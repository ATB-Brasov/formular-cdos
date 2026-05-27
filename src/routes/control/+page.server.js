import { fail, redirect } from "@sveltejs/kit";
import {
    getAdminSession,
    getDailyCounts,
    getListOfAnswers,
    getValidationStats,
} from "$lib/server/db.js";
import survey from "@content/cestionare/atb-cdos-2026.js";

const ACADEMIC_FIELDS = new Set([
    "facultatea",
    "ciclu",
    "forma",
    "programul",
    "anul",
]);

/** @type {import('./$types').PageServerLoad} */
export async function load({ cookies }) {
    const adminAuthEnabled = Deno.env.get("ADMIN_AUTH_ENABLED") !== "false";
    if (adminAuthEnabled) {
        const sessionid = cookies.get("adminsession");
        if (sessionid == null) redirect(303, "/control/login");
        const session = await getAdminSession(sessionid);
        if (session == null) {
            return { error: "Sesiunea a expirat!" };
        }
    }
    let iterator = await getListOfAnswers(survey.id, null);
    const answers = [];
    for await (const entry of iterator) {
        const val =
            /** @type {{answerId: string, answers: Map<string,string>, validated?: boolean}} */ (
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
            validated: val.validated ?? false,
        });
    }
    const dailyCounts = await getDailyCounts(survey.id);
    const validationStats = await getValidationStats(survey.id);
    return { answers, dailyCounts, validationStats };
}
