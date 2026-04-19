<script>
    /** @import {FocusEventHandler} from import('svelte/elements') */

    /**
     * @typedef {Object} Props
     * @property {'text'|'email'} tip
     * @property {string} nume
     * @property {string | null} [desc=null]
     * @property {string} intrebare
     * @property {string} value
     * @property {boolean} [obligatoriu=false]
     * @property {FocusEventHandler<HTMLElement>} [onblur]
     */

    /** @type {Props} */
    let {
        tip,
        nume,
        desc = null,
        obligatoriu = false,
        onblur,
        intrebare,
        value = $bindable(),
    } = $props();
</script>

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

    <input
        required={obligatoriu}
        class="
            w-full px-2 py-1
            rounded border border-stone-200
            shadow-xs placeholder:text-stone-300 dark:border-stone-500
            bg-white dark:bg-stone-700
        "
        type={tip}
        name={nume}
        {onblur}
        bind:value
    />
</label>
