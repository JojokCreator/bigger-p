<script>
  import BiggerPictureThumbnails from "./thumbnails.svelte";
  import Macy from "macy";

  let bpThumbnails;
  let imageLinks;

  function openGallery(e) {
    e.preventDefault();
    bpThumbnails.open({
      el: e.currentTarget,
      items: imageLinks,
    });
  }

  function initGallery() {
    imageLinks = document.querySelectorAll("#images > a");
    for (let link of imageLinks) {
      link.addEventListener("click", openGallery);
    }
    Macy({
      container: "#images",
      trueOrder: true,
      margin: 4,
      columns: 3,
      breakAt: {
        520: {
          columns: 2,
        },
      },
    });
  }

  // initialize gallery after component is mounted.
  import { onMount } from "svelte";
  onMount(() => {
    bpThumbnails = new BiggerPictureThumbnails({
      target: document.body,
    });
    initGallery();
  });
</script>

<svelte:head>
  <title>Svelte app</title>
</svelte:head>

<div id="images">
  <a
    href="https://assets.henrygd.me/bp/images/joshua-sukoff-sZ5zbZMAYJs-unsplash.jpg"
    data-img="https://assets.henrygd.me/bp/images/joshua-sukoff-sZ5zbZMAYJs-unsplash.jpg"
    data-thumb="https://assets.henrygd.me/bp/images/joshua-sukoff-sZ5zbZMAYJs-unsplash_thumb.jpg"
    data-height="2500"
    data-width="1667"
    data-alt="Antelope Canyon"
  >
    <img
      src="https://assets.henrygd.me/bp/images/joshua-sukoff-sZ5zbZMAYJs-unsplash_thumb.jpg"
      alt="Antelope Canyon"
      loading="lazy"
    />
  </a>
  <a
    href="https://assets.henrygd.me/bp/images/daniel-sessler-5El_7dJ0kKo-unsplash.jpg"
    data-img="https://assets.henrygd.me/bp/images/daniel-sessler-5El_7dJ0kKo-unsplash.jpg"
    data-thumb="https://assets.henrygd.me/bp/images/daniel-sessler-5El_7dJ0kKo-unsplash_thumb.jpg"
    data-height="2400"
    data-width="2400"
    data-alt="brown and white mountain under gray sky"
  >
    <img
      src="https://assets.henrygd.me/bp/images/daniel-sessler-5El_7dJ0kKo-unsplash_thumb.jpg"
      alt="brown and white mountain under gray sky"
      loading="lazy"
    />
  </a>
  <a
    href="https://assets.henrygd.me/bp/images/janko-ferlic-SDivo1PTBDs-unsplash.jpg"
    data-img="https://assets.henrygd.me/bp/images/janko-ferlic-SDivo1PTBDs-unsplash.jpg"
    data-thumb="https://assets.henrygd.me/bp/images/janko-ferlic-SDivo1PTBDs-unsplash_thumb.jpg"
    data-height="2000"
    data-width="3000"
    data-alt="wildlife photography of brown bear cub"
  >
    <img
      src="https://assets.henrygd.me/bp/images/janko-ferlic-SDivo1PTBDs-unsplash_thumb.jpg"
      alt="wildlife photography of brown bear cub"
      loading="lazy"
    />
  </a>
  <a
    href="https://assets.henrygd.me/bp/images/corey-agopian-5y4ljzRrDFA-unsplash.jpg"
    data-img="https://assets.henrygd.me/bp/images/corey-agopian-5y4ljzRrDFA-unsplash.jpg"
    data-thumb="https://assets.henrygd.me/bp/images/corey-agopian-5y4ljzRrDFA-unsplash_thumb.jpg"
    data-height="2000"
    data-width="3000"
    data-alt="green-and-brown palm trees under clear blue sky"
  >
    <img
      src="https://assets.henrygd.me/bp/images/corey-agopian-5y4ljzRrDFA-unsplash_thumb.jpg"
      alt="green-and-brown palm trees under clear blue sky"
      loading="lazy"
    />
  </a>
  <a
    href="https://assets.henrygd.me/bp/images/andrew-pons-lylCw4zcA7I-unsplash.jpg"
    data-img="https://assets.henrygd.me/bp/images/andrew-pons-lylCw4zcA7I-unsplash.jpg"
    data-thumb="https://assets.henrygd.me/bp/images/andrew-pons-lylCw4zcA7I-unsplash_thumb.jpg"
    data-height="2500"
    data-width="1667"
    data-alt="close up of a yellow and blue macaw"
  >
    <img
      src="https://assets.henrygd.me/bp/images/andrew-pons-lylCw4zcA7I-unsplash_thumb.jpg"
      alt="close up of a yellow and blue macaw"
      loading="lazy"
    />
  </a>
  <a
    href="https://assets.henrygd.me/bp/images/veeterzy-EYcvA56gSjU.jpg"
    data-img="https://assets.henrygd.me/bp/images/veeterzy-EYcvA56gSjU.jpg"
    data-thumb="https://assets.henrygd.me/bp/images/veeterzy-EYcvA56gSjU_thumb.jpg"
    data-height="2400"
    data-width="2400"
    data-alt="mountains clouded in purple fog"
  >
    <img
      src="https://assets.henrygd.me/bp/images/veeterzy-EYcvA56gSjU_thumb.jpg"
      alt="mountains clouded in purple fog"
      loading="lazy"
    />
  </a>
  <a
    href="https://assets.henrygd.me/bp/images/harshil-gudka-9GptkQwAAsc-unsplash.jpg"
    data-img="https://assets.henrygd.me/bp/images/harshil-gudka-9GptkQwAAsc-unsplash.jpg"
    data-thumb="https://assets.henrygd.me/bp/images/harshil-gudka-9GptkQwAAsc-unsplash_thumb.jpg"
    data-height="2400"
    data-width="2400"
    data-alt="three brown leopards hiding on grass field during daytime"
  >
    <img
      src="https://assets.henrygd.me/bp/images/harshil-gudka-9GptkQwAAsc-unsplash_thumb.jpg"
      alt="three brown leopards hiding on grass field during daytime"
      loading="lazy"
    />
  </a>
  <a
    href="https://assets.henrygd.me/bp/images/andrew-svk-REwZEYzw19g-unsplash.jpg"
    data-img="https://assets.henrygd.me/bp/images/andrew-svk-REwZEYzw19g-unsplash.jpg"
    data-thumb="https://assets.henrygd.me/bp/images/andrew-svk-REwZEYzw19g-unsplash_thumb.jpg"
    data-height="2000"
    data-width="3000"
    data-alt="people stand under unique trees on socotra"
  >
    <img
      src="https://assets.henrygd.me/bp/images/andrew-svk-REwZEYzw19g-REwZEYzw19g-unsplash_thumb.jpg"
      alt="people stand under unique trees on socotra"
      loading="lazy"
    />
  </a>
  <a
    href="https://assets.henrygd.me/bp/images/johannes-andersson-UCd78vfC8vU-unsplash.jpg"
    data-img="https://assets.henrygd.me/bp/images/johannes-andersson-UCd78vfC8vU-unsplash.jpg"
    data-thumb="https://assets.henrygd.me/bp/images/johannes-andersson-UCd78vfC8vU-unsplash_thumb.jpg"
    data-height="2500"
    data-width="1667"
    data-alt="two brown deer beside trees and mountain"
  >
    <img
      src="https://assets.henrygd.me/bp/images/johannes-andersson-UCd78vfC8vU-unsplash_thumb.jpg"
      alt="two brown deer beside trees and mountain"
      loading="lazy"
    />
  </a>
</div>

<style>
  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    padding: 4px;
    font-family: sans-serif;
  }

  a {
    display: inline-block;
    transition: opacity 0.2s;
  }

  a:hover {
    opacity: 0.95;
  }

  #images {
    width: 100%;
    max-width: 1200px;
    display: table;
    margin: 0 auto;
  }

  img {
    width: 100%;
    vertical-align: bottom;
  }
</style>