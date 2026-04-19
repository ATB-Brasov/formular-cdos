/** @import { SDict } from "$lib/common_types.js" */

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
 * @property {string} [desc]
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
 * @property {string} [descriere]
 * @property {Validator} [validare_posta]
 * @property {Pagina[]} pagini
 */

export {};
