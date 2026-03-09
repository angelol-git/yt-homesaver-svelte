<script>
  let { sets, currentSet, onUpdate } = $props();
  const colorClasses = {
    orange: "bg-orange-500",
    green: "bg-green-500",
    pink: "bg-pink-500",
    yellow: "bg-yellow-500",
  };
  $inspect(sets);
</script>

<nav class="flex gap-1 justify-between">
  {#each sets as set, index}
    <button
      onclick={() => {
        onUpdate(index);
      }}
      class="flex items-center justify-center gap-1 transition-colors duration-100 px-3 py-1 font-medium rounded-full cursor-pointer text-sm"
      class:hover:bg-gray-300={currentSet !== index}
      class:bg-blue-500={currentSet === index}
      class:text-white={currentSet === index}
      class:text-gray-800={currentSet !== index}
      class:bg-gray-200={currentSet !== index}
    >
      <div
        class="rounded-full w-2 h-2 z-10 shrink-0 {colorClasses[set.color]}"
      ></div>

      <div class="text-nowrap">
        Set {index + 1}
      </div>
    </button>
  {/each}
</nav>
