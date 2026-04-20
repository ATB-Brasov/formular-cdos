import { fail, redirect } from "@sveltejs/kit";
import { dev } from "$app/environment";
import { getListOfAnswers, getAdminSession } from "$lib/server/session.js";
import sondaj_cdos from "@content/cestionare/atb-cdos-2026.js"

/** @type {import('./$types').PageServerLoad} */
export async function load({ cookies }) {
    if (!dev) { 
        const sessionid = cookies.get("adminsession")
        if (sessionid == null) redirect(303, "/control/conectare")
        const session = await getAdminSession(sessionid);
        if (session == null) {
            return { eroare: "Sesiunea a expirat!" };
        }
    }
    let iterator = await getListOfAnswers(sondaj_cdos.id);
    const answers = []
    for await (const entry of iterator) {
        answers.push(entry)
    }
    return { answers };
}
