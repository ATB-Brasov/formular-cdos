<script>
    /** @import { SDict, Eroare } from "$lib/common_types.js" */

    import { enhance } from "$app/forms";
    import { solvePoW } from "$lib/miner.js";
    import Buton from "@components/Buton.svelte";
    import CimpText from "@components/CimpText.svelte";

    import sondaj_cdos from "@content/cestionare/atb-cdos-2026.js"; // TODO: Încărcare dinamică
    import { onMount } from "svelte";

    /**
     * @typedef {Object} Props
     * @property {SDict<Eroare|null>} eroare
     * @property {number} pagina
     */

    /** @type {Props & Record<string, unknown>} */
    let {
        eroare = $bindable(),
        pagina = $bindable(),
    } = $props();

    let isMining = $state(false);
    let formElement = /** @type {HTMLFormElement?} */ $state();

    let email = $state("");
    let gdprConsent = $state(false);

    onMount(() => {
        email = localStorage.getItem("posta") ?? "";
        gdprConsent = localStorage.getItem("gdpr-consent") === "true";
    });

    $effect(() => {
        if (!gdprConsent) {
            eroare["gdpr-consent"] = {
                type: "required",
                msg: "Trebuie să acceptați politica de confidențialitate",
                pag: -1,
            };
            localStorage.setItem("gdpr-consent", "false")
        } else {
            delete eroare["gdpr-consent"];
            localStorage.setItem("gdpr-consent", "true")
        }
    });

    $effect(() => {
        if (email === "") {
            eroare["posta"] = {
                type: "email-invalid",
                msg: "Adresa de poștei electronice este obligatorie",
                pag: -1,
            };
            return;
        }
        const msg = sondaj_cdos.validare_posta?.(email);
        if (msg != null) {
            eroare["posta"] = { type: "email-invalid", msg, pag: -1 };
        } else {
            if (eroare["posta"]?.type !== "email-invalid") return;
            delete eroare["posta"];
        }
    });

    function handleSubmit() {
        const msg = sondaj_cdos.validare_posta?.(email);
        if (msg != null) {
            eroare["posta"] = { type: "email-invalid", msg, pag: -1 };
            return;
        }

        if (!gdprConsent) {
            eroare["gdpr-consent"] = {
                type: "required",
                msg: "Trebuie să acceptați politica de confidențialitate",
                pag: -1,
            };
            return;
        }

        isMining = true;
        setTimeout(() => { formElement?.requestSubmit(); }, 0);
    }
</script>

<form
    method="POST"
    bind:this={formElement}
    use:enhance={async ({ formData, cancel }) => {
        isMining = true;
        await solvePoW(email, 4)
            .then((nonce) => {
                formData.append("nonce", nonce.toString());
                console.log("Solved PoW with nonce:", nonce);
            })
            .catch(() => {
                cancel();
                isMining = false;
            });

        return async ({ result, update }) => {
            if (result.type === "success") {
                pagina = 0;
                localStorage.setItem("pagina", "0")
                localStorage.setItem("posta", email)
            }
            isMining = false;
            await update();
        };
    }}
    action="?/posta"
    class="flex flex-col gap-6"
>
    <CimpText
        tip={"email"}
        titlu={"Adresa poștei instituționale"}
        desc={`
            Adresa de e-mail va fi folosită pentru a detecta completare repetată a formularului.
            Adresele vor fi păstrate în formă criptată și <b class="font-bold">nu vor fi</b> asociate cu
            răspunsurile colectate. Pentru mai multe informații, consultați <a href="/politica-confidentialitate" target="_blank" class="underline">politica de confidențialitate</a>.`}
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

    <div class="flex sm:items-center gap-4">
        <input
            bind:checked={gdprConsent}
            type="checkbox"
            id="gdpr-consent"
            name="gdpr-consent"
            required
            class="h-4 w-4 mt-1 sm:mt-0 rounded border-gray-300 text-primary focus:ring-primary accent-primary"
        />
        <label for="gdpr-consent" class="sm:leading-0 sm:pb-0.5">
            Am citit și sunt de acord cu <a
                href="/politica-confidentialitate"
                class="underline"
            >politica de confidențialitate</a>.
        </label>
    </div>

    {#if eroare["gdpr-consent"] != null}
        <span class="text-danger">{eroare["gdpr-consent"].msg}</span>
    {/if}

</form>

<div
    class="fixed bottom-0 left-0 sm:left-1/2 sm:-translate-x-1/2 w-full sm:w-[60ch]"
>
    <div class="m-4 rounded-xl border border-surface-border bg-surface p-3">
        <div class="flex justify-end gap-4">
            <Buton
                type="button"
                onclick={handleSubmit}
                disabled={isMining}
            >
                {isMining ? "Se începe..." : "Începe"}
            </Buton>
        </div>
    </div>
</div>
