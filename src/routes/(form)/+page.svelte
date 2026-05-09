<script>
    /** @import { Cimp } from "@content/cestionare/types.js" */
    /** @import { SDict, Eroare } from "$lib/common_types.js" */

    import { enhance } from "$app/forms";

    import { solvePoW } from "$lib/miner.js";
    import Buton from "@components/Buton.svelte";
    import Selectie from "@components/Selectie.svelte";
    import CimpText from "@components/CimpText.svelte";

    import sondaj_cdos from "@content/cestionare/atb-cdos-2026.js"; // TODO: Încărcare dinamică
    import Intrare from "./Intrare.svelte";

    /** @type {import('./$types').PageProps} */
    let { data, form } = $props();

    /** @type {SDict<Eroare>} */ let eroare = $state({});

    /** @type {SDict<string>} */ let raspunsuri = $state(
        /** @type {SDict<string>} */ ({}),
    );
    $effect(() => {
        const fonte = form ?? {};
        raspunsuri = Object.fromEntries(
            Object.entries(fonte).filter(([, v]) => typeof v === "string"),
        );
        eroare = Object.fromEntries(
            Object.entries(form?.erori ?? {}).map((
                [k, v],
            ) => [k, /** @type {Eroare} */ (v)]),
        );
    });

    let intrebari = sondaj_cdos.pagini;

    /**
     * Verifică dacă răspunsul este gol sau nu.
     *
     * @param {string} nume Numele cîmpului
     * @returns {boolean}
     */
    function raspunsGol(nume) {
        return raspunsuri[nume] == null || raspunsuri[nume]?.trim() === "";
    }

    let pagina = $derived(form?.pag ?? 0);
    const ULTIMA_PAGINA = intrebari.length - 1;
    const pagina_activa = $derived(intrebari[pagina]);
    const btn_urmator_activ = $derived(
        (!pagina_activa
            .cimpuri
            .map((c) =>
                raspunsGol(c.nume) && (c.filtru_afisare == null || c.filtru_afisare(raspunsuri)) && c.obligatoriu
            )
            .reduce((p, c) => p || c, false)) &&
            Object.keys(eroare).filter((k) => eroare[k].pag === pagina)
                    .length === 0,
    );

    function inloct(/**@type{string}*/ text) {
        if (text === "") return "{}";
        return text;
    }

    function aplica_validare(/**@type{Cimp}*/ cimp) {
        delete eroare[cimp.nume];

        const rasp = raspunsuri[cimp.nume];
        if ((rasp === undefined || rasp === "") && cimp.obligatoriu) {
            eroare[cimp.nume] = {
                type: "field-required",
                msg: "Cîmpul este obligatoriu",
                pag: pagina,
            };
            return;
        }

        if (cimp.valideaza !== undefined) {
            const err = cimp.valideaza(rasp.toString());
            if (err != null) {
                eroare[cimp.nume] = {
                    type: "field-invalid",
                    msg: err,
                    pag: pagina,
                };
                return;
            }
        }
    }
</script>

{#if !data.session?.email}
    <Intrare {eroare} />
{:else}
    <form
        method="POST"
        use:enhance={({}) => {
            return async ({ result, update }) => {
                if (result.type !== "success") {
                    update({ reset: false });
                } else {
                    update();
                }
            };
        }}
        action="?/salveaza"
        class="m-auto mt-10 flex w-full flex-col gap-4 p-4"
    >
        <h1 class="text-4xl font-bold">{sondaj_cdos.titlu}</h1>
        <h2 class="text-2xl font-bold">{pagina_activa.titlu}</h2>

        <div
            class="w-[100wv] rounded-xl border border-surface-border bg-surface p-3"
        >
            {pagina_activa.descriere}
        </div>

        {#each intrebari as pag, i}
            {#each pag.cimpuri as cimp}
                <div class:hidden={i !== pagina}>
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
                            <i class="text-italic text-danger-strong"
                            >Tip cîmp `{cimp.tip}` necunoscut</i>
                        {/if}
                    {/if}

                    {#if eroare[cimp.nume] != null}
                        <div class="text-sm text-danger">
                            {eroare[cimp.nume].msg}
                        </div>
                    {/if}
                </div>
            {/each}
        {/each}

        <div>
            Salut <span class="font-bold">{inloct(raspunsuri["posta"])}</span>
            din facultatea
            <span class="font-bold">{inloct(raspunsuri["facultatea"])}</span>
            specializaera <span class="font-bold">{
                inloct(raspunsuri["programul"])
            }</span>
        </div>

        <div
            class="w-[100wv] rounded-xl border border-surface-border bg-surface p-3"
        >
            <div class="flex justify-end gap-4">
                <Buton
                    class={pagina === 0 ? "invisible" : ""}
                    onclick={() => {
                        if (pagina > 0) pagina -= 1;
                    }}
                >
                    Anterior
                </Buton>

                {@render button()}
                {#snippet button()}
                    {@const ultima = pagina === ULTIMA_PAGINA}
                    <Buton
                        type={ultima ? "submit" : "button"}
                        disabled={!btn_urmator_activ}
                        onclick={ultima ? null : () => {
                            let tmp = pagina + 1;
                            if (tmp <= ULTIMA_PAGINA) pagina = tmp;
                        }}
                    >
                        {ultima ? "Trimite" : "Următor"}
                    </Buton>
                {/snippet}
            </div>
        </div>
    </form>
{/if}
