<script>
  let { video } = $props();
  //Check if thumbnail exists could not have been scraped properly
  let imageLoaded = $state(false);
  $inspect(video);
</script>

<a
  href={video.link}
  class="flex gap-2 p-2 bg-gray-100 border border-gray-200 rounded"
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
      class="relative rounded-md w-25 h-14 bg-gray-200 p-2 flex items-center justify-center text-center"
    >
      <div class="text-xs text-gray-800">No thumbnail available</div>
      <div
        class="absolute right-2 bottom-2 z-10 bg-white px-1 rounded-md text-xs"
      >
        {video.length}
      </div>
    </div>
  {/if}
  <div class="min-w-0 flex-1 pr-2 flex flex-col gap-1">
    <h3
      class="text-sm font-medium"
      style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.4em; max-height: 2.8em;"
    >
      {video.title}
    </h3>
    <p class="text-gray-500 text-xs font">Creator</p>
  </div>
</a>
