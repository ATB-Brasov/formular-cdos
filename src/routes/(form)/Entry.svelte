<script>
    /** @import { SDict, FieldError } from "$lib/common_types.js" */

    import { page } from "$app/state";
    import { enhance } from "$app/forms";
    import { solvePoW } from "$lib/miner.js";
    import Button from "@components/Button.svelte";
    import TextField from "@components/TextField.svelte";

    import survey from "@content/cestionare/atb-cdos-2026.js"; // TODO: dynamic loading
    import { onMount } from "svelte";

    const isIframe = page.url.searchParams.get("iframe") === "true"

    /**
     * @typedef {Object} Props
     * @property {SDict<FieldError|null>} errors
     * @property {number} sectionIndex
     */

    /** @type {Props & Record<string, unknown>} */
    let {
        errors = $bindable(),
        sectionIndex = $bindable(),
    } = $props();

    let isMining = $state(false);
    let formElement = /** @type {HTMLFormElement?} */ $state();

    let email = $state("");
    let consent = $state(false);

    onMount(() => {
        email = localStorage.getItem("posta") ?? "";
        consent = localStorage.getItem("gdpr-consent") === "true";
    });

    $effect(() => {
        if (!consent) {
            errors["gdpr-consent"] = {
                type: "required",
                msg: "Trebuie să acceptați politica de confidențialitate",
                pag: -1,
            };
            localStorage.setItem("gdpr-consent", "false")
        } else {
            delete errors["gdpr-consent"];
            localStorage.setItem("gdpr-consent", "true")
        }
    });

    $effect(() => {
        if (email === "") {
            errors["posta"] = {
                type: "email-invalid",
                msg: "Adresa de poștei electronice este obligatorie",
                pag: -1,
            };
            return;
        }
        const msg = survey.validare_posta?.(email);
        if (msg != null) {
            errors["posta"] = { type: "email-invalid", msg, pag: -1 };
        } else {
            if (errors["posta"]?.type !== "email-invalid") return;
            errors["posta"] = null;
        }
    });

    function handleSubmit() {
        if (email.trim() === "") {
            errors["posta"] = { type: "email-invalid", msg: "Adresa de poștei electronice este obligatorie", pag: -1 };
            return;
        }

        const msg = survey.validare_posta?.(email);
        if (msg != null) {
            errors["posta"] = { type: "email-invalid", msg, pag: -1 };
            return;
        }

        if (!consent) {
            errors["gdpr-consent"] = {
                type: "required",
                msg: "Trebuie să acceptați politica de confidențialitate",
                pag: -1,
            };
            return;
        }

        errors["posta"] = null
        errors["gdpr-consent"] = null
        isMining = true;
        setTimeout(() => { formElement?.requestSubmit(); }, 0);
    }
</script>

<form
    method="POST"
    bind:this={formElement}
    class:mb-26={isIframe}
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
                sectionIndex = 0;
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
    <TextField
        tip={"email"}
        titlu={"Adresa poștei instituționale"}
        disclaimer={`
            Adresa e-mail <strong>nu va fi</strong> asociată cu răspunsurile
            colectate. Colectăm adresa pentru a ne asigura că ești student UNITBV. Pentru mai multe informații, consultați <a href="/politica-confidentialitate">politica de confidențialitate</a>.`}
        nume={"posta"}
        bind:errors={errors["posta"]}
        placeholder={"exemplu@student.unitbv.ro"}
        obligatoriu={true}
        bind:value={email}
    />

    {#if errors["_form"] != null}
        <span class="text-danger">{errors["_form"].msg}</span>
    {/if}

    <div class="flex flex-col">
        <label for="gdpr-consent" class="sm:leading-0 sm:pb-0.5">
        <input
            bind:checked={consent}
            type="checkbox"
            id="gdpr-consent"
            name="gdpr-consent"
            required
            class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary"
        />
            Am citit și sunt de acord cu <a
                href="/politica-confidentialitate"
                class="underline"
            >politica de confidențialitate</a>.
        </label>
        {#if errors["gdpr-consent"] != null}
            <p class="text-danger text-sm mt-1">{errors["gdpr-consent"].msg}</p>
        {/if}
    </div>
</form>

<div
    class="fixed bottom-0 left-0 sm:left-1/2 sm:-translate-x-1/2 w-full sm:w-[60ch]"
>
    <div class="m-4 rounded-xl border border-surface-border bg-surface p-3">
        <div class="flex justify-end gap-4">
            <Button
                type="button"
                onclick={handleSubmit}
                disabled={isMining}
            >
                {isMining ? "Se verifică..." : "Începe"}
            </Button>
        </div>
    </div>
</div>
