import { expect, test } from '@playwright/test';
import { get_mouse_position, setup } from './test-utils';

test.describe('defaults', () => {
	test('renders a basic div with default class', async ({ page }) => {
		await setup(page);

		const div = page.getByTestId('draggable');

		await expect(div).toHaveAttribute('data-neodrag-state', 'idle');
		await expect(div).toHaveAttribute('data-neodrag', '');
		await expect(div).toHaveCSS('translate', 'none');
	});

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

		expect(div).toHaveCSS('translate', '100px 100px');
	});

	test('should be dragged by touch', async ({ page, isMobile }) => {
		test.skip(!isMobile);

		await setup(page);

		const div = page.getByTestId('draggable');

		await div.hover();
		const { x, y } = await get_mouse_position(page);
		await page.mouse.down();
		await page.mouse.move(x + 100, y + 100);
		await expect(div).toHaveAttribute('data-neodrag-state', 'dragging');
		await page.mouse.up();

		// Make sure neodrag-dragging isn't there anymore
		await expect(div).toHaveAttribute('data-neodrag-state', 'idle');

		expect(div).toHaveCSS('translate', '100px 100px');
	});
});
