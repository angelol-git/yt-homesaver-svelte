<script>
  let { sets, currentSet, onUpdate } = $props();
</script>

<nav class="flex gap-2 bg-gray-200 px-3 py-1 rounded">
  {#each sets as set, index}
    <button
      onclick={() => {
        onUpdate(index);
      }}
      class="px-3 py-1 rounded-sm cursor-pointer hover:opacity"
      class:font-bold={currentSet === index}
      class:bg-white={currentSet === index}
      class:text-gray-400={currentSet !== index}
    >
      Set {index + 1}
    </button>
  {/each}
</nav>
