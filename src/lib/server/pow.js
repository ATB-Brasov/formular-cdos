// Assisted-By: Gemini 3 Flash
import { createHash } from "node:crypto";

/**
 *
 * @param {string} email
 * @param {string} nonce
 * @param {number} difficulty
 * @returns
 */
export function verifyPoW(email, nonce, difficulty = 4) {
    const data = `${email}:${nonce}`;
    const hash = createHash("sha256").update(data).digest("hex");
    const prefix = "0".repeat(difficulty);
    return hash.startsWith(prefix);
}
