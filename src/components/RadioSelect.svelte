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
     * @property {boolean} [horizontal = false]
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
        horizontal = false,
        optiuni,
        valideaza,
        errors = $bindable(),
        value = $bindable(),
    } = $props();

    let facade = {
        get value() {
            return value;
        },
        set value(v) {
            errors = applyValidation(v, obligatoriu, valideaza);
            value = v;
        },
    };
</script>

<FieldFrame {errors} {question} {desc} {obligatoriu}>
    {#if optiuni.eroare != null}
        <p class="mt-1 text-sm text-warning dark:text-warning-dark">
            {optiuni.eroare}
        </p>
    {:else}
        <div
            class={["flex", horizontal ? "flex-row gap-4" : "flex-col gap-0.5"]}
            {onblur}
        >
            {#each optiuni.optiuni.map(normalizeOption) as opt}
                <div
                    class={[
                        "border transition-colors duration-300 rounded-lg",
                        horizontal && "grow",
                        value === opt.text
                            ? "bg-primary-subtle border-primary-border hover:bg-primary-border"
                            : "border-transparent bg-transparent focus-within:bg-surface focus-within:border-surface-border hover:bg-surface hover:border-surface-border",
                    ]}
                >
                    <label
                        class="block p-2 w-full"
                        class:opacity-50={!opt.exista}
                    >
                        <input
                            type="radio"
                            class="accent-primary mr-2"
                            name={nume}
                            bind:group={facade.value}
                            value={opt.text}
                            disabled={!opt.exista}
                            required={obligatoriu}
                        >
                        {opt.text}
                    </label>
                </div>
            {/each}
        </div>
    {/if}
</FieldFrame>
