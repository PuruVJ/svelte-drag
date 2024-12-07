import { draggable, type DragOptions } from '@neodrag/core';

export class Draggable {
	#instance: ReturnType<typeof draggable>;
	#raw_options: DragOptions = {};

	constructor(node: HTMLElement, options: DragOptions = {}) {
		this.#instance = draggable(node, (this.#raw_options = options));
	}

	/**
	 * Options Proxy Creator
	 */
	#create_proxy = (options: DragOptions) => {
		return new Proxy(options, {
			set: (target, property, value) => {
				Reflect.set(target, property, value);
				this.#instance?.update(this.#raw_options); // Update confetti instance when options change
				return true;
			},
		});
	};

	/** @deprecated Directly set individual options via `dragInstance.options.grid = [1, 3]`. Will be removed in v3 */
	updateOptions(options: DragOptions) {
		this.#instance.update(Object.assign(this.#raw_options, options));
	}

	get options() {
		return this.#create_proxy(this.#raw_options); // Initialize options with a proxy
	}

	get optionsJSON() {
		return JSON.parse(JSON.stringify(this.#raw_options));
	}

	set options(value: DragOptions) {
		this.#instance?.update((this.#raw_options = value)); // Update confetti instance on setting new options
	}

	destroy() {
		this.#instance.destroy();
	}
}

export type {
	DragAxis,
	DragBounds,
	DragBoundsCoords,
	DragEventData,
	DragOptions,
} from '@neodrag/core';
