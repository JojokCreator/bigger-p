<script>
  import BiggerPicture from "./bigger-picture";
  import { tweened } from "svelte/motion";
  import { fade } from "svelte/transition";
  import { cubicOut, linear } from "svelte/easing";
  import { resize } from "./actions";

  // store if user prefers reduced motion
  export const prefersReducedMotion = matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  export let thumbOrientation = "horizontal";
  console.log(thumbOrientation);

  let opts;

  let bp;
  let bpItems = [];
  let position;

  let thumbsWidth;
  let containerWidth;
  let initialTranslate = 0;
  let isPointerDown, pointerDownPos, hasDragged;
  let dragPositions = [];
  let focusWrap;
  let thumbnailUrl;

  let translate = tweened(0, {
    easing: cubicOut,
    duration: prefersReducedMotion ? 0 : 0,
  });

  $: if (position !== undefined) {
    setTimeout(scrollToButton, 0);
  }

  export const open = (options) => {
    opts = options;
  };

  function boundTranslate(int) {
    if (int >= 0) {
      int = 0;
    } else if (int < containerWidth - thumbsWidth - 1) {
      int = containerWidth - thumbsWidth - 1;
    }
    return int;
  }
  function scrollToButton() {
    let activeBtn = focusWrap.querySelector("[aria-pressed='true']");
    let { left, right, width } = activeBtn.getBoundingClientRect();
    let margin = 3;
    let { offsetLeft } = activeBtn;
    if (left + width > containerWidth) {
      $translate = boundTranslate(
        -offsetLeft - width + containerWidth - margin
      );
    } else if (right - width < 0) {
      $translate = boundTranslate(-offsetLeft + margin);
    }
  }

  function pointerDown(e) {
    if (thumbsWidth < containerWidth) {
      return;
    }
    let { clientX } = e;
    isPointerDown = true;
    pointerDownPos = clientX;
  }

  function pointerMove(e) {
    if (isPointerDown) {
      let { clientX } = e;
      let dragAmount = -(pointerDownPos - clientX);
      if (hasDragged) {
        translate.set(boundTranslate(initialTranslate + dragAmount), {
          duration: 0,
        });
        dragPositions.push(clientX);
      } else {
        hasDragged = Math.abs(dragAmount) > 5;
      }
    }
  }
  function pointerUp() {
    if (hasDragged) {
      // drag inertia
      dragPositions = dragPositions.slice(-3);
      let xDiff = dragPositions[1] - dragPositions[2];
      xDiff = dragPositions[0] - dragPositions[2];
      if (Math.abs(xDiff) > 5) {
        $translate = boundTranslate($translate - xDiff * 5);
      }
    }
    dragPositions = [];
    isPointerDown = hasDragged = false;
    initialTranslate = $translate;
  }

  const onMount = (bpWrap) => {
    bp = new BiggerPicture({
      target: bpWrap,
    });
    bp.open({
      ...opts,
      focusWrap,
      onOpen: () => {
        bpItems = bp.items;
      },
      onUpdate(container, activeItem) {
        position = activeItem.i;
        thumbnailUrl = activeItem.thumb;
      },
      onClose: () => (opts = null),
    });
  };
</script>

{#if opts}
  <div
    class="fixed inset-0 z-[1000] flex flex-col contain-layout"
    bind:this={focusWrap}
    on:pointermove={pointerMove}
    on:pointerup={pointerUp}
    on:pointercancel={pointerUp}
    use:resize
    on:bp:resize={({ detail }) => {
      containerWidth = detail.cr.width;
      $translate = 0;
    }}
  >
    <div class="relative flex-grow" use:onMount></div>
    <div
      class="relative z-[9999] h-[75px] bg-black transition-opacity duration-300"
      in:fade={{
        duration: 1000,
        easing: linear,
        delay: 1000,
        duration: prefersReducedMotion ? 0 : 1000,
      }}
      out:fade={{
        easing: linear,
        duration: prefersReducedMotion ? 0 : 600,
      }}
    >
      <div
        class="m-0 table h-full transition-transform duration-500 ease-in-out"
        style:transform="translatex({$translate}px)"
        on:pointerdown={pointerDown}
        use:resize
        on:bp:resize={({ detail }) => {
          thumbsWidth = detail.cr.width;
        }}
      >
        <div class="flex touch-none py-1">
          {#each bpItems as element (element.i)}
            <button
              title={element.alt}
              aria-label={element.alt}
              style:background-image="url({element.thumb})"
              aria-pressed={element.i === position}
              class={`m-[0_2px] ${thumbOrientation === "horizontal" ? "h-[67px] w-[85px]" : "h-[85px] w-[67px]"} flex-shrink-0 transform cursor-pointer select-none rounded-[2px] border-0 bg-black bg-contain bg-top bg-no-repeat p-0 opacity-60 !outline-none transition-transform duration-[150ms] ease-in-out hover:scale-105 hover:opacity-90 focus:scale-105 focus:opacity-90 aria-pressed:border aria-pressed:border-primary aria-pressed:opacity-100`}
              on:focus={(e) => scrollToButton(e.target)}
              on:pointerup={() => !hasDragged && bp.setPosition(element.i)}
              on:keyup={(e) => e.key === "Enter" && bp.setPosition(element.i)}
            >
            </button>
          {/each}
        </div>
      </div>
    </div>
  </div>
{/if}
