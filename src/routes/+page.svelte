<script>
    import { enhance } from '$app/forms';
    import intrebari from './intrebari.js';
    import Selectie from './Selectie.svelte';

    /** @type {{ form: import('./$types').ActionData }} */
    const { form } = $props();

    let raspunsuri = $state(form ?? {});

    let pagina = $derived(form?.pag ?? 0);
    const ULTIMA_PAGINA = intrebari.length - 1;
    const pagina_activa = $derived(intrebari[pagina]);
    const btn_urmator_activ = $derived(
        pagina_activa.cimpuri
            .map(
                (c) =>
                    c.obligatoriu &&
                    (raspunsuri[c.nume] === undefined ||
                        raspunsuri[c.nume] === ''),
            )
            .reduce((prev, curr) => {
                return prev || curr;
            }, false),
    );

    function inloct(text) {
        if (text === '') return '{}';
        return text;
    }
</script>

<form
    method="POST"
    use:enhance={({}) => {
        return async ({ result, update }) => {
            console.dir(result);
            if (!result.type === 'success') {
                update({ reset: false });
            } else {
                update();
            }
        };
    }}
    class="m-auto mt-10 flex w-[500px] flex-col gap-4 p-4"
>
    <h1 class="text-xl font-bold">{pagina_activa.titlu}</h1>

    <div class="w-[100wv] rounded-xl border border-stone-200 bg-white p-3">
        {pagina_activa.descriere}
    </div>

    {#each intrebari as pag, i}
        {#each pag.cimpuri as cimp}
            <div class:hidden={i !== pagina}>
                {#if cimp.tip === 'email'}
                    <label class="flex flex-col">
                        <span
                            >{cimp.titlu}

                            {#if cimp.obligatoriu}
                                <span
                                    class="rounded-full bg-red-300/70 px-0.5 text-xs leading-none font-bold text-red-500 dark:bg-red-800/70"
                                    >★</span
                                >
                            {/if}
                        </span>

                        <input
                            required={cimp.obligatoriu}
                            class="
                            mt-1 form-input w-full rounded border-stone-300 bg-white/90
                            px-2 py-1
                            shadow-xs placeholder:text-stone-300 dark:border-stone-500
                            dark:bg-stone-700
                            "
                            type="email"
                            name={cimp.nume}
                            bind:value={raspunsuri[cimp.nume]}
                        />
                    </label>
                {:else if cimp.tip === 'text'}
                    <label class="flex flex-col">
                        <span
                            >{cimp.titlu}

                            {#if cimp.obligatoriu}
                                <span
                                    class="rounded-full bg-red-300/70 px-0.5 text-xs leading-none font-bold text-red-500 dark:bg-red-800/70"
                                    >★</span
                                >
                            {/if}
                        </span>

                        <input
                            required={cimp.obligatoriu}
                            class="
                            mt-1 form-input w-full rounded border-stone-300 bg-stone-50/10
                            px-2 py-1
                            shadow-xs placeholder:text-stone-300 dark:border-stone-500
                            dark:bg-stone-700
                            "
                            type="text"
                            name={cimp.nume}
                            bind:value={raspunsuri[cimp.nume]}
                        />
                    </label>
                {:else if cimp.tip === 'selecție'}
                    <Selectie
                        name={cimp.nume}
                        intrebare={cimp.titlu}
                        obligatoriu={cimp.obligatoriu}
                        optiuni={cimp.optiuni(raspunsuri)}
                        bind:value={raspunsuri[cimp.nume]}
                    />
                {:else}
                    <i class="text-italic text-red-600"
                        >Tip cîmp `{cimp.tip}` necunoscut</i
                    >
                {/if}

                {#if form?.error === cimp.nume}
                    <div class="text-sm text-red-500">
                        {form?.msg}
                    </div>
                {/if}
            </div>
        {/each}
    {/each}

    <div>
        Salut <span class="font-bold">{inloct(raspunsuri['posta'])}</span> din
        facultatea
        <span class="font-bold">{inloct(raspunsuri['facultatea'])}</span>
        specializaera <span class="font-bold">{inloct(raspunsuri['programul'])}</span>
    </div>

    <div class="w-[100wv] rounded-xl border border-stone-200 bg-white p-3">
        <div class="flex justify-center gap-4">
            <button
                class="
                rounded-md border border-blue-600 bg-blue-500 px-2
                py-1 text-white shadow-xs shadow-blue-600/90
                disabled:border-stone-200 disabled:bg-stone-100 disabled:text-stone-100 disabled:shadow-stone-200/40
                "
                type="button"
                disabled={pagina === 0}
                onclick={() => (pagina -= 1)}>Anterior</button
            >

            {#if pagina === ULTIMA_PAGINA}
                <button
                    class="rounded-md border border-blue-600 bg-blue-500 px-2 py-1 text-white shadow-xs shadow-blue-600/90"
                    type="submit">Trimite</button
                >
            {:else}
                <button
                    class="rounded-md border border-blue-600 bg-blue-500 px-2
                    py-1 text-white shadow-xs shadow-blue-600/90
                    disabled:border-stone-200 disabled:bg-stone-100 disabled:text-stone-400 disabled:shadow-stone-200/40
                    "
                    type="button"
                    disabled={false && btn_urmator_activ}
                    onclick={function () {
                        let tmp = pagina + 1;
                        if (tmp <= ULTIMA_PAGINA) pagina = tmp;
                    }}
                >
                    Următor
                </button>
            {/if}
        </div>
    </div>
</form>
