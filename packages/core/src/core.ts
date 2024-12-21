import type { Plugin, PluginContext } from './plugins.ts';
import { is_svg_element, is_svg_svg_element, listen } from './utils.ts';

type DeepMutable<T> = T extends object
	? {
			-readonly [P in keyof T]: T[P] extends readonly any[]
				? DeepMutable<T[P]>
				: T[P] extends object
				? keyof T[P] extends never
					? T[P]
					: DeepMutable<T[P]>
				: T[P];
	  }
	: T;

export interface ErrorInfo {
	phase: 'setup' | 'dragStart' | 'drag' | 'dragEnd' | 'shouldDrag';
	plugin?: {
		name: string;
		hook: string;
	};
	node: HTMLElement | SVGElement;
	error: unknown;
}

export interface DraggableInstance {
	ctx: DeepMutable<PluginContext>;
	root_node: HTMLElement | SVGElement;
	plugins: Plugin[];
	states: Map<string, any>;
	dragstart_prevented: boolean;
	current_drag_hook_cancelled: boolean;
	pointer_captured_id: number | null;
	effects: Set<() => void>;
	controller: AbortController;
}

type Result<T> = { ok: true; value: T } | { ok: false; error: unknown };

export function createDraggable({
	plugins: initial_plugins = [],
	delegate: delegateTargetFn = () => document.body,
	onError,
}: {
	plugins?: Plugin[];
	delegate?: () => HTMLElement;
	onError?: (error: ErrorInfo) => void;
} = {}) {
	const instances = new WeakMap<HTMLElement | SVGElement, DraggableInstance>();
	let listeners_initialized = false;
	let active_node: HTMLElement | SVGElement | null = null;

	function resultify<T>(fn: () => T, errorInfo: Omit<ErrorInfo, 'error'>): Result<T> {
		try {
			return { ok: true, value: fn() };
		} catch (error) {
			report_error(errorInfo, error);
			return { ok: false, error };
		}
	}

	function report_error(info: Omit<ErrorInfo, 'error'>, error: unknown) {
		if (onError) {
			onError({ ...info, error });
		}
	}

	function initialize_listeners() {
		if (listeners_initialized) return;

		const delegateTarget = delegateTargetFn();

		listen(delegateTarget, 'pointerdown', handle_pointer_down, {
			passive: true,
			capture: false,
		});
		listen(delegateTarget, 'pointermove', handle_pointer_move, {
			passive: false,
			capture: false,
		});
		listen(delegateTarget, 'pointerup', handle_pointer_up, {
			passive: true,
			capture: false,
		});

		listeners_initialized = true;
	}

	function run_plugins(instance: DraggableInstance, hook: ErrorInfo['phase'], event: PointerEvent) {
		let should_run = true;
		instance.dragstart_prevented = false;

		for (const plugin of instance.plugins) {
			const handler = plugin[hook];
			if (!handler) continue;

			if (instance.current_drag_hook_cancelled && plugin.cancelable !== false) continue;

			const result = resultify(
				() => handler(instance.ctx, instance.states.get(plugin.name), event),
				{
					phase: hook,
					plugin: { name: plugin.name, hook },
					node: instance.ctx.rootNode,
				},
			);

			if (!result.ok || result.value === false) {
				should_run = false;
				break;
			}
		}

		return should_run;
	}

	function flush_effects(instance: DraggableInstance) {
		for (const effect of instance.effects) {
			effect();
		}
		clear_effects(instance);
	}

	function clear_effects(instance: DraggableInstance) {
		instance.effects.clear();
	}

	function cleanup_active_node() {
		// If no node is currently being dragged, nothing to clean up
		if (!active_node) return;

		// Get the instance associated with the active node
		const instance = instances.get(active_node);
		if (!instance) return;

		// If we have captured pointer events, release them
		if (
			instance.pointer_captured_id &&
			instance.ctx.currentlyDraggedNode.hasPointerCapture(instance.pointer_captured_id)
		) {
			resultify(
				() => {
					// Release the pointer capture we set earlier
					instance.ctx.currentlyDraggedNode.releasePointerCapture(instance.pointer_captured_id!);
				},
				{
					phase: 'dragEnd',
					node: active_node,
				},
			);
		}

		// Reset all the drag state
		instance.ctx.isInteracting = false; // No longer interacting with element
		instance.ctx.isDragging = false; // No longer dragging
		instance.dragstart_prevented = false; // Reset prevention flag
		instance.pointer_captured_id = null; // Clear pointer ID
		active_node = null; // Clear active node reference
		clear_effects(instance); // Clear any pending effects
	}

	function handle_pointer_down(e: PointerEvent) {
		if (e.button === 2) return;

		// Find the draggable node that contains the target
		const draggable_node = find_draggable_node(e);

		if (!draggable_node) return;

		const instance = instances.get(draggable_node)!;
		instance.ctx.cachedRootNodeRect = draggable_node.getBoundingClientRect();

		const should_drag = run_plugins(instance, 'shouldDrag', e);
		if (!should_drag) return;

		instance.ctx.isInteracting = true;
		active_node = draggable_node;

		const capture_result = resultify(
			() => {
				instance.pointer_captured_id = e.pointerId;
				instance.ctx.currentlyDraggedNode.setPointerCapture(instance.pointer_captured_id);
			},
			{
				phase: 'dragStart',
				node: instance.ctx.currentlyDraggedNode,
			},
		);

		if (!capture_result.ok) {
			cleanup_active_node();
			return;
		}

		// Modify this if draggable_node is SVG
		// Calculate scale differently for SVG vs HTML
		let inverse_scale = 1;
		if (draggable_node instanceof SVGElement) {
			// For SVG elements, use the bounding box for scale
			const bbox = (draggable_node as SVGGraphicsElement).getBBox();
			const rect = instance.ctx.cachedRootNodeRect;
			// Only calculate scale if we have valid dimensions
			if (bbox.width && rect.width) {
				inverse_scale = bbox.width / rect.width;
			}
		} else {
			// For HTML elements, use the original calculation
			inverse_scale = draggable_node.offsetWidth / instance.ctx.cachedRootNodeRect.width;
		}

		if (instance.ctx.proposed.x != null) {
			instance.ctx.initial.x = e.clientX - instance.ctx.offset.x / inverse_scale;
		}
		if (instance.ctx.proposed.y != null) {
			instance.ctx.initial.y = e.clientY - instance.ctx.offset.y / inverse_scale;
		}
	}

	function handle_pointer_move(e: PointerEvent) {
		if (!active_node) return;

		const instance = instances.get(active_node)!;
		if (!instance.ctx.isInteracting) return;

		instance.ctx.lastEvent = e;

		if (!instance.ctx.isDragging) {
			instance.dragstart_prevented = false;
			run_plugins(instance, 'drag', e);

			if (!instance.dragstart_prevented && !instance.current_drag_hook_cancelled) {
				const start_drag = run_plugins(instance, 'dragStart', e);
				if (!start_drag) return clear_effects(instance);
				else flush_effects(instance);

				instance.ctx.isDragging = true;
			}

			if (!instance.ctx.isDragging) return;
		}

		e.preventDefault();

		instance.ctx.delta.x = e.clientX - instance.ctx.initial.x - instance.ctx.offset.x;
		instance.ctx.delta.y = e.clientY - instance.ctx.initial.y - instance.ctx.offset.y;

		// Core proposes delta
		instance.ctx.proposed.x = instance.ctx.delta.x;
		instance.ctx.proposed.y = instance.ctx.delta.y;

		// Run the plugins
		const run_result = run_plugins(instance, 'drag', e);

		if (run_result) flush_effects(instance);
		else return clear_effects(instance);

		// Whatever offset we have had till now since the draggable() was mounted, add proposals to it, as long as they're not null
		instance.ctx.offset.x += instance.ctx.proposed.x ?? 0;
		instance.ctx.offset.y += instance.ctx.proposed.y ?? 0;
	}

	function handle_pointer_up(e: PointerEvent) {
		if (!active_node) return;

		const instance = instances.get(active_node)!;
		if (!instance.ctx.isInteracting) return;

		if (instance.ctx.isDragging) {
			listen(active_node as HTMLElement, 'click', (e) => e.stopPropagation(), {
				once: true,
				signal: instance.controller.signal,
				capture: true,
			});
		}

		if (
			instance.pointer_captured_id &&
			instance.ctx.currentlyDraggedNode.hasPointerCapture(instance.pointer_captured_id)
		) {
			instance.ctx.currentlyDraggedNode.releasePointerCapture(instance.pointer_captured_id);
		}

		// Call the dragEnd hooks
		run_plugins(instance, 'dragEnd', e);
		flush_effects(instance);

		if (instance.ctx.proposed.x) instance.ctx.initial.x = instance.ctx.offset.x;
		if (instance.ctx.proposed.y) instance.ctx.initial.y = instance.ctx.offset.y;

		instance.ctx.proposed.x = 0;
		instance.ctx.proposed.y = 0;
		instance.ctx.isInteracting = false;
		instance.ctx.isDragging = false;
		instance.dragstart_prevented = false;
		instance.pointer_captured_id = null;
		clear_effects(instance);
	}

	function find_draggable_node(e: PointerEvent): HTMLElement | SVGElement | null {
		// composedPath() gives us the event path in the DOM from target up to window
		const path = e.composedPath();
		// Find first element in path that's a draggable
		for (const el of path) {
			if (
				(el instanceof HTMLElement || (is_svg_element(el) && !is_svg_svg_element(el))) &&
				instances.has(el)
			) {
				return el;
			}
		}
		return null;
	}

	function initialize_plugins(new_plugins: Plugin[]) {
		// Initialize plugins
		const plugin_map = new Map<string, Plugin<any>>();
		for (const plugin of [...new_plugins, ...initial_plugins]) {
			const existing_plugin = plugin_map.get(plugin.name);
			if (!existing_plugin || (plugin.priority ?? 0) >= (existing_plugin.priority ?? 0)) {
				plugin_map.set(plugin.name, plugin);
			}
		}

		return [...plugin_map.values()].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
	}

	function update_plugin(
		instance: DraggableInstance,
		old_plugin: Plugin | undefined,
		new_plugin: Plugin,
	) {
		// Skip if same instance and not live-updateable
		if (old_plugin === new_plugin && !new_plugin.liveUpdate) {
			return false;
		}

		// Clean up old instance if different
		if (old_plugin && old_plugin !== new_plugin) {
			old_plugin.cleanup?.(instance.ctx, instance.states.get(old_plugin.name));
			instance.states.delete(old_plugin.name);
		}

		// Setup new plugin
		const state = new_plugin.setup?.(instance.ctx);
		flush_effects(instance);
		if (state) instance.states.set(new_plugin.name, state);

		return true;
	}

	function update(instance: DraggableInstance, new_plugins: Plugin[] = []) {
		const old_plugin_map = new Map(instance.plugins.map((p) => [p.name, p]));
		const new_plugin_list = initialize_plugins(new_plugins);
		let has_changes = false;

		// During drag, only update plugins that opted into live updates
		if (instance.ctx.isDragging || instance.ctx.isInteracting) {
			const updated_plugins = new_plugin_list.filter((plugin) => plugin.liveUpdate);

			for (const plugin of updated_plugins) {
				const old_plugin = old_plugin_map.get(plugin.name);
				if (update_plugin(instance, old_plugin, plugin)) {
					has_changes = true;
				}
			}

			// If we made changes and we're the active node, re-run drag
			if (has_changes && active_node === instance.root_node && instance.ctx.lastEvent) {
				handle_pointer_move(instance.ctx.lastEvent);
			}

			return;
		}

		// Clean up removed plugins
		const removed_plugins = instance.plugins.filter(
			(p) => !new_plugin_list.some((np) => np.name === p.name),
		);

		for (const plugin of removed_plugins) {
			plugin.cleanup?.(instance.ctx, instance.states.get(plugin.name));
			instance.states.delete(plugin.name);
			has_changes = true;
		}

		// Update or setup new plugins
		for (const plugin of new_plugin_list) {
			const old_plugin = old_plugin_map.get(plugin.name);
			if (update_plugin(instance, old_plugin, plugin)) {
				has_changes = true;
			}
		}

		// Update instance plugins list if there were changes
		if (has_changes) {
			instance.plugins = new_plugin_list;
		}
	}

	return {
		instances,
		draggable: (node: HTMLElement | SVGElement, plugins: Plugin[] = []) => {
			initialize_listeners();

			const instance: DraggableInstance = {
				ctx: {} as DeepMutable<PluginContext>,
				root_node: node,
				plugins: [],
				states: new Map<string, any>(),
				controller: new AbortController(),
				dragstart_prevented: false,
				current_drag_hook_cancelled: false,
				pointer_captured_id: null,
				effects: new Set<() => void>(),
			};

			let currently_dragged_element = node;

			instance.ctx = {
				proposed: { x: 0, y: 0 },
				delta: { x: 0, y: 0 },
				offset: { x: 0, y: 0 },
				initial: { x: 0, y: 0 },
				isDragging: false,
				isInteracting: false,
				rootNode: node,
				cachedRootNodeRect: node.getBoundingClientRect(),
				lastEvent: null,
				get currentlyDraggedNode() {
					return currently_dragged_element;
				},
				set currentlyDraggedNode(val) {
					//  In case a plugin switches currentDraggedElement through the pointermove
					if (
						instance.pointer_captured_id &&
						currently_dragged_element.hasPointerCapture(instance.pointer_captured_id)
					) {
						currently_dragged_element.releasePointerCapture(instance.pointer_captured_id);
						val.setPointerCapture(instance.pointer_captured_id);
					}

					currently_dragged_element = val;
				},

				effect: (func) => {
					instance.effects.add(func);
				},

				propose: (proposed) => {
					instance.ctx.proposed.x = proposed.x;
					instance.ctx.proposed.y = proposed.y;
				},

				cancel() {
					instance.current_drag_hook_cancelled = true;
				},

				preventStart() {
					instance.dragstart_prevented = true;
				},
			};

			// Initial setup
			instance.plugins = initialize_plugins(plugins);
			for (const plugin of instance.plugins) {
				resultify(
					() => {
						const value = plugin.setup?.(instance.ctx);
						if (value) instance.states.set(plugin.name, value);
						flush_effects(instance);
					},
					{
						phase: 'setup',
						plugin: { name: plugin.name, hook: 'setup' },
						node: instance.root_node,
					},
				);
			}

			// Register instance
			instances.set(node, instance);

			return {
				update: () => update(instance),
				destroy() {
					if (active_node === node) {
						active_node = null;
					}

					for (const plugin of instance.plugins) {
						plugin.cleanup?.(instance.ctx, instance.states.get(plugin.name));
					}

					instances.delete(node);
				},
			};
		},
	};
}
