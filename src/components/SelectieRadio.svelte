<script>
    /** @import {FocusEventHandler} from import('svelte/elements') */

    /**
     * @typedef {Object} Props
     * @property {string} nume
     * @property {string} intrebare
     * @property {string?} [desc = null]
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
        <div
            class="
                p-2 rounded flex flex-col
            "
            {onblur}
        >
            {#each optiuni as opt}
                <label>
                    <input
                        type="radio"
                        name={nume}
                        bind:group={value}
                        value={opt}
                        required={obligatoriu}
                    >
                    {opt}
                </label>
            {/each}
        </div>
    </label>
</div>
