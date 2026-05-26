<script>
	import { browser } from "$app/environment";
    import { onMount } from "svelte";


/**@type{HTMLElement?}*/ let element = $state(null)
    onMount(() => {
        localStorage.clear();

        let isIframe = false;
        if (browser) {
            try {
                isIframe = window?.top !== window?.self;
            } catch (e) {
                isIframe = true; // Likely in a cross-origin iframe
            }
        }

        if (isIframe && element != null) {
            const height = element.offsetHeight;
            window.parent.postMessage(
                { type: 'iframe-resize', height: height },
                '*' // TODO: use production URL from env variable
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
