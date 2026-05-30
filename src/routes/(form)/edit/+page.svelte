<script>
    import { page } from "$app/state";
    import { goto } from "$app/navigation";
    import TextField from "@components/TextField.svelte";

    let answerId = $state(page.url.searchParams.get("answerId") ?? "");
    let answerIdErrors = $state(/** @type {import('$lib/common_types').FieldError | undefined} */ (undefined));

    function handleSubmit() {
        const val = answerId.trim();
        if (!val) {
            answerIdErrors = { type: "field-required", msg: "Introdu ID-ul răspunsului.", pag: -1 };
            return;
        }
        answerIdErrors = undefined;
        goto("/?edit=" + encodeURIComponent(val), { replaceState: true });
    }
</script>

<div class="py-18 w-full flex flex-col gap-y-12 text-center">
    <h1 class="text-4xl font-bold">Modifică răspunsuri</h1>

    <p class="text-md">
        Introdu ID-ul răspunsului primit după completarea formularului pentru
        a-ți modifica răspunsurile.
    </p>

    <form
        onsubmit={(e) => {
            e.preventDefault();
            handleSubmit();
        }}
        class="mx-auto max-w-md flex flex-col gap-3"
    >
        <TextField
            tip="text"
            titlu="ID-ul răspunsului"
            nume="answerId"
            bind:value={answerId}
            obligatoriu={true}
            bind:errors={answerIdErrors}
            compact
        />
        <button
            type="submit"
            class="self-end rounded-md w-full px-4 py-1.5 bg-primary text-white text-sm hover:bg-primary-hover"
        >
            Modifică răspunsurile
        </button>
    </form>

    <p><a href="/">Înapoi la formular</a></p>
</div>
