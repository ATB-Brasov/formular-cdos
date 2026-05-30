import { assertEquals, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";

import { closeKv } from "../src/lib/server/kv.js";
import {
    saveAnswers,
    overwriteAnswers,
    deleteAnswers,
    getPreviousAnswers,
    getVerificationStats,
    generateVerificationToken,
    verifyVerificationToken,
    validateAnswer,
} from "../src/lib/server/db.js";

const FORM_ID = "test-form";
const TEST_SECRET = "test-secret-for-testing";
const TEST_SALT = "a".repeat(32);

function setupEnv() {
    Deno.env.set("HASH_SECRET", TEST_SECRET);
    Deno.env.set("HASH_SALT", TEST_SALT);
}

async function withCleanKv(fn) {
    setupEnv();
    closeKv();
    for (const file of ["local.db", "local.db-shm", "local.db-wal"]) {
        try { await Deno.remove(`./.db/${file}`); } catch {}
    }
    try {
        await fn();
    } finally {
        closeKv();
    }
}

Deno.test({
    name: "saveAnswers with email creates both records and sets email-not-verified",
    async fn() {
        await withCleanKv(async () => {
            const result = await saveAnswers("test@test.com", FORM_ID, "answer-1", new Map([["q1", "a1"]]));
            assertEquals(result.verificationType, "email-not-verified");

            const saved = await getPreviousAnswers(FORM_ID, "answer-1");
            assertEquals(saved.answerId, "answer-1");
            assertEquals(saved.verificationType, "email-not-verified");
            assertEquals(saved.answers.get("q1"), "a1");
        });
    },
    sanitizeOps: false,
    sanitizeResources: false,
});

Deno.test({
    name: "saveAnswers without email creates answer with verificationType no-email",
    async fn() {
        await withCleanKv(async () => {
            const result = await saveAnswers(null, FORM_ID, "answer-2", new Map([["q1", "b1"]]));
            assertEquals(result.verificationType, "no-email");

            const saved = await getPreviousAnswers(FORM_ID, "answer-2");
            assertEquals(saved.verificationType, "no-email");
        });
    },
    sanitizeOps: false,
    sanitizeResources: false,
});

Deno.test({
    name: "overwriteAnswers preserves verificationType",
    async fn() {
        await withCleanKv(async () => {
            await saveAnswers("test@test.com", FORM_ID, "answer-4", new Map([["q1", "a1"]]));
            await overwriteAnswers(FORM_ID, "answer-4", new Map([["q1", "a2"]]));

            const saved = await getPreviousAnswers(FORM_ID, "answer-4");
            assertEquals(saved.verificationType, "email-not-verified");
            assertEquals(saved.answers.get("q1"), "a2");
        });
    },
    sanitizeOps: false,
    sanitizeResources: false,
});

Deno.test({
    name: "deleteAnswers with no-email type deletes only answer record",
    async fn() {
        await withCleanKv(async () => {
            await saveAnswers(null, FORM_ID, "answer-5", new Map());
            const result = await deleteAnswers(FORM_ID, null, "answer-5");
            assertEquals(result.deleted, true);

            const saved = await getPreviousAnswers(FORM_ID, "answer-5");
            assertEquals(saved, null);
        });
    },
    sanitizeOps: false,
    sanitizeResources: false,
});

Deno.test({
    name: "deleteAnswers with email requires matching email",
    async fn() {
        await withCleanKv(async () => {
            await saveAnswers("test@test.com", FORM_ID, "answer-6", new Map());
            const result = await deleteAnswers(FORM_ID, "wrong@test.com", "answer-6");
            assertEquals(result.deleted, false);

            const saved = await getPreviousAnswers(FORM_ID, "answer-6");
            assert(saved != null);
        });
    },
    sanitizeOps: false,
    sanitizeResources: false,
});

Deno.test({
    name: "deleteAnswers with matching email deletes both records",
    async fn() {
        await withCleanKv(async () => {
            await saveAnswers("test@test.com", FORM_ID, "answer-7", new Map());
            const result = await deleteAnswers(FORM_ID, "test@test.com", "answer-7");
            assertEquals(result.deleted, true);

            const saved = await getPreviousAnswers(FORM_ID, "answer-7");
            assertEquals(saved, null);
        });
    },
    sanitizeOps: false,
    sanitizeResources: false,
});

Deno.test({
    name: "validateAnswer updates verificationType to email-verified",
    async fn() {
        await withCleanKv(async () => {
            await saveAnswers("test@test.com", FORM_ID, "answer-8", new Map());
            const ok = await validateAnswer(FORM_ID, "answer-8");
            assertEquals(ok, true);

            const saved = await getPreviousAnswers(FORM_ID, "answer-8");
            assertEquals(saved.verificationType, "email-verified");
        });
    },
    sanitizeOps: false,
    sanitizeResources: false,
});

Deno.test({
    name: "validateAnswer returns false for nonexistent answer",
    async fn() {
        await withCleanKv(async () => {
            const ok = await validateAnswer(FORM_ID, "nonexistent");
            assertEquals(ok, false);
        });
    },
    sanitizeOps: false,
    sanitizeResources: false,
});

Deno.test({
    name: "getVerificationStats counts by type",
    async fn() {
        await withCleanKv(async () => {
            await saveAnswers(null, FORM_ID, "stats-1", new Map());
            await saveAnswers(null, FORM_ID, "stats-2", new Map());
            await saveAnswers("e@t.com", FORM_ID, "stats-3", new Map());
            await saveAnswers("e2@t.com", FORM_ID, "stats-4", new Map());

            await validateAnswer(FORM_ID, "stats-4");

            const stats = await getVerificationStats(FORM_ID);
            assertEquals(stats.total, 4);
            assertEquals(stats.noEmail, 2);
            assertEquals(stats.emailNotVerified, 1);
            assertEquals(stats.emailVerified, 1);
        });
    },
    sanitizeOps: false,
    sanitizeResources: false,
});

Deno.test({
    name: "generateVerificationToken produces stable output",
    async fn() {
        setupEnv();
        const t1 = await generateVerificationToken("answer-1", "test@test.com");
        const t2 = await generateVerificationToken("answer-1", "test@test.com");
        assertEquals(t1, t2);
        assertEquals(t1.length, 64);
    },
    sanitizeOps: false,
    sanitizeResources: false,
});

Deno.test({
    name: "verifyVerificationToken accepts valid token",
    async fn() {
        setupEnv();
        const token = await generateVerificationToken("answer-1", "test@test.com");
        const ok = await verifyVerificationToken("answer-1", "test@test.com", token);
        assertEquals(ok, true);
    },
    sanitizeOps: false,
    sanitizeResources: false,
});

Deno.test({
    name: "verifyVerificationToken rejects invalid token",
    async fn() {
        setupEnv();
        const ok = await verifyVerificationToken("answer-1", "test@test.com", "invalid");
        assertEquals(ok, false);
    },
    sanitizeOps: false,
    sanitizeResources: false,
});
