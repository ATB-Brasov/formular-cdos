<script>
    /** @import { Cimp } from "@content/cestionare/types.js" */
    /** @import { SDict } from "$lib/common_types.js" */

    import { enhance } from "$app/forms";

    import { solvePoW } from "$lib/miner.js";
    import Buton from "@components/Buton.svelte";
    import Selectie from "@components/Selectie.svelte";
    import CimpText from "@components/CimpText.svelte";

    import sondaj_cdos from "@content/cestionare/atb-cdos-2026.js"; // TODO: Încărcare dinamică

    /** @type {import('./$types').PageProps} */
    let { data, form } = $props();

    /**
     * @typedef {Object} Eroare
     * @property {string} msg
     * @property {number} pag
     */

    /** @type {SDict<Eroare>} */ let eroare = $state({});

    /** @type {SDict<string>} */ let raspunsuri = $state(/** @type {SDict<string>} */ ({}));
    $effect(() => {
        const fonte = form ?? {};
        raspunsuri = Object.fromEntries(
            Object.entries(fonte).filter(([, v]) => typeof v === "string")
        );
        eroare = Object.fromEntries(
            Object.entries(form?.erori ?? {}).map(([k, v]) => [k, /** @type {Eroare} */ (v)])
        );
    });

    let intrebari = sondaj_cdos.pagini;

    let pagina = $derived(form?.pag ?? 0);
    const ULTIMA_PAGINA = intrebari.length - 1;
    const pagina_activa = $derived(intrebari[pagina]);
    const btn_urmator_activ = $derived(
        (!pagina_activa
            .cimpuri
            .map((c) => (raspunsuri[c.nume] === undefined || raspunsuri[c.nume] === "") && c.obligatoriu)
            .reduce((p, c) => p || c, false)) &&
            Object.keys(eroare).filter((k) => eroare[k].pag === pagina).length === 0,
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
            if (err != null) {
                eroare[cimp.nume] = {
                    msg: err,
                    pag: pagina,
                };
                return;
            }
        }
    }

    let email = $state("");

    // Mirror the live client-side email validation into eroare["posta"] so
    // the template has a single error source for all posta errors (both
    // client-side live feedback and server responses after submission).
    $effect(() => {
        const msg = sondaj_cdos.validare_posta?.(email) ?? null;
        if (msg != null) {
            eroare["posta"] = { msg, pag: -1 };
        } else {
            delete eroare["posta"];
        }
    });

    let isMining = $state(false);
    let nonce = $state("");
</script>

{#if !data.session?.email}
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
                isMining = false;
            }
            console.log("Solved PoW with nonce:", nonce);

            return async ({ update }) => {
                await update();
                isMining = false;
            };
        }}
        action="?/posta"
        class="flex flex-col gap-4 p-4"
    >
        <h1 class="text-4xl font-bold">{sondaj_cdos.titlu}</h1>

        <div class="w-[100wv] rounded-xl border border-surface-border bg-surface p-3">
            {sondaj_cdos.descriere}
        </div>

        <CimpText
            tip={"email"}
            intrebare={"Adresa poștei instituționale"}
            desc={`Avem nevoie de poșta electronică pentru a verifica statutul de student al unitbv și a preveni completări repetate. Adresele vor fi păstrate în formă criptată și <b class="font-bold">nu vor fi</b> asociate cu răspunsurile date. (TODO: GDPR)`}
            nume={"posta"}
            obligatoriu={true}
            bind:value={email}
        />

        {#if eroare["posta"] != null}
            <span class="text-danger">{eroare["posta"].msg}</span>
        {/if}

        {#if eroare["_form"] != null}
            <span class="text-danger">{eroare["_form"].msg}</span>
        {/if}

        <div>GDPR</div>

        <div class="w-[100wv] rounded-xl border border-surface-border bg-surface p-3">
            <div class="flex justify-end gap-4">
                <Buton
                    type="submit"
                    disabled={isMining || eroare["posta"] != null}
                >
                    {isMining ? "Începere..." : "Începe"}
                </Buton>
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
        class="m-auto mt-10 flex w-full flex-col gap-4 p-4"
    >
        <h1 class="text-4xl font-bold">{sondaj_cdos.titlu}</h1>
        <h2 class="text-2xl font-bold">{pagina_activa.titlu}</h2>

        <div class="w-[100wv] rounded-xl border border-surface-border bg-surface p-3">
            {pagina_activa.descriere}
        </div>

        {#each intrebari as pag, i}
            {#each pag.cimpuri as cimp}
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
                    {:else if cimp.tip.startsWith("selecție")}
                        <Selectie
                            cimp={cimp}
                            {raspunsuri}
                            onblur={() => aplica_validare(cimp)}
                            bind:value={raspunsuri[cimp.nume]}
                        />
                    {:else}
                        <i class="text-italic text-danger-strong"
                        >Tip cîmp `{cimp.tip}` necunoscut</i>
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

        <div class="w-[100wv] rounded-xl border border-surface-border bg-surface p-3">
            <div class="flex justify-end gap-4">
                <Buton
                    class={pagina === 0 ? 'invisible' : ''}
                    onclick={() => { if (pagina > 0) pagina -= 1; }}
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
