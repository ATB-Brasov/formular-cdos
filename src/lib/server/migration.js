import { getKv } from "./kv.js";

const MIGRATION_KEY = ["_migration", "schema_version"];
const CURRENT_VERSION = 3;

/**
 * v1: strip submittedAt from answers, backfill daily counts, refresh email stamps
 * @param {Deno.Kv} kv
 */
async function v1(kv) {
    const ANSWERS_PREFIX = ["answers"];
    const EMAILS_PREFIX = ["emails"];
    const DAILY_COUNTS_PREFIX = ["daily_counts"];

    // 1a. Strip submittedAt from answers, tally daily counts
    /** @type {Map<string, number>} */
    const tally = new Map();
    let cleaned = 0;

    const answerIter = kv.list({ prefix: ANSWERS_PREFIX });
    for await (const entry of answerIter) {
        const val = /** @type {Record<string, unknown>|null} */ (entry.value);
        if (val && typeof val.submittedAt === "number") {
            const dateStr = new Date(val.submittedAt).toISOString().slice(
                0,
                10,
            );
            tally.set(dateStr, (tally.get(dateStr) || 0) + 1);

            const { submittedAt, ...clean } = val;
            await kv.atomic()
                .check({ key: entry.key, versionstamp: entry.versionstamp })
                .set(entry.key, clean)
                .commit();
            cleaned++;
        }
    }

    // 1b. Write daily counts
    let countsWritten = 0;
    for (const [dateStr, count] of tally) {
        await kv.set([...DAILY_COUNTS_PREFIX, "atb-cdos-2026", dateStr], {
            count,
        });
        countsWritten++;
    }

    // 1c. Refresh email versionstamps
    let emailsRefreshed = 0;
    const emailIter = kv.list({ prefix: EMAILS_PREFIX });
    for await (const entry of emailIter) {
        await kv.set(entry.key, entry.value);
        emailsRefreshed++;
    }

    console.log(
        `Migration v1: cleaned ${cleaned} answers, wrote ${countsWritten} daily counts, refreshed ${emailsRefreshed} email entries`,
    );
}

/**
 * v2: backfill validated: false on existing answer & email records
 * @param {Deno.Kv} kv
 */
async function v2(kv) {
    const ANSWERS_PREFIX = ["answers"];
    const EMAILS_PREFIX = ["emails"];
    let answersUpdated = 0;
    let emailsUpdated = 0;

    const answerIter = kv.list({ prefix: ANSWERS_PREFIX });
    for await (const entry of answerIter) {
        if (entry.value?.validated === undefined) {
            await kv.set(entry.key, { ...entry.value, validated: false });
            answersUpdated++;
        }
    }

    const emailIter = kv.list({ prefix: EMAILS_PREFIX });
    for await (const entry of emailIter) {
        if (entry.value?.validated === undefined) {
            await kv.set(entry.key, { ...entry.value, validated: false });
            emailsUpdated++;
        }
    }

    console.log(
        `Migration v2: marked ${answersUpdated} answers and ${emailsUpdated} email records as unvalidated`,
    );
}

/**
 * v3: replace validated boolean with verificationType string
 * @param {Deno.Kv} kv
 */
async function v3(kv) {
    const ANSWERS_PREFIX = ["answers"];
    const EMAILS_PREFIX = ["emails"];
    let answersUpdated = 0;
    let emailsUpdated = 0;

    const answerIter = kv.list({ prefix: ANSWERS_PREFIX });
    for await (const entry of answerIter) {
        const val = entry.value;
        if (val && val.verificationType === undefined) {
            const type = "email-verified";
            const { validated, ...rest } = val;
            await kv.set(entry.key, { ...rest, verificationType: type });
            answersUpdated++;
        }
    }

    const emailIter = kv.list({ prefix: EMAILS_PREFIX });
    for await (const entry of emailIter) {
        if (entry.value && entry.value.validated !== undefined) {
            const { validated, ...rest } = entry.value;
            await kv.set(entry.key, rest);
            emailsUpdated++;
        }
    }

    console.log(
        `Migration v3: converted ${answersUpdated} answers to verificationType, cleaned ${emailsUpdated} email records`,
    );
}

/** Ordered list of migration functions (index 0 = v1, 1 = v2, ...). */
const migrations = [
    v1,
    v2,
    v3,
];

/**
 * Check the current schema version in KV and run any pending migrations.
 */
export async function runMigrations() {
    const kv = await getKv();
    /** @type {Deno.KvEntryMaybe<{version: number}>} */
    const current = await kv.get(MIGRATION_KEY);
    const appliedVersion = current.value?.version ?? 0;

    if (appliedVersion >= CURRENT_VERSION) {
        return;
    }

    console.log(
        `Schema at v${appliedVersion}, target v${CURRENT_VERSION}. Running migrations...`,
    );

    for (let v = appliedVersion; v < CURRENT_VERSION; v++) {
        console.log(`  Running migration v${v + 1}...`);
        await migrations[v](kv);
        await kv.set(MIGRATION_KEY, { version: v + 1 });
        console.log(`  Migration v${v + 1} complete`);
    }

    console.log("All migrations complete.");
}
