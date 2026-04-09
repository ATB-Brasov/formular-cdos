import { fail } from "@sveltejs/kit";
import intrebari from "@content/cestionare/intrebari.js";
import { getListOfAnswers } from "$lib/server/session.js";

/** @type {import('./$types').PageServerLoad} */
export async function load({ }) {
    let answers = await getListOfAnswers();
    const l = []
    for await (const entry of answers) {
        l.push(entry)
    }
    return { answers: l };
}


