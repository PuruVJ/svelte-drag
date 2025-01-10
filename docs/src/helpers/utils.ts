export const browser = !import.meta.env.SSR;

export const isMac = browser && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
export const isMobile =
	browser && navigator.userAgent.match(/(iPad)|(iPhone)|(iPod)|(android)|(webOS)/i);
export const isDesktop = !isMobile;

export function elements_overlap(el1: HTMLElement, el2: HTMLElement) {
	const dom_rect1 = el1.getBoundingClientRect();
	const dom_rect2 = el2.getBoundingClientRect();

	return !(
		dom_rect1.top > dom_rect2.bottom ||
		dom_rect1.right < dom_rect2.left ||
		dom_rect1.bottom < dom_rect2.top ||
		dom_rect1.left > dom_rect2.right
	);
}

export function wait_for(ms: number) {
	return new Promise((r) => setTimeout(r, ms));
}

// Add scroll helpers
export function isWindow(container: HTMLElement | Window): container is Window {
	return container === window;
}
