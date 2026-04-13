import { getListOfAnswers } from "$lib/server/session.js";

/** @type {import('./$types').PageServerLoad} */
export async function load({ }) {
    let iterator = await getListOfAnswers();
    const answers = []
    for await (const entry of iterator) {
        answers.push(entry)
    }
    return { answers };
}
