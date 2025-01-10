import { test, expect } from '@playwright/test';
import { get_mouse_position, setup } from '../test-utils';
import { SCHEMAS } from '../../src/lib/schemas';

test.describe('HTMLElement', () => {
	test('default', async ({ page }) => {
		await setup(page, 'plugins/transform', SCHEMAS.PLUGINS.TRANSFORM, {
			is_func: false,
			is_svg: false,
		});

		const div = page.getByTestId('draggable');

		await div.hover();
		const { x, y } = await get_mouse_position(page);
		await page.mouse.down();
		await page.mouse.move(x + 100, y + 100);
		await page.mouse.up();

		await expect(div).toHaveCSS('translate', '100px 100px');
	});

	test('func', async ({ page }) => {
		await setup(page, 'plugins/transform', SCHEMAS.PLUGINS.TRANSFORM, {
			is_func: true,
			is_svg: false,
		});

		const div = page.getByTestId('draggable');

		await div.hover();
		const { x, y } = await get_mouse_position(page);
		await page.mouse.down();
		await page.mouse.move(x + 100, y + 100);
		await page.mouse.up();

		await expect(div).toHaveCSS('left', '100px');
		await expect(div).toHaveCSS('top', '100px');
	});
});

test.describe('SVGElement', () => {
	test('default', async ({ page }) => {
		await setup(page, 'plugins/transform', SCHEMAS.PLUGINS.TRANSFORM, {
			is_func: false,
			is_svg: true,
		});

		const div = page.getByTestId('draggable');

		await div.hover();
		const { x, y } = await get_mouse_position(page);
		await page.mouse.down();
		await page.mouse.move(x + 100, y + 100);
		await page.mouse.up();

		await expect(div).toHaveAttribute('transform', /translate\(100[,]? 100\)/);
	});

	test('func', async ({ page, browserName }) => {
		await setup(page, 'plugins/transform', SCHEMAS.PLUGINS.TRANSFORM, {
			is_func: true,
			is_svg: true,
		});

		const div = page.getByTestId('draggable');

		await div.hover();
		const { x, y } = await get_mouse_position(page);
		await page.mouse.down();
		await page.mouse.move(x + 100, y + 100);
		await page.mouse.up();

		if (browserName === 'webkit') {
			await expect(div).toHaveAttribute('transform', 'translate(100 100)');
		} else {
			await expect(div).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 100, 100)');
		}
		await expect(div).toHaveAttribute('data-proof-func-worked', '');
	});
});
