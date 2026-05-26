<script>
    import { page } from "$app/state";
    import { goto } from "$app/navigation";

    let answerId = $state(page.url.searchParams.get("answerId") ?? "");

    function handleSubmit() {
        const val = answerId.trim();
        if (val) {
            goto("/?edit=" + encodeURIComponent(val), { replaceState: true });
        }
    }
</script>

<div class="py-18 w-full flex flex-col gap-y-12 text-center">
    <h1 class="text-4xl font-bold">Modifică răspunsuri</h1>

    <p class="text-lg">
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
        <input
            type="text"
            name="answerId"
            bind:value={answerId}
            placeholder="ID-ul răspunsului"
            required
            class="w-full px-3 py-2 rounded border border-surface-border bg-white text-sm font-mono text-center"
        >
        <button
            type="submit"
            class="rounded-md px-4 py-1.5 bg-primary text-white text-sm hover:bg-primary-hover"
        >
            Modifică răspunsurile
        </button>
    </form>

    <p><a href="/">Înapoi la formular</a></p>
</div>
