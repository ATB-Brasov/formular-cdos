<script>
    /** @import {FocusEventHandler} from import('svelte/elements') */
    /** @import {Eroare} from import('$lib/common_types') */
    /** @import { Validator } from import('@content/cestionare/types')*/

    /** @import { RezultatOptiuni } from "@content/cestionare/types.js" */
    import { normOptiune } from "@content/cestionare/types.js";
    import CadruCimp from "./CadruCimp.svelte";

    /**
     * @typedef {Object} Props
     * @property {string} nume
     * @property {string} intrebare
     * @property {string?} [desc = null]
     * @property {RezultatOptiuni} optiuni
     * @property {string} value
     * @property {boolean} [obligatoriu=false]
     * @property {Eroare} eroare
     * @property {Validator} [valideaza]
     * @property {FocusEventHandler<HTMLElement>} [onblur]
     */

    /** @type {Props} */
    let {
        nume,
        obligatoriu = false,
        onblur,
        intrebare,
        desc = null,
        optiuni,
        valideaza,
        eroare = $bindable(),
        value = $bindable(),
    } = $props();
</script>

<CadruCimp {valideaza} bind:eroare {value} {intrebare} {desc} {obligatoriu}>
    {#if optiuni.eroare != null}
        <p class="mt-1 text-sm text-warning dark:text-warning-dark">
            {optiuni.eroare}
        </p>
    {:else}
        <select
            id={nume}
            class="
                p-2 rounded shadow-xs
                border border-surface-border dark:border-surface-dim
                bg-surface dark:bg-surface-dark min-w-full w-full max-w-full
            "
            required={obligatoriu}
            {onblur}
            name={nume}
            bind:value
        >
            <option value="">Alege Opțiune</option>
            {#each optiuni.optiuni.map(normOptiune) as opt}
                <option
                    value={opt.text}
                    disabled={!opt.exista}
                    title={opt.msg ?? ""}
                >
                    {opt.text}
                </option>
            {/each}
        </select>
    {/if}
</CadruCimp>
