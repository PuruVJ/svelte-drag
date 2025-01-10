import { expect, test } from '@playwright/test';
import { get_mouse_position, setup } from '../test-utils';
import { SCHEMAS } from '../../src/lib/schemas';

test('undefined | null disables the plugin', async ({ page }) => {
	await setup(page, 'plugins/controls', SCHEMAS.PLUGINS.CONTROLS, {
		type: 'undefined,null',
	});

	const div = page.getByTestId('draggable');

	await div.hover();
	let { x, y } = await get_mouse_position(page);

	await page.mouse.down();
	await page.mouse.move(x + 10, y + 10);
	await page.mouse.up();

	await expect(div).toHaveCSS('translate', '10px 10px');

	// Locate `.cancel` and try to drag that. If it drags, then the plugin is working as intended for this value
	const cancel = div.locator('.cancel');
	await cancel.hover();
	({ x, y } = await get_mouse_position(page));

	await page.mouse.down();
	await page.mouse.move(x + 10, y + 10);
	await page.mouse.up();

	await expect(div).toHaveCSS('translate', '20px 20px');
});

test('allow-only', async ({ page }) => {
	await setup(page, 'plugins/controls', SCHEMAS.PLUGINS.CONTROLS, {
		type: 'allow-only',
	});

	const div = page.getByTestId('draggable');
	const handle = div.locator('.handle');

	await handle.hover();
	let { x, y } = await get_mouse_position(page);

	await page.mouse.down();
	await page.mouse.move(x + 10, y + 10);
	await page.mouse.up();

	// This should have moved.
	await expect(div).toHaveCSS('translate', '10px 10px');

	// Now move to some point within the box, near bottom right and attempt to drag
	await page.mouse.move(100, 100); // 10x10px from the corner

	// Locate `.cancel` and try to drag that. If it drags, then the plugin is working as intended for this value
	({ x, y } = await get_mouse_position(page));

	await page.mouse.down();
	await page.mouse.move(x + 10, y + 10);
	await page.mouse.up();

	// Should have stayed as is
	await expect(div).toHaveCSS('translate', '10px 10px');
});

test('block-only', async ({ page }) => {
	await setup(page, 'plugins/controls', SCHEMAS.PLUGINS.CONTROLS, {
		type: 'block-only',
	});

	const div = page.getByTestId('draggable');
	const handle = div.locator('.handle');
	const cancel = div.locator('.cancel');

	await handle.hover();
	let { x, y } = await get_mouse_position(page);

	await page.mouse.down();
	await page.mouse.move(x + 10, y + 10);
	await page.mouse.up();

	// This should have moved.
	await expect(div).toHaveCSS('translate', '10px 10px');

	// Now move to some point within the box, near bottom right and attempt to drag
	await page.mouse.move(100, 100); // 10x10px from the corner

	({ x, y } = await get_mouse_position(page));

	await page.mouse.down();
	await page.mouse.move(x + 10, y + 10);
	await page.mouse.up();

	// Should have moved
	await expect(div).toHaveCSS('translate', '20px 20px');

	await cancel.hover();
	({ x, y } = await get_mouse_position(page));

	await page.mouse.down();
	await page.mouse.move(x + 10, y + 10);
	await page.mouse.up();

	// Should not have moved
	await expect(div).toHaveCSS('translate', '20px 20px');
});

test('allow-block', async ({ page }) => {
	await setup(page, 'plugins/controls', SCHEMAS.PLUGINS.CONTROLS, {
		type: 'allow-block',
	});

	const div = page.getByTestId('draggable');
	const handle = div.locator('.handle');
	const cancel = div.locator('.cancel');

	await handle.hover();
	let { x, y } = await get_mouse_position(page);

	await page.mouse.down();
	await page.mouse.move(x + 10, y + 10);
	await page.mouse.up();

	// This should have moved.
	await expect(div).toHaveCSS('translate', '10px 10px');

	// Now move to some point within the box, near bottom right and attempt to drag
	await page.mouse.move(100, 100); // 10x10px from the corner

	({ x, y } = await get_mouse_position(page));

	await page.mouse.down();
	await page.mouse.move(x + 10, y + 10);
	await page.mouse.up();

	// Should not have moved
	await expect(div).toHaveCSS('translate', '10px 10px');

	await cancel.hover();
	({ x, y } = await get_mouse_position(page));

	await page.mouse.down();
	await page.mouse.move(x + 10, y + 10);
	await page.mouse.up();

	// Should not have moved
	await expect(div).toHaveCSS('translate', '10px 10px');
});

test('allow-block-allow', async ({ page }) => {
	await setup(page, 'plugins/controls', SCHEMAS.PLUGINS.CONTROLS, {
		type: 'allow-block-allow',
	});

	const div = page.getByTestId('draggable');
	const handle_text = div.locator('.handle').locator('.handle-text');
	const cancel_text = div.locator('.cancel').locator('.cancel-text');
	const handle2 = div.locator('.handle').locator('.handle2');

	await handle_text.hover();
	let { x, y } = await get_mouse_position(page);

	await page.mouse.down();
	await page.mouse.move(x + 10, y + 10);
	await page.mouse.up();

	// This should have moved.
	await expect(div).toHaveCSS('translate', '10px 10px');

	// Now move to some point within the box, near bottom right and attempt to drag
	await page.mouse.move(100, 100); // 10x10px from the corner

	({ x, y } = await get_mouse_position(page));

	await page.mouse.down();
	await page.mouse.move(x + 10, y + 10);
	await page.mouse.up();

	// Should not have moved
	await expect(div).toHaveCSS('translate', '10px 10px');

	await cancel_text.hover();
	({ x, y } = await get_mouse_position(page));

	await page.mouse.down();
	await page.mouse.move(x + 10, y + 10);
	await page.mouse.up();

	// Should not have moved
	await expect(div).toHaveCSS('translate', '10px 10px');

	// Now try to drag the handle2
	await handle2.hover();
	({ x, y } = await get_mouse_position(page));

	await page.mouse.down();
	await page.mouse.move(x + 10, y + 10);
	await page.mouse.up();

	// Should have moved
	await expect(div).toHaveCSS('translate', '20px 20px');
});

test('block-allow-block', async ({ page }) => {
	await setup(page, 'plugins/controls', SCHEMAS.PLUGINS.CONTROLS, {
		type: 'block-allow-block',
	});

	const div = page.getByTestId('draggable');
	const outer_text = div.locator('.outer-handle').locator('.outer-text');
	const inner_handle = div.locator('.inner-handle').locator('.inner-text');
	const middle_handle = div.locator('.middle-handle').locator('.middle-text');

	// Try dragging from outer handle (in outer block zone)
	await outer_text.hover();
	let { x, y } = await get_mouse_position(page);

	await page.mouse.down();
	await page.mouse.move(x + 10, y + 10);
	await page.mouse.up();

	// Should not have moved (blocked by outer block)
	await expect(div).toHaveCSS('translate', 'none');

	// Try dragging from middle handle (in allow zone)
	await middle_handle.hover();
	({ x, y } = await get_mouse_position(page));

	await page.mouse.down();
	await page.mouse.move(x + 10, y + 10);
	await page.mouse.up();

	// Should have moved (allowed by middle allow zone)
	await expect(div).toHaveCSS('translate', '10px 10px');

	// Try dragging from inner handle (in inner block zone)
	await inner_handle.hover();
	({ x, y } = await get_mouse_position(page));

	await page.mouse.down();
	await page.mouse.move(x + 10, y + 10);
	await page.mouse.up();

	// Should not have moved more (blocked by inner block)
	await expect(div).toHaveCSS('translate', '10px 10px');
});
