<script>
    import { enhance } from '$app/forms';
    import intrebari from './intrebari.js';
    import Selectie from './Selectie.svelte';

    /** @type {import('./$types').PageProps} */
    let { data, form } = $props();

    /**
     * @template T
     * @typedef {{[key:string]: T}} SDict
     */

    /**
     * @typedef {Object} Eroare
     * @property {string} msg
     * @property {number} pag
     */

    /** @type {SDict<Eroare>} */ let eroare = $state({})
    /** @type {SDict<string>} */ let raspunsuri = $state(form ?? {});

    let pagina = $derived(form?.pag ?? 0);
    const ULTIMA_PAGINA = intrebari.length - 1;
    const pagina_activa = $derived(intrebari[pagina]);
    const btn_urmator_activ = $derived(
        (!pagina_activa
            .cimpuri
            .map(c => raspunsuri[c.nume] === "" && c.obligatoriu)
            .reduce((p,c)=>p||c, false))
        && Object.keys(eroare).length === 0
    );

    function inloct(/**@type{string}*/ text) {
        if (text === '') return '{}';
        return text;
    }

    /**
     * @template T
     * @param {SDict<T>|undefined} obj
     * @param {string} key 
     * @param {T} [defaultValue=undefined]
     * @returns {T|undefined}
     */
    function get(obj, key, defaultValue) {
        if (obj === undefined) return
        return key in obj ? obj[key] : defaultValue;
    }

    /** @param {import('./intrebari.js').Cimp} cimp */
    function aplica_validare(cimp) {
        delete eroare[cimp.nume]

        const rasp = raspunsuri[cimp.nume];
        if ((rasp === undefined || rasp === "") && cimp.obligatoriu) {
            eroare[cimp.nume] = {
                msg: 'Cîmpul este obligatoriu',
                pag: pagina,
            }
            return
        }

        if (cimp.valideaza !== undefined) {
            const err = cimp.valideaza(rasp.toString());
            if (err !== undefined) {
                eroare[cimp.nume] = {
                    msg: err,
                    pag: pagina,
                }
                return
            }
        }
    }
</script>

<form
    method="POST"
    use:enhance={({}) => {
        return async ({ result, update }) => {
            if (result.type !== 'success') {
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
            {@const err = get(form?.erori, cimp.nume)}

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
                            onblur={() => aplica_validare(cimp)}
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
                    {#if cimp.optiuni !== undefined}
                        <Selectie
                            name={cimp.nume}
                            intrebare={cimp.titlu}
                            obligatoriu={cimp.obligatoriu}
                            onblur={() => aplica_validare(cimp)}
                            optiuni={cimp.optiuni(raspunsuri)}
                            bind:value={raspunsuri[cimp.nume]}
                        />
                    {:else}
                        <i class="text-italic text-red-600"
                            >Nu au fost definite opțiuni pentru selecția {cimp.nume}</i
                        >
                    {/if}
                {:else}
                    <i class="text-italic text-red-600"
                        >Tip cîmp `{cimp.tip}` necunoscut</i
                    >
                {/if}

                {#if eroare[cimp.nume] !== undefined}
                    <div class="text-sm text-red-500">
                        {eroare[cimp.nume].msg}
                    </div>
                {/if}

                {#if err !== undefined}
                    <div class="text-sm text-red-500">
                        {err.msg}
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
                    disabled={!btn_urmator_activ}
                    type="submit">Trimite</button
                >
            {:else}
                <button
                    class="rounded-md border border-blue-600 bg-blue-500 px-2
                    py-1 text-white shadow-xs shadow-blue-600/90
                    disabled:border-stone-200 disabled:bg-stone-100 disabled:text-stone-400 disabled:shadow-stone-200/40
                    "
                    type="button"
                    disabled={!btn_urmator_activ}
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
