<script>

import { enhance } from '$app/forms';
import lista from './lista_facultati_unitbv_2026.js';
import Selectie from './Selectie.svelte';

/** @type {{ data: import('./$types').PageData, form: import('./$types').ActionData }} */
const { form } = $props()

let posta = $derived(form?.posta ?? "")
let facultatea = $state("")
let ciclu = $state("")
let forma = $state("")
let specializare = $state("")
let test_val = $state("")

const lista_facultati = lista.facultati
.map(function(o) { return o.fac; })
.filter(function(e, i, self) { return i === self.indexOf(e); });


const lista_cicluri = $derived(
    lista.facultati
        .filter(o => o.fac === facultatea)
        .map(o => o.cic)
        .filter((e, i, self) => i === self.indexOf(e))
);
const lista_frm = $derived(
    lista.facultati
        .filter(o => o.fac === facultatea && o.cic === ciclu)
        .map(o => o.frm)
        .filter((e, i, self) => i === self.indexOf(e))
);
const specializări = $derived(
    lista.facultati
        .filter(o => o.fac === facultatea && o.cic === ciclu && o.frm === forma)
        .map(o=>o.prg)
)

let pagina = $state(1)

const error = $state({
    error: "",
    msg: ""
});

</script>

<form 
    method=POST
    use:enhance
    class="w-[500px] m-auto mt-10 p-4 flex flex-col gap-4">

    {#if pagina === 1}

        <div>
            <label class="flex flex-col">
                <span>e-poșta <span class="rounded-full leading-none px-0.5 text-xs font-bold bg-red-300/70 dark:bg-red-800/70 text-red-500">★</span></span>
                <input 
                    required={true}
                    class="
                    form-input mt-1 px-2 py-1 rounded shadow-xs 
                    border-stone-300 dark:border-stone-500
                    bg-stone-50/10 dark:bg-stone-700 w-full
                    placeholder:text-stone-300
                    " 
                    placeholder="ion.stanciu@student.unitbv.ro"
                    onblur={() => {
                        if (!posta.endsWith("@unitbv.ro") && !posta.endsWith("@student.unitbv.ro")) {
                            console.log("Poșta greșită!")
                            error.error = "POSTA"
                            error.msg = "Introdu adresa instutițională!"
                        } else {
                            error.error = ""
                            error.msg = ""

                        }
                    }}
                    type="email" name="posta" bind:value={posta}
                >
            </label>
            {#if error.error === "POSTA"}
                <span class="text-red-600 dark:text-red-300">{error.msg}</span>
            {/if}
            {#if form?.error === "POSTA"}
                <span class="text-red-600 dark:text-red-300">{form?.msg}</span>
            {/if}
        </div>

        <Selectie 
            name="facultatea"
            intrebare="Facultatea" 
            optiuni={lista_facultati} 
            bind:value={facultatea}
        />

        {#if lista_cicluri.length !== 0}
            <Selectie
                name="ciclul"
                intrebare="Ciclul de studii" 
                optiuni={lista_cicluri} 
                bind:value={ciclu}
            />
        {/if}

        {#if lista_frm.length !== 0}
            <Selectie
                name="forma"
                intrebare="Forma de învățămînt" 
                optiuni={lista_frm} 
                bind:value={forma}
            />
        {/if}

        {#if specializări.length !== 0}
            <Selectie
                name="programul"
                intrebare="Programul de studii" 
                optiuni={specializări} 
                bind:value={specializare}
            />
        {/if}

        <div>
            Salut <span class="font-bold">{posta ?? "{}"}</span> din facultatea <span class="font-bold">{facultatea ?? "{}"}</span> specializaera <span class="font-bold">{specializare ?? "{}"}</span>
        </div>

        <div class="flex justify-center gap-4">
            <button 
                class="bg-blue-500 border border-blue-600 shadow-xs shadow-blue-600/90 py-1 px-2 rounded-md text-white" 
                type="submit"
            >Trimite</button>
            <button
                class="bg-blue-500 border border-blue-600 shadow-xs shadow-blue-600/90 py-1 px-2 rounded-md text-white" 
                type="button"
                onclick={() => pagina += 1}
            >
                Următor
            </button>
        </div>

    {:else if pagina === 2}

        <div>Pagina 2, trebuește complectată</div>

        <div class="flex justify-center gap-4">
            <button 
                class="bg-blue-500 border border-blue-600 shadow-xs shadow-blue-600/90 py-1 px-2 rounded-md text-white" 
                type="button"
                onclick={() => pagina -= 1}
            >Anterior</button>
            <button 
                class="bg-blue-500 border border-blue-600 shadow-xs shadow-blue-600/90 py-1 px-2 rounded-md text-white" 
                type="button"
                onclick={() => pagina += 1}
            >Următor</button>
        </div>

    {:else}

        <div>Serios mă, complectează toate paĝinile, și după îți voi activa butonu!</div>

        <div class="flex justify-center gap-4">
            <button 
                class="bg-blue-500 border border-blue-600 shadow-xs shadow-blue-600/90 py-1 px-2 rounded-md text-white" 
                type="button"
                onclick={() => pagina -= 1}
            >Anterior</button>
            <button 
                class="bg-blue-500 border border-blue-600 shadow-xs shadow-blue-600/90 py-1 px-2 rounded-md text-white" 
                type="submit"
            >Trimite</button>
        </div>
    {/if}
</form>
