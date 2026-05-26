/** @import { SDict } from "$lib/common_types.js" */

/**
 * @typedef {Object} Option
 * @property {string} text
 * @property {boolean} exista
 * @property {string} [msg]
 */

/**
 * @typedef {Object} OptionsResult
 * @property {(string | Option)[]} optiuni
 * @property {string|null} eroare
 */

/**
 * @callback HideField
 * @param {SDict<string>} answers
 * @return {boolean}
 */

/**
 * @callback GetSelectionOptions
 * @param {SDict<string>} answers
 * @return {OptionsResult}
 */

/**
 * @callback Validator
 * @param {string} value
 * @return {string?}
 */

/**
 * @typedef {'email'|'selecție-nativa'|'selecție-cautare'|'text'|'textarea'|'selecție-radio'} FieldType
 */

/**
 * @typedef {Object} Field
 * @property {FieldType} tip
 * @property {string} nume
 * @property {string} titlu
 * @property {boolean} [horizontal]
 * @property {string?} [desc]
 * @property {HideField?} [ascunde]
 * @property {boolean} [obligatoriu]
 * @property {Validator} [valideaza]
 * @property {GetSelectionOptions} [optiuni]
 */

/**
 * @typedef {Object} Section
 * @property {string} titlu
 * @property {string} descriere
 * @property {Field[]} cimpuri
 * @property {HideField?} [ascunde]
 */

/**
 * @typedef {Object} Questionnaire
 * @property {string} id
 * @property {string} titlu
 * @property {string?} [descriere]
 * @property {Validator} [validare_posta]
 * @property {Section[]} pagini
 */

/**
 * @param {string | Option} opt
 * @returns {Option}
 */
export function normalizeOption(opt) {
    if (typeof opt === "string") {
        return { text: opt, exista: true };
    }
    return opt;
}

/**
 * @param {string?} value
 * @returns {boolean}
 */
export function emptyAnswer(value) {
    return value == null || value?.trim() === "";
}

/**
 * @param {string} value
 * @param {boolean} obligatoriu
 * @param {Validator} valideaza
 * @returns
 */
export function applyValidation(value, obligatoriu, valideaza) {
    let err;
    if (emptyAnswer(value)) {
        err = !obligatoriu ? null : {
            type: "field-required",
            msg: "Câmpul este obligatoriu",
            pag: 0,
        };
    } else {
        const msg = valideaza?.(value);
        err = (msg == null) ? null : {
            type: "field-invalid",
            msg,
            pag: 0,
        };
    }
    return err;
}
