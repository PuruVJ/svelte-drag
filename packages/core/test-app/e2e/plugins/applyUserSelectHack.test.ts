import test, { expect } from '@playwright/test';
import { setup } from '../test-utils';
import { SCHEMAS } from '../../src/lib/schemas';

test('true', async ({ page, browserName }) => {
	await setup(page, 'plugins/applyUserSelectHack', SCHEMAS.PLUGINS.APPLY_USER_SELECT_HACK, true);

	const body = page.locator('body');

	// Body should not have user-select: none without dragging
	await expect(body).not.toHaveCSS('user-select', 'none');

	// Now start dragging
	const div = page.getByTestId('draggable');

	await div.hover();
	await page.mouse.down();
	await page.mouse.move(100, 100);

	// Now make sure body has user-select: none
	if (browserName === 'webkit') {
		await expect(body).toHaveCSS('-webkit-user-select', 'none');
	} else {
		await expect(body).toHaveCSS('user-select', 'none');
	}
	await page.mouse.up();

	// Make sure it's removed
	await expect(body).not.toHaveCSS('user-select', 'none');
	await expect(body).not.toHaveCSS('-webkit-user-select', 'none');
});

test('false', async ({ page }) => {
	await setup(page, 'plugins/applyUserSelectHack', SCHEMAS.PLUGINS.APPLY_USER_SELECT_HACK, false);

	const body = page.locator('body');

	// Body should not have user-select: none without dragging
	await expect(body).not.toHaveCSS('user-select', 'none');

	// Now start dragging
	const div = page.getByTestId('draggable');

	await div.hover();
	await page.mouse.down();
	await page.mouse.move(100, 100);
	// Now make sure body has user-select: none
	await expect(body).not.toHaveCSS('user-select', 'none');
	await expect(body).not.toHaveCSS('-webkit-user-select', 'none');
	await page.mouse.up();
});
