import { verifyVerificationToken, validateAnswer } from "$lib/server/db.js";
import survey from "@content/cestionare/atb-cdos-2026.js";

const FORM_ID = survey.id;

/** @type {import('./$types').PageServerLoad} */
export async function load({ url }) {
    const answerId = url.searchParams.get("answerId");
    const email = url.searchParams.get("email");
    const token = url.searchParams.get("token");

    if (!answerId || !email || !token) {
        return { status: "error", message: "Link de verificare invalid." };
    }

    const valid = await verifyVerificationToken(answerId, email, token);
    if (!valid) {
        return { status: "error", message: "Link de verificare invalid sau expirat." };
    }

    const success = await validateAnswer(FORM_ID, answerId, email);
    if (!success) {
        return {
            status: "error",
            message: "Răspunsul nu a fost găsit. Poate a fost deja șters.",
        };
    }

    return { status: "success", message: "Adresa de e-mail a fost confirmată cu succes!" };
}
