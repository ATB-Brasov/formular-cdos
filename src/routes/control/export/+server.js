import { json } from "@sveltejs/kit";
import { getKv } from "$lib/server/kv.js";

const ANSWERS_PREFIX = ["answers"];

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
    const token = Deno.env.get("EXPORT_API_TOKEN");
    if (!token) {
        return json({ error: "EXPORT_API_TOKEN not configured" }, {
            status: 500,
        });
    }

    const auth = request.headers.get("authorization");
    if (!auth || !auth.startsWith("Bearer ") || auth.slice(7) !== token) {
        return json({ error: "Unauthorized" }, { status: 401 });
    }

    const kv = await getKv();
    const iterator = kv.list({ prefix: ANSWERS_PREFIX });
    const answers = [];

    for await (const entry of iterator) {
        const formId = /** @type {string} */ (entry.key[1]);
        const answerId = /** @type {string} */ (entry.key[2]);
        const val = /** @type {{answers: Map<string,string>, validated?: boolean}} */ (entry.value);
        const answersMap = val.answers instanceof Map
            ? val.answers
            : new Map(val.answers);
        answers.push({
            formId,
            answerId,
            validated: val.validated ?? false,
            ...Object.fromEntries(answersMap),
        });
    }

    return json({ count: answers.length, data: answers });
}
