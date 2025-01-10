import { createDraggable } from '@neodrag/core';
import { DragEventData, unstable_definePlugin, type Plugin } from '@neodrag/core/plugins';
import { useEffect, useMemo, useRef, useState } from 'react';

const draggable_factory = createDraggable();

interface DragState extends DragEventData {
	isDragging: boolean;
}

const default_drag_state: DragState = {
	offset: { x: 0, y: 0 },
	rootNode: null as unknown as HTMLElement,
	currentNode: null as unknown as HTMLElement,
	isDragging: false,
};

// Create the state sync plugin with the provided setState function
const state_sync = unstable_definePlugin<
	[setDragState: React.Dispatch<React.SetStateAction<DragState>>]
>({
	name: 'react-state-sync',
	priority: -1000, // Run last to ensure we get final values
	cancelable: false,

	start: ([setDragState], ctx) => {
		ctx.effect.immediate(() => {
			setDragState((prev) => ({
				...prev,
				isDragging: true,
				offset: { ...ctx.offset },
				rootNode: ctx.rootNode,
				currentNode: ctx.currentlyDraggedNode,
			}));
		});
	},

	drag: ([setDragState], ctx) => {
		ctx.effect.immediate(() => {
			setDragState((prev) => ({
				...prev,
				offset: { ...ctx.offset },
				rootNode: ctx.rootNode,
				currentNode: ctx.currentlyDraggedNode,
			}));
		});
	},

	end: ([setDragState], ctx) => {
		ctx.effect.immediate(() => {
			setDragState((prev) => ({
				...prev,
				isDragging: false,
				offset: { ...ctx.offset },
				rootNode: ctx.rootNode,
				currentNode: ctx.currentlyDraggedNode,
			}));
		});
	},
});

export function wrapper(draggableFactory: ReturnType<typeof createDraggable>) {
	return (ref: React.RefObject<HTMLElement | SVGElement | null>, plugins: Plugin[] = []) => {
		const [drag_state, set_drag_state] = useState<DragState>(default_drag_state);
		const instance = useRef<ReturnType<typeof draggableFactory.draggable>>();
		const state_sync_ref = useRef(state_sync(set_drag_state));
		const pluginsRef = useRef(plugins.concat(state_sync_ref.current));
		const is_first_run = useRef(true);

		// Initialize draggable instance
		useEffect(() => {
			const node = ref.current;
			if (!node) return;

			instance.current = draggableFactory.draggable(node, pluginsRef.current);

			return () => instance.current?.destroy();
		}, []); // Changed dependency

		// Handle plugin updates
		useEffect(() => {
			if (is_first_run.current) {
				is_first_run.current = false;
				return;
			}

			if (!instance.current) return;

			pluginsRef.current = plugins.concat(state_sync_ref.current);
			instance.current.update(pluginsRef.current);
		}, [plugins]); // Changed dependency

		return drag_state;
	};
}

export const useDraggable = wrapper(draggable_factory);
export * from '@neodrag/core/plugins';
export const instances = draggable_factory.instances;
