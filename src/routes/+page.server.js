import { fail } from "@sveltejs/kit";
import { dev } from "$app/environment";

import intrebari from "@content/cestionare/intrebari.js";
import {
    createSession,
    deleteSession,
    getAnsweredEmail,
    getSession,
    saveAnswers,
    updateSessionEmail,
} from "$lib/server/session.js";

/**
 * @param {import('@sveltejs/kit').Cookies} cookies
 * @returns {Promise<string>}
 */
async function newSession(cookies) {
    const sessionid = await createSession(null);
    console.log(`Sesiune nouă cu id: ${sessionid}`);
    cookies.set("sessionid", sessionid, {
        path: "/",
        httpOnly: true,
        secure: !dev,
        sameSite: "lax",
        maxAge: 60 * 60 * 24, // 1 day
    });
    return sessionid;
}

/** @type {import('./$types').PageServerLoad} */
export async function load({ cookies }) {
    console.log("server load");
    let sessionid = cookies.get("sessionid");
    console.log(`sessionid = ${sessionid}`);
    if (sessionid == null) {
        sessionid = await newSession(cookies);
    }
    let session = await getSession(sessionid);
    return { session };
}

/**
 * @typedef {Object} EroareValidare
 * @property {string} msg
 * @property {number} pag
 */

/** @satisfies {import('./$types').Actions} */
export const actions = {
    posta: async ({ request, cookies }) => {
        const data = await request.formData();
        let email = data.get("posta");
        if (email == null) {
            return fail(400, {
                erori: { email: { msg: "Cîmpul este obligatoriu", pag: 0 } },
                pag: 0,
            });
        }
        email = email.toString();
        console.log("data.email: ", email);

        const answered_email = await getAnsweredEmail(email);
        console.log("getAnsweredEmail => ", answered_email);
        if (answered_email != null) {
            return fail(400, {
                erori: {
                    posta: {
                        msg: "Este înregistrat răspuns pe această poștă electronică",
                    },
                },
            });
        }

        const sessionid = cookies.get("sessionid");
        if (sessionid == null) {
            console.log("Crează sesiune nouă");
            await newSession(cookies);
        } else {
            console.log(`Actualizează sesiunea ${sessionid}`);
            await updateSessionEmail(sessionid, email);
        }
        return { success: true };
    },
    salveaza: async ({ request, cookies }) => {
        const data = await request.formData();
        /** @type { {[nume: string]: EroareValidare} } */
        const erori = {}; // Poate un Map?

        const raspunsuri = [];

        let min_err_pag = intrebari.length;
        for (let pag_nr = 0; pag_nr < intrebari.length; ++pag_nr) {
            const pag = intrebari[pag_nr];
            for (let cimp of pag.cimpuri) {
                const cimp_formular = data.get(cimp.nume);

                if (!cimp_formular) {
                    if (cimp.obligatoriu) {
                        erori[cimp.nume] = {
                            msg: "Cîmpul este obligatoriu",
                            pag: pag_nr,
                        };
                        min_err_pag = Math.min(min_err_pag, pag_nr);
                    }
                    continue;
                }

                if (cimp.valideaza !== undefined) {
                    const err = cimp.valideaza(cimp_formular.toString());
                    if (err !== undefined) {
                        min_err_pag = Math.min(min_err_pag, pag_nr);
                        erori[cimp.nume] = {
                            msg: err,
                            pag: pag_nr,
                        };
                    }
                }

                raspunsuri.push([cimp.nume, cimp_formular]);
            }
        }

        if (Object.keys(erori).length > 0) {
            return fail(400, { erori: erori, pag: min_err_pag });
        }

        const sessionId = cookies.get("sessionid");
        if (sessionId == null) {
            return fail(400, { msg: "Nici o sesiune nu a fost setată" });
        }
        const session = await getSession(sessionId);
        if (session == null) {
            return fail(400, { msg: "Sesiune nevalidă" });
        }
        if (session.email == null) {
            return fail(400, { msg: "Poșta electronică a sesiunii nu a fost setată" });
        }

        console.log(session, JSON.stringify(raspunsuri));

        await saveAnswers(
            session.email,
            session.answerId,
            JSON.stringify(raspunsuri),
        );
        await deleteSession(sessionId);
        cookies.delete("sessionid", { path: "/" });

        // TODO: arată respondentului id-ul la răspuns ca să-l poată edita

        return { success: true };
    },
};
