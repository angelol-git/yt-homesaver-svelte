<script>
  import Video from "$lib/components/video.svelte";
  import { FolderX } from "@lucide/svelte";
  import { fade } from "svelte/transition";
  let { sets, currentSet } = $props();
</script>

<div class="flex flex-col gap-2 p-2 overflow-y-auto h-full">
  {#key currentSet}
    <div in:fade={{ duration: 200 }} class="flex flex-col gap-2 h-full">
      {#if sets[currentSet]?.videos?.length > 0}
        {#each sets[currentSet].videos as v (v.id)}
          <Video video={v} />
        {/each}
        <div class="text-secondary text-xs mt-auto pb-2">
          Set added: {sets[currentSet].timeAdded}
        </div>
      {:else}
        <div class="h-full pb-10 flex flex-col items-center justify-center">
          <div class="flex flex-col items-center gap-2">
            <div class="p-5 rounded-xl bg-cream-muted">
              <FolderX class="stroke-cream-stroke stroke-1.5" size={32} />
            </div>
            <div class="text-primary text-base">No videos saved yet</div>
          </div>
          <div class="text-secondary text-sm">
            Browse YouTube to save videos here
          </div>
        </div>
      {/if}
    </div>
  {/key}
</div>
