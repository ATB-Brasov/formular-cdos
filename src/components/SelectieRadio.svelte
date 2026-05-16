<script>
    /** @import {FocusEventHandler} from import('svelte/elements') */
    /** @import {Eroare} from import('$lib/common_types') */
    /** @import { Validator } from import('@content/cestionare/types')*/

    /** @import { RezultatOptiuni } from "@content/cestionare/types.js" */
    import { aplicaValidare, normOptiune } from "@content/cestionare/types.js";
    import CadruCimp from "./CadruCimp.svelte";

    /**
     * @typedef {Object} Props
     * @property {string} nume
     * @property {string} intrebare
     * @property {boolean} [horizontal = false]
     * @property {string?} [desc = null]
     * @property {RezultatOptiuni} optiuni
     * @property {string} value
     * @property {boolean} [obligatoriu=false]
     * @property {Eroare} eroare
     * @property {Validator} [valideaza]
     * @property {FocusEventHandler<HTMLElement>} [onblur]
     */

    /** @type {Props} */
    let {
        nume,
        obligatoriu = false,
        onblur,
        intrebare,
        desc = null,
        horizontal = false,
        optiuni,
        valideaza,
        eroare = $bindable(),
        value = $bindable(),
    } = $props();

    let facade = {
        get value() {
            return value;
        },
        set value(v) {
            eroare = aplicaValidare(v, obligatoriu, valideaza);
            value = v;
        },
    };
</script>

<CadruCimp {eroare} {intrebare} {desc} {obligatoriu}>
    {#if optiuni.eroare != null}
        <p class="mt-1 text-sm text-warning dark:text-warning-dark">
            {optiuni.eroare}
        </p>
    {:else}
        <div class={["flex", horizontal ? "flex-row gap-4" : "flex-col gap-0.5"]} {onblur}>
            {#each optiuni.optiuni.map(normOptiune) as opt}
                <div 
                    class={[
                        "border transition transition-colors duration-300 rounded rounded-lg",
                        horizontal && "flex-grow",
                        value === opt.text ? 
                            "bg-primary-subtle border-primary-border hover:bg-primary-border"
                        : "border-transparent bg-transparent focus-within:bg-surface focus-within:border-surface-border hover:bg-surface hover:border-surface-border"
                    ]}
                >
                    <label class="block p-2 w-full" class:opacity-50={!opt.exista}>
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
</CadruCimp>
