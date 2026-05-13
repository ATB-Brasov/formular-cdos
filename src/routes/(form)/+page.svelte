<script>
    /** @import { Cimp } from "@content/cestionare/types.js" */
    /** @import { SDict, Eroare } from "$lib/common_types.js" */

    import { enhance } from "$app/forms";
    import { page } from "$app/state";

    import Buton from "@components/Buton.svelte";
    import Selectie from "@components/Selectie.svelte";
    import CimpText from "@components/CimpText.svelte";

    import Intrare from "./Intrare.svelte";
    import { onMount } from "svelte";

    const sondaj_cdos =
        (page.url.searchParams.get("test") === "true"
            ? await import("@content/cestionare/atb-cdos-2026_test.js")
            : await import("@content/cestionare/atb-cdos-2026.js")).default;

    /** @type {import('./$types').PageProps} */
    let { data, form } = $props();

    let pagina = $state(data.session?.email ? 0 : -1);
    /** @type {SDict<Eroare>} */ let eroare = $state({});
    /** @type {SDict<string>} */ let raspunsuri = $state(
        /** @type {SDict<string>} */ ({}),
    );

    /**
     * @param {number} pag
     * @param {{whence: string}} [options]
     */
    function seteaza_pagina(pag, options) {
        if (options?.whence != null) console.log(options.whence);
        pagina = pag;
        localStorage.setItem("pagina", pagina.toString());
    }

    /** @param {"urmator" | "precedent"} directie */
    function scimbaPagina(directie) {
        let tmp = pagina;
        while (true) {
            switch (directie) {
                case "urmator":
                    tmp += 1;
                    break;
                case "precedent":
                    tmp -= 1;
                    if (tmp === -1) {
                        seteaza_pagina(tmp, {
                            whence: "scimbaPagina::case precedent",
                        });
                        return;
                    }
                    break;
                default:
                    return;
            }
            if (tmp < 0 || tmp > ULTIMA_PAGINA) return;
            const filtru = intrebari[tmp].filtru_afisare;
            if (filtru == null) break;
            if (filtru(raspunsuri)) break;
        }
        seteaza_pagina(tmp, { whence: "scimbaPagina::final" });
    }

    onMount(() => {
        const raspunsuriSalvate = localStorage.getItem("raspunsuri");
        if (raspunsuriSalvate) {
            try {
                const newRaspunsuri = JSON.parse(raspunsuriSalvate);
                if (typeof newRaspunsuri === "object") {
                    raspunsuri = newRaspunsuri;
                }
                const paginaSalvata = localStorage.getItem("pagina");
                if (paginaSalvata) {
                    pagina = parseInt(paginaSalvata);
                }
            } catch (e) {
                console.error(
                    "Nu am putut incărca răspunsurile din localStorage",
                    e,
                );
            }
        }
    });

    $effect(() => {
        if (form == null) return;
        if (form.pag != null) seteaza_pagina(form.pag, { whence: "$effect" });


        /** @type {SDict<string>} */ const newRaspunsuri = {};
        /** @type {SDict<Eroare>} */ const newEroare = {};
        for (const [k, v] of Object.entries(form)) {
            if (typeof v === "string") {
                newRaspunsuri[k] = v;
            }
        }
        for (const [k, v] of Object.entries(form?.erori ?? {})) {
            newEroare[k] = /** @type {Eroare} */ (v);
        }

        if (Object.entries(newRaspunsuri).length > 0) {
            raspunsuri = newRaspunsuri;
        }
        eroare = newEroare;
    });

    $effect(() => {
        if (Object.keys(raspunsuri).length > 0) {
            localStorage.setItem("raspunsuri", JSON.stringify(raspunsuri));
        }
    });

    let intrebari = sondaj_cdos.pagini.map((p, idx) => ({...p, idx}));

    /**
     * Verifică dacă răspunsul este gol sau nu.
     *
     * @param {string} nume Numele cîmpului
     * @returns {boolean}
     */
    function raspunsGol(nume) {
        return raspunsuri[nume] == null || raspunsuri[nume]?.trim() === "";
    }

    const ULTIMA_PAGINA = intrebari.length - 1;
    const pagina_activa = $derived(intrebari[pagina]);
    const btn_urmator_activ = $derived(
        !pagina_activa.cimpuri.some(
            (c) =>
                raspunsGol(c.nume) &&
                (c.filtru_afisare == null || c.filtru_afisare(raspunsuri)) &&
                c.obligatoriu,
        ) &&
            !Object.keys(eroare).some((k) => eroare[k].pag === pagina),
    );

    function aplica_validare(/**@type{Cimp}*/ cimp) {
        delete eroare[cimp.nume];

        const rasp = raspunsuri[cimp.nume];
        let errorMsg = null;
        let errorType = null;

        if (raspunsGol(cimp.nume) && cimp.obligatoriu) {
            errorType = "field-required";
            errorMsg = "Cîmpul este obligatoriu";
        } else if (cimp.valideaza != null) {
            const err = cimp.valideaza(rasp?.toString() ?? ""); // Ensure rasp is a string for validation
            if (err != null) {
                errorType = "field-invalid";
                errorMsg = err;
            }
        }

        if (errorMsg && errorType) {
            eroare[cimp.nume] = {
                type: errorType,
                msg: errorMsg,
                pag: pagina,
            };
        }
    }

    const pagini_vizibile = $derived(
        intrebari.filter((p) =>
            p.filtru_afisare == null || p.filtru_afisare(raspunsuri)
),
    );
</script>

{#if page.url.searchParams.get("test") === "true"}
    <div
        class="fixed bottom-6 left-6 rounded bg-primary-subtle border border-primary-border z-200 px-4 py-2 font-mono"
    >
        <span class="inline sm:hidden">xs</span>
        <span class="hidden sm:inline md:hidden">sm</span>
        <span class="hidden md:inline lg:hidden">md</span>
        <span class="hidden lg:inline xl:hidden">lg</span>
        <span class="hidden xl:inline">xl</span>
    </div>
{/if}

<h1 class="text-4xl font-bold mb-4">{sondaj_cdos.titlu}</h1>

{#if pagina === -1}
    <div
        class="w-full rounded-xl border border-surface-border bg-surface mt-4 mb-8 p-3"
    >
        {sondaj_cdos.descriere}
    </div>

    <Intrare bind:eroare bind:pagina />
{:else}
    <div class="flex flex-wrap gap-2 mb-8">
        {#each intrebari as pag, i}
            <button
                aria-label="Pagina {i + 1}"
                disabled={pag.filtru_afisare != null && !pag.filtru_afisare(raspunsuri)}
                onclick={() => {
                    pagina = i;
                    localStorage.setItem("pagina", pagina.toString());
                }}
                class={[
                    "px-1 py-0.5 rounded-full grow disabled:bg-surface-disabled transition-colors duration-200",
                    i === pagina
                        ? "bg-primary"
                        : "bg-surface-border hover:bg-surface-secondary",
                    i < pagina && Object.values(eroare).some((e) => e.pag === i)
                        ? "border-2 border-danger-strong bg-danger-strong"
                        : "opacity-75",
                ]}
            >
            </button>
        {/each}
    </div>

    <h2 class="text-2xl font-bold">{pagina_activa.titlu}</h2>
    {#if pagina_activa.descriere}
        <div
            class="w-full rounded-xl border border-surface-border bg-surface mt-4 p-3"
        >
            {pagina_activa.descriere}
        </div>
    {/if}

    <form
        method="POST"
        use:enhance
        action="?/salveaza"
        class="mt-4 w-full mb-26"
    >
        {#each intrebari as pag, i}
            {#if pag.filtru_afisare == null || pag.filtru_afisare(raspunsuri)}
                <div class={["flex flex-col gap-6 ", i !== pagina && "hidden"]}>
                    {#each pag.cimpuri as cimp, nr}
                        {#if cimp.filtru_afisare == null || cimp.filtru_afisare(raspunsuri)}
                            {#if cimp.tip === "email" || cimp.tip === "text"}
                                <CimpText
                                    tip={cimp.tip}
                                    intrebare={cimp.titlu}
                                    nume={cimp.nume}
                                    desc={cimp.desc}
                                    obligatoriu={cimp.obligatoriu}
                                    onblur={() => aplica_validare(cimp)}
                                    bind:value={raspunsuri[cimp.nume]}
                                />
                            {:else if cimp.tip.startsWith("selecție")}
                                <Selectie
                                    {cimp}
                                    {raspunsuri}
                                    onblur={() => aplica_validare(cimp)}
                                    bind:value={raspunsuri[cimp.nume]}
                                />
                            {:else}
                                <div class="text-italic text-danger-strong">
                                    Tip cîmp `{cimp.tip}` necunoscut
                                </div>
                            {/if}
                        {/if}

                        {#if eroare[cimp.nume] != null}
                            <div class="text-sm text-danger">
                                {eroare[cimp.nume].msg}
                            </div>
                        {/if}
                    {/each}
                </div>
            {/if}
        {/each}

        <div
            class="fixed bottom-0 left-0 sm:left-1/2 sm:-translate-x-1/2 w-full sm:w-[60ch]"
        >
            <div
                class="m-4 rounded-xl border border-surface-border bg-surface p-3"
            >
                <div class="flex justify-end gap-4">
                    <Buton
                        class={pagina === -1 ? "invisible" : ""}
                        onclick={() => scimbaPagina("precedent")}
                    >
                        Anterior
                    </Buton>

                    {@render button()}
                    {#snippet button()}
                        {@const ultima = intrebari[pagina].idx === pagini_vizibile.at(-1)?.idx}
                        <Buton
                            class="min-w-22"
                            type={ultima ? "submit" : "button"}
                            disabled={!btn_urmator_activ}
                            onclick={ultima ? null : () => scimbaPagina("urmator")}
                        >
                            {ultima ? "Trimite" : "Următor"}
                        </Buton>
                    {/snippet}
                </div>
            </div>
        </div>

    </form>

{/if}
