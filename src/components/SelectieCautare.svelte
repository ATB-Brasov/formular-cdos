<script>
    /** @import {FocusEventHandler} from import('svelte/elements') */

    /**
     * Strips Romanian (and general Latin) diacritics so that e.g.
     * 'stiinta' matches 'Știința', 'a' matches 'ă/â', 's' matches 'ș/ş', etc.
     *
     * Uses Unicode NFD decomposition: accented characters split into base letter
     * + combining mark, then the marks are removed.
     *
     * @param {string} s
     * @returns {string}
     */
    function normalizeaza(s) {
        return s
            .normalize("NFD")
            .replace(/\p{Diacritic}/gu, "");
    }

    /**
     * Fuzzy-matches `needle` against `haystack`.
     * Returns a score >= 0 if it matches (higher = better), or -1 if it doesn't.
     * All characters of `needle` must appear in `needle` order inside `haystack`.
     * Both sides are diacritic-normalised before comparison.
     *
     * @param {string} needle
     * @param {string} haystack
     * @returns {number} score, or -1 if no match
     */
    function fuzzyScore(needle, haystack) {
        if (needle === "") return 0;

        const n = normalizeaza(needle.toLowerCase());
        const h = normalizeaza(haystack.toLowerCase());

        let ni = 0; // index into needle
        let score = 0;
        let consecutive = 0;

        for (let hi = 0; hi < h.length && ni < n.length; hi++) {
            if (h[hi] === n[ni]) {
                ni++;
                consecutive++;
                // Bonus for consecutive matches and for matching at word start
                score += consecutive;
                if (hi === 0 || h[hi - 1] === " " || h[hi - 1] === "-") {
                    score += 5; // word-boundary bonus
                }
            } else {
                consecutive = 0;
            }
        }

        return ni === n.length ? score : -1;
    }

    /**
     * @typedef {Object} Props
     * @property {string} nume
     * @property {string} intrebare
     * @property {string | null} [desc=null]
     * @property {string[]} optiuni
     * @property {string} value
     * @property {boolean} [obligatoriu=false]
     * @property {FocusEventHandler<HTMLElement>} [onblur]
     */

    /** @type {Props} */
    let {
        nume,
        obligatoriu = false,
        onblur,
        intrebare,
        desc = null,
        optiuni,
        value = $bindable(),
    } = $props();

    /** @type {string} */
    let cautare = $state(value ?? "");

    /** @type {boolean} */
    let deschis = $state(false);

    /** @type {number} */
    let indexActiv = $state(-1);

    /** @type {HTMLInputElement | null} */
    let inputEl = $state(null);

    /** @type {HTMLUListElement | null} */
    let listaEl = $state(null);

    const optiuniFiltrate = $derived.by(() => {
        if (cautare === "") {
            return optiuni.map((opt) => ({ opt, score: 0 }));
        }
        return optiuni
            .map((opt) => ({ opt, score: fuzzyScore(cautare, opt) }))
            .filter(({ score }) => score >= 0)
            .sort((a, b) => b.score - a.score);
    });

    /**
     * Called when the user picks an option from the list.
     * @param {string} opt
     */
    function selecteaza(opt) {
        value = opt;
        cautare = opt;
        deschis = false;
        indexActiv = -1;
        // Trigger the parent's onblur-equivalent so validation runs
        inputEl?.dispatchEvent(new FocusEvent("blur", { bubbles: true }));
    }

    /** @param {KeyboardEvent} e */
    function peKeyDown(e) {
        if (!deschis) {
            if (e.key === "ArrowDown" || e.key === "Enter") {
                deschis = true;
                indexActiv = 0;
                e.preventDefault();
            }
            return;
        }

        const total = optiuniFiltrate.length;

        if (e.key === "ArrowDown") {
            indexActiv = (indexActiv + 1) % total;
            e.preventDefault();
            scrollLaActiv();
        } else if (e.key === "ArrowUp") {
            indexActiv = (indexActiv - 1 + total) % total;
            e.preventDefault();
            scrollLaActiv();
        } else if (e.key === "Enter") {
            if (indexActiv >= 0 && indexActiv < total) {
                selecteaza(optiuniFiltrate[indexActiv].opt);
            }
            e.preventDefault();
        } else if (e.key === "Escape") {
            deschis = false;
            indexActiv = -1;
        }
    }

    function scrollLaActiv() {
        // Give Svelte a tick to render before scrolling
        setTimeout(() => {
            const item = listaEl?.children[indexActiv];
            item?.scrollIntoView({ block: "nearest" });
        }, 0);
    }

    /** @param {Event} e */
    function peInput(e) {
        // Keep the internal search text, clear the committed value until user
        // actually picks something from the list.
        cautare = /** @type {HTMLInputElement} */ (e.target).value;
        value = "";
        deschis = true;
        indexActiv = cautare === "" ? -1 : 0;
    }

    /**
     * Close the dropdown when focus leaves the whole widget.
     * @param {FocusEvent} e
     */
    function peFocusOut(e) {
        // relatedTarget is the element receiving focus; if it's still inside our
        // container we leave the dropdown open.
        const related = /** @type {Node | null} */ (e.relatedTarget);
        if (listaEl && listaEl.contains(related)) return;

        deschis = false;
        indexActiv = -1;

        // If the user typed something but never picked an option, reset the
        // display text to the last committed value so the field isn't left
        // in a half-edited state.
        cautare = value;

        if (onblur) onblur(/** @type {any} */ (e));
    }

    /**
     * Highlight the matched characters in a result string.
     * Returns an array of { text, matched } segments.
     * Matching is done on diacritic-normalised versions so that e.g. typing
     * 's' still highlights 'ș' in the result; the original (diacritic) characters
     * are always preserved in the output.
     *
     * @param {string} needle
     * @param {string} haystack
     * @returns {{ text: string, matched: boolean }[]}
     */
    function evidentiaza(needle, haystack) {
        if (needle === "") return [{ text: haystack, matched: false }];

        // Normalise for matching only — keep originals for display.
        const n = normalizeaza(needle.toLowerCase());
        const h = normalizeaza(haystack.toLowerCase());

        /** @type {{ text: string, matched: boolean }[]} */
        const parts = [];
        let ni = 0;
        let segStart = 0;
        let inMatch = false;

        for (let hi = 0; hi < haystack.length; hi++) {
            if (ni < n.length && h[hi] === n[ni]) {
                if (!inMatch && hi > segStart) {
                    parts.push({ text: haystack.slice(segStart, hi), matched: false });
                    segStart = hi;
                }
                inMatch = true;
                ni++;
            } else {
                if (inMatch) {
                    parts.push({ text: haystack.slice(segStart, hi), matched: true });
                    segStart = hi;
                    inMatch = false;
                }
            }
        }

        // flush remaining
        if (segStart < haystack.length) {
            parts.push({ text: haystack.slice(segStart), matched: inMatch });
        }

        return parts;
    }
</script>

<!--
    Hidden native input so the form submission still picks up `name`/`value`
    correctly (the visible input is only for search).
-->
<input type="hidden" name={nume} value={value} />

<div onfocusout={(e) => peFocusOut(e)} class="flex flex-col">
    <span class="mb-1 font-bold">
        {intrebare}
        {#if obligatoriu}
            <span class="px-0.5 text-lg leading-none font-bold text-red-500">*</span>
        {/if}
    </span>

    {#if desc != null}
        <details class="mb-1 text-sm text-olive-600 dark:text-olive-300">
            <summary class="cursor-pointer">Vezi mai multe detalii&hellip;</summary>
            <span>{desc}</span>
        </details>
    {/if}

    <div class="relative">
        <!-- Search input -->
        <input
            bind:this={inputEl}
            type="text"
            autocomplete="off"
            placeholder="Caută…"
            required={obligatoriu && value === ""}
            class="
                w-full px-2 py-1
                rounded border border-olive-200 dark:border-olive-500
                bg-white dark:bg-olive-700
                shadow-xs placeholder:text-olive-300
            "
            value={cautare}
            oninput={peInput}
            onfocus={() => { deschis = true; }}
            onkeydown={peKeyDown}
        />

        <!-- Dropdown list -->
        {#if deschis && optiuniFiltrate.length > 0}
            <ul
                bind:this={listaEl}
                class="
                    absolute z-50 mt-1 w-full
                    max-h-60 overflow-y-auto
                    rounded border border-olive-200 dark:border-olive-500
                    bg-white dark:bg-olive-800
                    shadow-md
                "
            >
                {#each optiuniFiltrate as { opt }, i}
                    <li>
                        <button
                            type="button"
                            class="
                                w-full px-3 py-1.5 text-left text-sm
                                hover:bg-blue-50 dark:hover:bg-olive-700
                                {i === indexActiv
                                    ? 'bg-blue-100 dark:bg-olive-600'
                                    : ''}
                            "
                            onmousedown={(e) => { e.preventDefault(); selecteaza(opt); }}
                        >
                            {#each evidentiaza(cautare, opt) as seg}
                                {#if seg.matched}
                                    <span class="font-bold text-blue-600 dark:text-blue-300">{seg.text}</span>
                                {:else}
                                    <span>{seg.text}</span>
                                {/if}
                            {/each}
                        </button>
                    </li>
                {/each}
            </ul>
        {:else if deschis && cautare !== "" && optiuniFiltrate.length === 0}
            <div class="
                absolute z-50 mt-1 w-full
                rounded border border-olive-200 dark:border-olive-500
                bg-white dark:bg-olive-800
                shadow-md px-3 py-2 text-sm text-olive-400
            ">
                Nicio opțiune găsită
            </div>
        {/if}
    </div>
</div>
