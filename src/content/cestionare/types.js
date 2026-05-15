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
  * Această funcție este apelată pentru a determina dacă un câmp trebuie afișat în funcție de răspunsurile curente.
  *
  * @callback AscundeCimp
  * @param {SDict<string>} raspunsuri Răspunsurile curente a formularului
  * @return {boolean}
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
 * @property {boolean} [horizontal]
 * @property {string?} [desc]
 * @property {AscundeCimp?} [ascunde]
 * @property {boolean} [obligatoriu]
 * @property {Validator} [valideaza]
 * @property {DaOptiuniSelectie} [optiuni]
 */

/**
 * @typedef {Object} Pagina
 * @property {string} titlu
 * @property {string} descriere
 * @property {Cimp[]} cimpuri
 * @property {AscundeCimp?} [ascunde]
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

/**
 * Verifică dacă răspunsul este gol sau nu.
 *
 * @param {string?} value Numele cîmpului
 * @returns {boolean}
 */
function raspunsGol(value) {
    return value == null || value?.trim() === "";
}

/**
 *
 * @param {string} value
 * @param {boolean} obligatoriu
 * @param {Validator} valideaza
 * @returns
 */
export function aplicaValidare(value, obligatoriu, valideaza) {
    let err
    if (raspunsGol(value)) {
        err = !obligatoriu ? null :  {
            type: "field-required",
            msg : "Câmpul este obligatoriu",
            pag: 0,
        };
    } else {
        const msg = valideaza?.(value)
        err = (msg == null) ? null : {
            type: "field-invalid",
            msg,
            pag: 0,
        };
    }
    return err
}
