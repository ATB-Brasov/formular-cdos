<script>
    /** @import {FocusEventHandler} from import('svelte/elements') */
    /** @import { Cimp } from "@content/cestionare/types.js" */

    import SelectieNativa from "@components/SelectieNativa.svelte";
    import SelectieCautare from "@components/SelectieCautare.svelte";
    import SelectieRadio from "@components/SelectieRadio.svelte";

    /**
     * @typedef {Object} Props
     * @property {Cimp} cimp
     * @property {Record<string, string>} raspunsuri
     * @property {string} value
     * @property {FocusEventHandler<HTMLElement>} [onblur]
     */

    /** @type {Props} */
    let {
        cimp,
        raspunsuri,
        onblur,
        value = $bindable(),
    } = $props();

    const props_comuni = $derived({
        nume: cimp.nume,
        intrebare: cimp.titlu,
        desc: cimp.desc,
        obligatoriu: cimp.obligatoriu,
        onblur,
    });

</script>


{#if cimp.optiuni == null}
    <i class="text-italic text-danger-strong">
        Nu a fost definită funcția `optiuni` pentru cîmpul `{cimp.nume}`
    </i>
{:else}
    {@const rez = cimp.optiuni(raspunsuri)}
    {#if cimp.tip === "selecție-nativa"}
        <SelectieNativa
            {...props_comuni}
            optiuni={rez}
            bind:value
        />
    {:else if cimp.tip === "selecție-cautare"}
        <SelectieCautare
            {...props_comuni}
            optiuni={rez}
            bind:value
        />
    {:else if cimp.tip === "selecție-radio"}
        <SelectieRadio
            {...props_comuni}
            optiuni={rez}
            bind:value
        />
    {:else}
        <i class="text-italic text-danger-strong">
            Tip cîmp `{cimp.tip}` necunoscut pentru Selectie
        </i>
    {/if}
{/if}
