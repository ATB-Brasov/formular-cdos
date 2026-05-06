<script>
    /** @import {FocusEventHandler} from import('svelte/elements') */

    /** @import { RezultatOptiuni } from "@content/cestionare/types.js" */

    /**
     * @typedef {Object} Props
     * @property {string} nume
     * @property {string} intrebare
     * @property {string?} [desc = null]
     * @property {RezultatOptiuni} optiuni
     * @property {string} value
     * @property {boolean} [obligatoriu=false]
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
        value = $bindable(),
    } = $props();
</script>

<div>
    <label class="flex flex-col">
        <span class="mb-1 font-bold">{intrebare}
            {#if obligatoriu}
                <span
                    class="px-0.5 text-lg leading-none font-bold text-red-500"
                >*</span>
            {/if}
        </span>
        {#if desc != null}
            <details>
                <summary>Vezi mai multe detalii&hellip;</summary>
                <span>
                    {desc}
                </span>
            </details>
        {/if}
        {#if optiuni.eroare != null}
            <p class="mt-1 text-sm text-amber-600 dark:text-amber-400">{optiuni.eroare}</p>
        {:else}
            <select
                class="
                    p-2 rounded shadow-xs
                    border border-olive-200 dark:border-olive-500
                    bg-white dark:bg-olive-700 min-w-full w-full max-w-full
                "
                required={obligatoriu}
                {onblur}
                name={nume}
                bind:value
            >
                <option value="">Alege Opțiune</option>
                {#each optiuni.optiuni as opt}
                    <option value={opt}>{opt}</option>
                {/each}
            </select>
        {/if}
    </label>
</div>
