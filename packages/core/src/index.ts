import memoize from './memoize';

export type DragBoundsCoords = {
	/** Number of pixels from left of the document */
	left: number;

	/** Number of pixels from top of the document */
	top: number;

	/** Number of pixels from the right side of document */
	right: number;

	/** Number of pixels from the bottom of the document */
	bottom: number;
};

export type DragAxis = 'both' | 'x' | 'y' | 'none';

export type DragBounds =
	| HTMLElement
	| Partial<DragBoundsCoords>
	| 'parent'
	| 'body'
	| (string & Record<never, never>);

export type DragEventData = {
	offsetX: number;
	offsetY: number;
	domRect: DOMRect;
	node: HTMLElement;
};

export type DragOptions = {
	/**
	 * Optionally limit the drag area
	 *
	 * Accepts `parent` as prefixed value, and limits it to its parent.
	 *
	 * Or, you can specify any selector and it will be bound to that.
	 *
	 * **Note**: We don't check whether the selector is bigger than the node element.
	 * You yourself will have to make sure of that, or it may lead to strange behavior
	 *
	 * Or, finally, you can pass an object of type `{ top: number; right: number; bottom: number; left: number }`.
	 * These mimic the css `top`, `right`, `bottom` and `left`, in the sense that `bottom` starts from the bottom of the window, and `right` from right of window.
	 * If any of these properties are unspecified, they are assumed to be `0`.
	 */
	bounds?: DragBounds;

	/**
	 * When to recalculate the dimensions of the `bounds` element.
	 *
	 * By default, bounds are recomputed only on dragStart. Use this options to change that behavior.
	 *
	 * @default '{ dragStart: true, drag: false, dragEnd: false }'
	 */
	recomputeBounds?: {
		dragStart?: boolean;
		drag?: boolean;
		dragEnd?: boolean;
	};

	/**
	 * Axis on which the element can be dragged on. Valid values: `both`, `x`, `y`, `none`.
	 *
	 * - `both` - Element can move in any direction
	 * - `x` - Only horizontal movement possible
	 * - `y` - Only vertical movement possible
	 * - `none` - No movement at all
	 *
	 * @default 'both'
	 */
	axis?: DragAxis;

	/**
	 * If true, uses `translate3d` instead of `translate` to move the element around, and the hardware acceleration kicks in.
	 *
	 * `true` by default, but can be set to `false` if [blurry text issue](https://developpaper.com/question/why-does-the-use-of-css3-translate3d-result-in-blurred-display/) occur
	 *
	 * @default true
	 */
	gpuAcceleration?: boolean;

	/**
	 * Applies `user-select: none` on `<body />` element when dragging,
	 * to prevent the irritating effect where dragging doesn't happen and the text is selected.
	 * Applied when dragging starts and removed when it stops.
	 *
	 * Can be disabled using this option
	 *
	 * @default true
	 */
	applyUserSelectHack?: boolean;

	/**
	 * Ignores touch events with more than 1 touch.
	 * This helps when you have multiple elements on a canvas where you want to implement
	 * pinch-to-zoom behaviour.
	 *
	 * @default false
	 *
	 */
	ignoreMultitouch?: boolean;

	/**
	 * Disables dragging altogether.
	 *
	 * @default false
	 */
	disabled?: boolean;

	/**
	 * Applies a grid on the page to which the element snaps to when dragging, rather than the default continuous grid.
	 *
	 * `Note`: If you're programmatically creating the grid, do not set it to [0, 0] ever, that will stop drag at all. Set it to `undefined`.
	 *
	 * @default undefined
	 */
	grid?: [number, number];

	/**
	 * Control the position manually with your own state
	 *
	 * By default, the element will be draggable by mouse/finger, and all options will work as default while dragging.
	 *
	 * But changing the `position` option will also move the draggable around. These parameters are reactive,
	 * so using Svelte's reactive variables as values for position will work like a charm.
	 *
	 *
	 * Note: If you set `disabled: true`, you'll still be able to move the draggable through state variables. Only the user interactions won't work
	 *
	 */
	position?: { x: number; y: number };

	/**
	 * CSS Selector of an element or multiple elements inside the parent node(on which `use:draggable` is applied).
	 *
	 * Can be an element or elements too. If it is provided, Trying to drag inside the `cancel` element(s) will prevent dragging.
	 *
	 * @default undefined
	 */
	cancel?: string | HTMLElement | HTMLElement[];

	/**
	 * CSS Selector of an element or multiple elements inside the parent node(on which `use:draggable` is applied). Can be an element or elements too.
	 *
	 * If it is provided, Only clicking and dragging on this element will allow the parent to drag, anywhere else on the parent won't work.
	 *
	 * @default undefined
	 */
	handle?: string | HTMLElement | HTMLElement[];

	/**
	 * Class to apply on the element on which `use:draggable` is applied.
	 * Note that if `handle` is provided, it will still apply class on the element to which this action is applied, **NOT** the handle
	 *
	 */
	defaultClass?: string;

	/**
	 * Class to apply on the element when it is dragging
	 *
	 * @default 'neodrag-dragging'
	 */
	defaultClassDragging?: string;

	/**
	 * Class to apply on the element if it has been dragged at least once.
	 *
	 * @default 'neodrag-dragged'
	 */
	defaultClassDragged?: string;

	/**
	 * Offsets your element to the position you specify in the very beginning.
	 * `x` and `y` should be in pixels
	 *
	 */
	defaultPosition?: { x: number; y: number };

	/**
	 * Fires when dragging start
	 */
	onDragStart?: (data: DragEventData) => void;

	/**
	 * Fires when dragging is going on
	 */
	onDrag?: (data: DragEventData) => void;

	/**
	 * Fires when dragging ends
	 */
	onDragEnd?: (data: DragEventData) => void;
};

const enum DEFAULT_CLASS {
	MAIN = 'neodrag',
	DRAGGING = 'neodrag-dragging',
	DRAGGED = 'neodrag-dragged',
}

const DEFAULT_RECOMPUTE_BOUNDS: DragOptions['recomputeBounds'] = {
	dragStart: true,
};

export const draggable = (node: HTMLElement, options: DragOptions = {}) => {
	let {
		bounds,
		axis = 'both',
		gpuAcceleration = true,
		applyUserSelectHack = true,
		disabled = false,
		ignoreMultitouch = false,

		recomputeBounds = DEFAULT_RECOMPUTE_BOUNDS,

		grid,

		position,

		cancel,
		handle,

		defaultClass = DEFAULT_CLASS.MAIN,
		defaultClassDragging = DEFAULT_CLASS.DRAGGING,
		defaultClassDragged = DEFAULT_CLASS.DRAGGED,

		defaultPosition = { x: 0, y: 0 },

		onDragStart,
		onDrag,
		onDragEnd,
	} = options;

	const tick = new Promise(requestAnimationFrame);

	let active = false;

	let translateX = 0,
		translateY = 0;

	let initialX = 0,
		initialY = 0;

	// The offset of the client position relative to the node's top-left corner
	let clientToNodeOffsetX = 0,
		clientToNodeOffsetY = 0;

	let { x: xOffset, y: yOffset } = position
		? { x: position?.x ?? 0, y: position?.y ?? 0 }
		: defaultPosition;

	setTranslate(xOffset, yOffset, node, gpuAcceleration);

	let canMoveInX: boolean;
	let canMoveInY: boolean;

	let bodyOriginalUserSelectVal = '';

	let computedBounds: DragBoundsCoords | undefined;
	let nodeRect: DOMRect;

	let dragEl: HTMLElement | HTMLElement[] | undefined;
	let cancelEl: HTMLElement | HTMLElement[] | undefined;

	let isControlled = !!position;

	// Set proper defaults for recomputeBounds
	recomputeBounds = { ...DEFAULT_RECOMPUTE_BOUNDS, ...recomputeBounds };

	// Arbitrary constants for better minification
	const bodyStyle = document.body.style;
	const nodeClassList = node.classList;

	const getEventData: () => DragEventData = () => ({
		offsetX: translateX,
		offsetY: translateY,
		domRect: node.getBoundingClientRect(),
		node,
	});

	const callEvent = (eventName: 'neodrag:start' | 'neodrag' | 'neodrag:end', fn: typeof onDrag) => {
		const data = getEventData();
		node.dispatchEvent(new CustomEvent(eventName, { detail: data }));
		fn?.(data);
	};

	function fireSvelteDragStartEvent() {
		callEvent('neodrag:start', onDragStart);
	}

	function fireSvelteDragEndEvent() {
		callEvent('neodrag:end', onDragEnd);
	}

	function fireSvelteDragEvent() {
		callEvent('neodrag', onDrag);
	}

	const listen = addEventListener;

	listen('pointerdown', dragStart, false);
	listen('pointerup', dragEnd, false);
	listen('pointermove', drag, false);

	// On mobile, touch can become extremely janky without it
	node.style.touchAction = 'none';

	const calculateInverseScale = () => {
		// Calculate the current scale of the node
		let inverseScale = node.offsetWidth / nodeRect.width;
		if (isNaN(inverseScale)) inverseScale = 1;
		return inverseScale;
	};

	function dragStart(e: PointerEvent) {
		if (disabled) return;

		if (ignoreMultitouch && !e.isPrimary) return;

		nodeClassList.add(defaultClass);

		dragEl = getHandleEl(handle, node);
		cancelEl = getCancelElement(cancel, node);

		canMoveInX = /(both|x)/.test(axis);
		canMoveInY = /(both|y)/.test(axis);

		// Compute bounds
		if (recomputeBounds.dragStart) computedBounds = computeBoundRect(bounds, node);

		// Compute current node's bounding client Rectangle
		nodeRect = node.getBoundingClientRect();

		if (isString(handle) && isString(cancel) && handle === cancel)
			throw new Error("`handle` selector can't be same as `cancel` selector");

		if (cancelElementContains(cancelEl, dragEl))
			throw new Error(
				"Element being dragged can't be a child of the element on which `cancel` is applied"
			);

		if (
			(dragEl instanceof HTMLElement
				? dragEl.contains(<HTMLElement>e.target)
				: dragEl.some((el) => el.contains(<HTMLElement>e.target))) &&
			!cancelElementContains(cancelEl, <HTMLElement>e.target)
		)
			active = true;
		else return;

		if (applyUserSelectHack) {
			// Apply user-select: none on body to prevent misbehavior
			bodyOriginalUserSelectVal = bodyStyle.userSelect;
			bodyStyle.userSelect = 'none';
		}

		// Dispatch custom event
		fireSvelteDragStartEvent();

		const { clientX, clientY } = e;
		const inverseScale = calculateInverseScale();

		if (canMoveInX) initialX = clientX - xOffset / inverseScale;
		if (canMoveInY) initialY = clientY - yOffset / inverseScale;

		// Only the bounds uses these properties at the moment,
		// may open up in the future if others need it
		if (computedBounds) {
			clientToNodeOffsetX = clientX - nodeRect.left;
			clientToNodeOffsetY = clientY - nodeRect.top;
		}
	}

	function dragEnd() {
		if (!active) return;

		if (recomputeBounds.dragEnd) computedBounds = computeBoundRect(bounds, node);

		// Apply class defaultClassDragged
		nodeClassList.remove(defaultClassDragging);
		nodeClassList.add(defaultClassDragged);

		if (applyUserSelectHack) bodyStyle.userSelect = bodyOriginalUserSelectVal;

		fireSvelteDragEndEvent();

		if (canMoveInX) initialX = translateX;
		if (canMoveInX) initialY = translateY;

		active = false;
	}

	function drag(e: PointerEvent) {
		if (!active) return;

		if (recomputeBounds.drag) computedBounds = computeBoundRect(bounds, node);

		// Apply class defaultClassDragging
		nodeClassList.add(defaultClassDragging);

		e.preventDefault();

		nodeRect = node.getBoundingClientRect();

		// Get final values for clamping
		let finalX = e.clientX,
			finalY = e.clientY;

		const inverseScale = calculateInverseScale();

		if (computedBounds) {
			// Client position is limited to this virtual boundary to prevent node going out of bounds
			const virtualClientBounds: DragBoundsCoords = {
				left: computedBounds.left + clientToNodeOffsetX,
				top: computedBounds.top + clientToNodeOffsetY,
				right: computedBounds.right + clientToNodeOffsetX - nodeRect.width,
				bottom: computedBounds.bottom + clientToNodeOffsetY - nodeRect.height,
			};

			finalX = clamp(finalX, virtualClientBounds.left, virtualClientBounds.right);
			finalY = clamp(finalY, virtualClientBounds.top, virtualClientBounds.bottom);
		}

		if (Array.isArray(grid)) {
			let [xSnap, ySnap] = grid;

			if (isNaN(+xSnap) || xSnap < 0)
				throw new Error('1st argument of `grid` must be a valid positive number');

			if (isNaN(+ySnap) || ySnap < 0)
				throw new Error('2nd argument of `grid` must be a valid positive number');

			let deltaX = finalX - initialX,
				deltaY = finalY - initialY;

			[deltaX, deltaY] = snapToGrid([xSnap / inverseScale, ySnap / inverseScale], deltaX, deltaY);

			finalX = initialX + deltaX;
			finalY = initialY + deltaY;
		}

		if (canMoveInX) translateX = Math.round((finalX - initialX) * inverseScale);
		if (canMoveInY) translateY = Math.round((finalY - initialY) * inverseScale);

		xOffset = translateX;
		yOffset = translateY;

		fireSvelteDragEvent();

		tick.then(() => setTranslate(translateX, translateY, node, gpuAcceleration));
		// Promise.resolve().then(() => setTranslate(translateX, translateY, node, gpuAcceleration));
	}

	return {
		destroy: () => {
			const unlisten = removeEventListener;

			unlisten('pointerdown', dragStart, false);
			unlisten('pointerup', dragEnd, false);
			unlisten('pointermove', drag, false);
		},
		update: (options: DragOptions) => {
			// Update all the values that need to be changed
			axis = options.axis || 'both';
			disabled = options.disabled ?? false;
			ignoreMultitouch = options.ignoreMultitouch ?? false;
			handle = options.handle;
			bounds = options.bounds;
			recomputeBounds = options.recomputeBounds ?? DEFAULT_RECOMPUTE_BOUNDS;
			cancel = options.cancel;
			applyUserSelectHack = options.applyUserSelectHack ?? true;
			grid = options.grid;
			gpuAcceleration = options.gpuAcceleration ?? true;

			const dragged = nodeClassList.contains(defaultClassDragged);

			nodeClassList.remove(defaultClass, defaultClassDragged);

			defaultClass = options.defaultClass ?? DEFAULT_CLASS.MAIN;
			defaultClassDragging = options.defaultClassDragging ?? DEFAULT_CLASS.DRAGGING;
			defaultClassDragged = options.defaultClassDragged ?? DEFAULT_CLASS.DRAGGED;

			nodeClassList.add(defaultClass);

			if (dragged) nodeClassList.add(defaultClassDragged);

			if (isControlled) {
				xOffset = translateX = options.position?.x ?? translateX;
				yOffset = translateY = options.position?.y ?? translateY;

				tick.then(() => setTranslate(translateX, translateY, node, gpuAcceleration));
			}
		},
	};
};

const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);

const isString = (val: unknown): val is string => typeof val === 'string';

const snapToGrid = memoize(
	([xSnap, ySnap]: [number, number], pendingX: number, pendingY: number): [number, number] => {
		const calc = (val: number, snap: number) => (snap === 0 ? 0 : Math.ceil(val / snap) * snap);

		const x = calc(pendingX, xSnap);
		const y = calc(pendingY, ySnap);

		return [x, y];
	}
);

function getHandleEl(handle: DragOptions['handle'], node: HTMLElement) {
	if (!handle) return node;

	if (handle instanceof HTMLElement || Array.isArray(handle)) return handle;

	// Valid!! Let's check if this selector exists or not
	const handleEls = node.querySelectorAll<HTMLElement>(handle);
	if (handleEls === null)
		throw new Error(
			'Selector passed for `handle` option should be child of the element on which the action is applied'
		);

	return Array.from(handleEls.values());
}

function getCancelElement(cancel: DragOptions['cancel'], node: HTMLElement) {
	if (!cancel) return;

	if (cancel instanceof HTMLElement || Array.isArray(cancel)) return cancel;

	const cancelEls = node.querySelectorAll<HTMLElement>(cancel);

	if (cancelEls === null)
		throw new Error(
			'Selector passed for `cancel` option should be child of the element on which the action is applied'
		);

	return Array.from(cancelEls.values());
}

function cancelElementContains(
	cancelElement: HTMLElement | HTMLElement[] | undefined,
	element: HTMLElement | HTMLElement[]
): boolean {
	const dragElements = element instanceof HTMLElement ? [element] : element;

	if (cancelElement instanceof HTMLElement) {
		return dragElements.some((el) => cancelElement.contains(el));
	}

	if (Array.isArray(cancelElement)) {
		return cancelElement.some((cancelEl) => dragElements.some((el) => cancelEl.contains(el)));
	}

	return false;
}

function computeBoundRect(bounds: DragOptions['bounds'], rootNode: HTMLElement) {
	if (bounds === undefined) return;

	if (bounds instanceof HTMLElement) return bounds.getBoundingClientRect();

	if (typeof bounds === 'object') {
		// we have the left right etc

		const { top = 0, left = 0, right = 0, bottom = 0 } = bounds;

		const computedRight = window.innerWidth - right;
		const computedBottom = window.innerHeight - bottom;

		return { top, right: computedRight, bottom: computedBottom, left };
	}

	// It's a string
	if (bounds === 'parent') return (<HTMLElement>rootNode.parentNode).getBoundingClientRect();

	const node = document.querySelector<HTMLElement>(<string>bounds);
	if (node === null)
		throw new Error("The selector provided for bound doesn't exists in the document.");

	const computedBounds = node.getBoundingClientRect();
	return computedBounds;
}

function setTranslate(xPos: number, yPos: number, el: HTMLElement, gpuAcceleration: boolean) {
	el.style.transform = gpuAcceleration
		? `translate3d(${+xPos}px, ${+yPos}px, 0)`
		: `translate(${+xPos}px, ${+yPos}px)`;
}
