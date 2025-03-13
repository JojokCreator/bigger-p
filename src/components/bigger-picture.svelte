<svelte:options accessors={true} immutable={true} />

<script>
  import Icon from "./svelteIcon.svelte";
  import closeIcon from "../icons/close.svg?raw";
  import shareIcon from "../icons/share.svg?raw";
  import feedbackIcon from "../icons/feedback.svg?raw";
  import favouriteIcon from "../icons/heart.svg?raw";
  import arrowRight from "../icons/arrowRight.svg?raw";
  import { fade, fly } from "svelte/transition";
  import { cubicOut } from "svelte/easing";
  import ImageItem from "./components/image.svelte";
  import Iframe from "./components/iframe.svelte";
  import { writable } from "svelte/store";
  import { closing, currentZoom, zoomDragTranslate } from "./stores";
  import ImagePreview from "./components/imagePreview.svelte";
  /** items currently displayed in gallery */
  export let items = undefined;

  let interactionType = "fade";

  let isForward = true; // Track forward/backward movement

  /** element the gallery is mounted within (passed during initialization)*/
  export let target = undefined;

  const html = document.documentElement;

  /** index of current active item */
  let position;

  /** options passed via open method */
  let opts;

  /** bool tracks open state */
  let isOpen;

  /** dom element to restore focus to on close */
  let focusTrigger;

  /** bool true if container width < 769 */
  let smallScreen;

  /** bool value of inline option passed in open method */
  let inline;

  /** when position is set */
  let movement;

  /** stores target on pointerdown (ref for overlay close) */
  let clickedEl;

  /** active item object */
  let activeItem;

  let height = 0;
  let width = 0;

  /** returns true if `activeItem` is html */
  const activeItemIsHtml = () =>
    !activeItem.img && !activeItem.sources && !activeItem.iframe;

  /** function set by child component to run when container resized */
  let resizeFunc;
  /** used by child components to set resize function */
  const setResizeFunc = (fn) => (resizeFunc = fn);

  /** container element (el) / width (w) / height (h) */
  const container = {};

  // /** true if image is currently zoomed past starting size */
  const zoomed = writable(0);

  $: if (items) {
    // update active item when position changes
    activeItem = items[position];
    if (isOpen) {
      // run onUpdate when items updated
      opts.onUpdate?.(container.el, activeItem);
    }
  }

  /** receives options and opens gallery */
  export const open = (options) => {
    opts = options;
    inline = opts.inline;
    const openItems = opts.items;
    // add class to hide scroll if not inline gallery
    if (!inline && html.scrollHeight > html.clientHeight) {
      document.documentElement.classList.add("overflow-hidden");
    }
    // update trigger element to restore focus
    focusTrigger = document.activeElement;
    container.w = target.offsetWidth;
    container.h =
      target === document.body ? window.innerHeight : target.clientHeight;
    smallScreen = container.w < 769;
    position = opts.position || 0;
    // make array w/ dataset to work with
    if (Array.isArray(openItems)) {
      // array was passed
      items = openItems.map((item, i) => {
        // override gallery position if needed
        if (opts.el && opts.el === item.element) {
          position = i;
        }
        return { i, ...item };
      });
    } else {
      // nodelist / node was passed
      items = (openItems.length ? [...openItems] : [openItems]).map(
        (element, i) => {
          // override gallery position if needed
          if (opts.el === element) {
            position = i;
          }
          return { element, i, ...element.dataset };
        }
      );
    }
  };

  /** closes gallery */
  export const close = () => {
    opts.onClose?.(container.el, activeItem);
    closing.set(true);
    items = null;
    // restore focus to trigger element
    focusTrigger?.focus({ preventScroll: true });
  };

  /**
   * go to specific item in gallery
   * @param {number} index
   */
  export const setPosition = (index) => {
    interactionType = "fade";
    movement = index - position;
    position = getNextPosition(index);
    currentZoom.set(1);
    zoomDragTranslate.set([0, 0]);
  };

  /** Previous gallery item */
  export const prev = () => {
    isForward = false;
    setPosition(position - 1);
    interactionType = "fly";
  };

  /** Next gallery item */
  export const next = () => {
    isForward = true;
    setPosition(position + 1);
    interactionType = "fly";
  };

  /**
   * returns next gallery position (looped if neccessary)
   * @param {number} index
   */
  const getNextPosition = (index) => (index + items.length) % items.length;

  const onKeydown = (e) => {
    const { key, shiftKey } = e;
    if (key === "Escape") {
      !opts.noClose && close();
    } else if (key === "ArrowRight") {
      next();
    } else if (key === "ArrowLeft") {
      prev();
    } else if (key === "Tab") {
      // trap focus on tab press
      const { activeElement } = document;
      // allow browser to handle tab into video controls only
      if (shiftKey || !activeElement.controls) {
        e.preventDefault();
        const { focusWrap = container.el } = opts;
        const tabbable = [...focusWrap.querySelectorAll("*")].filter(
          (node) => node.tabIndex >= 0
        );
        let index = tabbable.indexOf(activeElement);
        index += tabbable.length + (shiftKey ? -1 : 1);
        tabbable[index % tabbable.length].focus();
      }
    }
  };

  /**
   * calculate dimensions of height / width resized to fit within container
   * @param {object} item object with height / width properties
   * @returns {Array} [width: number, height: number]
   */
  const calculateDimensions = ({ width = 1920, height = 1080 }) => {
    const { scale = 0.99 } = opts;
    const ratio = Math.min(
      1,
      (container.w / width) * scale,
      (container.h / height) * scale
    );
    // round number so we don't use a float as the sizes attribute
    return [Math.round(width * ratio), Math.round(height * ratio)];
  };

  /** preloads images for previous and next items in gallery */
  const preloadNext = () => {
    if (items) {
      const nextItem = items[getNextPosition(position + 1)];
      const prevItem = items[getNextPosition(position - 1)];
      !nextItem.preload && loadImage(nextItem);
      !prevItem.preload && loadImage(prevItem);
    }
  };

  /** loads / decodes image for item */
  const loadImage = (item) => {
    if (item.img) {
      const image = document.createElement("img");
      image.sizes = opts.sizes || `${calculateDimensions(item)[0]}px`;
      image.srcset = item.img;
      item.preload = true;
      return image.decode().catch((error) => {});
    }
  };

  /** svelte transition to control opening / changing */
  const mediaTransition = (node, isEntering) => {
    if (!isOpen || !items) {
      // entrance / exit transition
      isOpen = isEntering;
      return opts.intro
        ? fly(node, { y: 10 })
        : scaleTransition(node, isEntering ? "in" : "out");
    }

    // Choose transition based on interactionType
    if (interactionType === "fly") {
      node.firstChild.firstChild.firstChild.firstChild
        ? (movement = 1)
        : (movement = -1);
      return fly(node, {
        x: (movement > 0 ? container.w : -container.w) * (isForward ? -1 : 1),
        duration: 1000,
        opacity: 1,
        easing: cubicOut,
      });
    } else {
      // Default to fade transition
      return fade(node, {
        duration: 1000,
        easing: cubicOut,
        opacity: 1,
      });
    }
  };

  const scaleTransition = (node, direction = "in") => {
    let dimensions;
    if (activeItemIsHtml()) {
      const bpItem = node.firstChild.firstChild;
      dimensions = [bpItem.clientWidth, bpItem.clientHeight];
    } else {
      dimensions = calculateDimensions(activeItem);
    }

    // rect is bounding rect of trigger element
    const rect = (activeItem.element || focusTrigger).getBoundingClientRect();
    const leftOffset = rect.left - (container.w - rect.width) / 2;
    const centerTop = rect.top - (container.h - rect.height) / 2;
    const scaleWidth = rect.width / dimensions[0];
    const scaleHeight = rect.height / dimensions[1];

    return {
      duration: 600,
      easing: cubicOut,
      css: (t, u) => {
        // Reverse the progress if direction is 'out'
        const progress = direction === "in" ? t : 1 - t;
        const reverseProgress = direction === "in" ? u : 1 - u;

        return `
                transform: translate3d(${leftOffset * reverseProgress}px, ${centerTop * reverseProgress}px, 0)
                    scale3d(${scaleWidth + progress * (1 - scaleWidth)}, ${scaleHeight + progress * (1 - scaleHeight)}, 1);
                opacity: ${progress};
            `;
      },
    };
  };

  const share = () => {
    const socialShareElement = document.getElementById("socialShare");
    if (socialShareElement) {
      if (navigator.share) {
        navigator.share({
          title: activeItem.caption,
          text: "Check out this card",
          url: activeItem.img,
        });
      } else {
        socialShareElement.setAttribute("show", "true");
      }
    }
  };

  /** provides object w/ needed funcs / data to child components  */
  const getChildProps = () => ({
    activeItem,
    calculateDimensions,
    loadImage,
    preloadNext,
    opts,
    prev,
    next,
    close,
    setResizeFunc,
    zoomed,
    container,
  });

  /** code to run on mount / destroy */
  const containerActions = (node) => {
    container.el = node;
    let removeKeydownListener;
    let roActive;
    opts.onOpen?.(container.el, activeItem);
    // don't use keyboard events for inline galleries
    if (!inline) {
      const handleKeydown = (event) => onKeydown(event);
      window.addEventListener("keydown", handleKeydown);
      removeKeydownListener = () =>
        window.removeEventListener("keydown", handleKeydown);
    }
    // set up resize observer
    const ro = new ResizeObserver((entries) => {
      // use roActive to avoid running on initial open
      if (roActive) {
        container.w = entries[0].contentRect.width;
        container.h = entries[0].contentRect.height;
        smallScreen = container.w < 769;
        // run child component resize function
        if (!activeItemIsHtml()) {
          resizeFunc?.();
        }
        // run user defined onResize function
        opts.onResize?.(container.el, activeItem);
      }
      roActive = true;
    });
    ro.observe(node);
    return {
      destroy() {
        ro.disconnect();
        removeKeydownListener?.();
        closing.set(false);
        // remove class hiding scroll
        document.documentElement.classList.remove("overflow-hidden");
        opts.onClosed?.();
      },
    };
  };

  let imageDimensions = { height: 0, width: 0 }; // Store dimensions in an object

  function handleDimensionsChange(dimensions) {
    imageDimensions = dimensions;
    console.log("Dimensions changed:", dimensions);
  }
</script>

{#if items}
  <div
    use:containerActions
    class="fixed left-0 top-0 z-[999] h-full w-full touch-none contain-strict [-webkit-tap-highlight-color:transparent]"
    class:bp-zoomed={$zoomed}
    class:bp-inline={inline}
    class:bp-small={smallScreen}
    class:bp-noclose={opts.noClose}
  >
    <div
      class="absolute left-0 top-0 h-full w-full animate-bp-fadein bg-black"
      out:fly|local={{ duration: 480 }}
    ></div>
    {#key activeItem.i}
      <div
        class="absolute left-0 top-0 flex h-full w-full"
        in:mediaTransition|global={true}
        out:mediaTransition|global={true}
        on:pointerdown={(e) => (clickedEl = e.target)}
        on:pointerup={function (e) {
          // only close if left click on self and not dragged
          if (e.button !== 2 && e.target === this && clickedEl === this) {
            !opts.noClose && close();
          }
        }}
      >
        {#if activeItem.img}
          <ImageItem
            props={getChildProps()}
            {smallScreen}
            bind:height
            bind:width
            OnDimensionsChange={handleDimensionsChange}
          />
        {:else if activeItem.iframe}
          <Iframe props={getChildProps()} />
        {:else}
          <div class="contents first:m-auto">
            {@html activeItem.html ?? activeItem.element.outerHTML}
          </div>
        {/if}
      </div>
      {#if activeItem.caption}
        <div
          class="absolute bottom-20 left-1/2 table w-fit max-w-[95%] -translate-x-1/2 animate-bp-fadeinslow rounded-md bg-[rgba(9,9,9,0.8)] px-[1.2em] py-[0.6em] leading-[1.3] text-[rgba(255,255,255,0.9)] transition-opacity duration-300"
          out:fly|global={{ duration: 200 }}
        >
          {@html activeItem.caption}
        </div>
      {/if}
    {/key}
    {#if activeItem.img}
      <ImagePreview
        props={getChildProps()}
        {smallScreen}
        {activeItem}
        {container}
        {height}
        {width}
      />
    {/if}
    <div
      class="pointer-events-none absolute left-0 top-0 flex h-full w-full animate-bp-fadeinslow text-left transition duration-300"
      out:fly|local
    >
      <div
        class="absolute right-0 top-0 flex flex-row-reverse justify-between gap-4 p-4"
      >
        <Icon name="close" icon={closeIcon} onClick={close} />
        <Icon name="share" icon={shareIcon} onClick={share} />
        <Icon name="feedback" icon={feedbackIcon} />
        <Icon name="heart" icon={favouriteIcon} />
      </div>
      {#if items.length > 1}
        <!-- counter -->
        <div class="absolute m-8 h-12 w-24 text-white/90">
          {@html `${position + 1} / ${items.length}`}
        </div>
        <!-- foward / back buttons -->
        <button
          class="pointer-events-auto absolute left-2 top-1/2 h-10 w-auto -rotate-180 cursor-pointer rounded p-2 text-white backdrop-blur-sm hover:hover:text-gray-200"
          title="Previous"
          aria-label="Previous"
          on:click={prev}
        >
          {@html arrowRight}
        </button>
        <button
          class="pointer-events-auto absolute right-4 top-1/2 h-10 w-auto cursor-pointer rounded p-2 text-white backdrop-blur-sm hover:text-gray-200"
          title="Next"
          aria-label="Next"
          on:click={next}
        >
          {@html arrowRight}
        </button>
      {/if}
    </div>
  </div>
{/if}
