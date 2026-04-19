import { dev } from "$app/environment";
import { getListOfAnswers } from "$lib/server/session.js";
import sondaj_cdos from "@content/cestionare/atb-cdos-2026.js"

/** @type {import('./$types').PageServerLoad} */
export async function load({ }) {
    console.log("DENO_KV_ACCESS_TOKEN:", Deno.env.get("DENO_KV_ACCESS_TOKEN"))

    if (!dev) return { }
    let iterator = await getListOfAnswers(sondaj_cdos.id);
    const answers = []
    for await (const entry of iterator) {
        answers.push(entry)
    }
    return { answers };
}
