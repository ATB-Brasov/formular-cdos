import { shuffleVersionstamps } from "./db.js";

Deno.cron("Shuffle email and answer versionstamps", "0 */6 * * *", async () => {
    try {
        await shuffleVersionstamps();
    } catch (err) {
        console.error("Cron shuffle failed:", err);
    }
});
