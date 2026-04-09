import lista from "./lista_facultati_unitbv_2026.js";

/**
 * @template T
 * @typedef {{[key:string]: T}} SDict
 */

/**
 * Funcția trebuiește să întoarcă o listă de șiruri de caractere care să
 * fie folosite la crearea unei selecții.
 *
 * @callback DaOptiuniSelectie
 * @param {SDict<string>} raspunsuri Răspunsurile curente a formularului
 * @return {string[]} Lista de opțiuni pentru selecție
 */

/**
 * @callback Validator
 *
 * Funcție de validare a răspunsului dat.
 *
 * @param {string} valoare Valoarea răspunsului pentru cîmpulu dat
 * @return {string|undefined} Mesaj descriptiv în caz de eroare
 */

/**
 * @typedef {'email'|'selecție'|'text'} TipCimp
 */

/**
 * @typedef {Object} Cimp
 * @property {TipCimp} tip
 * @property {string} nume
 * @property {string} titlu
 * @property {boolean} [obligatoriu]
 * @property {Validator} [valideaza]
 * @property {DaOptiuniSelectie} [optiuni]
 */

/**
 * @typedef {Object} Pagina
 * @property {string} titlu
 * @property {string} descriere
 * @property {Cimp[]} cimpuri
 */

/**
 * @template T
 * @param {T} e - The element of a list
 * @param {number} i - The index of the element
 * @param {T[]} self The reference to the list
 * @returns {boolean} If the element should be filtered out
 */
function uniq(e, i, self) {
    return i === self.indexOf(e);
}

/**@type{Pagina[]}*/
export default [
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
                optiuni: (rspi) =>
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
                valideaza: (/** @type {string} */ val) => {
                    if (val.toLowerCase() !== "da") {
                        return "răspunsul trebuie să fie `da`";
                    }
                },
            },
        ],
    },
];
