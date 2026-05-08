<script>
    /**
     * @typedef {'primary' | 'ghost'} VariantaButon
     */

    /**
     * @typedef {Object} Props
     * @property {VariantaButon} [varianta='primary']
     * @property {import('svelte/elements').HTMLButtonAttributes['type']} [type='button']
     * @property {boolean} [disabled=false]
     * @property {string} [class='']
     * @property {import('svelte').Snippet} [children]
     */

    /** @type {Props & Record<string, unknown>} */
    let {
        varianta = "primary",
        type = "button",
        disabled = false,
        class: cls = "",
        children,
        ...rest
    } = $props();

    const baza = "rounded-md px-2 py-1 transition-colors";

    const variante = {
        primary: `
            border border-primary-strong bg-primary text-white
            shadow-xs shadow-primary-strong/90
            disabled:border-surface-border disabled:bg-surface-disabled
            disabled:text-surface-muted disabled:shadow-surface-border/40
        `,
        ghost: `
            rounded p-0.5 text-primary-faint
            hover:bg-primary-muted hover:text-primary-strong
            dark:hover:bg-primary-text dark:hover:text-primary-dim
        `,
    };
</script>

<button
    {type}
    {disabled}
    class="{baza} {variante[varianta]} {cls}"
    {...rest}
>
    {@render children?.()}
</button>
