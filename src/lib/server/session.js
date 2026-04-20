import argon2 from "argon2";

import { getKv } from "./kv.js";

const SESSION_PREFIX = ["sessions"];
const ANSWERS_PREFIX = ["answers"];
const EMAILS_PREFIX = ["emails"];
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
  * @property {number} submittedAt
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
export async function createSession(formId, email=null) {
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
 * @returns {Promise<void>} Session ID
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
    }
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
 * Extrge adresa poștei electronice din lista adreselor salvate
 * @param {string} formId
 * @param {string} email
 * @returns {Promise<EmailData|null>}
 */
export async function getAnsweredEmail(formId, email) {
    const kv = await getKv();

    const hashed_email = await hashEmail(email)
    /** @type {Deno.KvEntryMaybe<EmailData>} */
    const result = await kv.get([...EMAILS_PREFIX, formId, hashed_email]);
    return result.value || null;
}

/**
 * @param {string} formId
 * @returns {Promise<Deno.KvListIterator<AnswersData>>} 
 */
export async function getListOfAnswers(formId) {
    const kv = await getKv();
    /** @type {Deno.KvListIterator<AnswersData>} */
    const result = kv.list({ prefix: [...ANSWERS_PREFIX, formId] }, {limit: 10});
    return result;
}

/**
 * Extrage răspunsuri pe baza identificatorului de raspuns
 * @param {string} formId
 * @param {string} answerId
 * @returns {Promise<Map<string,string>|null>}
 */
export async function getPreviousAnswers(formId, answerId) {
    const kv = await getKv();
    const result = await kv.get([...ANSWERS_PREFIX, formId, answerId]);
    return result.value || null;
}

/**
 * Salvează răspunsurile la cestionar
 * @param {string} email
 * @param {string} formId
 * @param {string} answerId
 * @param {Map<string,string>} answers
 * @returns {Promise<void>}
 */
export async function saveAnswers(email, formId, answerId, answers) {
    const kv = await getKv();

    const hashed_email = await hashEmail(email)
    await kv.set([...EMAILS_PREFIX, formId, hashed_email], {answered: true});
    await kv.set([...ANSWERS_PREFIX, formId, answerId], {
        answerId,
        answers,
        submittedAt: Date.now(),
    });
}

export async function hashEmail(/**@type{string}*/ email) {
    const hash_secret = Deno.env.get("HASH_SECRET");
    if (hash_secret == null) {
        throw new Error("The `HASH_SECRET` environment variable was not defined!")
    }
    const hash_salt = Deno.env.get("HASH_SALT");
    if (hash_salt == null) {
        throw new Error("The `HASH_SALT` environment variable was not defined!")
    }
    const rawHash = await argon2.hash(email, {
        type: argon2.argon2id,
        salt: Buffer.from(hash_salt),
        secret: Buffer.from(hash_secret),
        memoryCost: 65536,
        timeCost: 3,
        raw: true,
    });
    const hash = Buffer.from(rawHash).toString('hex');
    return hash;
}
