import test, { expect } from '@playwright/test';
import { get_mouse_position, setup } from '../test-utils';
import { SCHEMAS } from '../../src/lib/schemas';

test('move only on x-axis', async ({ page }) => {
	await setup(page, 'plugins/axis', SCHEMAS.PLUGINS.AXIS, 'x');

	const div = page.getByTestId('draggable');

	await div.hover();
	const { x, y } = await get_mouse_position(page);
	await page.mouse.down();
	await page.mouse.move(x + 100, y + 100);
	await page.mouse.up();

	// Only X should have changed
	await expect(div).toHaveCSS('translate', '100px');
});

test('move only on y-axis', async ({ page }) => {
	await setup(page, 'plugins/axis', SCHEMAS.PLUGINS.AXIS, 'y');

	const div = page.getByTestId('draggable');

	await div.hover();
	const { x, y } = await get_mouse_position(page);
	await page.mouse.down();
	await page.mouse.move(x + 100, y + 100);
	await page.mouse.up();

	// Only X should have changed
	await expect(div).toHaveCSS('translate', '0px 100px');
});

test('undefined disables the plugin', async ({ page }) => {
	await setup(page, 'plugins/axis', SCHEMAS.PLUGINS.AXIS, undefined);

	const div = page.getByTestId('draggable');

	await div.hover();
	const { x, y } = await get_mouse_position(page);
	await page.mouse.down();
	await page.mouse.move(x + 100, y + 100);
	await page.mouse.up();

	// Only X should have changed
	await expect(div).toHaveCSS('translate', '100px 100px');
});
