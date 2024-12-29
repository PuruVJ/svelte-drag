import test, { expect } from '@playwright/test';
import { get_mouse_position, setup } from '../test-utils';

test.describe('stateMarker', () => {
	test('should be dragged by mouse', async ({ page, isMobile }) => {
		test.skip(isMobile);

		await setup(page);

		const div = page.getByTestId('draggable');

		await div.hover();
		const { x, y } = await get_mouse_position(page);
		await page.mouse.down();
		await page.mouse.move(x + 100, y + 100);
		await expect(div).toHaveAttribute('data-neodrag-state', 'dragging');
		await page.mouse.up();

		await expect(div).toHaveAttribute('data-neodrag-state', 'idle');
	});
});