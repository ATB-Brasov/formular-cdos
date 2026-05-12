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

    const baza = "rounded-md px-2 py-1 transition-transform transition-color duration-200 ease-in-out";

    const variante = {
        primary: `
            border border-primary-strong bg-primary text-white
            shadow-xs shadow-primary-strong/90
            hover:bg-primary-hover hover:shadow-sm hover:shadow-primary-hover/90
            focus:outline-none focus:ring-2 focus:ring-primary-faint focus:ring-opacity-75
            active:scale-95
            disabled:border-surface-border disabled:bg-surface-disabled
            disabled:text-surface-muted disabled:shadow-surface-border/40
        `,
        ghost: `
            text-primary-faint
            hover:bg-primary-muted hover:text-primary-strong
            focus:outline-none focus:ring-2 focus:ring-primary-faint focus:ring-opacity-75
            active:scale-95
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
