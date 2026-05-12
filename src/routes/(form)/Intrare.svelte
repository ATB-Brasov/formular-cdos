<script>
    /** @import { SDict, Eroare } from "$lib/common_types.js" */

    import { enhance } from "$app/forms";
    import { solvePoW } from "$lib/miner.js";
    import Buton from "@components/Buton.svelte";
    import CimpText from "@components/CimpText.svelte";

    import sondaj_cdos from "@content/cestionare/atb-cdos-2026.js"; // TODO: Încărcare dinamică

    /**
     * @typedef {Object} Props
     * @property {SDict<Eroare>} eroare
     */

    /** @type {Props & Record<string, unknown>} */
    let { eroare } = $props();

    let isMining = $state(false);
    let email = $state("");
    let formElement = /** @type {HTMLFormElement?} */ $state();


    // Mirror the live client-side email validation into eroare["posta"] so
    // the template has a single error source for all posta errors (both
    // client-side live feedback and server responses after submission).
    $effect(() => {
        if (email === "") return;
        const msg = sondaj_cdos.validare_posta?.(email);
        if (msg != null) {
            eroare["posta"] = { type: "email-invalid", msg, pag: -1 };
        } else {
            if (eroare["posta"]?.type !== "email-invalid") return;
            delete eroare["posta"];
        }
    });
</script>


<form
    method="POST"
    bind:this={formElement}
    use:enhance={async ({ formData, cancel }) => {
        isMining = true;
        await solvePoW(email, 4)
            .then(nonce => {
                formData.append("nonce", nonce.toString());
                console.log("Solved PoW with nonce:", nonce);
            })
            .catch(() => {
                cancel();
                isMining = false;
            });

        return async ({ update }) => {
            await update();
            isMining = false;
        };
    }}
    action="?/posta"
    class="flex flex-col gap-4 p-4"
>
    <h1 class="text-4xl font-bold">{sondaj_cdos.titlu}</h1>

    <div class="w-full rounded-xl border border-surface-border bg-surface p-3">
        {sondaj_cdos.descriere}
    </div>

    <CimpText
        tip={"email"}
        intrebare={"Adresa poștei instituționale"}
        desc={`Avem nevoie de poșta electronică pentru a verifica statutul de student al unitbv și a preveni completări repetate. Adresele vor fi păstrate în formă criptată și <b class="font-bold">nu vor fi</b> asociate cu răspunsurile date. (TODO: GDPR)`}
        nume={"posta"}
        placeholder={"exemplu@student.unitbv.ro"}
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
                type="button"
                onclick={() => {
                    const msg = sondaj_cdos.validare_posta?.(email);
                    if (msg != null) {
                        eroare["posta"] = { type: "email-invalid", msg, pag: -1 };
                        return;
                    }
                    isMining = true;
                    setTimeout(() => {
                        formElement?.dispatchEvent(new Event("submit"));
                    }, 0);
                }}
                disabled={isMining}
            >
                {isMining ? "Se începe..." : "Începe"}
            </Buton>
        </div>
    </div>
</form>
