<script>
  let { sets, currentSet, onUpdate } = $props();
  const colorClasses = {
    orange: { default: "bg-[#2d8ab3]", selected: "bg-[#7ab8d4]" },
    green: { default: "bg-[#2a9b85]", selected: "bg-[#7fc4b0]" },
    pink: { default: "bg-[#d64982]", selected: "bg-[#e899b3]" },
    yellow: { default: "bg-[#e5a53d]", selected: "bg-[#f0c87a]" },
  };
</script>

<nav class="flex gap-1 px-4 justify-between">
  {#each sets as set, index}
    {@const pillColor =
      colorClasses[set.color][currentSet === index ? "selected" : "default"]}
    <button
      onclick={() => {
        onUpdate(index);
      }}
      class="hover:shadow-md flex items-center justify-center gap-2 transition-shadow duration-100 px-3 py-1 rounded-full cursor-pointer text-xs"
      class:bg-burgundy={currentSet === index}
      class:text-white={currentSet === index}
      class:text-primary={currentSet !== index}
      class:bg-cream-muted={currentSet !== index}
    >
      <div class="rounded-full w-2 h-2 z-10 shrink-0 {pillColor}"></div>

      <div class="text-nowrap">
        Set {index + 1}
      </div>
    </button>
  {/each}
</nav>
