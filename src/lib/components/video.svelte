<script>
  let { video } = $props();
  //Check if thumbnail exists could not have been scraped properly
  let imageLoaded = $state(false);
</script>

<a
  href={video.link}
  class="flex gap-2 p-2 bg-gray-100 border border-gray-200 rounded"
  target="_blank"
>
  {#if video.thumbnail}
    <img
      src={video.thumbnail}
      alt={video.title}
      onload={() => (imageLoaded = true)}
      class:opacity-0={!imageLoaded}
      class:opacity-100={imageLoaded}
      class="transition-opacity rounded-md duration-200 w-30 h-auto"
    />
  {:else}
    <div
      class="w-30 h-16.75 bg-gray-200 p-2 flex items-center justify-center text-center"
    >
      <div class="text-xs text-gray-800">No thumbnail available</div>
    </div>
  {/if}
  <div class="min-w-0 flex-1 pr-2 py-1">
    <h3
      class="text-sm"
      style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.4em; max-height: 2.8em;"
    >
      {video.title}
    </h3>
  </div>
</a>
