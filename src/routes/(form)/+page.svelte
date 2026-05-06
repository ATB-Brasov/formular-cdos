<script>
    /** @import { Cimp } from "@content/cestionare/types.js" */
    /** @import { SDict } from "$lib/common_types.js" */

    import { enhance } from "$app/forms";

    import { solvePoW } from "$lib/miner.js";
    import Selectie from "@components/Selectie.svelte";
    import SelectieCautare from "@components/SelectieCautare.svelte";
    import CimpText from "@components/CimpText.svelte";

    import sondaj_cdos from "@content/cestionare/atb-cdos-2026.js"; // TODO: Încărcare dinamică
    import SelectieRadio from "@components/SelectieRadio.svelte";

    /** @type {import('./$types').PageProps} */
    let { data, form } = $props();

    /**
     * @typedef {Object} Eroare
     * @property {string} msg
     * @property {number} pag
     */

    /** @type {SDict<Eroare>} */ let eroare = $state({});

    // `form` is the value returned by the server action (e.g. after a failed
    // submission it carries back the submitted field values + errors).
    // We seed `raspunsuri` from it whenever the server sends a new response,
    // but we also allow local edits in between — hence the split between a
    // $derived "snapshot" and a locally-mutable $state copy.
    /** @type {SDict<string>} */ let raspunsuri = $state(/** @type {SDict<string>} */ ({}));
    $effect(() => {
        // `$effect` runs on mount and every time `form` changes (i.e. a new
        // server response arrives). This seeds/re-seeds the local mutable copy
        // from whatever the server sent back, while still allowing local edits
        // between submissions.
        const fonte = form ?? {};
        // Only copy string-valued keys — ignore metadata like `erori`, `pag`, `success`.
        raspunsuri = Object.fromEntries(
            Object.entries(fonte).filter(([, v]) => typeof v === "string")
        );
        // Merge server-side validation errors into the single `eroare` object
        // so the template only needs one error source.
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
            eroare["posta"] = { msg, pag: 0 };
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
            <div class="flex justify-center gap-4">
                <button
                    class="
                        rounded-md border border-primary-strong bg-primary px-2
                        py-1 text-white shadow-xs shadow-primary-strong/90
                        disabled:border-surface-border disabled:bg-surface-disabled disabled:text-surface-muted disabled:shadow-surface-border/40
                    "
                    type="button"
                    disabled={true}
                >
                    Anterior
                </button>

                <button
                    class="
                        rounded-md border border-primary-strong bg-primary px-2 py-1 text-white shadow-xs shadow-primary-strong/90
                        disabled:border-surface-border disabled:bg-surface-disabled disabled:text-surface-muted disabled:shadow-surface-border/40
                    "
                    type="submit"
                    disabled={isMining || eroare["posta"] != null}
                >
                    {isMining ? "Începere..." : "Începe"}
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
        class="m-auto mt-10 flex w-125 flex-col gap-4 p-4"
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
                    {:else if cimp.tip === "radio"}
                        {#if cimp.optiuni != null}
                            <SelectieRadio
                                nume={cimp.nume}
                                intrebare={cimp.titlu}
                                obligatoriu={cimp.obligatoriu}
                                onblur={() => aplica_validare(cimp)}
                                optiuni={cimp.optiuni(raspunsuri)}
                                bind:value={raspunsuri[cimp.nume]}
                            />
                        {:else}
                            <i class="text-italic text-danger-strong">Nu au fost
                                definite opțiuni pentru selecția {cimp.nume}</i>
                        {/if}
                    {:else if cimp.tip === "selecție-cautare"}
                        {#if cimp.optiuni !== undefined}
                            <SelectieCautare
                                nume={cimp.nume}
                                intrebare={cimp.titlu}
                                obligatoriu={cimp.obligatoriu}
                                onblur={() => aplica_validare(cimp)}
                                optiuni={cimp.optiuni(raspunsuri)}
                                bind:value={raspunsuri[cimp.nume]}
                            />
                        {:else}
                            <i class="text-italic text-danger-strong">Nu au fost
                                definite opțiuni pentru selecția {cimp.nume}</i>
                        {/if}
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
                            <i class="text-italic text-danger-strong">Nu au fost
                                definite opțiuni pentru selecția {cimp.nume}</i>
                        {/if}
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
            <div class="flex justify-center gap-4">
                <button
                    class="
                        rounded-md border border-primary-strong bg-primary px-2
                        py-1 text-white shadow-xs shadow-primary-strong/90
                        {pagina === 0 ? 'invisible' : ''}
                    "
                    type="button"
                    onclick={() => { if (pagina > 0) pagina -= 1; }}
                >
                    Anterior
                </button>

                {@render button()}
                {#snippet button()}
                    {@const ultima = pagina === ULTIMA_PAGINA}
                    <button
                        type={ultima ? "submit" : "button"}
                        class="
                            px-2 py-1 text-white bg-primary
                                rounded-md border border-primary-strong
                                shadow-xs shadow-primary-strong/90
                                disabled:bg-surface-disabled disabled:text-surface-muted
                                disabled:border-surface-border disabled:shadow-surface-border/40
                        "
                        disabled={!btn_urmator_activ}
                        onclick={ultima ? null : () => {
                            let tmp = pagina + 1;
                            if (tmp <= ULTIMA_PAGINA) pagina = tmp;
                        }}
                    >
                        {ultima ? "Trimite" : "Următor"}
                    </button>
                {/snippet}
            </div>
        </div>
    </form>
{/if}
