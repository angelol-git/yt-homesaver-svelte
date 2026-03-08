<script>
  import Header from "$lib/components/header.svelte";
  import Nav from "$lib/components/nav.svelte";
  import SetList from "$lib/components/setList.svelte";

  import { getStorage, setStorage } from "$lib/storage.js";
  import { onMount } from "svelte";

  let sets = $state([]);
  let currentSet = $state(0);
  function updateSet(index) {
    currentSet = index;
  }
  onMount(async () => {
    const data = await getStorage("yt-home-saver");
    sets = data?.sets || [];
  });
</script>

<div class="w-87.5 h-125 p-4 border-red-800 border flex flex-col gap-1">
  <Header />
  <Nav {sets} {currentSet} onUpdate={updateSet} />
  <SetList {sets} {currentSet} />
</div>
