import { createDraggable } from '@neodrag/core';
import { unstable_definePlugin, type Plugin } from '@neodrag/core/plugins';
import { createEffect, createMemo, createSignal, onCleanup } from 'solid-js';

const draggable_factory = createDraggable();

interface Offset {
	x: number;
	y: number;
}

interface DraggableSignals {
	offset: () => Offset;
	rootNode: () => HTMLElement | SVGElement;
	currentNode: () => HTMLElement | SVGElement;
	isDragging: () => boolean;
}

// State sync plugin factory
const state_sync = unstable_definePlugin<
	[
		{
			setOffset: (offset: Offset) => void;
			setRootNode: (node: HTMLElement | SVGElement) => void;
			setCurrentNode: (node: HTMLElement | SVGElement) => void;
			setIsDragging: (dragging: boolean) => void;
		},
	]
>({
	name: 'solid-state-sync',
	priority: -1000,
	cancelable: false,

	start: ([setters], ctx) => {
		ctx.effect.immediate(() => {
			setters.setIsDragging(true);
			setters.setOffset({ x: ctx.offset.x, y: ctx.offset.y });
			setters.setRootNode(ctx.rootNode);
			setters.setCurrentNode(ctx.currentlyDraggedNode);
		});
	},

	drag: ([setters], ctx) => {
		ctx.effect.immediate(() => {
			setters.setOffset({ x: ctx.offset.x, y: ctx.offset.y });
			setters.setRootNode(ctx.rootNode);
			setters.setCurrentNode(ctx.currentlyDraggedNode);
		});
	},

	end: ([setters], ctx) => {
		ctx.effect.immediate(() => {
			setters.setIsDragging(false);
			setters.setOffset({ x: ctx.offset.x, y: ctx.offset.y });
			setters.setRootNode(ctx.rootNode);
			setters.setCurrentNode(ctx.currentlyDraggedNode);
		});
	},
});

export function wrapper(draggableFactory: ReturnType<typeof createDraggable>) {
	return (
		ref: () => HTMLElement | SVGElement | null,
		pluginFactories: (() => Plugin)[],
	): DraggableSignals => {
		const [offset, setOffset] = createSignal<Offset>({ x: 0, y: 0 });
		const [rootNode, setRootNode] = createSignal<HTMLElement | SVGElement>(
			null as unknown as HTMLElement,
		);
		const [currentNode, setCurrentNode] = createSignal<HTMLElement | SVGElement>(
			null as unknown as HTMLElement,
		);
		const [isDragging, setIsDragging] = createSignal(false);

		let instance: ReturnType<typeof draggableFactory.draggable> | undefined;

		const setters = {
			setOffset,
			setRootNode,
			setCurrentNode,
			setIsDragging,
		};

		const statePlugin = state_sync(setters);

		// Create plugins array - each factory function is wrapped in a memo
		const plugins = createMemo(() => pluginFactories.map((factory) => factory()));

		// Initialize draggable instance and handle updates
		createEffect(() => {
			const node = ref();
			if (!node) return;

			const allPlugins = [...plugins(), statePlugin];

			if (!instance) {
				instance = draggableFactory.draggable(node, allPlugins);
				onCleanup(() => instance?.destroy());
			} else {
				instance.update(allPlugins);
			}
		});

		return {
			offset,
			rootNode,
			currentNode,
			isDragging,
		};
	};
}

export const useDraggable = wrapper(draggable_factory);
export * from '@neodrag/core/plugins';
export const instances = draggable_factory.instances;
