const Draggable = NeoDrag.Draggable

const draggableEl = document.querySelector('.box');
const xSlider = document.querySelector('#x');
const ySlider = document.querySelector('#y');

let position = { x: 0, y: 0 };

const dragInstance = new Draggable(draggableEl, {
	position,
	onDrag: ({ offsetX, offsetY }) => {
		position = { x: offsetX, y: offsetY };

		xSlider.value = offsetX.toString();
		ySlider.value = offsetY.toString();
	},
});

xSlider.addEventListener('input', (e) => {
	position.x = +e.target.value;
	dragInstance.updateOptions({ position });
});

ySlider.addEventListener('input', (e) => {
	position.y = +e.target.value;
	dragInstance.updateOptions({ position });
});
