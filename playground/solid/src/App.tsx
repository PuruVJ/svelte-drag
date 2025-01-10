import { createDraggable } from '@neodrag/solid';
import { Component, createSignal } from 'solid-js';

const App: Component = () => {
	const { draggable } = createDraggable();

	const [position, setPosition] = createSignal({ x: 0, y: 0 });

	return (
		<>
			<div
				use:draggable={{
					position: position(),
					onDrag: ({ offsetX, offsetY }) => setPosition({ x: offsetX, y: offsetY }),
				}}
			>
				I can be moved with the slider too
			</div>
			X:
			<input
				type="range"
				min="0"
				max="300"
				value={position().x}
				onInput={(e) => setPosition({ x: +e.target.value, y: position().y })}
			/>
			Y:
			<input
				type="range"
				min="0"
				max="300"
				value={position().y}
				onInput={(e) => setPosition({ x: position().x, y: +e.target.value })}
			/>
		</>
	);
};

export default App;
