import { expect, test } from '@playwright/test';
import { SCHEMAS } from '../../src/lib/schemas';
import { setup } from '../test-utils';

test('undefined triggers default behavior', async ({ page }) => {
	await setup(page, 'plugins/touchAction', SCHEMAS.PLUGINS.TOUCH_ACTION, 'undefined');

	const div = page.getByTestId('draggable');

	await expect(div).toHaveCSS('touch-action', 'manipulation');
});

test('null is false', async ({ page }) => {
	await setup(page, 'plugins/touchAction', SCHEMAS.PLUGINS.TOUCH_ACTION, 'null');

	const div = page.getByTestId('draggable');

	await expect(div).not.toHaveCSS('touch-action', 'manipulation');
});

test('false', async ({ page }) => {
	await setup(page, 'plugins/touchAction', SCHEMAS.PLUGINS.TOUCH_ACTION, 'false');

	const div = page.getByTestId('draggable');

	await expect(div).not.toHaveCSS('touch-action', 'manipulation');
});

test('auto', async ({ page }) => {
	await setup(page, 'plugins/touchAction', SCHEMAS.PLUGINS.TOUCH_ACTION, 'auto');

	const div = page.getByTestId('draggable');

	await expect(div).toHaveCSS('touch-action', 'auto');
});
