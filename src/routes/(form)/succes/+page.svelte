<script>
    import { page } from "$app/state";
    import { onMount } from "svelte";

    /**@type{HTMLElement?}*/ let element = $state(null)

    onMount(() => {
        localStorage.clear();

        const is_iframe = page.url.searchParams.get("iframe") === "true"
        console.dir(element)
        if (is_iframe && element != null) {
            console.log("trimite la părinte dimensiunile proprii")
            const height = element.offsetHeight;
            window.parent.postMessage(
                { type: 'iframe-resize', height: height },
                '*' // INFO: Folosește url-ul de producție, printr-o variabilă de mediu poate
            );
        }
    });
</script>

<div bind:this={element} class="py-18 w-full flex flex-col gap-y-12 text-center">
    <h1 class="text-4xl font-bold">Mulțumim pentru participare</h1>

    <p class="text-lg">
        Opinia este importantă pentru a îmbunătăți mediul universitar și
        experiența de student la Universitatea Transilvania din Brașov.
    </p>

    <p><a href="/">Completează din nou</a></p>
</div>
