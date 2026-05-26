import { fail, redirect } from "@sveltejs/kit";
import { dev } from "$app/environment";
import { getAdminSession, getDailyCounts, getListOfAnswers } from "$lib/server/session.js";
import sondaj_cdos from "@content/cestionare/atb-cdos-2026.js";

const ACADEMIC_FIELDS = new Set(["facultatea", "ciclu", "forma", "programul", "anul"]);

/** @type {import('./$types').PageServerLoad} */
export async function load({ cookies }) {
    if (!dev) {
        const sessionid = cookies.get("adminsession");
        if (sessionid == null) redirect(303, "/control/conectare");
        const session = await getAdminSession(sessionid);
        if (session == null) {
            return { eroare: "Sesiunea a expirat!" };
        }
    }
    let iterator = await getListOfAnswers(sondaj_cdos.id, null);
    const answers = [];
    for await (const entry of iterator) {
        const val = /** @type {{answerId: string, answers: Map<string,string>}} */ (
            entry.value
        );
        const academicAnswers = new Map();
        if (val.answers instanceof Map) {
            for (const [key, value] of val.answers) {
                if (ACADEMIC_FIELDS.has(key)) {
                    academicAnswers.set(key, value);
                }
            }
        }
        answers.push({
            key: entry.key,
            value: { answerId: val.answerId, answers: academicAnswers },
            versionstamp: entry.versionstamp,
        });
    }
    const dailyCounts = await getDailyCounts(sondaj_cdos.id);
    return { answers, dailyCounts };
}
