<script>
    import { page } from "$app/state";
    const is_iframe = page.url.searchParams.get("iframe") === "true"

    let { children } = $props();
</script>

<main 
    class={[
        !is_iframe && "bg-olive-50/30 dark:bg-olive-900 text-olive-900 dark:text-olive-50",
        "m-auto mt-6 sm:mt-10 px-4 w-full sm:w-[60ch]"
    ]}>
    {@render children()}
</main>
