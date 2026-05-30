import { fail } from "@sveltejs/kit";
import { deleteAnswers, getPreviousAnswers } from "$lib/server/db.js";
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
    delete: async ({ request }) => {
        const data = await request.formData();
        const email = data.get("email")?.toString();
        const answerId = data.get("answerId")?.toString();

        if (answerId == null) {
            return fail(400, {
                deleteMsg: "Introdu ID-ul răspunsului.",
            });
        }

        const prev = await getPreviousAnswers(FORM_ID, answerId);
        if (prev == null) {
            return fail(404, {
                deleteMsg: "Nu s-au găsit date pentru acest ID.",
            });
        }

        if (prev.verificationType === "no-email") {
            await deleteAnswers(FORM_ID, null, answerId);
            return { deleteSuccess: true };
        }

        if (email == null) {
            return fail(400, {
                deleteMsg: "Introdu adresa de e-mail asociată răspunsului pentru confirmare.",
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
                    "Adresa de e-mail nu corespunde. Verifică datele introduse.",
            });
        }
        return { deleteSuccess: true };
    },
};
