import { runMigrations } from "./migration.js";
import { refreshEmailVersionstamps } from "./session.js";

try {
    await runMigrations();
    await refreshEmailVersionstamps();
} catch (err) {
    console.error("Migration/refresh failed:", err);
}

Deno.cron("Refresh email versionstamps", "0 */6 * * *", async () => {
    try {
        await refreshEmailVersionstamps();
    } catch (err) {
        console.error("Cron refresh failed:", err);
    }
});
