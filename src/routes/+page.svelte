<script>
  import Header from "$lib/components/header.svelte";
  import Nav from "$lib/components/nav.svelte";
  import SetList from "$lib/components/setList.svelte";

  import { getStorage, setStorage } from "$lib/storage.js";
  import { onMount } from "svelte";
  const MAX_SETS = 4;
  let sets = $state([]);
  let currentSet = $state(0);
  let colors = ["orange", "green", "pink", "yellow"];
  function updateSet(index) {
    currentSet = index;
  }
  onMount(async () => {
    const data = await getStorage("yt-homesaver");
    sets = data?.sets || [];

    if (sets.length < 4) {
      const difference = MAX_SETS - sets.length;
      for (let i = 0; i < difference; i++) {
        sets.push({ setId: i, timeAdded: null, videos: [] });
      }
    }

    sets = sets.map((set, i) => ({ ...set, color: colors[i] }));
  });
</script>

<div class="w-87.5 h-125 bg-cream flex flex-col gap-1">
  <Header />
  <Nav {sets} {currentSet} onUpdate={updateSet} />
  <div class="w-full border-b border-cream-border pb-2"></div>
  <SetList {sets} {currentSet} />
</div>
