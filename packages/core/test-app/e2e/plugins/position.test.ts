import test, { expect } from '@playwright/test';
import { get_mouse_position, setup } from '../test-utils';
import { SCHEMAS } from '../../src/lib/schemas';

test('undefined disables the plugin', async ({ page }) => {
	await setup(page, 'plugins/position', SCHEMAS.PLUGINS.POSITION, undefined);

	const div = page.getByTestId('draggable');

	await div.hover();
	const { x, y } = await get_mouse_position(page);
	await page.mouse.down();
	await page.mouse.move(x + 100, y + 100);
	await page.mouse.up();

	// This will drag as usual
	await expect(div).toHaveCSS('translate', '100px 100px');
});

test('null disables the plugin', async ({ page }) => {
	await setup(page, 'plugins/position', SCHEMAS.PLUGINS.POSITION, null);

	const div = page.getByTestId('draggable');

	await div.hover();
	const { x, y } = await get_mouse_position(page);
	await page.mouse.down();
	await page.mouse.move(x + 100, y + 100);
	await page.mouse.up();

	// This will drag as usual
	await expect(div).toHaveCSS('translate', '100px 100px');
});

test('default only', async ({ page }) => {
	await setup(page, 'plugins/position', SCHEMAS.PLUGINS.POSITION, {
		default: {
			x: 20,
			y: 80,
		},
	});

	const div = page.getByTestId('draggable');

	// Should be translated by `default`
	await expect(div).toHaveCSS('translate', '20px 80px');

	await div.hover();
	const { x, y } = await get_mouse_position(page);
	await page.mouse.down();
	await page.mouse.move(x + 100, y + 100);
	await page.mouse.up();

	// This will drag as usual
	await expect(div).toHaveCSS('translate', '120px 180px');
});

test('current only', async ({ page }) => {
	await setup(page, 'plugins/position', SCHEMAS.PLUGINS.POSITION, {
		current: {
			x: 20,
			y: 80,
		},
	});

	const div = page.getByTestId('draggable');

	// Should be translated by `default`
	await expect(div).toHaveCSS('translate', '20px 80px');

	await div.hover();
	const { x, y } = await get_mouse_position(page);
	await page.mouse.down();
	await page.mouse.move(x + 100, y + 100);
	await page.mouse.up();

	// This will drag too
	await expect(div).toHaveCSS('translate', '120px 180px');
});

test('current-default', async ({ page }) => {
	await setup(page, 'plugins/position', SCHEMAS.PLUGINS.POSITION, {
		default: {
			x: 20,
			y: 80,
		},
		current: {
			x: 100,
			y: 180,
		},
	});

	const div = page.getByTestId('draggable');

	// current ahould be prioritized over default
	await expect(div).toHaveCSS('translate', '100px 180px');

	await div.hover();
	const { x, y } = await get_mouse_position(page);
	await page.mouse.down();
	await page.mouse.move(x + 100, y + 100);
	await page.mouse.up();

	// This will drag too
	await expect(div).toHaveCSS('translate', '200px 280px');
});

test('two-way-binding', async ({ page }) => {
	await setup(page, 'plugins/position', SCHEMAS.PLUGINS.POSITION, {
		default: {
			x: 20,
			y: 80,
		},
		current: {
			x: 100,
			y: 180,
		},
		two_way_binding: true,
	});

	const div = page.getByTestId('draggable');

	// current ahould be prioritized over default
	await expect(div).toHaveCSS('translate', '100px 180px');

	await div.hover();
	const { x, y } = await get_mouse_position(page);
	await page.mouse.down();
	await page.mouse.move(x + 100, y + 100);
	await page.mouse.up();

	// This will drag too
	await expect(div).toHaveCSS('translate', '200px 280px');

	const xSlider = page.getByTestId('x-slider');
	const ySlider = page.getByTestId('y-slider');

	// Check their values, make sure theyre the same as drag translatye
	await expect(xSlider).toHaveValue('200');
	await expect(ySlider).toHaveValue('280');
});
