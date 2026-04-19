<script>
    import { dev } from "$app/environment";

    /** @type {import('./$types').PageProps} */
    let { data } = $props();
</script>

{#if dev}
    Data answers: 
    {#if data.answers != null}
        <div class="flex flex-col">
            {#each data.answers as kdata}
                {@const answer = kdata.value.answers}
                {@const submitedAt = kdata.value.submittedAt}
                {#if answer != null}
                    {@const data = answer}
                    <div class="flex flex-row gap-6">
                        <div>{ new Date(submitedAt).toLocaleString("ro") }</div>
                        {#each data as item}
                            <div>{item.at(1)}</div>
                        {/each}
                    </div>
                {/if}
            {/each}
        </div>
    {:else}
        nulll
    {/if}
{:else}
    Disponibil doar pentru Dezvoltare
{/if}
