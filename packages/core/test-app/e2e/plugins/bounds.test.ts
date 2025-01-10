import test, { expect } from '@playwright/test';
import { SCHEMAS } from '../../src/lib/schemas';
import { get_mouse_position, setup } from '../test-utils';

test.describe('BoundsFrom.element()', () => {
	test('stays within bounds in all directions', async ({ page }) => {
		await setup(page, 'plugins/bounds', SCHEMAS.PLUGINS.BOUNDS, {
			type: 'element',
		});

		const div = page.getByTestId('draggable');

		await div.hover();
		const { x, y } = await get_mouse_position(page);

		await page.mouse.down();
		// THe bounds are 200px wide, so we should be able to drag it to the right
		await page.mouse.move(x + 10, y + 10);
		await page.mouse.up();

		await expect(div).toHaveCSS('translate', '10px 10px');

		// Now drag it by 200px to the right
		await page.mouse.down();
		await page.mouse.move(x + 210, y + 210);
		await page.mouse.up();

		// It should only have dragged by 100px since the box itself is 100px
		await expect(div).toHaveCSS('translate', '100px 100px');

		await div.hover();
		// Now try to go all the way back to negative mouse coordinates
		await page.mouse.down();
		await page.mouse.move(0, 0);
		await page.mouse.up();

		await expect(div).toHaveCSS('translate', '0px');
	});

	test('error when bounds are smaller than element', async ({ page }) => {
		const console_error_promise = page.waitForEvent('console');

		await setup(page, 'plugins/bounds', SCHEMAS.PLUGINS.BOUNDS, {
			type: 'element',
			is_smaller_than_element: true,
		});

		const console_error = await console_error_promise;
		expect((await console_error.args()[0].jsonValue()).error.toString()).toContain(
			'Bounds dimensions cannot be smaller than the draggable element dimensions',
		);

		// Once this is done, bounds plugin should be no-op, so drag anywhere and confirm
		const div = page.getByTestId('draggable');

		await div.hover();
		const { x, y } = await get_mouse_position(page);

		await page.mouse.down();
		await page.mouse.move(x + 150, y + 10);
		await page.mouse.up();

		await expect(div).toHaveCSS('translate', '150px 10px');
	});
});

test.describe('BoundsFrom.viewport()', () => {
	test('stays within bounds in all directions', async ({ page }) => {
		await setup(page, 'plugins/bounds', SCHEMAS.PLUGINS.BOUNDS, {
			type: 'viewport',
		});

		const div = page.getByTestId('draggable');

		await div.hover();
		const { x, y } = await get_mouse_position(page);

		await page.mouse.down();
		// The viewport in oru example is only as tall as the page itself, so it it shouldn't
		// move in y-direction
		await page.mouse.move(x + 10, y + 10);
		await page.mouse.up();

		await expect(div).toHaveCSS('translate', '10px');

		const viewport_size = page.viewportSize() ?? { width: 0, height: 0 };

		await div.hover();
		await page.mouse.down();
		// Weird: All browsers will move cursors beyond the viewport, so we need to move it
		// except for firefox, so instead of moving to any large distance, we have to move within the viewport
		//  the -10 is just arbitrary
		await page.mouse.move(viewport_size.width - 10, viewport_size.height - 10);
		await page.mouse.up();

		// It should have dragged viewport width minus the box width
		await expect(div).toHaveCSS('translate', `${viewport_size.width - 100}px`);
	});
});

test.describe('BoundsFrom.selector()', () => {
	test('stays within bounds in all directions', async ({ page }) => {
		await setup(page, 'plugins/bounds', SCHEMAS.PLUGINS.BOUNDS, {
			type: 'selector',
			selector: '.selector',
		});

		const div = page.getByTestId('draggable');

		await div.hover();
		const { x, y } = await get_mouse_position(page);

		await page.mouse.down();
		await page.mouse.move(x + 10, y + 10);
		await page.mouse.up();

		await expect(div).toHaveCSS('translate', '10px 10px');

		await div.hover();
		await page.mouse.down();
		await page.mouse.move(200, 200);
		await page.mouse.up();

		// It should have dragged viewport width minus the box width
		await expect(div).toHaveCSS('translate', `100px 100px`);
	});
});

test.describe('BoundsFrom.parent()', () => {
	test('stays within bounds in all directions', async ({ page }) => {
		await setup(page, 'plugins/bounds', SCHEMAS.PLUGINS.BOUNDS, {
			type: 'parent',
		});

		const div = page.getByTestId('draggable');

		await div.hover();
		const { x, y } = await get_mouse_position(page);

		await page.mouse.down();
		// THe bounds are 200px wide, so we should be able to drag it to the right
		await page.mouse.move(x + 10, y + 10);
		await page.mouse.up();

		await expect(div).toHaveCSS('translate', '10px 10px');

		// Now drag it by 200px to the right
		await page.mouse.down();
		await page.mouse.move(x + 210, y + 210);
		await page.mouse.up();

		// It should only have dragged by 100px since the box itself is 100px
		await expect(div).toHaveCSS('translate', '100px 100px');

		await div.hover();
		// Now try to go all the way back to negative mouse coordinates
		await page.mouse.down();
		await page.mouse.move(0, 0);
		await page.mouse.up();

		await expect(div).toHaveCSS('translate', '0px');
	});
});
