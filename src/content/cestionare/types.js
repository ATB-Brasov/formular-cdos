/** @import { SDict } from "$lib/common_types.js" */

/**
 * O opțiune individuală dintr-o selecție.
 *
 * @typedef {Object} Optiune
 * @property {string} text   Textul afișat pentru această opțiune.
 * @property {boolean} exista Dacă `false`, opțiunea este dezactivată (disabled).
 * @property {string} [msg]  Mesaj tooltip afișat la hover, util când `exista` este `false`.
 */

/**
 * Rezultatul întors de funcția de generare a opțiunilor.
 *
 * @typedef {Object} RezultatOptiuni
 * @property {(string | Optiune)[]} optiuni Lista de opțiuni (poate fi goală)
 * @property {string|null} eroare Mesaj descriptiv dacă nu pot fi generate opțiuni, altfel null
 */

/**
 * Funcția trebuiește să întoarcă un obiect cu lista de opțiuni și un mesaj
 * opțional de eroare în cazul în care nu există opțiuni disponibile.
 *
 * @callback DaOptiuniSelectie
 * @param {SDict<string>} raspunsuri Răspunsurile curente a formularului
 * @return {RezultatOptiuni}
 */

/**
 * @callback Validator
 *
 * Funcție de validare a răspunsului dat.
 *
 * @param {string} valoare Valoarea răspunsului pentru cîmpulu dat
 * @return {string?} Mesaj descriptiv în caz de eroare
 */

/**
 * @typedef {'email'|'selecție-nativa'|'selecție-cautare'|'text'|'selecție-radio'} TipCimp
 */

/**
 * @typedef {Object} Cimp
 * @property {TipCimp} tip
 * @property {string} nume
 * @property {string} titlu
 * @property {string?} [desc]
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
 * @typedef {Object} Cestionar
 * @property {string} id
 * @property {string} titlu
 * @property {string?} [descriere]
 * @property {Validator} [validare_posta]
 * @property {Pagina[]} pagini
 */

/**
 * @param {string | Optiune} opt
 * @returns {Optiune}
 */
export function normOptiune(opt) {
    if (typeof opt === "string") {
        return { text: opt, exista: true };
    }
    return opt;
}
