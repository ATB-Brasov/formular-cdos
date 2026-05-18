<script>
    /** @import { Cimp } from "@content/cestionare/types.js" */
    /** @import { SDict, Eroare } from "$lib/common_types.js" */

    import { enhance } from "$app/forms";
    import { page } from "$app/state";
    import { dev } from "$app/environment";

    import Buton from "@components/Buton.svelte";
    import Selectie from "@components/Selectie.svelte";
    import CimpText from "@components/CimpText.svelte";

    import Intrare from "./Intrare.svelte";
    import { onMount } from "svelte";
    import { raspunsGol } from "@content/cestionare/types.js";

    import logo from "$lib/assets/logo_ATB_120x120.webp";

    const test = page.url.searchParams.get("test") === "true"
    const is_iframe = page.url.searchParams.get("iframe") === "true"

    const sondaj_cdos =
        (test
            ? await import("@content/cestionare/atb-cdos-2026_test.js")
            : await import("@content/cestionare/atb-cdos-2026.js")).default;

    /** @type {import('./$types').PageProps} */
    let { data, form } = $props();

    let pagina = $state(data.session?.email ? 0 : -1);
    /** @type {SDict<Eroare|null>} */ let eroare = $state({});
    /** @type {SDict<string>} */ let raspunsuri = $state({});

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
        for (const k in eroare)
            eroare[k] = null
        for (const c of intrebari[pagina].cimpuri) 
            aplica_validare(c)
        for (const k in eroare) {
            if (eroare[k] != null) { 
                cimpuri[k].scrollIntoView();
                return;
            }
        }

        let tmp = pagina;
        while (true) {
            if (directie === "urmator") {
                tmp++;
            } else if (directie === "precedent") {
                tmp--;
            } else {
                console.error(`Direcție necunoscută ${directie}`)
                return;
            }
            if (tmp === -1) {
                seteaza_pagina(tmp, {whence: "scimbaPagina::precedent"});
                return;
            }
            if (tmp < 0 || tmp > ULTIMA_PAGINA) return;
            if (!intrebari[tmp].ascunde?.(raspunsuri)) break;
        }
        seteaza_pagina(tmp, {whence: "scimbaPagina::final"});
        setTimeout(() => window.scrollTo(0, 0))
    }

    /**@type{SDict<HTMLElement>}*/ let cimpuri = $state( {})
    /**@type{ResizeObserver}*/     let observer
    /**@type{HTMLElement?}*/       let forIframe

    function notifyParentOfHeightChange() {
        if (forIframe) {
            const height = forIframe.offsetHeight;
            window.parent.postMessage(
                {
                    type: 'iframe-resize',
                    height: height
                },
                '*' // INFO: Folosește url-ul de producție, printr-o variabilă de mediu poate
            );
        }
    }

    onMount(() => {
        if (is_iframe) notifyParentOfHeightChange();
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

        if (is_iframe) {
            observer = new ResizeObserver((entries) => {
                for (let entry of entries) {
                    if (entry.target.id === "formWrapper") {
                        setTimeout(notifyParentOfHeightChange, 0);
                    }
                }
            });
            setTimeout(() => forIframe && observer.observe(forIframe), 0)
            return () => { observer?.disconnect() };
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
        if (Object.entries(newRaspunsuri).length > 0) {
            raspunsuri = newRaspunsuri;
        }

        const errEntries = Object.entries(form?.erori ?? {})
            .sort((a, b) => {
                const erA = a[1];
                const erB = b[1];
                if (erA == null || erB == null) return 0
                return erA.pag - erB.pag
            })
        if (errEntries.length > 0) {
            for (const [k, v] of errEntries) {
                newEroare[k] = /** @type {Eroare} */ (v);
            }
            eroare = newEroare;
            const e = errEntries[0];
            seteaza_pagina(e[1].pag, {whence: "$effect::errEntries"})
            if (e[1].pag >= 0)
                cimpuri[e[0]].scrollIntoView()
        }
    });

    $effect(() => {
        localStorage.setItem("raspunsuri", JSON.stringify(raspunsuri));
    });

    let intrebari = sondaj_cdos.pagini.map((p, idx) => ({...p, idx}));

    const ULTIMA_PAGINA = intrebari.length - 1;
    const pagina_activa = $derived(intrebari[pagina]);

    /**
     * @param {Cimp} cimp
     * @param {number} [pag=pagina]
     */
    function aplica_validare(cimp, pag=pagina) {
        eroare[cimp.nume] = null;

        const rasp = raspunsuri[cimp.nume] ?? "";
        let msg = null;
        let type = null;

        if (raspunsGol(rasp)) {
            const ascunde_pag  = intrebari[pag].ascunde?.(raspunsuri)
            const ascunde_cimp = cimp.ascunde?.(raspunsuri)
            if (ascunde_pag || ascunde_cimp || !cimp.obligatoriu) return
            type = "field-required";
            msg = "Câmpul este obligatoriu";
        } else {
            const err = cimp.valideaza?.(rasp);
            if (err != null) {
                type = "field-invalid";
                msg = err;
            }
        }

        if (msg && type) eroare[cimp.nume] = { type, msg, pag };
    }

    const pagini_vizibile = $derived(
        intrebari.filter((p) => !p.ascunde?.(raspunsuri)),
    );

    let formElement = /** @type {HTMLFormElement?} */ $state();

    function handleSubmit() {
        for (const k in eroare) eroare[k] = null
        const cimps = intrebari.map((p) => p.cimpuri.map(c=>({...c, pag: p.idx}))).flat(1)
        cimps.forEach(c => aplica_validare(c, c.pag))
        const err = Object.entries(eroare).filter(([_, v]) => v != null)
        err.sort((a, b) => {
            const erA = a[1];
            const erB = b[1];
            if (erA == null || erB == null) return 0
            return erA.pag - erB.pag
        })

        if (err.length > 0) {
            const [k, v] = err[0]
            if (v == null) return
            seteaza_pagina(v.pag, {whence: "/::handleSubmit"})
            setTimeout(() => cimpuri[k].scrollIntoView(), 0)
        } else {
            setTimeout(() => formElement?.requestSubmit(), 0);
        }
    }
</script>

{#if test}
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


{#if !is_iframe}
    <header class="px-4 flex justify-center w-full"><a href="https://atbbrasov.ro/"><img class="h-20" src={logo} alt=""></a></header>
{/if}


<div id="formWrapper" bind:this={forIframe}>

<h1 class="text-4xl font-bold mt-8 mb-4">{sondaj_cdos.titlu}</h1>

{#if pagina === -1}
    <div
        id="descriere"
        class="w-full rounded-xl flex flex-col gap-y-2 border border-surface-border bg-surface mt-4 mb-8 p-3"
    >
        {@html sondaj_cdos.descriere}
    </div>

    <Intrare bind:this={formElement} bind:eroare bind:pagina />
{:else}
    <div class="flex flex-wrap gap-2 mb-8">
        {#each intrebari as pag, i}
            <button
                aria-label="Pagina {i + 1}"
                disabled={pag.ascunde?.(raspunsuri)}
                onclick={() => {
                    pagina = i;
                    localStorage.setItem("pagina", pagina.toString());
                }}
                class={[
                    "px-1 py-0.5 rounded-full grow disabled:bg-surface-disabled transition-colors duration-200",
                    i === pagina
                        ? "bg-primary"
                        : "bg-surface-border hover:bg-surface-secondary",
                    i < pagina && Object.values(eroare).some((e) => e?.pag === i)
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
        class="mt-4 w-full"
        class:mb-26={is_iframe}
        bind:this={formElement}
    >

        {#if test}
            <input type="hidden" name="test" value="true">
        {/if}

        {#each intrebari as pag, i}
            {#if !pag.ascunde?.(raspunsuri)}
                <div class={["flex flex-col gap-6 ", i !== pagina && "hidden"]}>
                    {#each pag.cimpuri as cimp, nr}
                        {#if !cimp.ascunde?.(raspunsuri)}
                            <div class="scroll-mt-32" bind:this={cimpuri[cimp.nume]}>
                                {#if dev}
                                    <div class="text-surface-muted text-mono text-xs">
                                        id: {cimp.nume} ({nr + 1})
                                    </div>
                                {/if}

                                {#if cimp.tip === "email" || cimp.tip === "text"}
                                    <CimpText
                                        {...cimp}
                                        tip={cimp.tip}
                                        eroare={eroare[cimp.nume]}
                                        onblur={() => false && aplica_validare(cimp)}
                                        bind:value={raspunsuri[cimp.nume]}
                                    />
                                {:else if cimp.tip.startsWith("selecție")}
                                    <Selectie
                                        {cimp}
                                        {raspunsuri}
                                        bind:eroare={eroare[cimp.nume]}
                                        onblur={() => false && aplica_validare(cimp)}
                                        bind:value={raspunsuri[cimp.nume]}
                                    />
                                {:else}
                                    <div class="text-italic text-danger-strong">
                                        Tip câmp `{cimp.tip}` necunoscut
                                    </div>
                                {/if}
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
                            type="button"
                            onclick={ultima ? handleSubmit : () => scimbaPagina("urmator")}
                        >
                            {ultima ? "Trimite" : "Următor"}
                        </Buton>
                    {/snippet}
                </div>
            </div>
        </div>

    </form>

{/if}

</div>

{#if !is_iframe}
    <footer class="text-surface-dim flex flex-col items-center mt-8 mb-22 gap-2">
        <div class="text-center">Dacă întâmpinați probleme cu formularul sau considerați că conține informații greșite lăsați o sesizare <a href="https://opnform.com/forms/formular-de-sesizari-0nuyk3">aici.</a></div>
        <div>&copy; ATB Brașov 2026</div>
    </footer>
{/if}
