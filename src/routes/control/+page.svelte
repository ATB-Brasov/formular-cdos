<script>
    import { page } from "$app/state";
    import { onMount } from "svelte";

    /** @type {import('./$types').PageProps} */
    let { data } = $props();

    const test = page.url.searchParams.get("test") === "true";
    const survey =
        (test
            ? await import("@content/cestionare/atb-cdos-2026_test.js")
            : await import("@content/cestionare/atb-cdos-2026.js")).default;

    let sections = $state(survey.pagini.map((p, idx) => ({ ...p, idx })));
    let allFields = $state(
        sections.map((p) => p.cimpuri.map((c) => ({ ...c, pag: p.idx }))).flat(
            1,
        ),
    );

    const academicFieldNames = new Set([
        "facultatea",
        "ciclu",
        "forma",
        "programul",
        "anul",
    ]);
    let academicFields = $state(
        allFields.filter((c) => academicFieldNames.has(c.nume)),
    );

    let totalAnswers = $derived(data.answers?.length ?? 0);
    let validatedAnswers = $derived(data.validationStats?.validated ?? 0);
    let validationPct = $derived(
        totalAnswers > 0
            ? Math.round((validatedAnswers / totalAnswers) * 100)
            : 0,
    );

    let answersPerDay = $derived.by(() => {
        /**@type{Map<string, number>}*/
        const map = new Map();
        if (data.dailyCounts) {
            for (const { date, count } of data.dailyCounts) {
                const [y, m, d] = date.split("-");
                map.set(`${d}.${m}.${y}`, count);
            }
        }
        return map;
    });

    let chartData = $derived.by(() => {
        const sortedEntries = Array.from(answersPerDay.entries()).sort(
            ([dateA], [dateB]) => {
                return new Date(dateA.split(".").reverse().join("-"))
                    .valueOf() -
                    new Date(dateB.split(".").reverse().join("-")).valueOf();
            },
        );

        return {
            labels: sortedEntries.map(([date]) => date),
            data: sortedEntries.map(([, count]) => count),
        };
    });

    /**@type{HTMLElement|null} */ let chartContainer = $state(null);
    /**@type{SVGSVGElement|null} */ let svgChart = null;
    /**@type{ResizeObserver|null} */ let resizeObserver = null;

    $effect(() => {
        if (chartData.labels.length > 0 && chartContainer) {
            const renderChart = () => {
                if (!chartContainer) return;

                const { labels, data } = chartData;
                const svgNS = "http://www.w3.org/2000/svg";

                if (svgChart) {
                    svgChart.remove();
                }

                const chartAreaWidth = chartContainer.clientWidth;
                const chartAreaHeight = 300;

                svgChart = document.createElementNS(svgNS, "svg");
                svgChart.setAttribute("width", "100%");
                svgChart.setAttribute("height", String(chartAreaHeight));
                svgChart.setAttribute(
                    "viewBox",
                    `0 0 ${chartAreaWidth} ${chartAreaHeight}`,
                );

                const maxDataValue = Math.max(...data, 1);
                const margin = { top: 30, right: 10, bottom: 50, left: 10 }; // Increased bottom margin for labels and grid lines
                const plotHeight = chartAreaHeight - margin.top - margin.bottom;
                const plotWidth = chartAreaWidth - margin.left - margin.right;

                // --- Grid Lines ---
                const numberOfGridLines = 5; // Adjust for desired density
                for (let i = 0; i < numberOfGridLines; i++) {
                    const gridLineY = margin.top +
                        (plotHeight / (numberOfGridLines - 1)) * i;
                    const line = document.createElementNS(svgNS, "line");
                    line.setAttribute("x1", String(margin.left));
                    line.setAttribute("y1", String(gridLineY));
                    line.setAttribute(
                        "x2",
                        String(chartAreaWidth - margin.right),
                    );
                    line.setAttribute("y2", String(gridLineY));
                    line.setAttribute("stroke", "#e5e7eb"); // Tailwind's gray-200 for light mode grid lines
                    line.setAttribute("stroke-width", "1");
                    line.setAttribute("stroke-dasharray", "4 2"); // Dashed line effect
                    svgChart.appendChild(line);
                }

                // --- End Grid Lines ---
                const barSpacingRatio = 0.2;
                const totalBarSlotWidth = plotWidth / labels.length;
                const barWidth = totalBarSlotWidth * (1 - barSpacingRatio);
                const spacing = totalBarSlotWidth * barSpacingRatio;

                labels.forEach((label, i) => {
                    if (!svgChart) return;
                    const barHeight = (data[i] / maxDataValue) * plotHeight;
                    const x = margin.left + (totalBarSlotWidth * i) +
                        (spacing / 2);
                    const y = chartAreaHeight - margin.bottom - barHeight;

                    const rect = document.createElementNS(svgNS, "rect");
                    rect.setAttribute("x", String(x));
                    rect.setAttribute("y", String(y));
                    rect.setAttribute("width", String(barWidth));
                    rect.setAttribute("height", String(barHeight));
                    rect.setAttribute("fill", "rgba(75, 192, 192, 0.6)");
                    rect.setAttribute("rx", "3");
                    svgChart.appendChild(rect);

                    // Value label on top of bar
                    const valueText = document.createElementNS(svgNS, "text");
                    valueText.setAttribute("x", String(x + barWidth / 2));
                    valueText.setAttribute("y", String(y - 5));
                    valueText.setAttribute("text-anchor", "middle");
                    valueText.setAttribute("font-size", "12");
                    valueText.setAttribute("font-weight", "600");
                    valueText.setAttribute("fill", "#4B5563");
                    valueText.textContent = String(data[i]);
                    svgChart.appendChild(valueText);

                    const text = document.createElementNS(svgNS, "text");
                    text.setAttribute("x", String(x + barWidth / 2));
                    text.setAttribute(
                        "y",
                        String(chartAreaHeight - margin.bottom + 15),
                    );
                    text.setAttribute("text-anchor", "middle");
                    text.setAttribute("font-size", "12");
                    text.setAttribute("fill", "#6B7280");
                    text.textContent = label;
                    svgChart.appendChild(text);
                });

                chartContainer.appendChild(svgChart);
            };

            renderChart();

            if (resizeObserver) {
                resizeObserver.disconnect();
            }
            resizeObserver = new ResizeObserver(renderChart);
            resizeObserver.observe(chartContainer);

            return () => {
                if (svgChart) {
                    svgChart.remove();
                    svgChart = null;
                }
                if (resizeObserver) {
                    resizeObserver.disconnect();
                    resizeObserver = null;
                }
            };
        }
    });
</script>

{#if data.error != null}
    <div class="text-red-500">{data.error}</div>
{:else}
    <div class="container mx-auto p-4 md:p-8">
        <h1 class="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-6">
            Dashboard
        </h1>

        <!-- Summary Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <!-- Total Answers Card -->
            <div
                class="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 flex flex-col items-center justify-center border border-gray-200 dark:border-gray-700 transition-shadow duration-300 hover:shadow-lg"
            >
                <h2
                    class="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-2"
                >
                    Total Answers Submitted
                </h2>
                <p class="text-5xl font-bold text-blue-600 dark:text-blue-400">
                    {totalAnswers}
                </p>
            </div>
            <!-- Validated Answers Card -->
            <div
                class="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 flex flex-col items-center justify-center border border-gray-200 dark:border-gray-700 transition-shadow duration-300 hover:shadow-lg"
            >
                <h2
                    class="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-2"
                >
                    Validated Answers
                </h2>
                <p class="text-5xl font-bold text-green-600 dark:text-green-400">
                    {validatedAnswers}
                </p>
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {validationPct}% of total
                </p>
            </div>
        </div>

        <!-- Answers Per Day Chart -->
        {#if chartData.labels.length > 0}
            <div
                class="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8 border border-gray-200 dark:border-gray-700 transition-shadow duration-300 hover:shadow-lg"
            >
                <h2
                    class="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4"
                >
                    Daily Submissions
                </h2>
                <div
                    bind:this={chartContainer}
                    style="height: 300px; position: relative"
                >
                    <!-- SVG will be rendered here -->
                </div>
            </div>
        {:else if data.answers != null}
            <div
                class="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8 border border-gray-200 dark:border-gray-700"
            >
                <p class="text-gray-600 dark:text-gray-300">
                    No daily answer data available to display.
                </p>
            </div>
        {/if}

        <!-- Answers Table -->
        {#if data.answers != null && data.answers.length > 0}
            <div
                class="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700 transition-shadow duration-300 hover:shadow-lg"
            >
                <h2
                    class="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4"
                >
                    Submission Details
                </h2>
                <div class="overflow-x-auto rounded-lg">
                    <table
                        class="min-w-full divide-y divide-gray-200 dark:divide-gray-700"
                    >
                        <thead class="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                {#each academicFields as field}
                                    <th
                                        scope="col"
                                        class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                                    >
                                        {field.nume}
                                    </th>
                                {/each}
                                <th
                                    scope="col"
                                    class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                                >
                                    Validat
                                </th>
                            </tr>
                        </thead>
                        <tbody
                            class="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700"
                        >
                            {#each data.answers as kdata}
                                {@const answersMap = kdata.value.answers instanceof Map
                                ? kdata.value.answers
                                : new Map(kdata.value.answers)}
                                <tr>
                                    {#each academicFields as field}
                                        {@const item = answersMap.get(field.nume)}
                                        <td
                                            class="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300"
                                        >
                                            {item ?? "-"}
                                        </td>
                                    {/each}
                                    <td class="px-4 py-3 whitespace-nowrap text-sm">
                                        {#if kdata.validated}
                                            <span class="text-green-600 font-medium">Da</span>
                                        {:else}
                                            <span class="text-gray-400">Nu</span>
                                        {/if}
                                    </td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>
            </div>
        {:else if data.answers != null}
            <div
                class="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700"
            >
                <p class="text-gray-600 dark:text-gray-300">
                    No answers to display.
                </p>
            </div>
        {/if}
    </div>
{/if}
