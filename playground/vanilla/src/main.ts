import './style.css';
import { Draggable } from '@neodrag/vanilla';

const draggableEl = document.querySelector<HTMLDivElement>('.box')!;
const xSlider = document.querySelector<HTMLInputElement>('#x')!;
const ySlider = document.querySelector<HTMLInputElement>('#y')!;

let position = { x: 0, y: 0 };

const dragInstance = new Draggable(draggableEl, {
	position,
	onDrag: ({ offsetX, offsetY }) => {
		position = { x: offsetX, y: offsetY };

		xSlider.value = offsetX.toString();
		ySlider.value = offsetY.toString();
	},
});

xSlider.addEventListener('input', (e: Event) => {
	position.x = +e.target.value;
	dragInstance.updateOptions({ position });
});

ySlider.addEventListener('input', (e: Event) => {
	position.y = +e.target.value;
	dragInstance.updateOptions({ position });
});
