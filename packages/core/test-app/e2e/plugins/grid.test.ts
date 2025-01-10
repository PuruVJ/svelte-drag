import { expect, test } from '@playwright/test';
import { SCHEMAS } from '../../src/lib/schemas';
import { get_mouse_position, setup } from '../test-utils';

test('[10, 10]', async ({ page }) => {
	await setup(page, 'plugins/grid', SCHEMAS.PLUGINS.GRID, [10, 10]);

	const div = page.getByTestId('draggable');

	await div.hover();
	const { x, y } = await get_mouse_position(page);
	await page.mouse.down();
	await page.mouse.move(x + 94, y + 90);
	await page.mouse.up();

	await expect(div).toHaveCSS('translate', '100px 90px');

	await page.mouse.down();
	await page.mouse.move(x + 94, y + 91);
	await page.mouse.up();

	await expect(div).toHaveCSS('translate', '100px 90px');
});

test('[23, 102]', async ({ page }) => {
	await setup(page, 'plugins/grid', SCHEMAS.PLUGINS.GRID, [23, 102]);

	const div = page.getByTestId('draggable');

	await div.hover();
	const { x, y } = await get_mouse_position(page);
	await page.mouse.down();
	await page.mouse.move(x + 94, y + 90);
	await page.mouse.up();

	await expect(div).toHaveCSS('translate', '115px 102px');

	await page.mouse.down();
	await page.mouse.move(x + 300, y + 291);
	await page.mouse.up();

	await expect(div).toHaveCSS('translate', '322px 306px');
});

test('undefined should disable the plugin', async ({ page }) => {
	await setup(page, 'plugins/grid', SCHEMAS.PLUGINS.GRID, undefined);

	const div = page.getByTestId('draggable');

	await div.hover();
	const { x, y } = await get_mouse_position(page);
	await page.mouse.down();
	await page.mouse.move(x + 94, y + 90);
	await page.mouse.up();

	await expect(div).toHaveCSS('translate', '94px 90px');

	await page.mouse.down();
	await page.mouse.move(x + 300, y + 291);
	await page.mouse.up();

	await expect(div).toHaveCSS('translate', '300px 291px');
});

test('[10, undefined] should snap in x but let y be free', async ({ page }) => {
	await setup(page, 'plugins/grid', SCHEMAS.PLUGINS.GRID, [10, undefined]);

	const div = page.getByTestId('draggable');

	await div.hover();
	const { x, y } = await get_mouse_position(page);
	await page.mouse.down();
	await page.mouse.move(x + 94, y + 90);
	await page.mouse.up();

	await expect(div).toHaveCSS('translate', '100px 90px');

	await page.mouse.down();
	await page.mouse.move(x + 307, y + 291);
	await page.mouse.up();

	await expect(div).toHaveCSS('translate', '320px 291px');
});

test('[undefined, undefined] does no snapping', async ({ page }) => {
	await setup(page, 'plugins/grid', SCHEMAS.PLUGINS.GRID, [undefined, undefined]);

	const div = page.getByTestId('draggable');

	await div.hover();
	const { x, y } = await get_mouse_position(page);
	await page.mouse.down();
	await page.mouse.move(x + 94, y + 90);
	await page.mouse.up();

	await expect(div).toHaveCSS('translate', '94px 90px');

	await page.mouse.down();
	await page.mouse.move(x + 307, y + 291);
	await page.mouse.up();

	await expect(div).toHaveCSS('translate', '307px 291px');
});
