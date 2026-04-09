<script>
    /** @import {FocusEventHandler} from import('svelte/elements') */

    /**
     * @typedef {Object} Props
     * @property {string} nume
     * @property {string} intrebare
     * @property {string[]} optiuni
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
        optiuni,
        value = $bindable(),
    } = $props();
</script>

<div>
    <label class="flex flex-col">
        <span class="mb-1">{intrebare}
            {#if obligatoriu}
                <span
                    class="px-0.5 text-lg leading-none font-bold text-red-500"
                >*</span>
            {/if}
        </span>
        <select
            class="
                p-2 rounded shadow-xs
                border border-stone-200 dark:border-stone-500
                bg-white dark:bg-stone-700 min-w-full w-full max-w-full
            "
            required={obligatoriu}
            {onblur}
            name={nume}
            bind:value
        >
            <option value="">Alege Opțiune</option>
            {#each optiuni as opt}
                <option value={opt}>{opt}</option>
            {/each}
        </select>
    </label>
</div>
