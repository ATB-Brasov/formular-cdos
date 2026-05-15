<script>
    /** @import {FocusEventHandler} from import('svelte/elements') */
    /** @import { Cimp } from "@content/cestionare/types.js" */
    /** @import {Eroare} from import('$lib/common_types') */
    /** @import { Validator } from import('@content/cestionare/types')*/

    import SelectieNativa from "@components/SelectieNativa.svelte";
    import SelectieCautare from "@components/SelectieCautare.svelte";
    import SelectieRadio from "@components/SelectieRadio.svelte";

    /**
     * @typedef {Object} Props
     * @property {Cimp} cimp
     * @property {Record<string, string>} raspunsuri
     * @property {string} value
     * @property {Eroare} eroare
     * @property {Validator} [valideaza]
     * @property {FocusEventHandler<HTMLElement>} [onblur]
     */

    /** @type {Props} */
    let {
        cimp,
        raspunsuri,
        onblur,
        valideaza,
        eroare = $bindable(),
        value = $bindable(),
    } = $props();

    const optiuni = $derived(cimp.optiuni?.(raspunsuri))
    $effect(() => {
        if (optiuni == null) return
        const optii = optiuni.optiuni.map((v) =>
            typeof v === "string" ? v : v.exista ? v.text : null
        )
        if (!optii.includes(value)) {
            value = "";
        }
    });

    const props_comuni = $derived({
        nume: cimp.nume,
        intrebare: cimp.titlu,
        desc: cimp.desc,
        obligatoriu: cimp.obligatoriu,
        onblur,
        valideaza,
    });
</script>


{#if optiuni == null}
    <i class="text-italic text-danger-strong">
        Nu a fost definită funcția `optiuni` pentru cîmpul `{cimp.nume}`
    </i>
{:else}
    {#if cimp.tip === "selecție-nativa"}
        <SelectieNativa
            {...props_comuni}
            {optiuni}
            bind:eroare
            bind:value
        />
    {:else if cimp.tip === "selecție-cautare"}
        <SelectieCautare
            {...props_comuni}
            {optiuni}
            bind:eroare
            bind:value
        />
    {:else if cimp.tip === "selecție-radio"}
        <SelectieRadio
            {...props_comuni}
            horizontal={cimp.horizontal}
            {optiuni}
            bind:eroare
            bind:value
        />
    {:else}
        <i class="text-italic text-danger-strong">
            Tip cîmp `{cimp.tip}` necunoscut pentru Selectie
        </i>
    {/if}
{/if}
