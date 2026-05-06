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

    /** @import { RezultatOptiuni } from "@content/cestionare/types.js" */

    /**
     * @typedef {Object} Props
     * @property {string} nume
     * @property {string} intrebare
     * @property {string | null} [desc=null]
     * @property {RezultatOptiuni} optiuni
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
    let cautare = $state("");

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
            return optiuni.optiuni.map((opt) => ({ opt, score: 0 }));
        }
        return optiuni.optiuni
            .map((opt) => ({ opt, score: fuzzyScore(cautare, opt) }))
            .filter(({ score }) => score >= 0)
            .sort((a, b) => b.score - a.score);
    });

    /**
     * Called when the user picks an option from the list.
     * Commits the value and resets the search box so the field is
     * ready for a new search if the user changes their mind.
     * @param {string} opt
     */
    function selecteaza(opt) {
        value = opt;
        cautare = "";   // search box is always empty after a pick
        deschis = false;
        indexActiv = -1;
        inputEl?.dispatchEvent(new FocusEvent("blur", { bubbles: true }));
    }

    /**
     * Clears the committed selection and focuses the search box so the
     * user can immediately start a new search.
     */
    function sterge() {
        value = "";
        cautare = "";
        deschis = false;
        indexActiv = -1;
        // Give the DOM a tick to re-render before focusing
        setTimeout(() => inputEl?.focus(), 0);
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
        // If the user typed something but never picked an option, clear the
        // search box so it doesn't show a half-typed dead-end query.
        cautare = "";

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
        <details class="mb-1 text-sm text-surface-dim dark:text-surface-placeholder">
            <summary class="cursor-pointer">Vezi mai multe detalii&hellip;</summary>
            <span>{desc}</span>
        </details>
    {/if}

    {#if optiuni.eroare != null}
        <p class="mt-1 text-sm text-warning dark:text-warning-dark">{optiuni.eroare}</p>
    {:else}
    <div class="relative">
        <!-- Search input -->
        <input
            bind:this={inputEl}
            type="text"
            autocomplete="off"
            placeholder={value ? "Caută altă opțiune…" : "Caută…"}
            required={obligatoriu && value === ""}
            class="
                w-full px-2 py-1
                rounded border border-surface-border dark:border-surface-dim
                bg-surface dark:bg-surface-dark
                shadow-xs placeholder:text-surface-placeholder
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
                    rounded border border-surface-border dark:border-surface-dim
                    bg-surface dark:bg-surface-darker
                    shadow-md
                "
            >
                {#each optiuniFiltrate as { opt }, i}
                    <li>
                        <button
                            type="button"
                            class="
                                w-full px-3 py-1.5 text-left text-sm
                                hover:bg-primary-subtle dark:hover:bg-surface-dark
                                {i === indexActiv
                                    ? 'bg-primary-muted dark:bg-surface-dim'
                                    : ''}
                            "
                            onmousedown={(e) => { e.preventDefault(); selecteaza(opt); }}
                        >
                            {#each evidentiaza(cautare, opt) as seg}
                                {#if seg.matched}
                                    <span class="font-bold text-primary-strong dark:text-primary-dim">{seg.text}</span>
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
                rounded border border-surface-border dark:border-surface-dim
                bg-surface dark:bg-surface-darker
                shadow-md px-3 py-2 text-sm text-surface-muted
            ">
                Nicio opțiune găsită
            </div>
        {/if}
    </div>

    <!-- Current selection chip -->
    {#if value}
        <div class="
            mt-2 flex items-center gap-2
            rounded-lg border border-primary-border bg-primary-subtle
            px-3 py-2
            dark:border-primary-text dark:bg-primary-deep
        ">
            <!-- Checkmark icon -->
            <svg
                class="h-4 w-4 shrink-0 text-primary dark:text-primary-faint"
                viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"
            >
                <path fill-rule="evenodd"
                    d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                    clip-rule="evenodd"
                />
            </svg>
            <span class="flex-1 text-sm font-medium text-primary-text dark:text-primary-dim">{value}</span>
            <!-- Clear button -->
            <button
                type="button"
                aria-label="Șterge selecția"
                class="
                    ml-auto rounded p-0.5 text-primary-faint
                    hover:bg-primary-muted hover:text-primary-strong
                    dark:hover:bg-primary-text dark:hover:text-primary-dim
                "
                onclick={sterge}
            >
                <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                </svg>
            </button>
        </div>
    {/if}
    {/if}
</div>
