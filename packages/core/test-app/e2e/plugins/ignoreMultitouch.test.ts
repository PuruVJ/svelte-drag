import test from '@playwright/test';

test('should not allow multitouch', () => {
	test.skip(
		true,
		'Playwright does not support multiple pointers yet https://github.com/microsoft/playwright/issues/34158',
	);
});
