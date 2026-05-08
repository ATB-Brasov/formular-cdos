<script>
    /** @import {FocusEventHandler} from import('svelte/elements') */

    /** @import { RezultatOptiuni } from "@content/cestionare/types.js" */
    import { normOptiune } from "@content/cestionare/types.js";

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

<div class="flex flex-col">
    <label for={nume} class="mb-1 font-bold">
        {intrebare}
        {#if obligatoriu}
            <span class="px-0.5 text-lg leading-none font-bold text-danger"
            >*</span>
        {/if}
    </label>

    {#if desc != null}
        <details class="mb-1">
            <summary>Vezi mai multe detalii&hellip;</summary>
            <span>{desc}</span>
        </details>
    {/if}

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
</div>
