import { fail, redirect } from "@sveltejs/kit";
import { dev } from "$app/environment";
import { verifyPoW } from "$lib/server/pow.js";

import sondaj_cdos from "@content/cestionare/atb-cdos-2026.js";
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
    const sessionid = await createSession(sondaj_cdos.id);
    console.log(`Sesiune nouă cu id: ${sessionid}`);
    cookies.set("sessionid", sessionid, {
        path: "/",
        httpOnly: true,
        secure: !dev,
        sameSite: dev ? "lax" : "none",
        maxAge: 60 * 60, // 1 hour
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
    console.dir(session);
    return { session };
}

/** @satisfies {import('./$types').Actions} */
export const actions = {
    posta: async ({ request, cookies }) => {
        const data = await request.formData();
        let email = data.get("posta");
        let nonce = data.get("nonce");
        if (email == null) {
            return fail(400, {
                erori: {
                    posta: {
                        type: "email-required",
                        msg: "Cîmpul este obligatoriu",
                        pag: -1,
                    },
                },
            });
        }
        email = email.toString();

        const msg_validare = (sondaj_cdos.validare_posta != null)
            ? sondaj_cdos.validare_posta(email)
            : null;
        if (msg_validare != null) {
            return fail(400, {
                erori: {
                    posta: {
                        type: "email-invalid",
                        msg: msg_validare,
                        pag: -1,
                    },
                },
            });
        }

        console.log("data.email: ", email);

        if (nonce == null) {
            return fail(400, {
                erori: {
                    posta: {
                        type: "pow-required",
                        msg: "Nonce este null!",
                        pag: -1,
                    },
                },
            });
        }
        nonce = nonce.toString();
        if (!verifyPoW(email, nonce)) {
            return fail(400, {
                erori: {
                    posta: {
                        type: "pow-invalid",
                        msg: "Invalid Proof of Work. Nice try, bot!",
                        pag: -1,
                    },
                },
            });
        }

        const answered_email = await getAnsweredEmail(sondaj_cdos.id, email);
        console.log("getAnsweredEmail => ", answered_email);
        if (answered_email != null) {
            return fail(400, {
                erori: {
                    posta: {
                        type: "email-exists",
                        msg: "Este înregistrat răspuns pe această poștă electronică",
                        pag: -1,
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
        const sessionId = cookies.get("sessionid");
        if (sessionId == null) {
            return fail(400, {
                erori: {
                    _form: {
                        type: "session-required",
                        msg: "Nici o sesiune nu a fost setată",
                        pag: -1,
                    },
                },
            });
        }
        const session = await getSession(sessionId);
        if (session == null) {
            return fail(400, {
                erori: {
                    _form: {
                        type: "session-invalid",
                        msg: "Sesiune nevalidă",
                        pag: -1,
                    },
                },
            });
        }
        if (session.email == null) {
            return fail(400, {
                erori: {
                    _form: {
                        type: "email-required",
                        msg: "Poșta electronică a sesiunii nu a fost setată",
                        pag: -1,
                    },
                },
            });
        }
        const msg_validare = (sondaj_cdos.validare_posta != null)
            ? sondaj_cdos.validare_posta(session.email)
            : null;
        if (msg_validare != null) {
            return fail(400, {
                erori: {
                    posta: { type: "email-invalid", msg: msg_validare, pag: 0 },
                },
            });
        }

        const data = await request.formData();
        const dataDict = Object.fromEntries(
            data.entries().map(([nume, valoare]) => [nume, valoare.toString()]),
        );
        /** @type { {[nume: string]: import("$lib/common_types.js").Eroare} } */
        const erori = {}; // Poate un Map?

        /** @type {[string, string][]} */
        const raspunsuri = [];

        const pagini = sondaj_cdos.pagini;
        let min_err_pag = pagini.length;
        for (let pag_nr = 0; pag_nr < pagini.length; ++pag_nr) {
            const pag = pagini[pag_nr];
            if (pag.filtru_afisare != null && !pag.filtru_afisare?.(dataDict)) {
                continue;
            }
            for (let cimp of pag.cimpuri) {
                const cimp_formular = data.get(cimp.nume);

                if (!cimp_formular) {
                    if (
                        (cimp.filtru_afisare == null ||
                            cimp.filtru_afisare?.(dataDict)) && cimp.obligatoriu
                    ) {
                        erori[cimp.nume] = {
                            type: "field-required",
                            msg: "Cîmpul este obligatoriu",
                            pag: pag_nr,
                        };
                        min_err_pag = Math.min(min_err_pag, pag_nr);
                    }
                    continue;
                }

                if (cimp.valideaza !== undefined) {
                    const err = cimp.valideaza(cimp_formular.toString());
                    if (err != null) {
                        min_err_pag = Math.min(min_err_pag, pag_nr);
                        erori[cimp.nume] = {
                            type: "field-invalid",
                            msg: err,
                            pag: pag_nr,
                        };
                    }
                }

                // WARN: Trebuie de văzut cum funcționează cu Selecții Multiple
                raspunsuri.push([cimp.nume, cimp_formular.toString()]);
            }
        }

        if (Object.keys(erori).length > 0) {
            return fail(400, { erori: erori, pag: min_err_pag });
        }

        await saveAnswers(
            session.email,
            sondaj_cdos.id,
            session.answerId,
            new Map(raspunsuri),
        );
        await deleteSession(sessionId);
        cookies.delete("sessionid", { path: "/" });

        // TODO: arată respondentului id-ul la răspuns ca să-l poată edita

        // return { success: true };
        redirect(303, "/succes");
    },
};
