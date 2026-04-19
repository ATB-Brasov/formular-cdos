import { uniq } from "$lib/ds_helpers.js"
import lista from "./lista_facultati_unitbv_2026.js";

/**@type{import("@content/cestionare/types.js").Cestionar}*/
export default {
    id: "atb-cdos-2026",
    titlu: "Sondaj CDOS 2026",
    descriere: "Sondaj pentru evaluarea respectării Codului de Drepturi și Obligații a Studenților din Universitatea Transilvania din Brașov.",
    pagini: [
    {
        titlu: "Date Academice",
        descriere: "Date academice, ce nu-i clar?",
        cimpuri: [
            {
                tip: "selecție",
                nume: "facultatea",
                titlu: "Facultatea",
                obligatoriu: true,
                optiuni: () => lista.facultati.map((o) => o.fac).filter(uniq),
            },
            {
                tip: "selecție",
                nume: "ciclu",
                titlu: "Ciclu de Studii",
                optiuni: (rspi) =>
                    lista.facultati
                        .filter((o) => o.fac === rspi["facultatea"])
                        .map((o) => o.cic)
                        .filter(uniq),
            },
            {
                tip: "selecție",
                nume: "forma",
                titlu: "Forma de Învățămînt",
                optiuni: (rspi) => // TODO: Adaugă abilitatea de a întoarce un mesaj în caz că filtrul generează listă goală
                    lista.facultati
                        .filter(
                            (o) =>
                                o.fac === rspi["facultatea"] &&
                                o.cic === rspi["ciclu"],
                        )
                        .map((o) => o.frm)
                        .filter((e, i, self) => i === self.indexOf(e)),
            },
            {
                tip: "selecție",
                nume: "programul",
                titlu: "Programul de Învățămînt",
                optiuni: (rspi) =>
                    lista.facultati
                        .filter(
                            (o) =>
                                o.fac === rspi["facultatea"] &&
                                o.cic === rspi["ciclu"] &&
                                o.frm === rspi["forma"],
                        )
                        .map((o) => o.prg)
                        .filter(uniq),
            },
        ],
    },
    {
        titlu: "Fisa de Curs",
        descriere: "Ca la dnul Țierean",
        cimpuri: [
            {
                tip: "text",
                nume: "cunostinte",
                titlu: "descrieție ĉe e aia o fișă de curs",
            },
            {
                tip: "text",
                nume: "primire",
                titlu: "ați primit fișa?",
                obligatoriu: true,
            },
        ],
    },
]};
