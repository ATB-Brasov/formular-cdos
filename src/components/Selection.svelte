<script>
    /** @import {FocusEventHandler} from import('svelte/elements') */
    /** @import { Field } from "@content/cestionare/types.js" */
    /** @import {FieldError} from import('$lib/common_types') */
    /** @import { Validator } from import('@content/cestionare/types')*/

    import NativeSelect from "@components/NativeSelect.svelte";
    import SearchSelect from "@components/SearchSelect.svelte";
    import RadioSelect from "@components/RadioSelect.svelte";

    /**
     * @typedef {Object} Props
     * @property {Field} field
     * @property {Record<string, string>} allAnswers
     * @property {string} value
     * @property {FieldError} errors
     * @property {Validator} [valideaza]
     * @property {FocusEventHandler<HTMLElement>} [onblur]
     */

    /** @type {Props} */
    let {
        field,
        allAnswers,
        onblur,
        valideaza,
        errors = $bindable(),
        value = $bindable(),
    } = $props();

    const optiuni = $derived(field.optiuni?.(allAnswers))
    $effect(() => {
        if (optiuni == null) return
        const items = optiuni.optiuni.map((v) =>
            typeof v === "string" ? v : v.exista ? v.text : null
        )
        if (!items.includes(value)) {
            value = "";
        }
    });

    const commonProps = $derived({
        nume: field.nume,
        question: field.titlu,
        desc: field.desc,
        obligatoriu: field.obligatoriu,
        onblur,
        valideaza,
    });
</script>


{#if optiuni == null}
    <i class="text-italic text-danger-strong">
        Nu a fost definită funcția `optiuni` pentru câmpul `{field.nume}`
    </i>
{:else}
    {#if field.tip === "selecție-nativa"}
        <NativeSelect
            {...commonProps}
            {optiuni}
            bind:errors
            bind:value
        />
    {:else if field.tip === "selecție-cautare"}
        <SearchSelect
            {...commonProps}
            {optiuni}
            bind:errors
            bind:value
        />
    {:else if field.tip === "selecție-radio"}
        <RadioSelect
            {...commonProps}
            horizontal={field.horizontal}
            {optiuni}
            bind:errors
            bind:value
        />
    {:else}
        <i class="text-italic text-danger-strong">
            Unknown field type `{field.tip}` for Selection
        </i>
    {/if}
{/if}
