<script>
    import { enhance } from "$app/forms";

    /** @type {import('./$types').PageProps} */
    let { data, form } = $props();
</script>

<div class="py-18 w-full flex flex-col gap-y-12 text-center">
    <h1 class="text-4xl font-bold">Ștergere răspunsuri</h1>

    <p class="text-lg">
        Pentru a-ți șterge răspunsurile, introdu adresa de e-mail și ID-ul
        răspunsului primit după completare.
    </p>

    <form
        method="POST"
        action="?/delete"
        use:enhance
        class="mx-auto max-w-md flex flex-col gap-3"
    >
        <input
            type="text"
            name="answerId"
            value={data.answerId ?? ""}
            placeholder="ID-ul răspunsului"
            required
            class="w-full px-3 py-2 rounded border border-surface-border bg-white text-sm font-mono"
        >
        <input
            type="email"
            name="email"
            value={data.email ?? ""}
            placeholder="exemplu@student.unitbv.ro"
            required
            class="w-full px-3 py-2 rounded border border-surface-border bg-white text-sm"
        >
        <button
            type="submit"
            class="self-end rounded-md px-4 py-1.5 bg-danger text-white text-sm hover:bg-danger-hover"
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
