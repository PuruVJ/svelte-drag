import test, { expect } from '@playwright/test';
import { get_mouse_position, setup, stringify_console_message } from '../test-utils';
import { SCHEMAS } from '../../src/lib/schemas';

test('null disables the plugin', async ({ page }) => {
	await setup(page, 'plugins/threshold', SCHEMAS.PLUGINS.THRESHOLD, null);

	const div = page.getByTestId('draggable');

	await div.hover();
	const { x, y } = await get_mouse_position(page);
	await page.mouse.down();
	await page.mouse.move(x + 1, y + 0);
	await page.mouse.up();

	// With threshold set to `null`, the drag of 1px should have happened
	await expect(div).toHaveCSS('translate', '1px');
});

test('undefined === defaults', async ({ page }) => {
	await setup(page, 'plugins/threshold', SCHEMAS.PLUGINS.THRESHOLD, undefined);

	const div = page.getByTestId('draggable');

	await div.hover();
	const { x, y } = await get_mouse_position(page);
	await page.mouse.down();
	await page.mouse.move(x + 1, y + 0);
	await page.mouse.up();

	// With threshold set to undefined, the drag of 1px should not have happened
	await expect(div).not.toHaveCSS('translate', '1px');
});

test('{} switches to defaults', async ({ page }) => {
	await setup(page, 'plugins/threshold', SCHEMAS.PLUGINS.THRESHOLD, {});

	const div = page.getByTestId('draggable');

	await div.hover();
	const { x, y } = await get_mouse_position(page);
	await page.mouse.down();
	await page.mouse.move(x + 1, y + 0);
	await page.mouse.up();

	// With threshold set to undefined, the drag of 1px should have happened
	await expect(div).not.toHaveCSS('translate', '1px');
});

test('delay: 400', async ({ page }) => {
	await setup(page, 'plugins/threshold', SCHEMAS.PLUGINS.THRESHOLD, {
		delay: 400,
	});

	const div = page.getByTestId('draggable');

	await div.hover();
	const { x, y } = await get_mouse_position(page);
	await page.mouse.down();
	await page.mouse.move(x + 1, y + 0);
	await page.mouse.up();

	// Since the delay is 400ms, the drag should not have happened
	await expect(div).not.toHaveCSS('translate', '1px');

	// Now do it again, but wait for 400ms of mouse.down to move the mouse
	await page.mouse.down();
	await page.waitForTimeout(400);
	await page.mouse.move(x + 1, y + 0);
	await page.mouse.move(x + 2, y + 0);
	await page.mouse.move(x + 3, y + 0);
	await page.mouse.move(x + 5, y + 0);
	await page.mouse.up();

	// Now the drag should have happened
	//! OK its kinda weird: We have to move 1px past the threshold to get the drag to happen, and even then it loses 1px
	// TODO: Fix it later
	await expect(div).toHaveCSS('translate', '4px');
});

test('delay: 400, distance: 0', async ({ page }) => {
	await setup(page, 'plugins/threshold', SCHEMAS.PLUGINS.THRESHOLD, {
		delay: 400,
		distance: 0,
	});

	const div = page.getByTestId('draggable');

	await div.hover();
	const { x, y } = await get_mouse_position(page);
	await page.mouse.down();
	await page.mouse.move(x + 1, y + 0);
	await page.mouse.up();

	// Since the delay is 400ms, the drag should not have happened
	await expect(div).not.toHaveCSS('translate', '1px');

	// Now do it again, but wait for 400ms of mouse.down to move the mouse
	await page.mouse.down();
	await page.waitForTimeout(400);
	await page.mouse.move(x + 1, y + 0);
	await page.mouse.move(x + 2, y + 0);
	await page.mouse.up();

	// Now the drag should have happened
	//! OK its kinda weird: We have to move 1px past the threshold to get the drag to happen, and even then it loses 1px
	// TODO: Fix it later
	await expect(div).toHaveCSS('translate', '1px');
});

test('negative delay', async ({ page }) => {
	const console_message_promise = page.waitForEvent('console');
	await setup(page, 'plugins/threshold', SCHEMAS.PLUGINS.THRESHOLD, {
		delay: -1,
	});

	const console_error = await console_message_promise;

	expect((await console_error.args()[0].jsonValue()).error.toString()).toContain(
		'delay must be >= 0',
	);
});

test('negative distance', async ({ page }) => {
	const console_message_promise = page.waitForEvent('console');
	await setup(page, 'plugins/threshold', SCHEMAS.PLUGINS.THRESHOLD, {
		distance: -1,
	});

	const console_error = await console_message_promise;

	expect((await console_error.args()[0].jsonValue()).error.toString()).toContain(
		'distance must be >= 0',
	);
});
