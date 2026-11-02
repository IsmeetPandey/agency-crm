import { chromium } from "playwright";
import * as fs from "fs";
import * as path from "path";

const VIEWPORTS = {
	desktop: { width: 1440, height: 900 },
	mobile: { width: 390, height: 844 },
};

const MAIN_SCREENS = [
	{ id: "overview", name: "01-dashboard" },
	{ id: "pipeline", name: "02-pipeline" },
	{ id: "opportunities", name: "03-opportunities" },
	{ id: "clients", name: "04-clients" },
	{ id: "contacts", name: "05-contacts" },
	{ id: "projects", name: "06-projects" },
	{ id: "tasks", name: "07-tasks" },
	{ id: "finance", name: "08-finance" },
	{ id: "handoffs", name: "09-handoffs" },
	{ id: "approvals", name: "10-approvals" },
	{ id: "team", name: "11-team" },
	{ id: "raci", name: "12-raci" },
	{ id: "archive", name: "13-archive" },
	{ id: "settings", name: "14-settings" },
];

async function capture(phase: "before" | "after") {
	const baseDir = path.resolve(process.cwd(), "artifacts", "ui-audit", phase);

	for (const vp of ["desktop", "mobile"]) {
		for (const theme of ["light", "dark"]) {
			fs.mkdirSync(path.join(baseDir, `${vp}-${theme}`), { recursive: true });
		}
	}

	const browser = await chromium.launch({ headless: true });

	for (const theme of ["light", "dark"] as const) {
		for (const [vpName, vp] of Object.entries(VIEWPORTS)) {
			console.log(`\n=== Capturing ${phase.toUpperCase()} | ${vpName.toUpperCase()} | ${theme.toUpperCase()} ===`);
			const context = await browser.newContext({
				viewport: vp,
				colorScheme: theme,
			});

			const page = await context.newPage();

			// 0. Capture Auth screen first (unauthenticated)
			await page.addInitScript(({ th }) => {
				localStorage.removeItem("kreatiwit_offline_session");
				localStorage.setItem("kreatiwit-theme", th);
				document.documentElement.setAttribute("data-theme", th);
			}, { th: theme });

			await page.goto("http://localhost:3001/", { waitUntil: "networkidle" });
			await page.waitForTimeout(600);
			const authPath = path.join(baseDir, `${vpName}-${theme}`, "00-auth.png");
			await page.screenshot({ path: authPath, fullPage: false });
			console.log(`✓ Saved 00-auth -> ${authPath}`);

			// Now login to offline studio mode
			const offlineBtn = page.locator("button:has-text('Launch Studio in Offline Resilient Engine Mode')");
			if (await offlineBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
				await offlineBtn.click();
				await page.waitForTimeout(800);
			} else {
				// set offline in localStorage and reload
				await page.evaluate(() => {
					localStorage.setItem("kreatiwit_offline_session", "true");
				});
				await page.reload({ waitUntil: "networkidle" });
				await page.waitForTimeout(800);
			}

			// Capture Main Module Screens
			for (const screen of MAIN_SCREENS) {
				try {
					if (vpName === "mobile") {
						const menuBtn = page.locator("button[aria-label='Toggle navigation menu'], button:has-text('☰')").first();
						if (await menuBtn.isVisible().catch(() => false)) {
							await menuBtn.click();
							await page.waitForTimeout(200);
						}
					}

					const navBtn = page.locator(`button[data-nav='${screen.id}']`).first();
					if (await navBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
						await navBtn.click();
						await page.waitForTimeout(400);
					}

					const outPath = path.join(baseDir, `${vpName}-${theme}`, `${screen.name}.png`);
					await page.screenshot({ path: outPath, fullPage: false });
					console.log(`✓ Saved ${screen.name} -> ${outPath}`);
				} catch (err: any) {
					console.warn(`! Failed to capture ${screen.name}: ${err.message}`);
				}
			}

			// Capture Opportunity Detail (click on first row in Opportunities view)
			try {
				const oppNav = page.locator("button[data-nav='opportunities']").first();
				if (await oppNav.isVisible({ timeout: 1500 }).catch(() => false)) {
					await oppNav.click();
					await page.waitForTimeout(400);
					// click first opportunity row or deal chip
					const firstRow = page.locator("tr[class*='cursor-pointer']").first();
					if (await firstRow.isVisible({ timeout: 1500 }).catch(() => false)) {
						await firstRow.click();
						await page.waitForTimeout(500);
						const oppDetailPath = path.join(baseDir, `${vpName}-${theme}`, "15-opportunity-detail.png");
						await page.screenshot({ path: oppDetailPath, fullPage: false });
						console.log(`✓ Saved 15-opportunity-detail -> ${oppDetailPath}`);
					}
				}
			} catch (err: any) {
				console.warn(`! Opportunity detail capture skipped: ${err.message}`);
			}

			// Capture Project Detail (click first project in Projects view)
			try {
				const projNav = page.locator("button[data-nav='projects']").first();
				if (await projNav.isVisible({ timeout: 1500 }).catch(() => false)) {
					await projNav.click();
					await page.waitForTimeout(400);
					const firstProj = page.locator("button:has-text('Open Cockpit'), button:has-text('Cockpit →')").first();
					if (await firstProj.isVisible({ timeout: 1500 }).catch(() => false)) {
						await firstProj.click();
						await page.waitForTimeout(500);
						const projDetailPath = path.join(baseDir, `${vpName}-${theme}`, "16-project-detail.png");
						await page.screenshot({ path: projDetailPath, fullPage: false });
						console.log(`✓ Saved 16-project-detail -> ${projDetailPath}`);
					}
				}
			} catch (err: any) {
				console.warn(`! Project detail capture skipped: ${err.message}`);
			}

			// Capture Command Palette
			try {
				await page.keyboard.press("Control+k");
				await page.waitForTimeout(300);
				const cmdPalettePath = path.join(baseDir, `${vpName}-${theme}`, "17-command-palette.png");
				await page.screenshot({ path: cmdPalettePath, fullPage: false });
				console.log(`✓ Saved 17-command-palette -> ${cmdPalettePath}`);
				await page.keyboard.press("Escape");
				await page.waitForTimeout(200);
			} catch (err: any) {
				console.warn(`! Command palette capture skipped: ${err.message}`);
			}

			await context.close();
		}
	}

	await browser.close();
	console.log(`\n🎉 All ${phase.toUpperCase()} audit screenshots captured successfully!`);
}

const phase = (process.argv[2] as "before" | "after") || "before";
capture(phase).catch((e) => {
	console.error("Capture failed:", e);
	process.exit(1);
});
