import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	webServer: {
		command: 'pnpm build && pnpm preview',
		port: 3291,
	},

	projects: [
		{
			name: 'chrome',
			use: { ...devices['Desktop Chrome'] },
		},
		{
			name: 'firefox',
			use: { ...devices['Desktop Firefox'] },
		},
		{
			name: 'safari',
			use: { ...devices['Desktop Safari'] },
		},
		{
			name: 'chrome.touch',
			use: { ...devices['Pixel 7'] },
		},
		{
			name: 'safari.mobile',
			use: { ...devices['iPhone 15'] },
		},
	],

	testDir: 'e2e',
});
