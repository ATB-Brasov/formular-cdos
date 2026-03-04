import { fail } from '@sveltejs/kit';
import intrebari from './intrebari.js';

/** @satisfies {import('./$types').Actions} */
export const actions = {
    default: async ({ request }) => {
        const data = await request.formData();

        for (let pag_nr = 0; pag_nr < intrebari.length; ++pag_nr) {
            const pag = intrebari[pag_nr];
            for (let cimp of pag.cimpuri) {
                const cimp_formular = data.get(cimp.nume);

                if (!cimp_formular) {
                    if (!cimp.obligatoriu) {
                        continue;
                    } else {
                        return fail(400, {
                            success: false,
                            error: cimp.nume,
                            msg: 'Cîmpul este obligatoriu',
                            pag: pag_nr,
                        });
                    }
                }

                if (cimp.valideaza !== undefined) {
                    const err = cimp.valideaza(cimp_formular.toString());
                    if (err !== undefined) {
                        return fail(400, {
                            success: false,
                            error: cimp.nume,
                            msg: err,
                            pag: pag_nr,
                        });
                    }
                }
            }
        }

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
