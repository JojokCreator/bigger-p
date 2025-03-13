<script>
	import {
		addAttributes,
		closing,
		currentZoom,
		defaultTweenOptions,
		getThumbBackground,
		imageDimensions,
		zoomDragTranslate,
	} from "../stores";
	import { fly } from "svelte/transition";
	import Loading from "./loading.svelte";
	export let props;
	export let onDimensionsChange = () => {};
	export let smallScreen;
	export let height;
	export let width;

	import { get } from "svelte/store";

	$: onDimensionsChange({ height, width });

	let { activeItem, opts, prev, next, zoomed, container } = props;

	let calculatedDimensions = props.calculateDimensions(activeItem);
	imageDimensions.set(calculatedDimensions);

	$: maxZoom = calculateMaxPossibleZoom(activeItem, calculatedDimensions);
	function calculateMaxPossibleZoom(activeItem, calculatedDimensions) {
		const calculatedWidth = calculatedDimensions[0];
		return +activeItem.width / calculatedWidth;
	}
	/** value of sizes attribute */
	let sizes = calculatedDimensions[0];

	/** tracks load state of image */
	let loaded, showLoader;

	/** stores pinch info if multiple touch events active */
	let pinchDetails;

	/** image html element (.bp-img) */
	let bpImg;

	/** track distance for pinch events */
	let prevDiff = 0;

	let pointerDown, hasDragged;
	let dragStartX, dragStartY;

	/** zoomDragTranslate values on start of drag */
	let dragStartTranslateX, dragStartTranslateY;

	/** if true, adds class to .bp-wrap to avoid image cropping */
	let closingWhileZoomed;

	const naturalWidth = +activeItem.width;

	/** store positions for drag inertia */
	const dragPositions = [];

	/** cache pointer events to handle pinch */
	const pointerCache = new Map();

	$: zoomed.set($imageDimensions[0] - 10 > calculatedDimensions[0]);
	$: handleClosing($closing, $zoomed, opts.intro);

	function handleClosing(closing, zoomed, intro) {
		if (closing && zoomed && !intro) {
			const closeTweenOpts = defaultTweenOptions(480);
			zoomDragTranslate.set([0, 0], closeTweenOpts);
			imageDimensions.set(calculatedDimensions, closeTweenOpts);
			closingWhileZoomed = true;
		}
	}

	function changeZoom(newZoom, e) {
		if ($closing) return;

		const maxWidth = calculatedDimensions[0] * maxZoom;
		let [newWidth, newHeight] = calculateNewDimensions(newZoom, maxWidth);

		if (newWidth <= calculatedDimensions[0]) {
			return resetZoom();
		}

		let x, y;
		if (e && e.clientX !== undefined) {
			// Mouse event
			[x, y] = calculateZoomOffset(e, newWidth, newHeight);
		} else {
			// Slider event
			x = ($zoomDragTranslate[0] / $imageDimensions[0]) * newWidth - $zoomDragTranslate[0];
			y = ($zoomDragTranslate[1] / $imageDimensions[1]) * newHeight - $zoomDragTranslate[1];
		}

		const newDimensions = [newWidth, newHeight];

		updateImageDimensions(newDimensions, x, y);

		currentZoom.set(Number(newZoom));
	}

	function calculateNewDimensions(newZoom, maxWidth) {
		// Calculate new dimensions based on the new zoom level
		let newWidth = calculatedDimensions[0] * newZoom;
		let newHeight = calculatedDimensions[1] * newZoom;

		// Ensure we don't zoom in beyond the maximum allowed size or natural size
		newWidth = Math.min(newWidth, maxWidth, naturalWidth);

		// Adjust height proportionally if width was capped
		if (newWidth !== calculatedDimensions[0] * newZoom) {
			newHeight = (newWidth / calculatedDimensions[0]) * calculatedDimensions[1];
		}

		// If we've hit the natural width, use the natural height
		if (newWidth === naturalWidth) {
			newHeight = +activeItem.height;
		}
		return [newWidth, newHeight];
	}

	function calculateZoomOffset(e, newWidth, newHeight) {
		if (!e) return [-40, -60];

		const { x, y, width, height } = bpImg.getBoundingClientRect();
		const offsetX = e.clientX - x - width / 2;
		const offsetY = e.clientY - y - height / 2;

		return [-offsetX * (newWidth / width) + offsetX, -offsetY * (newHeight / height) + offsetY];
	}

	function updateImageDimensions(newDimensions, x, y) {
		imageDimensions.set(newDimensions).then(() => {
			sizes = Math.round(Math.max(sizes, newDimensions[0]));
		});

		zoomDragTranslate.set(
			boundTranslateValues([$zoomDragTranslate[0] + x, $zoomDragTranslate[1] + y], newDimensions),
		);
	}

	function resetZoom() {
		imageDimensions.set(calculatedDimensions);
		zoomDragTranslate.set([0, 0]);
		currentZoom.set(1);
	}
	/** calculate translate position with bounds */
	const boundTranslateValues = ([x, y], newDimensions = $imageDimensions) => {
		// image drag translate bounds
		const maxTranslateX = (newDimensions[0] - container.w) / 2;
		const maxTranslateY = (newDimensions[1] - container.h) / 2;
		// x max drag
		if (maxTranslateX < 0) {
			x = 0;
		} else if (x > maxTranslateX) {
			if (smallScreen) {
				// bound to left side (allow slight over drag)
				x = pointerDown ? maxTranslateX + (x - maxTranslateX) / 10 : maxTranslateX;
				// previous item if dragged past threshold
				if (x > maxTranslateX + 20) {
					// pointerdown = undefined to stop pointermove from running again
					pointerDown = prev();
				}
			} else {
				x = maxTranslateX;
			}
		} else if (x < -maxTranslateX) {
			// bound to right side (allow slight over drag)
			if (smallScreen) {
				x = pointerDown ? -maxTranslateX - (-maxTranslateX - x) / 10 : -maxTranslateX;
				// next item if dragged past threshold
				if (x < -maxTranslateX - 20) {
					// pointerdown = undefined to stop pointermove from running again
					pointerDown = next();
				}
			} else {
				x = -maxTranslateX;
			}
		}
		// y max drag
		if (maxTranslateY < 0) {
			y = 0;
		} else if (y > maxTranslateY) {
			y = maxTranslateY;
		} else if (y < -maxTranslateY) {
			y = -maxTranslateY;
		}
		return [x, y];
	};

	export const onWheel = (e) => {
		if (opts.inline && !$zoomed) {
			return;
		}
		e.preventDefault();
		const zoomChange = e.deltaY > 0 ? 0.9 : 1.1;
		const newZoom = Math.min(Math.max(get(currentZoom) * zoomChange, 1), maxZoom);
		changeZoom(newZoom, e);
	};

	/** on drag start, store initial position and image translate values */
	const onPointerDown = (e) => {
		// don't run if right click
		if (e.button !== 2) {
			e.preventDefault();
			pointerDown = true;
			pointerCache.set(e.pointerId, e);
			dragStartX = e.clientX;
			dragStartY = e.clientY;
			dragStartTranslateX = $zoomDragTranslate[0];
			dragStartTranslateY = $zoomDragTranslate[1];
		}
	};

	/** on drag, update image translate val */
	const onPointerMove = (e) => {
		if (pointerCache.size > 1) {
			// if multiple pointer events, pass to handlePinch function
			pointerDown = false;
			return opts.noPinch?.(container.el) || handlePinch(e);
		}

		if (!pointerDown) {
			return;
		}

		let x = e.clientX;
		let y = e.clientY;

		// store positions in dragPositions for inertia
		// set hasDragged if > 2 pointer move events
		hasDragged = dragPositions.push({ x, y }) > 2;

		// overall drag diff from start location
		x = x - dragStartX;
		y = y - dragStartY;

		// handle unzoomed left / right / up swipes
		if (!$zoomed) {
			// close if swipe up
			if (y < -90) {
				pointerDown = !opts.noClose && props.close();
			}
			// only handle left / right if not swiping vertically
			if (Math.abs(y) < 30) {
				// previous if swipe left
				if (x > 40) {
					// pointerdown = undefined to stop pointermove from running again
					pointerDown = prev();
				}
				// next if swipe right
				if (x < -40) {
					// pointerdown = undefined to stop pointermove from running again
					pointerDown = next();
				}
			}
		}

		// image drag when zoomed
		if ($zoomed && hasDragged && !$closing) {
			zoomDragTranslate.set(
				boundTranslateValues([dragStartTranslateX + x, dragStartTranslateY + y]),
				{ duration: 0 },
			);
		}

		if ($zoomed && hasDragged && !$closing) {
			const newTranslate = boundTranslateValues([dragStartTranslateX + x, dragStartTranslateY + y]);
			zoomDragTranslate.set(newTranslate, { duration: 0 });
		}
	};

	const handlePinch = (e) => {
		// update event in cache and get values
		const [p1, p2] = pointerCache.set(e.pointerId, e).values();

		// Calculate the distance between the two pointers
		const dx = p1.clientX - p2.clientX;
		const dy = p1.clientY - p2.clientY;
		const curDiff = Math.hypot(dx, dy);

		// cache the original pinch center
		pinchDetails = pinchDetails || {
			clientX: (p1.clientX + p2.clientX) / 2,
			clientY: (p1.clientY + p2.clientY) / 2,
		};

		// scale image
		const zoomChange = ((prevDiff || curDiff) - curDiff) / -35;
		const newZoom = Math.min(Math.max(get(currentZoom) * (1 + zoomChange), 1), maxZoom);
		changeZoom(newZoom, pinchDetails);

		// Cache the distance for the next move event
		prevDiff = curDiff;
	};

	/** remove event from pointer event cache */
	const removeEventFromCache = (e) => pointerCache.delete(e.pointerId);

	function onPointerUp(e) {
		removeEventFromCache(e);

		if (pinchDetails) {
			// reset prevDiff and clear pointerDown to trigger return below
			pointerDown = prevDiff = 0;
			// set pinchDetails to null after last finger lifts
			pinchDetails = pointerCache.size ? pinchDetails : null;
		}

		// make sure pointer events don't carry over to next image
		if (!pointerDown) {
			return;
		}

		pointerDown = false;

		// close if overlay is clicked
		if (e.target === this && !opts.noClose) {
			return props.close();
		}

		// add drag inertia / snap back to bounds
		if (hasDragged) {
			const [posOne, posTwo, posThree] = dragPositions.slice(-3);
			const xDiff = posTwo.x - posThree.x;
			const yDiff = posTwo.y - posThree.y;
			if (Math.hypot(xDiff, yDiff) > 5) {
				zoomDragTranslate.set(
					boundTranslateValues([
						$zoomDragTranslate[0] - (posOne.x - posThree.x) * 5,
						$zoomDragTranslate[1] - (posOne.y - posThree.y) * 5,
					]),
				);
			}
		} else if (!opts.onImageClick?.(container.el, activeItem)) {
			changeZoom($zoomed ? -maxZoom : maxZoom, e);
		}

		// reset pointer states
		hasDragged = false;
		// reset dragPositions
		dragPositions.length = 0;
	}

	const onMount = (node) => {
		bpImg = node;
		// handle window resize
		props.setResizeFunc(() => {
			calculatedDimensions = props.calculateDimensions(activeItem);
			// adjust image size / zoom on resize, but not on mobile because
			// some browsers (ios safari 15) constantly resize screen on drag
			if (opts.inline || !smallScreen) {
				imageDimensions.set(calculatedDimensions);
				zoomDragTranslate.set([0, 0]);
			}
		});

		// decode initial image before rendering
		props.loadImage(activeItem).then(() => {
			loaded = true;
			props.preloadNext();
		});
		// show loading indicator if needed
		setTimeout(() => {
			showLoader = !loaded;
		}, 250);
	};

	const addSrc = (node) => {
		addAttributes(node, activeItem.attr);
		node.src = activeItem.fallback ? activeItem.fallback : activeItem.img;

		const pictureElement = node.closest("picture");
		if (activeItem.sources) {
			appendToPicture("source", activeItem.sources, pictureElement, node);
		}
	};

	const appendToPicture = (tag, arr, pictureElement, imgElement) => {
		if (!Array.isArray(arr)) {
			arr = JSON.parse(arr);
		}
		for (const obj of arr) {
			const el = document.createElement(tag);
			addAttributes(el, obj);
			pictureElement.insertBefore(el, imgElement);
		}
	};
</script>

<div
	class="relative -top-10 left-0 h-full w-full contain-strict"
	bind:clientHeight={height}
	bind:clientWidth={width}
	on:wheel={onWheel}
	on:pointerdown={onPointerDown}
	on:pointermove={onPointerMove}
	on:pointerup={onPointerUp}
	on:pointercancel={removeEventFromCache}
	class:bp-close={closingWhileZoomed}
>
	<div
		use:onMount
		class={`absolute left-1/2 top-1/2 select-none overflow-hidden bg-[length:100%_100%]`}
		class:bp-canzoom={maxZoom > 1 && $imageDimensions[0] < naturalWidth}
		style:background-image={getThumbBackground(activeItem)}
		style:transform="translate3d({$imageDimensions[0] / -2 + $zoomDragTranslate[0]}px, {$imageDimensions[1] /
			-2 +
			$zoomDragTranslate[1]}px, 0)"
		style="
			width:{$imageDimensions[0]}px;
			height:{$imageDimensions[1]}px;
		"
	>
		{#if loaded}
			<picture>
				<img
					use:addSrc
					sizes={opts.sizes || `${sizes}px`}
					class={`absolute -top-0 left-0 h-full w-full ${!$zoomed ? "hover:cursor-zoom" : "hover:cursor-grab"} ${pointerDown ? "hover:cursor-grabbing" : ""}`}
					alt={activeItem.alt}
					on:error={(error) => opts.onError?.(container, activeItem, error)}
					out:fly|global
				/>
			</picture>
		{/if}
		{#if showLoader}
			<Loading {activeItem} {loaded} />
		{/if}
	</div>
</div>
