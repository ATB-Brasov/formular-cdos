<script>
    /** @type {import('./$types').PageProps} */
    let { data } = $props();
</script>

<div class="py-18 w-full flex flex-col items-center text-center">
    {#if data.status === "success"}
        <h1 class="text-3xl font-bold text-green-600 mb-4">
            Adresă confirmată
        </h1>
        <p class="text-lg text-gray-700 max-w-md">
            {data.message}
        </p>
        <p class="mt-6 text-sm text-gray-500">
            Poți închide această pagină.
        </p>
    {:else}
        <h1 class="text-3xl font-bold text-red-600 mb-4">
            Verificare eșuată
        </h1>
        <p class="text-lg text-gray-700 max-w-md">
            {data.message}
        </p>
    {/if}
</div>
