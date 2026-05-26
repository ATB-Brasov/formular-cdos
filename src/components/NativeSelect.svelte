<script>
    /** @import {FocusEventHandler} from import('svelte/elements') */
    /** @import {FieldError} from import('$lib/common_types') */
    /** @import { Validator } from import('@content/cestionare/types')*/

    /** @import { OptionsResult } from "@content/cestionare/types.js" */
    import {
        applyValidation,
        normalizeOption,
    } from "@content/cestionare/types.js";
    import FieldFrame from "./FieldFrame.svelte";

    /**
     * @typedef {Object} Props
     * @property {string} nume
     * @property {string} question
     * @property {string?} [desc = null]
     * @property {OptionsResult} optiuni
     * @property {string} value
     * @property {boolean} [obligatoriu=false]
     * @property {FieldError} errors
     * @property {Validator} [valideaza]
     * @property {FocusEventHandler<HTMLElement>} [onblur]
     */

    /** @type {Props} */
    let {
        nume,
        obligatoriu = false,
        onblur,
        question,
        desc = null,
        optiuni,
        valideaza,
        errors = $bindable(),
        value = $bindable(),
    } = $props();
</script>

<FieldFrame {errors} {question} {desc} {obligatoriu}>
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
            bind:value={() => value, (v) => {
                errors = applyValidation(v, obligatoriu, valideaza);
                value = v;
            }}
        >
            <option value="">Alege Opțiune</option>
            {#each optiuni.optiuni.map(normalizeOption) as opt}
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
</FieldFrame>
