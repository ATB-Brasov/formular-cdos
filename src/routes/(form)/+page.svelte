<script>
    /** @import { Cimp } from "@content/cestionare/types.js" */
    /** @import { SDict, Eroare } from "$lib/common_types.js" */

    import { enhance } from "$app/forms";

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
        const sursa = form ?? {};
        /** @type {SDict<string>} */ const newRaspunsuri = {};
        /** @type {SDict<Eroare>} */ const newEroare = {};

        for (const [k, v] of Object.entries(sursa)) {
            if (typeof v === "string") {
                newRaspunsuri[k] = v;
            }
        }
        for (const [k, v] of Object.entries(form?.erori ?? {})) {
            newEroare[k] = /** @type {Eroare} */ (v);
        }
        raspunsuri = newRaspunsuri;
        eroare = newEroare;
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

        {#if pagina_activa.descriere}
        <div
            class="w-full rounded-xl border border-surface-border bg-surface p-3"
        >
            {pagina_activa.descriere}
        </div>
        {/if}

        {#each intrebari as pag, i}
            {#if pag.filtru_afisare == null || pag.filtru_afisare(raspunsuri)}
            {#each pag.cimpuri as cimp, nr}
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
                            <div class="text-italic text-danger-strong"
                            >Tip cîmp `{cimp.tip}` necunoscut</div>
                        {/if}
                    {/if}

                    {#if eroare[cimp.nume] != null}
                        <div class="text-sm text-danger">
                            {eroare[cimp.nume].msg}
                        </div>
                    {/if}
                </div>
            {/each}
            {/if}
        {/each}

        <div>
            Salut <span class="font-bold">{raspunsuri["posta"] || "{}"}</span>
            din facultatea
            <span class="font-bold">{raspunsuri["facultatea"] || "{}"}</span>
            specializaera <span class="font-bold">
                {raspunsuri["programul"] || "{}"}</span
            >
        </div>

        <div
            class="w-full rounded-xl border border-surface-border bg-surface p-3"
        >
            <div class="flex justify-end gap-4">
                <Buton
                    class={pagina === 0 ? "invisible" : ""}
                    onclick={() => {
                        do {
                            if (pagina > 0) pagina -= 1;
                        } while (pagina > 0 && intrebari[pagina].filtru_afisare != null && !intrebari[pagina].filtru_afisare?.(raspunsuri));
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
                            do {
                                let tmp = pagina + 1;
                                if (tmp <= ULTIMA_PAGINA) pagina = tmp;
                            } while (pagina <= ULTIMA_PAGINA && intrebari[pagina].filtru_afisare != null && !intrebari[pagina].filtru_afisare?.(raspunsuri));
                        }}
                    >
                        {ultima ? "Trimite" : "Următor"}
                    </Buton>
                {/snippet}
            </div>
        </div>
    </form>
{/if}
