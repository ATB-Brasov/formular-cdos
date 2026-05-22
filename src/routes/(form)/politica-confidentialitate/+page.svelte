<script>
    import { onMount } from "svelte";
	import { browser } from "$app/environment";

    /**@type{HTMLElement?}*/ let element = $state(null)

    onMount(() => {
        let is_iframe = false;
        if (browser) {
            try {
                is_iframe = window?.top !== window?.self;
            } catch (e) {
                is_iframe = true; // Likely in a cross-origin iframe
            }
        }
        if (is_iframe && element != null) {
            const height = element.offsetHeight;
            window.parent.postMessage(
                { type: 'iframe-resize', height: height },
                '*' // INFO: Folosește url-ul de producție, printr-o variabilă de mediu poate
            );
        }
    });
</script>

<div bind:this={element} class="font-sans leading-relaxed mt-6">
    <div class="mb-4">
        <a href="/" class="text-blue-600 hover:underline">Înapoi la formular</a>
    </div>

    <h2 class="text-3xl font-bold text-gray-800">
        Politică de Confidențialitate
    </h2>
    <p class="mb-6 text-sm text-gray-500">
        Data ultimei actualizări: 21.05.2026
    </p>

    <p class="mb-4">
        Respectăm confidențialitatea respondenților și ne angajăm să protejăm
        informațiile personale colectate.
    </p>

    <h3 class="text-2xl font-semibold text-gray-700 mt-6 mb-3">
        Colectarea și Utilizarea Datelor
    </h3>
    <p class="mb-4">
        Pentru a îmbunătăți experiența dumneavoastră și a asigura
        funcționalitatea corectă a serviciului, utilizăm cookie-uri pentru a
        salva sesiunea curentă.
    </p>
    <p class="mb-4">
        Colectăm adresa dumneavoastră de e-mail pentru a ne asigura că sunteți
        sutent al Univeristății Transilvania din Brașov și în scopul prevenirii
        completărilor duplicate în chestionar. Această informație nu
        va fi partajată cu terți fără consimțământul dumneavoastră explicit.
    </p>

    <h3 class="text-2xl font-semibold text-gray-700 mt-6 mb-3">
        Securitatea Datelor
    </h3>
    <p class="mb-4">
        Asigurăm securitatea datelor dumneavoastră prin implementarea unor
        măsuri tehnice și organizatorice adecvate. Datele personale sunt
        protejate prin criptare și sunt stocate separat de răspunsurile la
        cestionar, astfel răspunsurile sunt anonimizate pentru a garanta
        confidențialitatea.
    </p>

    <h3 class="text-2xl font-semibold text-gray-700 mt-6 mb-3">
        Modificări ale Politicii de Confidențialitate
    </h3>
    <p class="mb-4">
        Ne rezervăm dreptul de a modifica această politică de confidențialitate
        oricând. Orice modificări vor fi publicate pe această pagină.
    </p>
</div>
