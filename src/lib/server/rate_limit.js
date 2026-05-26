import { getKv } from "./kv.js";

const PREFIX = ["rate_limit"];
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

/**
 * Check if the given IP is rate-limited.
 * If not, record the attempt and return allow=true.
 * If blocked, return allow=false with retryAfter text.
 *
 * @param {string} ip
 * @returns {Promise<{allow: boolean, retryAfter?: string}>}
 */
export async function checkRateLimit(ip) {
    const kv = await getKv();
    const key = [...PREFIX, ip];
    const entry = await kv.get(key);
    const now = Date.now();

    if (entry.value) {
        const { attempts, resetAt } =
            /** @type {{attempts: number, resetAt: number}} */ (entry.value);

        if (now < resetAt) {
            if (attempts >= MAX_ATTEMPTS) {
                const remaining = Math.ceil((resetAt - now) / 1000);
                return { allow: false, retryAfter: `${remaining} secunde` };
            }
            await kv.set(key, { attempts: attempts + 1, resetAt }, {
                expireIn: WINDOW_MS / 1000,
            });
            return { allow: true };
        }
    }

    const resetAt = now + WINDOW_MS;
    await kv.set(key, { attempts: 1, resetAt }, { expireIn: WINDOW_MS / 1000 });
    return { allow: true };
}
