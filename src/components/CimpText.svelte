<script>
    import CadruCimp from './CadruCimp.svelte';

    /** @import {FocusEventHandler} from import('svelte/elements') */
    /** @import {Eroare} from import('$lib/common_types') */
    /** @import { Validator } from import('@content/cestionare/types')*/

    /**
     * @typedef {Object} Props
     * @property {'text'|'email'} tip
     * @property {string} nume
     * @property {string | null} [desc=null]
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
    {desc}
    {obligatoriu}
    {valideaza}
    {value}
    bind:eroare
>
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
        bind:value
    />
</CadruCimp>
