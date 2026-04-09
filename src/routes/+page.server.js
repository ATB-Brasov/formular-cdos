import { fail } from '@sveltejs/kit';
import intrebari from './intrebari.js';

/**
 * @typedef {Object} EroareValidare
 * @property {string} msg
 * @property {number} pag
 */

/** @satisfies {import('./$types').Actions} */
export const actions = {
    default: async ({ request }) => {
        const data = await request.formData();
        /** @type { {[nume: string]: EroareValidare} } */
        const erori = {}; // Poate un Map?

        let min_err_pag = intrebari.length
        for (let pag_nr = 0; pag_nr < intrebari.length; ++pag_nr) {
            const pag = intrebari[pag_nr];
            for (let cimp of pag.cimpuri) {
                const cimp_formular = data.get(cimp.nume);

                if (!cimp_formular) {
                    if (cimp.obligatoriu) {
                        erori[cimp.nume] = {
                            msg: 'Cîmpul este obligatoriu',
                            pag: pag_nr,
                        };
                        min_err_pag = Math.min(min_err_pag, pag_nr)
                    }
                    continue
                }

                if (cimp.valideaza !== undefined) {
                    const err = cimp.valideaza(cimp_formular.toString());
                    if (err !== undefined) {
                        min_err_pag = Math.min(min_err_pag, pag_nr)
                        erori[cimp.nume] = {
                            msg: err,
                            pag: pag_nr,
                        }
                    }
                }
            }
        }

        if (Object.keys(erori).length > 0)
            return fail(400, {erori: erori, pag: min_err_pag});

        // const posta = data.get("posta");
        //
        // console.log(posta)
        //
        // if (!posta) {
        //     return fail(400, { success: false, error: "posta", msg: "Introdu adresa poștei electronice!", pag: 0, posta })
        // }
        // if (!posta.toString().endsWith("@student.unitbv.ro")
        //     && !posta.toString().endsWith("@unitbv.ro")) {
        //     return fail(400, { success: false, error: "posta", msg: "Folosește adresa instituțională!", posta })
        // }
        return { success: true };
    },
};
