<script>
    let { name, cerut=true, intrebare, optiuni, value = $bindable() } = $props()
</script>



<div>
    <label class="flex flex-col">
        <span class="mb-1">{intrebare}</span>
        <select
            class="
            form-input px-2 py-1 rounded shadow-xs 
            border-stone-300 dark:border-stone-500
            dark:bg-stone-700 min-w-full w-full max-w-full
            "
            required={cerut}
            name={name}
            bind:value={value}
        >
            <option value="">Alege Opțiune</option>
            {#each optiuni as opt}
                <option value={opt}>{opt}</option>
            {/each}
        </select>
    </label>
</div>
