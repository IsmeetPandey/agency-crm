import { chromium } from "playwright";
import * as fs from "node:fs";
import * as path from "node:path";

async function captureAfter() {
	const afterDir = path.resolve(process.cwd(), "artifacts/ui-audit/after");
	fs.mkdirSync(path.join(afterDir, "desktop-light"), { recursive: true });
	fs.mkdirSync(path.join(afterDir, "desktop-dark"), { recursive: true });
	fs.mkdirSync(path.join(afterDir, "tablet-light"), { recursive: true });
	fs.mkdirSync(path.join(afterDir, "mobile-light"), { recursive: true });

	const browser = await chromium.launch({ headless: true });

	// 1. Desktop Light (1440x900)
	const ctxLight = await browser.newContext({
		viewport: { width: 1440, height: 900 },
	});
	await ctxLight.addInitScript(() => {
		localStorage.setItem("kreatiwit_offline_session", "true");
		localStorage.setItem("theme", "light");
	});
	const pageLight = await ctxLight.newPage();
	await pageLight.goto("http://localhost:3000", { waitUntil: "networkidle" });
	await pageLight.waitForTimeout(800);

	const offlineBtn = pageLight.locator(
		'button:has-text("Launch Studio in Offline Resilient Engine Mode")',
	);
	if ((await offlineBtn.count()) > 0) {
		await offlineBtn.click();
		await pageLight.waitForTimeout(800);
	}

	const routes = [
		{ id: "overview", file: "01-dashboard.png" },
		{ id: "pipeline", file: "02-pipeline.png" },
		{ id: "opportunities", file: "03-opportunities.png" },
		{ id: "clients", file: "04-clients.png" },
		{ id: "projects", file: "05-projects.png" },
		{ id: "tasks", file: "06-tasks.png" },
		{ id: "finance", file: "07-finance.png" },
		{ id: "team", file: "08-team.png" },
	];

	for (const r of routes) {
		const btn = pageLight.locator(`button[data-nav="${r.id}"]`);
		if ((await btn.count()) > 0) {
			await btn.first().click();
			await pageLight.waitForTimeout(600);
			await pageLight.screenshot({
				path: path.join(afterDir, "desktop-light", r.file),
			});
		}
	}

	// Capture Financial Statements tab inside finance
	const financeBtn = pageLight.locator('button[data-nav="finance"]');
	if ((await financeBtn.count()) > 0) {
		await financeBtn.first().click();
		await pageLight.waitForTimeout(400);
		const statementTabBtn = pageLight.locator(
			'button:has-text("Financial Statements")',
		);
		if ((await statementTabBtn.count()) > 0) {
			await statementTabBtn.first().click();
			await pageLight.waitForTimeout(500);
			await pageLight.screenshot({
				path: path.join(afterDir, "desktop-light", "07b-financial-statements.png"),
			});
		}
	}

	// 2. Desktop Dark (1440x900)
	const ctxDark = await browser.newContext({
		viewport: { width: 1440, height: 900 },
	});
	await ctxDark.addInitScript(() => {
		localStorage.setItem("kreatiwit_offline_session", "true");
		localStorage.setItem("kreatiwit-theme", "dark");
		localStorage.setItem("theme", "dark");
	});
	const pageDark = await ctxDark.newPage();
	await pageDark.goto("http://localhost:3000", { waitUntil: "networkidle" });
	await pageDark.waitForTimeout(800);
	const offlineBtnDark = pageDark.locator(
		'button:has-text("Launch Studio in Offline Resilient Engine Mode")',
	);
	if ((await offlineBtnDark.count()) > 0) {
		await offlineBtnDark.click();
		await pageDark.waitForTimeout(800);
	}

	for (const r of routes.slice(0, 4)) {
		const btn = pageDark.locator(`button[data-nav="${r.id}"]`);
		if ((await btn.count()) > 0) {
			await btn.first().click();
			await pageDark.waitForTimeout(600);
			await pageDark.screenshot({
				path: path.join(afterDir, "desktop-dark", r.file),
			});
		}
	}

	// 3. Tablet Light (768x1024)
	const ctxTablet = await browser.newContext({
		viewport: { width: 768, height: 1024 },
	});
	await ctxTablet.addInitScript(() => {
		localStorage.setItem("kreatiwit_offline_session", "true");
		localStorage.setItem("theme", "light");
	});
	const pageTablet = await ctxTablet.newPage();
	await pageTablet.goto("http://localhost:3000", { waitUntil: "networkidle" });
	await pageTablet.waitForTimeout(800);
	const offTablet = pageTablet.locator(
		'button:has-text("Launch Studio in Offline Resilient Engine Mode")',
	);
	if ((await offTablet.count()) > 0) {
		await offTablet.click();
		await pageTablet.waitForTimeout(800);
	}
	await pageTablet.screenshot({
		path: path.join(afterDir, "tablet-light", "01-dashboard.png"),
	});

	// 4. Mobile Light (390x844)
	const ctxMobile = await browser.newContext({
		viewport: { width: 390, height: 844 },
	});
	await ctxMobile.addInitScript(() => {
		localStorage.setItem("kreatiwit_offline_session", "true");
		localStorage.setItem("theme", "light");
	});
	const pageMobile = await ctxMobile.newPage();
	await pageMobile.goto("http://localhost:3000", { waitUntil: "networkidle" });
	await pageMobile.waitForTimeout(800);
	const offMobile = pageMobile.locator(
		'button:has-text("Launch Studio in Offline Resilient Engine Mode")',
	);
	if ((await offMobile.count()) > 0) {
		await offMobile.click();
		await pageMobile.waitForTimeout(800);
	}
	await pageMobile.screenshot({
		path: path.join(afterDir, "mobile-light", "01-dashboard.png"),
	});

	await browser.close();
	console.log("AFTER UI audit screenshots captured successfully in artifacts/ui-audit/after/");
}

captureAfter().catch((err) => {
	console.error("Capture after failed:", err);
	process.exit(1);
});
