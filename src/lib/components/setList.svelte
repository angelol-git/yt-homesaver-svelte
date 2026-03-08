<script>
  import Video from "$lib/components/video.svelte";
  let { sets, currentSet } = $props();
</script>

<ul class="flex flex-col gap-2 py-2 overflow-y-auto">
  {#each sets as set, index}
    {#if index === currentSet}
      {#each set.videos as v}
        <li class="rounded cursor-pointer">
          <Video video={v} />
        </li>
      {/each}

      <div class="text-gray-500 text-sm">Set added: {set.timeAdded}</div>
    {/if}
  {/each}
</ul>
