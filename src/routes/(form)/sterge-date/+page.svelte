<script>
    import { enhance } from "$app/forms";
    import TextField from "@components/TextField.svelte";

    /** @type {import('./$types').PageProps} */
    let { data, form } = $props();

    let emailErrors = $state(/** @type {import('$lib/common_types').FieldError | undefined} */ (undefined));
    let answerIdErrors = $state(/** @type {import('$lib/common_types').FieldError | undefined} */ (undefined));
    let emailValue = $state("");
    let answerIdValue = $state(data.answerId ?? "");

    $effect(() => {
        const err = /** @type {any} */ (form)?.errors;
        if (err?.email != null) {
            emailErrors = err.email;
        }
        if (err?.answerId != null) {
            answerIdErrors = err.answerId;
        }
    });
</script>

<div class="py-18 w-full flex flex-col gap-y-12 text-center">
    <h1 class="text-4xl font-bold">Ștergere răspunsuri</h1>

    <p class="text-md">
        Pentru a-ți șterge răspunsurile din baza noastră de date, introdu ID-ul
        răspunsului primit după completare.
        {#if data.verificationType !== "no-email"}
            Dacă ai furnizat o adresă de e-mail, introdu și aceasta pentru confirmare.
        {/if}
    </p>

    <form
        method="POST"
        action="?/delete"
        use:enhance
        class="mx-auto max-w-md flex flex-col gap-3"
    >
        <TextField
            tip="text"
            titlu="ID-ul răspunsului"
            nume="answerId"
            bind:value={answerIdValue}
            obligatoriu={true}
            bind:errors={answerIdErrors}
            compact
        />

        <TextField
            tip="email"
            titlu="Adresă de e-mail"
            nume="email"
            placeholder="exemplu@student.unitbv.ro"
            bind:errors={emailErrors}
            bind:value={emailValue}
            compact
        />

        <button
            type="submit"
            class="self-end rounded-md w-full px-4 py-1.5 bg-danger text-white text-sm hover:cursor-pointer hover:bg-danger-hover"
        >
            Șterge răspunsurile
        </button>
        {#if form?.deleteSuccess}
            <p class="text-green-600 text-sm">Răspunsurile au fost șterse.</p>
        {:else if form?.deleteMsg}
            <p class="text-danger text-sm">{form.deleteMsg}</p>
        {/if}
    </form>

    <p><a href="/">Înapoi la formular</a></p>
</div>
