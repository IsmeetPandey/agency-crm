import { chromium } from "playwright";
import * as fs from "node:fs";
import * as path from "node:path";

interface TargetRoute {
	id: string;
	name: string;
	file: string;
	subAction?: (page: any) => Promise<void>;
}

async function captureAll(target: "before" | "after") {
	const baseDir = path.resolve(process.cwd(), `artifacts/ui-audit/${target}`);
	const desktopDir = path.join(baseDir, "desktop");
	const tabletDir = path.join(baseDir, "tablet");
	const mobileDir = path.join(baseDir, "mobile");

	fs.mkdirSync(desktopDir, { recursive: true });
	fs.mkdirSync(tabletDir, { recursive: true });
	fs.mkdirSync(mobileDir, { recursive: true });

	const browser = await chromium.launch({ headless: true });

	const routes: TargetRoute[] = [
		{ id: "overview", name: "Dashboard", file: "01-dashboard.png" },
		{ id: "pipeline", name: "Sales Pipeline", file: "02-pipeline.png" },
		{ id: "opportunities", name: "Commercial Deals", file: "03-opportunities.png" },
		{ id: "clients", name: "Clients", file: "04-clients.png" },
		{ id: "contacts", name: "Contacts", file: "05-contacts.png" },
		{ id: "projects", name: "Projects Cockpit", file: "06-projects.png" },
		{ id: "tasks", name: "Tasks Masterboard", file: "07-tasks.png" },
		{ id: "handoffs", name: "Handoff Transit", file: "08-handoffs.png" },
		{
			id: "finance",
			name: "Finance Invoices",
			file: "09-finance-invoices.png",
		},
		{
			id: "finance",
			name: "Financial Statements",
			file: "09b-finance-statements.png",
			subAction: async (page) => {
				const stmtBtn = page.locator('button:has-text("Financial Statements")');
				if ((await stmtBtn.count()) > 0) {
					await stmtBtn.first().click();
					await page.waitForTimeout(400);
				}
			},
		},
		{ id: "team", name: "Team & Capacity", file: "10-team.png" },
		{ id: "approvals", name: "Approval Center", file: "11-approvals.png" },
		{ id: "raci", name: "RACI Governance", file: "12-raci.png" },
		{ id: "archive", name: "Recycle Archive", file: "13-archive.png" },
		{ id: "settings", name: "Settings & Storage", file: "14-settings.png" },
	];

	// Helper to navigate safely on any viewport
	async function navigateTo(page: any, navId: string) {
		const isDesktopVisible = await page
			.locator('aside.hidden.lg\\:flex button[data-nav="' + navId + '"]')
			.first()
			.isVisible()
			.catch(() => false);

		if (isDesktopVisible) {
			await page
				.locator('aside.hidden.lg\\:flex button[data-nav="' + navId + '"]')
				.first()
				.click();
		} else {
			// Mobile/Tablet drawer mode (< 1024px)
			const isDrawerOpen = await page
				.locator('div.fixed.inset-0 button[data-nav="' + navId + '"]')
				.first()
				.isVisible()
				.catch(() => false);

			if (!isDrawerOpen) {
				const menuBtn = page.locator('button[aria-label="Toggle Navigation Menu"]');
				if (await menuBtn.isVisible().catch(() => false)) {
					await menuBtn.click();
					await page.waitForTimeout(300);
				}
			}

			const targetBtn = page.locator('div.fixed.inset-0 button[data-nav="' + navId + '"]');
			if (await targetBtn.first().isVisible().catch(() => false)) {
				await targetBtn.first().click();
			}
		}
		await page.waitForTimeout(400);
	}
	console.log(`\nCapturing Desktop (1440x900) for ${target}...`);
	const ctxDesktop = await browser.newContext({
		viewport: { width: 1440, height: 900 },
	});
	await ctxDesktop.addInitScript(() => {
		localStorage.setItem("kreatiwit_offline_session", "true");
		localStorage.setItem("theme", "light");
	});
	const pageDesktop = await ctxDesktop.newPage();
	await pageDesktop.goto("http://localhost:3000", { waitUntil: "networkidle" });
	await pageDesktop.waitForTimeout(600);

	const offlineBtn = pageDesktop.locator(
		'button:has-text("Launch Studio in Offline Resilient Engine Mode")',
	);
	if ((await offlineBtn.count()) > 0) {
		await offlineBtn.click();
		await pageDesktop.waitForTimeout(600);
	}

	for (const r of routes) {
		try {
			const btn = pageDesktop.locator(`button[data-nav="${r.id}"]`);
			if ((await btn.count()) > 0) {
				await btn.first().click();
				await pageDesktop.waitForTimeout(400);
				if (r.subAction) {
					await r.subAction(pageDesktop);
				}
				await pageDesktop.screenshot({
					path: path.join(desktopDir, r.file),
				});
				console.log(`  ✓ Desktop: ${r.file}`);
			}
		} catch (err) {
			console.error(`  ✗ Desktop error on ${r.id}:`, err);
		}
	}

	// Capture Opportunity Detail View
	try {
		const oppBtn = pageDesktop.locator('button[data-nav="opportunities"]');
		if ((await oppBtn.count()) > 0) {
			await oppBtn.first().click();
			await pageDesktop.waitForTimeout(400);
			const viewDetailBtn = pageDesktop.locator('button:has-text("View →")');
			if ((await viewDetailBtn.count()) > 0) {
				await viewDetailBtn.first().click();
				await pageDesktop.waitForTimeout(500);
				await pageDesktop.screenshot({
					path: path.join(desktopDir, "03b-opportunity-detail.png"),
				});
				console.log("  ✓ Desktop: 03b-opportunity-detail.png");
			}
		}
	} catch (e) {
		console.error("  ✗ Desktop opp detail error:", e);
	}

	// Capture Project Detail View
	try {
		const projBtn = pageDesktop.locator('button[data-nav="projects"]');
		if ((await projBtn.count()) > 0) {
			await projBtn.first().click();
			await pageDesktop.waitForTimeout(400);
			const openCockpitBtn = pageDesktop.locator(
				'button:has-text("Open Project Cockpit →")',
			);
			if ((await openCockpitBtn.count()) > 0) {
				await openCockpitBtn.first().click();
				await pageDesktop.waitForTimeout(500);
				await pageDesktop.screenshot({
					path: path.join(desktopDir, "06b-project-detail.png"),
				});
				console.log("  ✓ Desktop: 06b-project-detail.png");
			}
		}
	} catch (e) {
		console.error("  ✗ Desktop project detail error:", e);
	}

	// 2. Tablet Viewport (768x1024)
	console.log(`\nCapturing Tablet (768x1024) for ${target}...`);
	const ctxTablet = await browser.newContext({
		viewport: { width: 768, height: 1024 },
	});
	await ctxTablet.addInitScript(() => {
		localStorage.setItem("kreatiwit_offline_session", "true");
		localStorage.setItem("theme", "light");
	});
	const pageTablet = await ctxTablet.newPage();
	await pageTablet.goto("http://localhost:3000", { waitUntil: "networkidle" });
	await pageTablet.waitForTimeout(600);

	const offlineTablet = pageTablet.locator(
		'button:has-text("Launch Studio in Offline Resilient Engine Mode")',
	);
	if ((await offlineTablet.count()) > 0) {
		await offlineTablet.click();
		await pageTablet.waitForTimeout(600);
	}

	for (const r of routes) {
		try {
			await navigateTo(pageTablet, r.id);
			if (r.subAction) {
				await r.subAction(pageTablet);
			}
			await pageTablet.screenshot({
				path: path.join(tabletDir, r.file),
			});
			console.log(`  ✓ Tablet: ${r.file}`);
		} catch (err) {
			console.error(`  ✗ Tablet error on ${r.id}:`, err);
		}
	}

	// 3. Mobile Viewport (390x844)
	console.log(`\nCapturing Mobile (390x844) for ${target}...`);
	const ctxMobile = await browser.newContext({
		viewport: { width: 390, height: 844 },
	});
	await ctxMobile.addInitScript(() => {
		localStorage.setItem("kreatiwit_offline_session", "true");
		localStorage.setItem("theme", "light");
	});
	const pageMobile = await ctxMobile.newPage();
	await pageMobile.goto("http://localhost:3000", { waitUntil: "networkidle" });
	await pageMobile.waitForTimeout(600);

	const offlineMobile = pageMobile.locator(
		'button:has-text("Launch Studio in Offline Resilient Engine Mode")',
	);
	if ((await offlineMobile.count()) > 0) {
		await offlineMobile.click();
		await pageMobile.waitForTimeout(600);
	}

	// First screenshot: Dashboard mobile view
	await pageMobile.screenshot({
		path: path.join(mobileDir, "01-dashboard.png"),
	});
	console.log("  ✓ Mobile: 01-dashboard.png");

	// Open mobile menu
	const mobileMenuTrigger = pageMobile.locator(
		'button[aria-label="Toggle Navigation Menu"]',
	);
	if ((await mobileMenuTrigger.count()) > 0) {
		await mobileMenuTrigger.first().click();
		await pageMobile.waitForTimeout(400);
		await pageMobile.screenshot({
			path: path.join(mobileDir, "00-mobile-drawer.png"),
		});
		console.log("  ✓ Mobile: 00-mobile-drawer.png");
	}

	// Navigate through mobile drawer for all routes
	for (const r of routes) {
		try {
			await navigateTo(pageMobile, r.id);
			if (r.subAction) {
				await r.subAction(pageMobile);
			}
			await pageMobile.screenshot({
				path: path.join(mobileDir, r.file),
			});
			console.log(`  ✓ Mobile: ${r.file}`);
		} catch (e) {
			console.error(`  ✗ Mobile error on ${r.id}:`, e);
		}
	}

	await browser.close();
	console.log(`\nAudit capture for ${target} completed successfully!`);
}

const targetArg = (process.argv[2] as "before" | "after") || "before";
captureAll(targetArg).catch((e) => {
	console.error("Fatal capture error:", e);
	process.exit(1);
});
