<script>
    /** @import { Field } from "@content/cestionare/types.js" */
    /** @import { SDict, FieldError } from "$lib/common_types.js" */

    import { enhance } from "$app/forms";
    import { page } from "$app/state";
    import { browser, dev } from "$app/environment";
    import { goto } from "$app/navigation";

    import Button from "@components/Button.svelte";
    import Selection from "@components/Selection.svelte";
    import TextField from "@components/TextField.svelte";
    import TextAreaField from "@components/TextAreaField.svelte";

    import Entry from "./Entry.svelte";
    import { onMount } from "svelte";
    import { emptyAnswer } from "@content/cestionare/types.js";
    import { solvePoW } from "$lib/miner.js";

    const test = page.url.searchParams.get("test") === "true"
    let isIframe = $state(false)

    const survey =
        (test
            ? await import("@content/cestionare/atb-cdos-2026_test.js")
            : await import("@content/cestionare/atb-cdos-2026.js")).default;

    /** @type {import('./$types').PageProps} */
    let { data, form } = $props();

    const _editData = data.editData;
    const _session = data.session;
    let sectionIndex = $state(_editData ? 0 : _session?.email ? 0 : -1);
    $effect(() => {
        sectionIndex;
        notifyParentPageChange()
    })
    /** @type {SDict<FieldError|null>} */ let errors = $state({});
    /** @type {SDict<string>} */ let answers = $state(_editData?.answers ?? {});

    /**
     * @param {number} sectionIdx
     * @param {{whence: string}} [options]
     */
    function setSectionIndex(sectionIdx, options) {
        if (dev && options?.whence != null) console.log(options.whence);
        sectionIndex = sectionIdx;
        localStorage.setItem("pagina", sectionIndex.toString());
    }

    /**
     * @param {HTMLElement} el
    */
    function scrollToField(el) {
        const top = el.offsetTop - window.innerHeight/2 + el.offsetHeight/2
        window.scrollTo({top, behavior: "smooth"})
        notifyParentScrollTo(
            el.getBoundingClientRect().top,
            el.getBoundingClientRect().height,
        )
        el.dataset.animate = "true"
        setTimeout(() => delete el.dataset.animate, 700)

    }

    /** @param {"urmator" | "precedent"} direction */
    function navigateSection(direction) {
        let tmp = sectionIndex;
        while (true) {
            if (direction === "urmator") {
                for (const k in errors)
                    errors[k] = null
                for (const f of sections[sectionIndex].cimpuri)
                    applyFieldValidation(f)
                for (const k in errors) {
                    if (errors[k] != null) {
                        scrollToField(fieldRefs[k])
                        return;
                    }
                }

                tmp++;
            } else if (direction === "precedent") {
                tmp--;
            } else {
                console.error(`Unknown direction ${direction}`)
                return;
            }
            if (tmp === -1) {
                if (_editData) return;
                setSectionIndex(tmp, {whence: "navigateSection::precedent"});
                return;
            }
            if (tmp < 0 || tmp > LAST_SECTION) return;
            if (!sections[tmp].ascunde?.(answers)) break;
        }
        setSectionIndex(tmp, {whence: "navigateSection::final"});
        !isIframe && setTimeout(() => window.scrollTo({top: 0, behavior: "smooth"}))
    }

    /**@type{SDict<HTMLElement>}*/ let fieldRefs = $state({})
    /**@type{ResizeObserver}*/     let observer
    /**@type{HTMLElement?}*/       let iframeEl

    function notifyParentScrollTo(/**@type{number}*/rectTop, /**@type{number}*/rectHeight) {
        if (iframeEl) {
            window.parent.postMessage(
                { type: 'scroll-to', rectTop, rectHeight},
                '*'
            );
        }
    }

    function notifyParentPageChange() {
        if (iframeEl) {
            window.parent.postMessage(
                { type: 'page-change' },
                '*'
            );
        }
    }

    function notifyParentOfHeightChange() {
        if (iframeEl) {
            const height = iframeEl.offsetHeight;
            window.parent.postMessage(
                {
                    type: 'iframe-resize',
                    height: height
                },
                '*'
            );
        }
    }

    onMount(() => {
        if (browser) {
            try {
                isIframe = window?.top !== window?.self;
            } catch (e) {
                isIframe = true; // Likely in a cross-origin iframe
            }
        }

        if (isIframe) notifyParentOfHeightChange();
        if (data.editData) return;
        const savedAnswers = localStorage.getItem("raspunsuri");
        if (savedAnswers) {
            try {
                const newAnswers = JSON.parse(savedAnswers);
                if (typeof newAnswers === "object") {
                    answers = newAnswers;
                }
                const savedSectionIndex = localStorage.getItem("pagina");
                if (savedSectionIndex) {
                    sectionIndex = parseInt(savedSectionIndex);
                }
            } catch (e) {
                console.error(
                    "Could not load answers from localStorage",
                    e,
                );
            }
        }

        if (isIframe) {
            observer = new ResizeObserver((entries) => {
                for (let entry of entries) {
                    if (entry.target.id === "formWrapper") {
                        setTimeout(notifyParentOfHeightChange, 0);
                    }
                }
            });
            setTimeout(() => iframeEl && observer.observe(iframeEl), 0)
            return () => { observer?.disconnect() };
        }
    });

    $effect(() => {
        if (form == null) return;
        if (form.pag != null) setSectionIndex(form.pag, { whence: "$effect" });

        /** @type {SDict<string>} */ const newAnswers = {};
        /** @type {SDict<FieldError>} */ const newErrors = {};
        for (const [k, v] of Object.entries(form)) {
            if (typeof v === "string") {
                newAnswers[k] = v;
            }
        }
        if (Object.entries(newAnswers).length > 0) {
            answers = newAnswers;
        }

        const errEntries = Object.entries(form?.errors ?? {})
            .sort((a, b) => {
                const erA = a[1];
                const erB = b[1];
                if (erA == null || erB == null) return 0
                return erA.pag - erB.pag
            })
        if (errEntries.length > 0) {
            for (const [k, v] of errEntries) {
                newErrors[k] = /** @type {FieldError} */ (v);
            }
            errors = newErrors;
            const e = errEntries[0];
            setSectionIndex(e[1].pag, {whence: "$effect::errEntries"})
            if (e[1].pag >= 0)
                fieldRefs[e[0]].scrollIntoView()
        }
        form = null
    });

    $effect(() => {
        localStorage.setItem("raspunsuri", JSON.stringify(answers));
    });

    let sections = survey.pagini.map((p, idx) => ({...p, idx}));

    const LAST_SECTION = sections.length - 1;
    const activeSection = $derived(sections[sectionIndex]);

    /**
     * @param {Field} field
     * @param {number} [sectionIdx=sectionIndex]
     */
    function applyFieldValidation(field, sectionIdx=sectionIndex) {
        errors[field.nume] = null;

        const val = answers[field.nume] ?? "";
        let msg = null;
        let type = null;

        if (emptyAnswer(val)) {
            const hideSection  = sections[sectionIdx].ascunde?.(answers)
            const hideField = field.ascunde?.(answers)
            if (hideSection || hideField || !field.obligatoriu) return
            type = "field-required";
            msg = "Câmpul este obligatoriu";
        } else {
            const err = field.valideaza?.(val);
            if (err != null) {
                type = "field-invalid";
                msg = err;
            }
        }

        if (msg && type) errors[field.nume] = { type, msg, pag: sectionIdx };
    }

    const visibleSections = $derived(
        sections.filter((p) => !p.ascunde?.(answers)),
    );

    let formElement = /** @type {HTMLFormElement?} */ $state();
    let isMining = $state(false);

    function handleSubmit() {
        for (const k in errors) errors[k] = null
        const allFields = sections.map((p) => p.cimpuri.map(c=>({...c, pag: p.idx}))).flat(1)
        allFields.forEach(c => applyFieldValidation(c, c.pag))
        const err = Object.entries(errors).filter(([_, v]) => v != null)
        err.sort((a, b) => {
            const erA = a[1];
            const erB = b[1];
            if (erA == null || erB == null) return 0
            return erA.pag - erB.pag
        })

        if (err.length > 0) {
            const [k, v] = err[0]
            if (v == null) return
            setSectionIndex(v.pag, {whence: "/::handleSubmit"})
            setTimeout(() => scrollToField(fieldRefs[k]), 0)
        } else {
            formElement?.requestSubmit();
        }
    }
</script>

{#if dev}
    <div
        class="fixed bottom-6 left-6 rounded bg-primary-subtle border border-primary-border z-200 px-4 py-2 font-mono"
    >
        <span class="inline sm:hidden">xs</span>
        <span class="hidden sm:inline md:hidden">sm</span>
        <span class="hidden md:inline lg:hidden">md</span>
        <span class="hidden lg:inline xl:hidden">lg</span>
        <span class="hidden xl:inline">xl</span>
    </div>
{/if}

<div id="formWrapper" bind:this={iframeEl}>

<h1 class="text-4xl font-bold mt-8 mb-4">{survey.titlu}</h1>

{#if sectionIndex === -1}
    <div
        id="descriere"
        class="w-full rounded-xl flex flex-col gap-y-2 border border-surface-border bg-surface mt-4 mb-8 p-3"
    >
        {@html survey.descriere}
    </div>

    <Entry bind:this={formElement} bind:errors bind:sectionIndex />
{:else}
    <div class="flex flex-wrap gap-2 mb-8">
        {#each sections as section, i}
            <button
                aria-label="Secțiunea {i + 1}"
                disabled={section.ascunde?.(answers)}
                onclick={() => {
                    sectionIndex = i;
                    localStorage.setItem("pagina", sectionIndex.toString());
                }}
                class={[
                    "px-1 py-0.5 rounded-full grow disabled:bg-surface-disabled transition-colors duration-200",
                    i === sectionIndex
                        ? "bg-primary"
                        : "bg-surface-border hover:bg-surface-secondary",
                    i < sectionIndex && Object.values(errors).some((e) => e?.pag === i)
                        ? "border-2 border-danger-strong bg-danger-strong"
                        : "opacity-75",
                ]}
            >
            </button>
        {/each}
    </div>

    <h2 class="text-2xl font-bold">{activeSection.titlu}</h2>
    {#if activeSection.descriere}
        <div
            class="w-full rounded-xl border border-surface-border bg-surface mt-4 p-3"
        >
            {activeSection.descriere}
        </div>
    {/if}

    <form
        method="POST"
        use:enhance={async ({ formData, cancel }) => {
            if (!data.editData) {
                const email = localStorage.getItem("posta");
                if (email) {
                    formData.set("posta", email);
                    isMining = true;
                    try {
                        const nonce = await solvePoW(email, 4);
                        formData.append("nonce", nonce.toString());
                    } catch {
                        cancel();
                        return;
                    } finally {
                        isMining = false;
                    }
                }
            }
            return async ({ result, update }) => { await update(); };
        }}
        action="?/submit"
        class="mt-4 w-full"
        class:mb-26={isIframe}
        bind:this={formElement}
    >

        {#if test}
            <input type="hidden" name="test" value="true">
        {/if}

        {#if data.editData}
            <input type="hidden" name="edit" value="true">
            <input type="hidden" name="answerId" value={data.editData.answerId}>
        {/if}

        {#each sections as section, i}
            {#if !section.ascunde?.(answers)}
                <div class={["flex flex-col gap-6 ", i !== sectionIndex && "hidden"]}>
                    {#each section.cimpuri as field, nr}
                        {#if !field.ascunde?.(answers)}
                            <div id={`field-${field.nume}`}
                                    class="
                                        p-2 rounded-xl
                                        border border-transparent
                                        data-animate:border-red-200
                                        data-animate:bg-red-100
                                        transition-colors ease-in duration-400"
                                    bind:this={fieldRefs[field.nume]}>
                                {#if dev}
                                    <div class="text-surface-muted text-mono text-xs">
                                        id: {field.nume} ({nr + 1})
                                    </div>
                                {/if}

                                {#if field.tip === "email" || field.tip === "text"}
                                    <TextField
                                        {...field}
                                        tip={field.tip}
                                        errors={errors[field.nume]}
                                        onblur={() => false && applyFieldValidation(field)}
                                        bind:value={answers[field.nume]}
                                    />
                                {:else if field.tip === "textarea"}
                                    <TextAreaField
                                        {...field}
                                        tip={field.tip}
                                        errors={errors[field.nume]}
                                        onblur={() => false && applyFieldValidation(field)}
                                        bind:value={answers[field.nume]}
                                    />
                                {:else if field.tip.startsWith("selecție")}
                                    <Selection
                                        field={field}
                                        allAnswers={answers}
                                        bind:errors={errors[field.nume]}
                                        onblur={() => false && applyFieldValidation(field)}
                                        bind:value={answers[field.nume]}
                                    />
                                {:else}
                                    <div class="text-italic text-danger-strong">
                                        Unknown field type `{field.tip}`
                                    </div>
                                {/if}
                            </div>
                        {/if}
                    {/each}
                </div>
            {/if}
        {/each}

        <div
            class="fixed bottom-0 left-0 sm:left-1/2 sm:-translate-x-1/2 w-full sm:w-[60ch]"
        >
            <div
                class="m-4 rounded-xl border border-surface-border bg-surface p-3"
            >
                <div class="flex justify-between gap-4">
                    <div>
                        {#if _editData}
                            <Button
                                variant="danger"
                                onclick={() => goto("/sterge-date?answerId=" + encodeURIComponent(_editData.answerId))}
                            >
                                Șterge
                            </Button>
                        {/if}
                    </div>
                    <div class="flex gap-4">
                        <Button
                            class={sectionIndex === -1 || (_editData && sectionIndex === 0) ? "invisible" : ""}
                            onclick={() => navigateSection("precedent")}
                        >
                            Anterior
                        </Button>

                        {@render button()}
                        {#snippet button()}
                            {@const ultima = sections[sectionIndex].idx === visibleSections.at(-1)?.idx}
                            <Button
                                class="min-w-22"
                                type="button"
                                disabled={isMining}
                                onclick={ultima ? handleSubmit : () => navigateSection("urmator")}
                            >
                                {isMining ? "Se verifică..." : ultima ? "Trimite" : "Următor"}
                            </Button>
                        {/snippet}
                    </div>
                </div>
            </div>
        </div>

    </form>

{/if}

</div>
