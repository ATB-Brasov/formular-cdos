import argon2 from "argon2";

import { getKv } from "./kv.js";

const SESSION_PREFIX = ["sessions"];
const ANSWERS_PREFIX = ["answers"];
const EMAILS_PREFIX = ["emails"];
const DAILY_COUNTS_PREFIX = ["daily_counts"];
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 1 day

/**
 * @typedef {Object} AdminSessionData
 * @property {number} createdAt
 * @property {number} lastActivity
 */

/**
 * @typedef {Object} SessionData
 * @property {string|null} email
 * @property {string} answerId
 * @property {string} formId
 * @property {number} createdAt
 * @property {number} lastActivity
 */

/**
 * @typedef {Object} EmailData
 * @property {boolean} answered
 */

/**
 * @typedef {Object} AnswersData
 * @property {string} answerId
 * @property {Map<string,string>} answers
 * @property {string} verificationType
 */

/**
 * @typedef {Object} DailyCount
 * @property {string} date
 * @property {number} count
 */

/**
 * Create a new session for the admin
 * @returns {Promise<string>} Session ID
 */
export async function createAdminSession() {
    const kv = await getKv();
    const sessionId = crypto.randomUUID();
    const now = Date.now();

    /** @type {SessionData} */
    const sessionData = {
        createdAt: now,
        lastActivity: now,
    };

    await kv.set([...SESSION_PREFIX, "admin", sessionId], sessionData, {
        expireIn: SESSION_DURATION,
    });

    return sessionId;
}

/**
 * Create a new session for an email
 * @param {string} formId - User email
 * @param {string|null} email - User email
 * @returns {Promise<string>} Session ID
 */
export async function createSession(formId, email = null) {
    const kv = await getKv();
    const sessionId = crypto.randomUUID();
    const answerId = crypto.randomUUID();
    const now = Date.now();

    /** @type {SessionData} */
    const sessionData = {
        email,
        answerId,
        formId,
        createdAt: now,
        lastActivity: now,
    };

    await kv.set([...SESSION_PREFIX, sessionId], sessionData, {
        expireIn: SESSION_DURATION,
    });

    return sessionId;
}

/**
 * Create a new session for an email
 * @param {string} sessionId - User email
 * @param {string} email - User email
 * @returns {Promise<SessionData|null>} Session ID
 * TODO: Return an error if no session was found
 */
export async function updateSessionEmail(sessionId, email) {
    const kv = await getKv();
    /** @type {Deno.KvEntryMaybe<SessionData>} */
    const result = await kv.get([...SESSION_PREFIX, sessionId]);
    const now = Date.now();

    if (result.value) {
        /** @type {SessionData} */
        const sessionData = {
            createdAt: result.value.createdAt,
            answerId: result.value.answerId,
            email,
            lastActivity: now,
        };

        await kv.set([...SESSION_PREFIX, sessionId], sessionData, {
            expireIn: SESSION_DURATION,
        });

        return sessionData;
    }
    return null;
}

/**
 * Get session data by session ID
 * @param {string|undefined} sessionId The session id from Cookies, could be undefined to allow passing directly from cookies.get
 * @returns {Promise<AdminSessionData|null>}
 */
export async function getAdminSession(sessionId) {
    if (sessionId === undefined) return null;

    const kv = await getKv();
    /** @type {Deno.KvEntryMaybe<SessionData>} */
    const result = await kv.get([...SESSION_PREFIX, "admin", sessionId]);

    if (result.value) {
        const updated = {
            ...result.value,
            lastActivity: Date.now(),
        };
        await kv.set([...SESSION_PREFIX, "admin", sessionId], updated, {
            expireIn: SESSION_DURATION,
        });

        return updated;
    }

    return null;
}

/**
 * Get session data by session ID
 * @param {string|undefined} sessionId The session id from Cookies, could be undefined to allow passing directly from cookies.get
 * @returns {Promise<SessionData|null>}
 */
export async function getSession(sessionId) {
    if (sessionId === undefined) return null;

    const kv = await getKv();
    /** @type {Deno.KvEntryMaybe<SessionData>} */
    const result = await kv.get([...SESSION_PREFIX, sessionId]);

    if (result.value) {
        const updated = {
            ...result.value,
            lastActivity: Date.now(),
        };
        await kv.set([...SESSION_PREFIX, sessionId], updated, {
            expireIn: SESSION_DURATION,
        });

        return updated;
    }

    return null;
}

/**
 * Delete a session
 * @param {string} sessionId
 * @returns {Promise<void>}
 */
export async function deleteSession(sessionId) {
    const kv = await getKv();
    await kv.delete([...SESSION_PREFIX, sessionId]);
}

/**
 * Get answered email from the saved email list
 * @param {string} formId
 * @param {string} email
 * @returns {Promise<EmailData|null>}
 */
export async function getAnsweredEmail(formId, email) {
    const kv = await getKv();

    const hashed_email = await hashEmail(email);
    /** @type {Deno.KvEntryMaybe<EmailData>} */
    const result = await kv.get([...EMAILS_PREFIX, formId, hashed_email]);
    return result.value || null;
}

/**
 * @param {string} formId
 * @param {number|null} [limit=10]
 * @returns {Promise<Deno.KvListIterator<AnswersData>>}
 */
export async function getListOfAnswers(formId, limit = 10) {
    const kv = await getKv();
    /** @type {Deno.KvListIterator<AnswersData>} */
    const result = kv.list({ prefix: [...ANSWERS_PREFIX, formId] }, {
        limit: limit ?? undefined,
    });
    return result;
}

/**
 * Get previous answers by answer ID
 * @param {string} formId
 * @param {string} answerId
 * @returns {Promise<AnswersData|null>}
 */
export async function getPreviousAnswers(formId, answerId) {
    const kv = await getKv();
    const result = await kv.get([...ANSWERS_PREFIX, formId, answerId]);
    return result.value || null;
}

/**
 * Save answers to questionnaire
 * @param {string|null} email
 * @param {string} formId
 * @param {string} answerId
 * @param {Map<string,string>} answers
 * @returns {Promise<{verificationType: string}>}
 */
export async function saveAnswers(email, formId, answerId, answers) {
    const kv = await getKv();

    const verificationType = email
        ? "email-not-verified"
        : "no-email";

    if (email) {
        const hashed_email = await hashEmail(email);
        await kv.set([...EMAILS_PREFIX, formId, hashed_email], {
            answered: true,
        });
    }

    await kv.set([...ANSWERS_PREFIX, formId, answerId], {
        answerId,
        answers,
        verificationType,
    });
    await saveDailyCount(kv, formId);

    return { verificationType };
}

/**
 * Overwrite existing answers without touching email records or daily counts.
 * @param {string} formId
 * @param {string} answerId
 * @param {Map<string,string>} answers
 * @returns {Promise<void>}
 */
export async function overwriteAnswers(formId, answerId, answers) {
    const kv = await getKv();
    const existing = await kv.get([...ANSWERS_PREFIX, formId, answerId]);
    const verificationType = existing.value?.verificationType ?? "no-email";
    await kv.set([...ANSWERS_PREFIX, formId, answerId], {
        answerId,
        answers,
        verificationType,
    });
}

/**
 * Generate an HMAC-SHA256 verification token linking an answer to an email.
 * @param {string} answerId
 * @param {string} email
 * @returns {Promise<string>}
 */
export async function generateVerificationToken(answerId, email) {
    const secret = Deno.env.get("HASH_SECRET");
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"],
    );
    const sig = await crypto.subtle.sign(
        "HMAC",
        key,
        encoder.encode(`${answerId}::${email}`),
    );
    return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Verify that a token matches the answerId-email pair.
 * @param {string} answerId
 * @param {string} email
 * @param {string} token
 * @returns {Promise<boolean>}
 */
export async function verifyVerificationToken(answerId, email, token) {
    const expected = await generateVerificationToken(answerId, email);
    if (token.length !== expected.length) return false;
    const tBuf = new TextEncoder().encode(token);
    const eBuf = new TextEncoder().encode(expected);
    let result = 0;
    for (let i = 0; i < tBuf.length; i++) {
        result |= tBuf[i] ^ eBuf[i];
    }
    return result === 0;
}

/**
 * Mark an answer as email-verified.
 * @param {string} formId
 * @param {string} answerId
 * @returns {Promise<boolean>} true if the answer record was found and updated
 */
export async function validateAnswer(formId, answerId) {
    const kv = await getKv();
    const answerKey = [...ANSWERS_PREFIX, formId, answerId];

    const answerEntry = await kv.get(answerKey);
    if (answerEntry.value == null) return false;

    await kv.set(answerKey, { ...answerEntry.value, verificationType: "email-verified" });
    return true;
}

/**
 * Get answer counts by verification type for a form.
 * @param {string} formId
 * @returns {Promise<{total: number, noEmail: number, emailNotVerified: number, emailVerified: number}>}
 */
export async function getVerificationStats(formId) {
    const kv = await getKv();
    const iter = kv.list({ prefix: [...ANSWERS_PREFIX, formId] });
    let total = 0;
    let noEmail = 0;
    let emailNotVerified = 0;
    let emailVerified = 0;
    for await (const entry of iter) {
        total++;
        const type = entry.value?.verificationType;
        if (type === "no-email") noEmail++;
        else if (type === "email-verified") emailVerified++;
        else emailNotVerified++;
    }
    return { total, noEmail, emailNotVerified, emailVerified };
}

/**
 * Increment today's daily answer count for a given form
 * @param {Deno.Kv} kv
 * @param {string} formId
 */
async function saveDailyCount(kv, formId) {
    const today = new Date().toISOString().slice(0, 10);
    const key = [...DAILY_COUNTS_PREFIX, formId, today];
    /** @type {Deno.KvEntryMaybe<{count: number}>} */
    const current = await kv.get(key);
    const count = (current.value?.count ?? 0) + 1;
    await kv.set(key, { count });
}

/**
 * Get daily answer counts for a form
 * @param {string} formId
 * @returns {Promise<{date: string, count: number}[]>}
 */
export async function getDailyCounts(formId) {
    const kv = await getKv();
    const iterator = kv.list({ prefix: [...DAILY_COUNTS_PREFIX, formId] });
    /** @type {{date: string, count: number}[]} */
    const results = [];
    for await (const entry of iterator) {
        const val = /** @type {{count: number}} */ (entry.value);
        results.push({
            date: /** @type {string} */ (entry.key[2]),
            count: val.count,
        });
    }
    return results;
}

/**
 * Delete an answer and optionally its associated email record.
 * For no-email answers, only the answer record is needed.
 * @param {string} formId
 * @param {string|null} email
 * @param {string} answerId
 * @returns {Promise<{deleted: boolean, emailExists?: boolean, answerExists?: boolean}>}
 */
export async function deleteAnswers(formId, email, answerId) {
    const kv = await getKv();
    const answerKey = [...ANSWERS_PREFIX, formId, answerId];

    const answerEntry = await kv.get(answerKey);
    if (answerEntry.value == null) {
        return { deleted: false, answerExists: false };
    }

    const verificationType = answerEntry.value.verificationType;

    if (verificationType === "no-email") {
        await kv.delete(answerKey);
        return { deleted: true, answerExists: true };
    }

    if (!email) {
        return { deleted: false, answerExists: true, emailExists: false };
    }

    const hashed = await hashEmail(email);
    const emailKey = [...EMAILS_PREFIX, formId, hashed];
    const emailEntry = await kv.get(emailKey);

    if (emailEntry.value == null) {
        return { deleted: false, emailExists: false, answerExists: true };
    }

    await Promise.all([
        kv.delete(emailKey),
        kv.delete(answerKey),
    ]);
    return { deleted: true, emailExists: true, answerExists: true };
}

/**
 * Rewrite every email hash entry to update its versionstamp,
 * preventing time-based correlation with answer entries.
 */
export async function shuffleVersionstamps() {
    const kv = await getKv();

    const emailEntries = [];
    const emailIter = kv.list({ prefix: EMAILS_PREFIX });
    for await (const entry of emailIter) {
        emailEntries.push({ key: entry.key, value: entry.value });
    }

    for (let i = emailEntries.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [emailEntries[i], emailEntries[j]] = [emailEntries[j], emailEntries[i]];
    }

    for (const entry of emailEntries) {
        await kv.set(entry.key, entry.value);
    }

    console.log(`Shuffled versionstamps for ${emailEntries.length} email entries`);
}

export async function hashEmail(/**@type{string}*/ email) {
    const hash_secret = Deno.env.get("HASH_SECRET");
    if (hash_secret == null) {
        throw new Error(
            "The `HASH_SECRET` environment variable was not defined!",
        );
    }
    const hash_salt = Deno.env.get("HASH_SALT");
    if (hash_salt == null) {
        throw new Error(
            "The `HASH_SALT` environment variable was not defined!",
        );
    }
    const rawHash = await argon2.hash(email, {
        type: argon2.argon2id,
        salt: Buffer.from(hash_salt),
        secret: Buffer.from(hash_secret),
        memoryCost: 65536,
        timeCost: 3,
        raw: true,
    });
    const hash = Buffer.from(rawHash).toString("hex");
    return hash;
}
