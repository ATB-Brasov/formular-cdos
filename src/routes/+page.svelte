<script>
    /** @import {Cimp} from "@content/cestionare/types.js" */

    import { enhance } from "$app/forms";
    import { solvePoW } from "$lib/miner.js";
    import * as ds from "$lib/ds_helpers.js";

    import Selectie from "@components/Selectie.svelte";
    import CimpText from "@components/CimpText.svelte";

    import sondaj_cdos from "@content/cestionare/atb-cdos-2026.js"; // TODO: Încărcare dinamică

    /** @type {import('./$types').PageProps} */
    let { data, form } = $props();

    /** @import { SDict } from "$lib/common_types.js" */

    /**
     * @typedef {Object} Eroare
     * @property {string} msg
     * @property {number} pag
     */

    /** @type {SDict<Eroare>} */ let eroare = $state({});
    /** @type {SDict<string>} */ let raspunsuri = $state(form ?? {}); // TODO: Fix warning

    let intrebari = sondaj_cdos.pagini

    let pagina = $derived(form?.pag ?? 0);
    const ULTIMA_PAGINA = intrebari.length - 1;
    const pagina_activa = $derived(intrebari[pagina]);
    const btn_urmator_activ = $derived(
        (!pagina_activa
            .cimpuri
            .map((c) => raspunsuri[c.nume] === "" && c.obligatoriu)
            .reduce((p, c) => p || c, false)) &&
            Object.keys(eroare).length === 0,
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
                msg: "Cîmpul este obligatoriu",
                pag: pagina,
            };
            return;
        }

        if (cimp.valideaza !== undefined) {
            const err = cimp.valideaza(rasp.toString());
            if (err !== undefined) {
                eroare[cimp.nume] = {
                    msg: err,
                    pag: pagina,
                };
                return;
            }
        }
    }

    let email = $state("");

    let eroare_posta = $derived(!este_posta_valida(email));

    function este_posta_valida(/**@type{string}*/ posta) {
        return posta.endsWith("@student.unitbv.ro") ||
            posta.endsWith("@unitbv.ro");
    }

    let isMining = $state(false);
    let nonce = $state("");
</script>

{#if !data.session || !data.session.email}
    <form
        method="POST"
        use:enhance={async ({ formData, cancel }) => {
            // Assisted-By: Gemini 3 Flash
            isMining = true;

            try {
                const solvedNonce = await solvePoW(email, 4);
                nonce = solvedNonce.toString();
                formData.append("nonce", nonce);
            } catch (err) {
                cancel();
            } finally {
                isMining = false;
            }
            console.log("Solved PoW with nonce:", nonce);

            return async ({ update }) => {
                await update();
            };
        }}
        action="?/posta"
        class="m-auto mt-10 flex w-[500px] flex-col gap-4 p-4"
    >
        <h1>Formular CDOS</h1>

        <div class="w-[100wv] rounded-xl border border-olive-200 bg-white p-3">
            Avem nevoie de poșta electronică pentru a verifica statutul de
            student al unitbv și a preveni completări repetate. Adresele vor fi
            păstrate în formă criptată și <b class="font-bold">nu vor fi</b>
            asociate cu răspunsurile date. (TODO: GDPR)
        </div>

        <CimpText
            tip={"email"}
            intrebare={"Adresa poștei instituționale"}
            nume={"posta"}
            obligatoriu={true}
            onblur={() => este_posta_valida(email)}
            bind:value={email}
        />

        <div>
            Eroare posta: {eroare_posta}
        </div>

        {#if eroare_posta}
            <span class="text-red-500">Folosește adresa instutițională!</span>
        {/if}

        {#if form?.erori != null}
            <span class="text-red-500">{form?.erori?.posta?.msg}</span>
        {/if}

        <div>
            Salut <span class="font-bold">{inloct(raspunsuri["posta"])}</span>
        </div>

        <div class="w-[100wv] rounded-xl border border-olive-200 bg-white p-3">
            <div class="flex justify-center gap-4">
                <button
                    class="
                        rounded-md border border-blue-600 bg-blue-500 px-2
                        py-1 text-white shadow-xs shadow-blue-600/90
                        disabled:border-olive-200 disabled:bg-olive-100 disabled:text-olive-100 disabled:shadow-olive-200/40
                    "
                    type="button"
                    disabled={true}
                >
                    Anterior
                </button>

                <button
                    class="rounded-md border border-blue-600 bg-blue-500 px-2 py-1 text-white shadow-xs shadow-blue-600/90"
                    type="submit"
                    disabled={isMining}
                >
                    {isMining ? "Se trimite..." : "Începe"}
                </button>
            </div>
        </div>
    </form>
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
        class="m-auto mt-10 flex w-[500px] flex-col gap-4 p-4"
    >
        <h1 class="text-xl font-bold">{pagina_activa.titlu}</h1>

        <div class="w-[100wv] rounded-xl border border-olive-200 bg-white p-3">
            {pagina_activa.descriere}
        </div>

        {#each intrebari as pag, i}
            {#each pag.cimpuri as cimp}
                {@const err = ds.get(form?.erori, cimp.nume)}

                <div class:hidden={i !== pagina}>
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
                    {:else if cimp.tip === "selecție"}
                        {#if cimp.optiuni !== undefined}
                            <Selectie
                                nume={cimp.nume}
                                intrebare={cimp.titlu}
                                obligatoriu={cimp.obligatoriu}
                                onblur={() => aplica_validare(cimp)}
                                optiuni={cimp.optiuni(raspunsuri)}
                                bind:value={raspunsuri[cimp.nume]}
                            />
                        {:else}
                            <i class="text-italic text-red-600">Nu au fost
                                definite opțiuni pentru selecția {cimp.nume}</i>
                        {/if}
                    {:else}
                        <i class="text-italic text-red-600"
                        >Tip cîmp `{cimp.tip}` necunoscut</i>
                    {/if}

                    {#if eroare[cimp.nume] != null}
                        <div class="text-sm text-red-500">
                            {eroare[cimp.nume].msg}
                        </div>
                    {/if}

                    {#if err != null}
                        <div class="text-sm text-red-500">
                            {err.msg}
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

        <div class="w-[100wv] rounded-xl border border-olive-200 bg-white p-3">
            <div class="flex justify-center gap-4">
                <button
                    class="
                        rounded-md border border-blue-600 bg-blue-500 px-2
                        py-1 text-white shadow-xs shadow-blue-600/90
                        disabled:border-olive-200 disabled:bg-olive-100 disabled:text-olive-100 disabled:shadow-olive-200/40
                    "
                    type="button"
                    disabled={pagina === 0}
                    onclick={() => (pagina -= 1)}
                >
                    Anterior
                </button>

                {#if pagina === 0}
                    <button
                        class="rounded-md border border-blue-600 bg-blue-500 px-2 py-1 text-white shadow-xs shadow-blue-600/90"
                        type="submit"
                        disabled={!btn_urmator_activ}
                        onclick={async () => {
                            let tmp = pagina + 1;
                            if (tmp <= ULTIMA_PAGINA) pagina = tmp;
                        }}
                    >
                        Următorul
                    </button>
                {:else if pagina === ULTIMA_PAGINA}
                    <button
                        class="rounded-md border border-blue-600 bg-blue-500 px-2 py-1 text-white shadow-xs shadow-blue-600/90"
                        disabled={!btn_urmator_activ}
                        type="submit"
                    >
                        Trimite
                    </button>
                {:else}
                    <button
                        class="
                            rounded-md border border-blue-600 bg-blue-500 px-2
                            py-1 text-white shadow-xs shadow-blue-600/90
                            disabled:border-olive-200 disabled:bg-olive-100 disabled:text-olive-400 disabled:shadow-olive-200/40
                        "
                        type="button"
                        disabled={!btn_urmator_activ}
                        onclick={() => {
                            let tmp = pagina + 1;
                            if (tmp <= ULTIMA_PAGINA) pagina = tmp;
                        }}
                    >
                        Următor
                    </button>
                {/if}
            </div>
        </div>
    </form>
{/if}
