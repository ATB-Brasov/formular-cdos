<script>
    /** @import {FocusEventHandler} from import('svelte/elements') */
    /** @import {FieldError} from import('$lib/common_types') */
    /** @import { Validator } from import('@content/cestionare/types')*/

    /**
     * @typedef {Object} Props
     * @property {string} question
     * @property {string | null} [desc=null]
     * @property {boolean} [obligatoriu=false]
     * @property {import('svelte').Snippet} children
     * @property {FocusEventHandler} [onFocusOut]
     * @property {FieldError} errors
     */

     /** @type {Props} */
    let {
        desc = null,
        obligatoriu = false,
        question,
        errors,
        children,
        onFocusOut
    } = $props();

</script>

<fieldset onfocusout={onFocusOut} class="flex flex-col">

    <legend class="mb-1 text-lg font-bold">
        {question}{#if obligatoriu}&#8288;<span
                class="px-0.5 leading-none font-bold text-danger"
            >*</span>
        {/if}
    </legend>

    {#if desc != null}
        <details class="mb-1">
            <summary>Vezi mai multe detalii&hellip;</summary>
            <p class="border-l-3 border-surface-dark pl-2.5 mt-1 text-surface-dark text-sm mb-3">
                {@html desc}
            </p>
        </details>
    {/if}

    {@render children?.()}


    {#if errors}
        <div class="text-red-500 mt-1 text-sm">{errors.msg}</div>
    {/if}

</fieldset>
