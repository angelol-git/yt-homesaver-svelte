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
    const data = await getStorage("yt-home-saver");
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

<div class="w-87.5 h-125 p-4 border-gray-400 border flex flex-col gap-2">
  <Header />
  <Nav {sets} {currentSet} onUpdate={updateSet} />
  <SetList {sets} {currentSet} />
</div>
