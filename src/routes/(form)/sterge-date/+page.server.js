import { fail } from "@sveltejs/kit";
import { deleteAnswers } from "$lib/server/db.js";
import survey from "@content/cestionare/atb-cdos-2026.js";

const FORM_ID = survey.id;

/** @type {import('./$types').PageServerLoad} */
export async function load({ url }) {
    return {
        answerId: url.searchParams.get("answerId"),
    };
}

/** @satisfies {import('./$types').Actions} */
export const actions = {
    delete: async ({ request }) => {
        const data = await request.formData();
        const email = data.get("email")?.toString();
        const answerId = data.get("answerId")?.toString();
        if (email == null || answerId == null) {
            return fail(400, {
                deleteMsg:
                    "Introdu atât adresa de e-mail cât și ID-ul răspunsului.",
            });
        }

        const result = await deleteAnswers(FORM_ID, email, answerId);

        if (!result.deleted) {
            if (!result.emailExists && !result.answerExists) {
                return fail(404, {
                    deleteMsg:
                        "Nu s-au găsit date pentru această adresă și acest ID.",
                });
            }
            return fail(400, {
                deleteMsg:
                    "Adresa de e-mail și ID-ul nu corespund. Verifică datele introduse.",
            });
        }
        return { deleteSuccess: true };
    },
};
