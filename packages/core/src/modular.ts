export type DragEventData = {
	/** How much element moved from its original position horizontally */
	offsetX: number;

	/** How much element moved from its original position vertically */
	offsetY: number;

	/** The node on which the draggable is applied */
	rootNode: HTMLElement;

	/** The element being dragged */
	currentNode: HTMLElement;
};

export type BaseDragOptions = {
	plugins?: Plugin<any>[];

	/**
	 * Threshold for dragging to start. If the user moves the mouse/finger less than this distance, the dragging won't start.
	 *
	 * @default { delay: 0, distance: 3 }
	 */
	threshold?: {
		/**
		 * Threshold in milliseconds for a pointer movement to be considered a drag
		 *
		 * @default 0
		 */
		delay?: number;

		/**
		 * Threshold in pixels for movement to be considered a drag
		 *
		 * @default 3
		 */
		distance?: number;
	};

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

type PluginContext = {
	readonly delta: { x: number; y: number };

	// Current position (mutable). Only of this drag cycle
	readonly proposed: { x: number | null; y: number | null };

	readonly offset: { x: number; y: number };

	// Drag status
	readonly isDragging: boolean;

	readonly isInteracting: boolean;

	readonly rootNode: HTMLElement;

	/**
	 * Here for performance reasons. Must be calculated only during dragStart by the core instance, not by any plugin within.
	 */
	cachedRootNodeRect: DOMRect;

	// This will be overriden by controls plugin for eg
	currentlyDraggedNode: HTMLElement;

	// any side-effects within plugins(DOM manipulation etc) must go here. THis is run only after making sure
	// no plugin returned false. Other doesn't run
	effect: (fn: () => void) => void;

	/**
	 * Propose a new position for the draggable. This will be applied to the DOM only after all plugins have run. Highest
	 * priority plugin's proposed value will be used.
	 */
	propose: (coords: { x: number | null; y: number | null }) => void;

	/**
	 * Cancels the drag operation. This applies to all the hooks, any hook cancenling will stop the drag operation.
	 */
	cancel: () => void;
};

type Plugin<PrivateState = any> = {
	// Identifier for the plugin
	name: string;

	/**
	 * Priority decides the order in which the plugins will run. Higher the number, earlier it runs. If priority of two or more plugins are sam
	 * then they run in the order specified in the plugins array
	 */
	priority?: number;

	// Called when plugin is initialized
	setup?: (context: PluginContext) => PrivateState | void;

	shouldDrag?: (context: PluginContext, state: PrivateState) => boolean;

	// Start of drag - return false to prevent drag
	dragStart?: (context: PluginContext, state: PrivateState, event: PointerEvent) => void;

	// During drag - return state modifications
	drag?: (context: PluginContext, state: PrivateState, event: PointerEvent) => void;

	// End of drag
	dragEnd?: (context: PluginContext, state: PrivateState, event: PointerEvent) => void;

	// Cleanup when draggable is destroyed
	cleanup?: () => void;
};

export function draggable(node: HTMLElement, options: BaseDragOptions): { destroy: () => void } {
	let {
		onDrag,
		onDragEnd,
		onDragStart,
		plugins: user_plugins = [],
		threshold = { delay: 0, distance: 3 },
	} = options;

	const default_plugins: Plugin[] = [
		ignoreMultitouch(),
		classes(),
		// axis(),
		applyUserSelectHack(),
		transform(),
		// bounds(BoundsFrom.box({ top: 10, left: 0, right: 600, bottom: 200 }, document.body)),
		// grid(40, 20),
		// disabled(),
	];

	let is_interacting = false;
	let is_dragging = false;

	let start_time = 0;
	let meets_time_threshold = false;
	let meets_distance_threshold = false;

	let x_offset = 0,
		y_offset = 0;

	let initial_x = 0,
		initial_y = 0;

	const proposals: { x: number | null; y: number | null } = { x: 0, y: 0 };
	let current_drag_hook_cancelled = false;
	let delta: { x: number; y: number } = { x: 0, y: 0 };

	let cached_root_node_rect = node.getBoundingClientRect();
	let currently_dragged_element = node;

	const effects_to_run = new Set<() => void>();

	const ctx: PluginContext = {
		get proposed() {
			return { x: proposals.x, y: proposals.y };
		},
		get delta() {
			return { x: delta.x, y: delta.y };
		},
		get offset() {
			return { x: x_offset, y: y_offset };
		},
		get isDragging() {
			return is_dragging;
		},
		get isInteracting() {
			return is_interacting;
		},
		get rootNode() {
			return node;
		},
		get cachedRootNodeRect() {
			return cached_root_node_rect;
		},
		set cachedRootNodeRect(val) {
			cached_root_node_rect = val;
		},
		get currentlyDraggedNode() {
			return currently_dragged_element;
		},
		set currentlyDraggedNode(val) {
			currently_dragged_element = val;
		},
		effect: (func) => {
			effects_to_run.add(func);
		},
		propose: (proposed) => {
			proposals.x = proposed.x;
			proposals.y = proposed.y;
		},
		cancel() {
			current_drag_hook_cancelled = true;
		},
	};

	// For finding duplicates
	const plugin_map = new Map<string, Plugin<any>>();
	for (const plugin of [...default_plugins, ...user_plugins]) {
		const existing_plugin = plugin_map.get(plugin.name);
		if (!existing_plugin || (plugin.priority ?? 0) > (existing_plugin.priority ?? 0)) {
			plugin_map.set(plugin.name, plugin);
		}
	}

	const ordered_plugins = [...plugin_map.values()].sort(
		(a, b) => (a.priority ?? 0) - (b.priority ?? 0),
	);

	const private_states = new Map<string, any>();
	for (const plugin of default_plugins.concat(user_plugins)) {
		// Initialize private state
		const maybe_state = plugin.setup?.(ctx);
		if (maybe_state) private_states.set(plugin.name, maybe_state);
	}

	// Run own setup
	// On mobile, touch can become extremely janky without it
	set_style(node, 'touch-action', 'none');

	function flush_effects() {
		for (const effect of effects_to_run) {
			effect();
		}
		effects_to_run.clear();
	}

	function clear_effects() {
		effects_to_run.clear();
	}

	function run_plugins(hook: 'dragStart' | 'drag' | 'dragEnd' | 'shouldDrag', event: PointerEvent) {
		let should_run = true;

		for (const plugin of ordered_plugins) {
			const handler = plugin[hook];
			if (!handler) continue;

			const result = handler(ctx, private_states.get(plugin.name), event);

			if (result === false) {
				should_run = false;
				break;
			}

			// Check if it was cancelled
			if (current_drag_hook_cancelled) {
				should_run = false;

				// Reset it back to what false
				current_drag_hook_cancelled = false;
				break;
			}
		}

		// TODO: This creates memory again and again in the loop. Hoist these to top-level variables
		return should_run;
	}

	function calculate_inverse_scale() {
		// Calculate the current scale of the node
		let inverse_scale = node.offsetWidth / ctx.cachedRootNodeRect.width;
		if (isNaN(inverse_scale)) inverse_scale = 1;
		return inverse_scale;
	}

	function reset_state() {
		is_dragging = false;
		meets_time_threshold = false;
		meets_distance_threshold = false;
		clear_effects();
	}

	function get_event_data(transform_x: number, transform_y: number) {
		return {
			offsetX: transform_x,
			offsetY: transform_y,
			rootNode: node,
			currentNode: node,
		};
	}

	function call_event(
		eventName: 'neodrag_start' | 'neodrag' | 'neodrag_end',
		fn: typeof onDrag,
		transform_x: number,
		transform_y: number,
	) {
		const data = get_event_data(transform_x, transform_y);
		node.dispatchEvent(new CustomEvent(eventName, { detail: data }));
		fn?.(data);
	}

	function fire_svelte_drag_start_event(transform_x: number, transform_y: number) {
		call_event('neodrag_start', onDragStart, transform_x, transform_y);
	}

	function fire_svelte_drag_end_event(transform_x: number, transform_y: number) {
		call_event('neodrag_end', onDragEnd, transform_x, transform_y);
	}

	function fire_svelte_drag_event(transform_x: number, transform_y: number) {
		call_event('neodrag', onDrag, transform_x, transform_y);
	}

	function try_start_drag(e: PointerEvent) {
		// We now meet all the threshold conditions
		if (
			is_interacting &&
			!is_dragging &&
			meets_distance_threshold &&
			meets_time_threshold &&
			currently_dragged_element
		) {
			delta = { x: 0, y: 0 };

			const should_start_drag = run_plugins('dragStart', e);

			if (!should_start_drag) return clear_effects();

			// Everything worked well. Flush the effects
			flush_effects();

			is_dragging = true;

			fire_svelte_drag_start_event(initial_x, initial_y);

			// if (applyUserSelectHack) {
			// 	// Apply user-select: none on body to prevent misbehavior
			// 	body_original_user_select_val = body_style.userSelect;
			// 	body_style.userSelect = 'none';
			// }
		}
	}

	const listen = window.addEventListener;
	const controller = new AbortController();
	const event_options = { signal: controller.signal, capture: false };

	// Contrary to what you might believe, this doesn't actually start dragging. This sets up the premise for drag
	// Actual dragging is begun by the `try_start_drag` function
	listen(
		'pointerdown',
		(e: PointerEvent) => {
			if (e.button === 2) return;

			// Run the plugins
			const should_drag = run_plugins('shouldDrag', e);

			// Some plugin blocked dragStart, dont drag at all
			// Also, should_drag doesn't take any effect callbacks, so no need to flush to clear
			if (should_drag === false) return;

			if (!ctx.currentlyDraggedNode.contains(e.target as Node)) return;

			is_interacting = true;
			start_time = Date.now();

			// TODO: Investigate whether this can be turned into a plugin or not
			if (!threshold.delay) {
				meets_time_threshold = true;
			}

			// We will run this by default in the drag_start plugin. But not in any other, the user will have to
			// run it in their own plugin
			ctx.cachedRootNodeRect = node.getBoundingClientRect();

			const inverse_scale = calculate_inverse_scale();

			// Some plugin like axis might not allow dragging in one direction
			if (proposals.x != null) initial_x = e.clientX - x_offset / inverse_scale;
			if (proposals.y != null) initial_y = e.clientY - y_offset / inverse_scale;

			// This should be in the axis plugin, included by default
			// state.initial.x = e.clientX - state.x / inverse_scale;
			// state.initial.y = e.clientY - state.y / inverse_scale;
		},
		event_options,
	);

	listen(
		'pointermove',
		(e: PointerEvent) => {
			if (!is_interacting) return;

			if (!is_dragging) {
				// Time threshold
				if (!meets_time_threshold) {
					const elapsed = Date.now() - start_time;
					if (elapsed >= threshold.delay!) {
						meets_time_threshold = true;
						try_start_drag(e);
					}
				}

				// Distance threshold
				if (!meets_distance_threshold) {
					const delta_x = e.clientX - initial_x;
					const delta_y = e.clientY - initial_y;
					const distance = delta_x ** 2 + delta_y ** 2;

					// We were doing Math.sqrt here but that is slower than just comparing the square of the distance
					if (distance >= threshold.distance! ** 2) {
						meets_distance_threshold = true;
						try_start_drag(e);
					}
				}

				if (!is_dragging) return;
			}

			//if (recomputeBounds.drag) computed_bounds = compute_bound_rect(bounds, node);
			e.preventDefault();

			delta = {
				x: e.clientX - initial_x - x_offset,
				y: e.clientY - initial_y - y_offset,
			};

			// Core proposes delta
			proposals.x = delta.x;
			proposals.y = delta.y;

			// Run the plugins
			const run_result = run_plugins('drag', e);

			if (run_result) flush_effects();
			else return clear_effects();

			// Whatever offset we have had till now since the draggable() was mounted, add proposals to it, as long as they're not null
			const final = {
				x: x_offset + (proposals.x ?? 0),
				y: y_offset + (proposals.y ?? 0),
			};

			fire_svelte_drag_event(final.x, final.y);

			x_offset = final.x;
			y_offset = final.y;
		},
		event_options,
	);

	listen(
		'pointerup',
		(e: PointerEvent) => {
			if (!is_interacting) return;

			if (is_dragging) {
				// Listen for click handler and cancel it
				listen('click', (e) => e.stopPropagation(), {
					once: true,
					signal: controller.signal,
					capture: true,
				});
			}

			// Call the dragEnd hooks
			run_plugins('dragEnd', e);

			if (proposals.x) initial_x = x_offset;
			if (proposals.y) initial_y = y_offset;

			proposals.x = 0;
			proposals.y = 0;

			fire_svelte_drag_end_event(initial_x, initial_y);

			is_interacting = false;

			reset_state();
		},
		event_options,
	);

	return {
		destroy() {
			for (const plugin of ordered_plugins) {
				plugin.cleanup?.();
			}

			private_states.clear();

			controller.abort();
		},
	};
}

const definePlugin = <T>(plugin: (...args: any[]) => Plugin<T>) => plugin;

const set_style = (el: HTMLElement, style: string, value: string) =>
	el.style.setProperty(style, value);

export const ignoreMultitouch = definePlugin((value = true) => {
	return {
		name: 'neodrag:ignoreMultitouch',

		setup() {
			return {
				active_pointers: new Set<number>(),
			};
		},

		dragStart(ctx, state, event) {
			ctx.effect(() => {
				state.active_pointers.add(event.pointerId);

				if (value && state.active_pointers.size > 1) {
					event.preventDefault();
				}
			});
		},

		drag(ctx, state) {
			if (value && state.active_pointers.size > 1) {
				ctx.cancel();
			}
		},

		dragEnd(_, state, event) {
			state.active_pointers.delete(event.pointerId);
		},
	};
});

const enum DEFAULT_CLASS {
	DEFAULT = 'neodrag',
	DRAGGING = 'neodrag-dragging',
	DRAGGED = 'neodrag-dragged',
}
export const classes = definePlugin((classes) => {
	return {
		name: 'neodrag:classes',

		setup(ctx) {
			classes = classes ?? {};
			classes.default ??= DEFAULT_CLASS.DEFAULT;
			classes.dragging ??= DEFAULT_CLASS.DRAGGING;
			classes.dragged ??= DEFAULT_CLASS.DRAGGED;

			if (classes.default) ctx.rootNode.classList.add(classes.default);
		},

		dragStart(ctx) {
			ctx.effect(() => {
				ctx.rootNode.classList.add(classes.dragging);
			});
		},

		dragEnd(ctx) {
			ctx.rootNode.classList.remove(classes.dragging);
			ctx.rootNode.classList.add(classes.dragged);
		},
	};
});

// Degree of Freedom X and Y
export const axis = definePlugin((value: 'both' | 'x' | 'y' | 'none' = 'both') => {
	return {
		name: 'neodrag:axis',

		shouldDrag() {
			return value !== 'none';
		},

		setup() {
			return {
				df: {
					x: value === 'both' || value === 'x',
					y: value === 'both' || value === 'y',
				},
			};
		},

		drag(ctx, state) {
			ctx.propose({
				x: state.df.x ? ctx.proposed.x : null,
				y: state.df.y ? ctx.proposed.y : null,
			});
		},
	};
});

export const applyUserSelectHack = definePlugin((value: boolean = true) => {
	return {
		name: 'neodrag:applyUserSelectHack',

		setup() {
			return {
				body_user_select_val: '',
			};
		},

		dragStart(ctx, state) {
			ctx.effect(() => {
				if (value) {
					state.body_user_select_val = document.body.style.userSelect;
					document.body.style.userSelect = 'none';
				}
			});
		},

		dragEnd(_, state) {
			if (value) {
				document.body.style.userSelect = state.body_user_select_val;
			}
		},
	};
});

function snap_to_grid(
	[x_snap, y_snap]: [number, number],
	pending_x: number | null,
	pending_y: number | null,
) {
	const calc = (val: number, snap: number) => (snap === 0 ? 0 : Math.ceil(val / snap) * snap);

	const x = pending_x ? calc(pending_x, x_snap) : pending_x;
	const y = pending_y ? calc(pending_y, y_snap) : pending_y;

	return { x, y };
}
export const grid = definePlugin((x: number, y: number) => {
	return {
		name: 'neodrag:grid',

		drag(ctx) {
			ctx.propose(snap_to_grid([x, y], ctx.proposed.x!, ctx.proposed.y!));
		},
	};
});

export const disabled = definePlugin(() => {
	return {
		name: 'neodrag:disabled',
		shouldDrag() {
			return false;
		},
	};
});

export const transform = definePlugin(
	(func?: (args: { offsetX: number; offsetY: number; rootNode: HTMLElement }) => void) => {
		return {
			name: 'neodrag:transform',

			drag(ctx) {
				// Apply the transform
				ctx.effect(() => {
					if (func) {
						return func({
							offsetX: ctx.offset.x!,
							offsetY: ctx.offset.y!,
							rootNode: ctx.rootNode,
						});
					}

					ctx.rootNode.style.translate = `${ctx.offset.x}px ${ctx.offset.y}px`;
				});
			},
		};
	},
);

type BoundFromFunction = (data: {
	root_node: HTMLElement;
}) => [[x1: number, y1: number], [x2: number, y2: number]];

export const BoundsFrom = {
	element(
		element: HTMLElement,
		padding?: { top?: number; left?: number; right?: number; bottom?: number },
	): BoundFromFunction {
		return () => {
			const rect = element.getBoundingClientRect();

			if (rect.left === 0 && rect.right === 0 && rect.top === 0 && rect.bottom === 0) {
				throw new Error(
					'bounds element has no dimensions. This may happen due to display:contents',
				);
			}

			return [
				[rect.left + (padding?.left ?? 0), rect.top + (padding?.top ?? 0)],
				[rect.right - (padding?.right ?? 0), rect.bottom - (padding?.bottom ?? 0)],
			];
		};
	},

	parent(padding?: {
		top?: number;
		left?: number;
		right?: number;
		bottom?: number;
	}): BoundFromFunction {
		return (ctx) => BoundsFrom.element(ctx.root_node.parentNode as HTMLElement, padding)(ctx);
	},
};

const clamp = (val: number, min: number, max: number) => Math.min(max, Math.max(min, val));
export const bounds = definePlugin(
	(
		value: BoundFromFunction,
		shouldRecompute: (ctx: { readonly hook: 'dragStart' | 'drag' | 'dragEnd' }) => boolean = (
			ctx,
		) => ctx.hook === 'dragStart',
	) => {
		return {
			name: 'neodrag:bounds',

			setup(ctx) {
				return {
					bounds: value({ root_node: ctx.rootNode }),
				};
			},

			dragStart(ctx, state) {
				if (shouldRecompute({ hook: 'dragStart' })) {
					state.bounds = value({ root_node: ctx.rootNode });
				}
			},

			drag(ctx, state) {
				if (shouldRecompute({ hook: 'drag' })) {
					state.bounds = value({ root_node: ctx.rootNode });
				}

				const bound_coords = state.bounds;
				const element_width = ctx.cachedRootNodeRect.width;
				const element_height = ctx.cachedRootNodeRect.height;

				// Convert absolute bounds to allowed movement bounds
				// Need to consider:
				// 1. Current accumulated offset (ctx.offset)
				// 2. Where user grabbed the element (pointer_offset)
				// 3. Element dimensions
				const allowed_movement: [[number, number], [number, number]] = [
					[
						bound_coords[0][0] - ctx.offset.x, // max left
						bound_coords[0][1] - ctx.offset.y, // max top
					],
					[
						bound_coords[1][0] - element_width - ctx.offset.x, // max right
						bound_coords[1][1] - element_height - ctx.offset.y, // max bottom
					],
				];

				// Now clamp the proposed delta movement to our allowed movement bounds
				ctx.propose({
					x:
						ctx.proposed.x != null
							? clamp(ctx.proposed.x, allowed_movement[0][0], allowed_movement[1][0])
							: ctx.proposed.x,
					y:
						ctx.proposed.y != null
							? clamp(ctx.proposed.y, allowed_movement[0][1], allowed_movement[1][1])
							: ctx.proposed.y,
				});
			},

			dragEnd(context, state) {
				if (shouldRecompute({ hook: 'dragEnd' })) {
					state.bounds = value({ root_node: context.rootNode });
				}
			},
		};
	},
);