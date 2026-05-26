import { createHash } from "node:crypto";

/**
 * @param {string} email
 * @param {string} nonce
 * @param {number} difficulty
 * @returns {boolean}
 */
export function verifyPoW(email, nonce, difficulty) {
    const data = `${email}:${nonce}`;
    const hash = createHash("sha256").update(data).digest("hex");
    const prefix = "0".repeat(difficulty);
    return hash.startsWith(prefix);
}
