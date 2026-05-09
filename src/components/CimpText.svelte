<script>
    /** @import {FocusEventHandler} from import('svelte/elements') */

    /**
     * @typedef {Object} Props
     * @property {'text'|'email'} tip
     * @property {string} nume
     * @property {string | null} [placeholder=null]
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
        placeholder = null,
        desc = null,
        obligatoriu = false,
        onblur,
        intrebare,
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

    <input
        id={nume}
        placeholder={placeholder}
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
</div>
