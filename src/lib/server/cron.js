import { refreshEmailVersionstamps } from "./session.js";

Deno.cron("Refresh email versionstamps", "0 */6 * * *", async () => {
    try {
        await refreshEmailVersionstamps();
    } catch (err) {
        console.error("Cron refresh failed:", err);
    }
});
