<script>
    import CadruCimp from './CadruCimp.svelte';
    import {aplicaValidare} from '@content/cestionare/types.js';

    /** @import {FocusEventHandler} from import('svelte/elements') */
    /** @import {Eroare} from import('$lib/common_types') */
    /** @import { Validator } from import('@content/cestionare/types')*/

    /**
     * @typedef {Object} Props
     * @property {'text'|'email'} tip
     * @property {string} nume
     * @property {string | null} [desc=null]
     * @property {string | null} [disclaimer=null]
     * @property {string} titlu
     * @property {boolean} [obligatoriu=false]
     * @property {string | null} [placeholder=null]
     * @property {string} value
     * @property {Eroare} eroare
     * @property {Validator} [valideaza]
     * @property {FocusEventHandler<HTMLElement>} [onblur]
     */

    /** @type {Props} */
    let {
        nume,
        titlu: intrebare,
        desc = null,
        obligatoriu = false,
        disclaimer = null,
        tip,
        placeholder = null,
        onblur,
        valideaza,
        eroare = $bindable(),
        value = $bindable(),
    } = $props();

</script>

<CadruCimp
    {intrebare}
    {obligatoriu}
    {desc}
    {eroare}
>
    <p class="border-l-3 border-surface-dark pl-2.5 mt-1 text-surface-dark text-sm mb-3">
        {@html disclaimer}
    </p>
    <input
        id={nume}
        {placeholder}
        required={obligatoriu}
        class="
            w-full px-2 py-1
            rounded border border-surface-border
            shadow-xs placeholder:text-surface-placeholder dark:border-surface-dim
            bg-surface dark:bg-surface-dark
        "
        type={tip}
        name={nume}
        {onblur}
        bind:value={
            () => value,
            (v) => {
                eroare = aplicaValidare(v, obligatoriu, valideaza)
                value = v
            }
        }
    />
</CadruCimp>
