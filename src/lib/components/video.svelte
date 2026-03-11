<script>
  let { video } = $props();
  import { CameraOff } from "@lucide/svelte";
  //Check if thumbnail exists could not have been scraped properly
  let imageLoaded = $state(false);
</script>

<a
  href={video.link}
  class="group flex gap-3 p-2 bg-cream-muted text-brown border border-cream-border rounded hover:shadow-md transition-shadow duration-150"
  target="_blank"
>
  {#if video.thumbnail}
    <div class="relative">
      <img
        src={video.thumbnail}
        alt={video.title}
        onload={() => (imageLoaded = true)}
        class:opacity-0={!imageLoaded}
        class:opacity-100={imageLoaded}
        class="rounded-md duration-200 w-25 h-14"
      />
      <div
        class="absolute right-2 bottom-2 z-10 bg-white px-1 rounded-md text-xs"
      >
        {video.length}
      </div>
    </div>
  {:else}
    <div
      class="transition-colors duration-100 relative rounded-md w-25 h-14 bg-stone-200 p-2 flex items-center justify-center text-center"
    >
      <CameraOff size={20} class="stroke-gray-700" />
      <div
        class="font-mono absolute right-2 bottom-2 z-10 bg-cream-muted text-secondary rounded-md text-xs"
      >
        {video.length}
      </div>
    </div>
  {/if}
  <div class="min-w-0 flex-1 pr-2 flex flex-col gap-1">
    <h3
      class="text-sm font-medium text-primary"
      style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.4em; max-height: 2.8em;"
    >
      {video.title}
    </h3>
    <p class="text-xs text-secondary">{video.channel}</p>
  </div>
</a>
