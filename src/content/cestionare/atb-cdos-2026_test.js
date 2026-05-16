/** @import { AscundeCimp } from "@content/cestionare/types.js" */
import { uniq } from "$lib/ds_helpers.js";
import lista from "./lista_facultati_unitbv_2026.js";

/**
 * @typedef {object} OptiuniDanu
 * @property {string | null} [desc=null]
 * @property {boolean} [obligatoriu=true]
 * @property {import("@content/cestionare/types.js").AscundeCimp | null} [ascunde=null]
 * @property {() => ({ optiuni: string[]; eroare: string? })} [optiuni=() => ({ optiuni: ["da", "nu", "nu știu"], eroare: null })]
 */

/**
 * @param {string} nume
 * @param {string} titlu
 * @param {OptiuniDanu} [optiuni_obj={}]
 * @returns {import("@content/cestionare/types.js").Cimp}
 */
function danu(nume, titlu, optiuni_obj = {}) {
    const {
        desc = null,
        obligatoriu = true,
        ascunde = null,
        optiuni = () => ({ optiuni: ["da", "nu", "nu știu"], eroare: null }),
    } = optiuni_obj;

    return {
        nume,
        titlu,
        desc,
        obligatoriu,
        ascunde,
        tip: "selecție-radio",
        optiuni,
    };
}

/** @type {import("@content/cestionare/types.js").Pagina} */
const paginia_dezabilitati =
    {
        titlu: "Dizabilități",
        descriere: "Studenți cu dizabilități",
        ascunde: (rspi) => rspi["forma"] !== "ID",
        cimpuri: [
            {
                titlu: "Ai dizabilități?",
                nume: "dizabilitati",
                desc: "Selectează toate opțiunile care se aplică ti ai caz.",
                obligatoriu: true,
                tip: "selecție-radio",
                optiuni: () => {
                    return {
                        optiuni: [
                            { text: "Da", exista: true },
                            { text: "Nu", exista: true },
                        ],
                        eroare: null,
                    };
                },
            },
            {
                titlu: "Ai întîmpinat discriminare din cauza dezabilităților?",
                nume: "dizabilitati-discriminare",
                desc: "Selectează toate opțiunile care se aplică ti ai caz.",
                obligatoriu: true,
                ascunde: (rspi) => {
                    return rspi.dizabilitati !== "Da";
                },
                tip: "selecție-radio",
                optiuni: () => {
                    return {
                        optiuni: [
                            { text: "Da", exista: true },
                            { text: "Nu", exista: true },
                        ],
                        eroare: null,
                    };
                },
            },
        ],
    }

/**@type{import("@content/cestionare/types.js").Cestionar}*/
export default {
    id: "atb-cdos-2026",
    titlu: "Sondaj CDOS 2026",
    validare_posta: (posta) =>
        (!posta.endsWith("@student.unitbv.ro"))
            ? "Folosește adresa instituțională de student `@student.unitbv.ro`"
            : null,
    descriere:
        "Sondaj pentru evaluarea respectării Codului de Drepturi și Obligații a Studenților din Universitatea Transilvania din Brașov.",
    pagini: [
        {
            titlu: "Date Academice",
            descriere: "",
            cimpuri: [
                {tip: "text", nume: "nume", titlu: "Nume", valideaza: (v) =>  v === "a" ? null : "Lasă gol, e doar pentru test"},
                {
                    tip: "selecție-cautare",
                    nume: "facultatea",
                    titlu: "Facultatea",
                    obligatoriu: true,
                    optiuni: () => ({
                        optiuni: lista.facultati.map((o) => o.fac).filter(uniq),
                        eroare: null,
                    }),
                },
                {
                    tip: "selecție-radio",
                    nume: "ciclu",
                    titlu: "Ciclu de Studii",
                    obligatoriu: true,
                    optiuni: (rspi) => ({optiuni: ["LICENȚĂ", "MASTER"], eroare: null}),
                },
                {
                    tip: "selecție-radio",
                    nume: "forma",
                    titlu: "Forma de Învățămînt",
                    obligatoriu: true,
                    optiuni: (rspi) => {
                        const filtered = lista.facultati
                            .filter(
                                (o) =>
                                    o.fac === rspi["facultatea"] &&
                                    o.cic === rspi["ciclu"],
                            )
                            .map((o) => o.frm)
                            .filter(uniq);
                        const optiuni = lista.facultati
                            .map((o) => o.frm)
                            .filter(uniq)
                            .map(text => ({ text, exista: filtered.includes(text) }));

                        return { optiuni, eroare: optiuni.length === 0 ? "Nu au fost găsite forme de învățămînt pentru selecția curentă." : null };
                    },
                },
                {
                    tip: "selecție-radio",
                    nume: "programul",
                    titlu: "Programul de Învățămînt",
                    obligatoriu: true,
                    optiuni: (rspi) => {
                        if (!rspi["facultatea"]) return { optiuni: [], eroare: "Selectează mai întâi facultatea." };
                        if (!rspi["ciclu"]) return { optiuni: [], eroare: "Selectează mai întâi ciclul de studii." };
                        if (!rspi["forma"]) return { optiuni: [], eroare: "Selectează mai întâi forma de învățămînt." };
                        const optiuni = lista.facultati
                            .filter(
                                (o) =>
                                    o.fac === rspi["facultatea"] &&
                                    o.cic === rspi["ciclu"] &&
                                    o.frm === rspi["forma"],
                            )
                            .map((o) => o.prg)
                            .filter(uniq)
                            .map(text => ({ text, exista: true }));
                        return { optiuni, eroare: optiuni.length === 0 ? "Nu au fost găsite programe pentru selecția curentă." : null };
                    },
                },
            ],
        },
        {
            titlu: "Întrebări",
            descriere: "Întrebări pe baza Codului DOS",
            cimpuri: [
                danu(
                    "discriminarea",
                    "Ai simțit discriminare sau tratamente inechitabile din partea cadrelor didactice? [art. 1] ",
                ),
                danu(
                    "schim-contr-stud",
                    "Contractele de studii au fost modificate în timpul anului? [art. 3 (3)] [LÎS 199/2023 art. 34 (1)]",
                    { desc: "Contractul de studii încheiat între Universitate și student nu poate fi modificat pe parcursul anului universitar. Un an universitar începe de pe 1 octombrie până pe 29 septembrie conform Legii Învățământului Superior. Contractul conține obiectul contractului, drepturile și obligațiile părților, cuantumul taxei de școlarizare și modalitatea de plata, după caz, răspunderea părților și termenul de valabilitate a contractului." },
                ),
            ],
        },
        paginia_dezabilitati,
    ],
};
