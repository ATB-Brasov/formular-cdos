import { dev } from "$app/environment";
import { json } from "@sveltejs/kit";
import { sendVerificationEmail } from "$lib/server/email.js";

/** @type {import('./$types').RequestHandler} */
export async function GET({ url }) {
    if (!dev) {
        return json({ error: "Only available in dev mode" }, { status: 403 });
    }

    const to = url.searchParams.get("to");
    if (!to) {
        return json({ error: "Missing ?to=email parameter" }, { status: 400 });
    }

    const answerId = crypto.randomUUID();
    const origin = url.searchParams.get("origin") || "http://localhost:5173";

    try {
        await sendVerificationEmail(to, answerId, to, origin);
        return json({ success: true, answerId, to });
    } catch (err) {
        return json({ error: err.message, cause: err.cause }, { status: 500 });
    }
}
