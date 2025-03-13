import { writable } from "svelte/store";
import { cubicOut } from "svelte/easing";
import { tweened } from "svelte/motion";

/** store if user prefers reduced motion  */
export const prefersReducedMotion = globalThis.matchMedia?.(
	"(prefers-reduced-motion: reduce)",
).matches;

/** default options for tweens / transitions */
export const defaultTweenOptions = (duration) => ({
	easing: cubicOut,
	duration: prefersReducedMotion ? 0 : duration,
});
// Set initial dimensions to a placeholder like { width: 0, height: 0 } or another value
export const imageDimensions = tweened([0, 0], defaultTweenOptions(400));

export const currentZoom = writable(1);

/** translate transform for pointerDown */
export const zoomDragTranslate = tweened([0, 0], defaultTweenOptions(400));

export const previewBoxStyle = writable(`left: 0%; top: 0%;width: 100%;height: 100%;`);
/** true if gallery is in the process of closing */
export const closing = writable(0);

export const getThumbBackground = (activeItem) => !activeItem.thumb || `url(${activeItem.thumb})`;

/**
 * Adds attributes to the given node based on the provided object.
 *
 * @param {HTMLElement} node - The node to which attributes will be added
 * @param {Record<string, string | boolean> | string} obj - The object containing key-value pairs of attributes to be added
 */
export const addAttributes = (node, obj) => {
	if (!obj) {
		return;
	}
	if (typeof obj === "string") {
		obj = JSON.parse(obj);
	}
	for (const key in obj) {
		node.setAttribute(key, obj[key]);
	}
};
