import { createDraggable } from '@neodrag/core';
import type { Plugin } from '@neodrag/core/plugins';
import type { Action } from 'svelte/action';

const { draggable: core, instances } = createDraggable();

export const draggable = core as Action<HTMLElement | SVGElement, Plugin[] | undefined>;
export * from '@neodrag/core/plugins';
export { instances };
