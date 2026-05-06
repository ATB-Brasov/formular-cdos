/** @import { SDict } from "$lib/common_types.js" */

/**
 * Rezultatul întors de funcția de generare a opțiunilor.
 *
 * @typedef {Object} RezultatOptiuni
 * @property {string[]} optiuni Lista de opțiuni disponibile (poate fi goală)
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
 * @typedef {'email'|'selecție'|'selecție-cautare'|'text'|'radio'} TipCimp
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

export {};
