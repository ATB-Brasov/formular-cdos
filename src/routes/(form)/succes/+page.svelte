<script>
    import { browser } from "$app/environment";
    import { onMount } from "svelte";
    import { PUBLIC_ORIGIN } from "$env/static/public";

    const POST_ORIGIN = PUBLIC_ORIGIN || "*";

    /** @type {import('./$types').PageProps} */
    let { data } = $props();

    let element = $state(/** @type {HTMLElement|null} */ (null))
    onMount(() => {
        localStorage.clear();

        let isIframe = false;
        if (browser) {
            try {
                isIframe = window?.top !== window?.self;
            } catch (e) {
                isIframe = true;
            }
        }

        if (isIframe) {
            window.scrollTo(0, 0);
            window.parent.postMessage({ type: 'page-change' }, POST_ORIGIN);
        }

        if (isIframe && element != null) {
            const height = element.offsetHeight;
            window.parent.postMessage(
                { type: 'iframe-resize', height: height },
                POST_ORIGIN,
            );
        }
    });
</script>

<div bind:this={element} class="py-18 w-full flex flex-col gap-y-12 text-center">
    <h1 class="text-4xl font-bold">Mulțumim pentru participare</h1>

    <p class="text-lg">
        Opinia ta este importantă pentru a îmbunătăți mediul universitar și
        experiența de student la Universitatea Transilvania din Brașov.
    </p>

    {#if data.answerId}
        <div class="mx-auto max-w-md rounded-xl border border-surface-border bg-surface p-4 text-left">
            <p class="text-sm text-surface-dim mb-1">ID-ul răspunsului tău:</p>
            <p class="font-mono text-sm break-all select-all">{data.answerId}</p>
            <p class="text-xs text-surface-dim mt-2">
                Păstrează acest ID dacă dorești să-ți modifici sau ștergi ulterior răspunsurile.
            </p>
            <div class="flex flex-col gap-1 mt-2 text-sm">
                <a href={"/edit?answerId=" + encodeURIComponent(data.answerId)} class="text-primary hover:text-primary-hover">
                    Modifică răspunsurile
                </a>
                <a href={"/sterge-date?answerId=" + encodeURIComponent(data.answerId) + (data.email ? "&email=" + encodeURIComponent(data.email) : "")}
                   class="text-danger-strong hover:text-danger-hover"
                >
                    Șterge răspunsurile
                </a>
            </div>
        </div>
    {/if}

    <p><a href="/">Completează din nou</a></p>
</div>
