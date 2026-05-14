<script>
    /** @import {FocusEventHandler} from import('svelte/elements') */
    /** @import {Eroare} from import('$lib/common_types') */
    /** @import { Validator } from import('@content/cestionare/types')*/

    /**
     * @typedef {Object} Props
     * @property {string} intrebare
     * @property {string | null} [desc=null]
     * @property {boolean} [obligatoriu=false]
     * @property {import('svelte').Snippet} children
     * @property {FocusEventHandler} [onFocusOut]
     * @property {Eroare} eroare
     * @property {Validator | null} [valideaza=null]
     * @property {string} value
     */

     /** @type {Props} */
    let {
        desc = null,
        obligatoriu = false,
        intrebare,
        value,
        eroare = $bindable(),
        valideaza = null,
        children,
        onFocusOut
    } = $props();


    /**
     * Verifică dacă răspunsul este gol sau nu.
     *
     * @param {string?} value Numele cîmpului
     * @returns {boolean}
     */
    function raspunsGol(value) {
        return value == null || value?.trim() === "";
    }

    $effect(() => {
        if (raspunsGol(value)) {
            eroare = !obligatoriu ? null :  {
                type: "field-required",
                msg : "Câmpul este obligatoriu",
                pag: 0,
            };
        } else {
            const msg = valideaza?.(value)
            eroare = (msg == null) ? null : {
                type: "field-invalid",
                msg,
                pag: 0,
            };
        }
    })
</script>

<fieldset onfocusout={onFocusOut} class="flex flex-col">

    <legend class="mb-1 text-lg font-bold">
        {intrebare}{#if obligatoriu}&#8288;<span
                class="px-0.5 leading-none font-bold text-danger"
            >*</span>
        {/if}
    </legend>

    {#if desc != null}
        <details class="mb-1">
            <summary>Vezi mai multe detalii&hellip;</summary>
            <span>{@html desc}</span>
        </details>
    {/if}

    {@render children?.()}


    {#if eroare}
        <div class="text-red-500">{eroare.msg}</div>
    {/if}

</fieldset>
