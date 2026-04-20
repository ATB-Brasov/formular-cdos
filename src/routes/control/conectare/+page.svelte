<script>
    /** @type {import('./$types').PageProps} */
    let { data, form } = $props();
    let value = $state("")
</script>

<form method="POST">
    <input type="password" name="parola" bind:value>
    <button type="submit">Conectează-te</button>

    {#if form?.msg != null}
        <div class="text-red-500">{form.msg}</div>
    {/if}
</form>
