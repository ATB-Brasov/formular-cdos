import { fail } from "@sveltejs/kit";
import { dev } from "$app/environment";
import { deleteAnswers, deleteSession, getPreviousAnswers } from "$lib/server/db.js";
import survey from "@content/cestionare/atb-cdos-2026.js";

const FORM_ID = survey.id;

/** @type {import('./$types').PageServerLoad} */
export async function load({ url }) {
    const answerId = url.searchParams.get("answerId");
    let verificationType = null;

    if (answerId) {
        const prev = await getPreviousAnswers(FORM_ID, answerId);
        verificationType = prev?.verificationType ?? null;
    }

    return { answerId, verificationType };
}

/** @satisfies {import('./$types').Actions} */
export const actions = {
    delete: async ({ request, cookies }) => {
        const data = await request.formData();
        const email = data.get("email")?.toString();
        const answerId = data.get("answerId")?.toString();

        if (answerId == null) {
            return fail(400, {
                deleteMsg: "Introdu ID-ul răspunsului.",
                errors: {
                    answerId: {
                        type: "field-required",
                        msg: "ID-ul răspunsului este necesar.",
                        pag: -1,
                    },
                },
            });
        }

        const prev = await getPreviousAnswers(FORM_ID, answerId);
        if (prev == null) {
            return fail(404, {
                deleteMsg: "Nu s-au găsit date pentru acest ID.",
                errors: {
                    answerId: {
                        type: "not-found",
                        msg: "Nu s-au găsit date pentru acest ID.",
                        pag: -1,
                    },
                },
            });
        }

        if (prev.verificationType === "no-email") {
            await deleteAnswers(FORM_ID, null, answerId);
            await cleanupSession(cookies);
            return { deleteSuccess: true };
        }

        if (email == null) {
            return fail(400, {
                deleteMsg: "Introdu adresa de e-mail asociată răspunsului pentru confirmare.",
                errors: {
                    email: {
                        type: "field-required",
                        msg: "Adresa de e-mail este necesară pentru confirmare.",
                        pag: -1,
                    },
                },
            });
        }

        const result = await deleteAnswers(FORM_ID, email, answerId);

        if (!result.deleted) {
            if (!result.answerExists) {
                return fail(404, {
                    deleteMsg:
                        "Nu s-au găsit date pentru acest ID.",
                });
            }
            return fail(400, {
                deleteMsg:
                    "Adresa poștei electronice nu a fost înregistrată. Verifică datele introduse.",
                errors: {
                    email: {
                        type: "email-invalid",
                        msg: "Adresa poștei electronice nu a fost înregistrată.",
                        pag: -1,
                    },
                },
            });
        }
        await cleanupSession(cookies);
        return { deleteSuccess: true };
    },
};

async function cleanupSession(cookies) {
    const sessionId = cookies.get("sessionid");
    if (sessionId) {
        await deleteSession(sessionId);
        cookies.delete("sessionid", {
            path: "/",
            httpOnly: true,
            partitioned: !dev,
            secure: !dev,
            sameSite: dev ? "lax" : "none",
        });
    }
}
