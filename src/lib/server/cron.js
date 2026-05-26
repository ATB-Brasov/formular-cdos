import { refreshEmailVersionstamps } from "./session.js";


// Keep them scrambled every 6 hours going forward
Deno.cron("Refresh email versionstamps", "0 */6 * * *", async () => {
    await refreshEmailVersionstamps();
});
