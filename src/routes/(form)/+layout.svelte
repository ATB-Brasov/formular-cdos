<script>
    import logo from "$lib/assets/logo_ATB_120x120.webp";

    import { page } from "$app/state";
    const is_iframe = page.url.searchParams.get("iframe") === "true"

    let { children } = $props();
</script>

<main 
    class={[
        !is_iframe && "bg-olive-50/30 dark:bg-olive-900 text-olive-900 dark:text-olive-50",
    ]}
>

    <div class="m-auto mt-6 sm:py-10 px-4 w-full sm:w-[60ch]" >
        {#if !is_iframe}
            <header class="px-4 flex justify-center w-full"><a href="https://atbbrasov.ro/"><img class="h-20" src={logo} alt=""></a></header>
        {/if}

        {@render children()}

        {#if !is_iframe}
            <footer class="text-surface-dim flex flex-col items-center mt-14 mb-16 gap-2">
                <div class="text-center">Dacă întâmpinați probleme cu formularul sau considerați că conține informații greșite lăsați o sesizare <a href="https://opnform.com/forms/formular-de-sesizari-0nuyk3">aici.</a></div>
                <div>&copy; ATB Brașov 2026</div>
            </footer>
        {/if}
    </div>
</main>
