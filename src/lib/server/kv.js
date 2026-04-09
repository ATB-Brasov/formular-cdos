/** @typedef {Deno.Kv} Kv */

/** @type {Kv | null} */
let kvInstance = null;

/** @type {boolean} */
let isInitializing = false;

/**
 * Initialize and retrieve the Deno KV instance.
 * Uses a singleton pattern to ensure only one KV connection is open.
 *
 * @returns {Promise<Kv>}
 * @throws {Error} If KV initialization fails
 */
async function initKv() {
    if (kvInstance) {
        return kvInstance;
    }

    // Prevent race conditions during initialization
    if (isInitializing) {
        // Wait for initialization to complete
        while (!kvInstance) {
            await new Promise((resolve) => setTimeout(resolve, 10));
        }
        return kvInstance;
    }

    isInitializing = true;
    try {
        kvInstance = await Deno.openKv();
        return kvInstance;
    } catch (error) {
        console.error("Failed to initialize Deno KV:", error);
        throw error;
    } finally {
        isInitializing = false;
    }
}

/**
 * Get the Deno KV instance.
 * Lazily initializes on first call and returns the same instance thereafter.
 *
 * @returns {Promise<Kv>}
 */
export async function getKv() {
    return await initKv();
}

/**
 * Get the KV instance synchronously if already initialized.
 * Returns null if not yet initialized.
 *
 * @returns {Kv | null}
 */
export function getKvSync() {
    return kvInstance;
}

/** @returns {boolean} */
export function isKvInitialized() {
    return kvInstance !== null;
}

export function closeKv() {
    if (kvInstance) {
        kvInstance.close();
        kvInstance = null;
    }
}
