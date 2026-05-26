import "$lib/server/cron.js";

const EXPORT_TOKEN = Deno.env.get("EXPORT_API_TOKEN");
if (EXPORT_TOKEN == null || EXPORT_TOKEN === "change-me-to-a-random-secret") {
    console.warn(
        "WARNING: EXPORT_API_TOKEN is not set or is still the default placeholder. " +
            "Set it to a random secret before deploying to production.",
    );
}
