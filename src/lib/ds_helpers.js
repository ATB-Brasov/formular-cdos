/**
 * Helper functions for working with datastructures
 */

/** @import {SDict} from "$lib/common_types" */

/**
 * @template T
 * @param {T} e - The element of a list
 * @param {number} i - The index of the element
 * @param {T[]} self The reference to the list
 * @returns {boolean} If the element should be filtered out
 */
export function uniq(e, i, self) {
    return i === self.indexOf(e);
}

/**
 * @template T
 * @param {SDict<T>|undefined} obj
 * @param {string} key
 * @param {T|null} [defaultValue=null]
 * @returns {T|null}
 */
export function get(obj, key, defaultValue=null) {
    if (obj === undefined) return null;
    return key in obj ? obj[key] : defaultValue;
}
