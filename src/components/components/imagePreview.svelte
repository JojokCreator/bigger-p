<script>
	import plusIcon from "../../icons/plus.svg?raw";
	import minusIcon from "../../icons/minus.svg?raw";
	import RangeSlider from "svelte-range-slider-pips";
	import { fade } from "svelte/transition";
	import { get } from "svelte/store";
	export let width;
	export let height;
	let isDraggingPreview = false;
	import {
		closing,
		currentZoom,
		imageDimensions,
		zoomDragTranslate,
		previewBoxStyle,
	} from "../stores";

	export let props;
	export let smallScreen;
	export let activeItem;
	export let container;

	const naturalWidth = +activeItem.width;

	$: bindedZoom = [$currentZoom];

	let startX, startY;
	let calculatedDimensions = props.calculateDimensions(activeItem);
	let sizes = calculatedDimensions[0];

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

	function updateZoomFromPreview(deltaX, deltaY) {
		const zoomFactor = $imageDimensions[0] / calculatedDimensions[0];
		const thumbnailWidth = 176;
		const thumbnailHeight = thumbnailWidth * (activeItem.height / activeItem.width);

		const translateX = $zoomDragTranslate[0] - deltaX * (thumbnailWidth / 100) * zoomFactor;
		const translateY = $zoomDragTranslate[1] - deltaY * (thumbnailHeight / 100) * zoomFactor;

		const boundedTranslate = boundTranslateValues([translateX, translateY], $imageDimensions);
		zoomDragTranslate.set(boundedTranslate, { duration: 0 });
	}

	function updateImageDimensions(newDimensions, x, y) {
		imageDimensions.set(newDimensions).then(() => {
			sizes = Math.round(Math.max(sizes, newDimensions[0]));
		});

		zoomDragTranslate.set(
			boundTranslateValues([$zoomDragTranslate[0] + x, $zoomDragTranslate[1] + y], newDimensions),
		);
	}

	$: maxZoom = calculateMaxPossibleZoom(activeItem, calculatedDimensions);
	function calculateMaxPossibleZoom(activeItem, calculatedDimensions) {
		const calculatedWidth = calculatedDimensions[0];
		return +activeItem.width / calculatedWidth;
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

	export const onWheel = (e) => {
		e.preventDefault();
		if (e.deltaY > 0) {
			decreaseZoom();
		} else {
			increaseZoom();
		}
	};

	function decreaseZoom() {
		const newZoom = Math.max(get(currentZoom) - 0.1, 1);
		changeZoom(newZoom);
	}

	function increaseZoom() {
		const newZoom = Math.min(get(currentZoom) + 0.1, maxZoom);
		changeZoom(newZoom);
	}

	function handlePreviewMouseMove(event) {
		if (!isDraggingPreview) return;

		const thumbnailRect = event.currentTarget.getBoundingClientRect();
		const deltaX = event.clientX - startX;
		const deltaY = event.clientY - startY;

		const newLeft = (deltaX / thumbnailRect.width) * 300;
		const newTop = (deltaY / thumbnailRect.height) * 300;

		updateZoomFromPreview(newLeft, newTop);

		startX = event.clientX;
		startY = event.clientY;
	}

	function handlePreviewMouseUp() {
		isDraggingPreview = false;
	}

	function handlePreviewMouseDown(event) {
		isDraggingPreview = true;
		startX = event.clientX;
		startY = event.clientY;
		event.preventDefault();
	}

	$: {
		if ($imageDimensions && $zoomDragTranslate) {
			updatePreviewBoxStyle(width, height, $imageDimensions, $zoomDragTranslate);
		}
	}

	$: updatePreviewBoxStyle(width, height, $imageDimensions, $zoomDragTranslate);

	function updatePreviewBoxStyle(width, height, imageDimensions, zoomDragTranslate) {
		const previewWidth = (100 * width) / imageDimensions[0];
		const previewHeight = (100 * height) / imageDimensions[1];

		let previewLeft = 50 - (zoomDragTranslate[0] / imageDimensions[0]) * 100 - previewWidth / 2;
		let previewTop = 50 - (zoomDragTranslate[1] / imageDimensions[1]) * 100 - previewHeight / 2;

		previewLeft = Math.max(0, Math.min(previewLeft, 100 - previewWidth));
		previewTop = Math.max(0, Math.min(previewTop, 100 - previewHeight));

		previewBoxStyle.set(`
        left: ${previewLeft}%;
        top: ${previewTop}%;
        width: ${previewWidth}%;
        height: ${previewHeight}%;
    `);
	}

	function resetZoom() {
		imageDimensions.set(calculatedDimensions);
		zoomDragTranslate.set([0, 0]);
		currentZoom.set(1);

		updatePreviewBoxStyle(width, height, calculatedDimensions, [0, 0]);
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
		updatePreviewBoxStyle(width, height, newDimensions, [
			x + $zoomDragTranslate[0],
			y + $zoomDragTranslate[1],
		]);

		currentZoom.set(Number(newZoom));
	}
</script>

<div
	class={`${Number(bindedZoom) == 1 ? "opacity-0" : "opacity-1"} group transition-opacity duration-500 ease-in-out`}
>
	<div
		in:fade={{ duration: 500 }}
		class=" absolute right-0 top-14 z-[1] mx-auto h-fit w-44 overflow-hidden"
	>
		<div
			role="button"
			aria-label="Image preview"
			tabindex="0"
			class="hidden border-2 border-white lg:block"
			on:mousedown={handlePreviewMouseDown}
			on:mousemove={handlePreviewMouseMove}
			on:mouseup={handlePreviewMouseUp}
			on:wheel={onWheel}
			on:mouseleave={handlePreviewMouseUp}
		>
			<img src={activeItem.img} alt="thumbnail" class="h-auto w-44" />
			<div class="zoom-preview absolute z-10 border-2 border-white" style={$previewBoxStyle}></div>
		</div>
	</div>
	<div
		style={`top: ${176 * (activeItem.height / activeItem.width) + 45}px`}
		class="absolute right-0 z-[999] mx-auto hidden w-full max-w-44 pt-4 lg:block"
	>
		<div
			class="ml-auto flex items-center justify-between opacity-0 transition-opacity duration-200 ease-in-out hover:opacity-100 group-hover:opacity-100"
		>
			<button
				class="z-10 flex h-[25.6px] w-[32px] items-center justify-center border-[1px] border-white bg-black p-1 font-bold text-white focus:outline-none"
				on:click={() => resetZoom()}
			>
				{@html minusIcon}
			</button>
			<div class="-ml-1 -mr-1 flex-grow border-[1px] border-white bg-black hover:cursor-pointer">
				<RangeSlider
					step={0.001}
					min={1}
					max={maxZoom}
					springValues={{ stiffness: 1, damping: 1 }}
					bind:values={bindedZoom}
					on:change={(e) => {
						changeZoom(e.detail.value);
					}}
				/>
			</div>
			<button
				class="z-10 flex h-[25.6px] w-[32px] items-center justify-center border-[1px] border-white bg-black p-1 font-bold text-white focus:outline-none"
				on:click={() => changeZoom(maxZoom)}
			>
				{@html plusIcon}
			</button>
		</div>
	</div>
</div>

<style>
	.zoom-preview {
		box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5);
	}
	:root {
		--range-handle-border: rgba(255, 255, 255, 0.5);
	}

	:global(span.rangeNub) {
		background-color: white !important;
		border-radius: 0em !important;
	}
	:global(div.rangeSlider) {
		margin: 8px 14px !important;
		background-color: black !important;
	}
</style>
