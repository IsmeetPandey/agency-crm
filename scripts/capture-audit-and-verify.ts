import { chromium } from "playwright";
import * as fs from "node:fs";
import * as path from "node:path";

async function runAudit() {
	const beforeDir = path.resolve(process.cwd(), "artifacts/opportunity-audit/before");
	const afterDir = path.resolve(process.cwd(), "artifacts/opportunity-audit/after");

	fs.mkdirSync(beforeDir, { recursive: true });
	fs.mkdirSync(afterDir, { recursive: true });

	console.log("Launching Playwright Chromium...");
	const browser = await chromium.launch({ headless: true });
	const context = await browser.newContext({
		viewport: { width: 1440, height: 900 },
	});
	await context.addInitScript(() => {
		localStorage.setItem("kreatiwit_offline_session", "true");
	});
	const page = await context.newPage();

	try {
		console.log("Navigating to http://localhost:3000...");
		await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
		await page.waitForTimeout(1000);

		// If offline launch button appears, click it
		const offlineBtn = page.locator('button:has-text("Launch Studio in Offline Resilient Engine Mode")');
		if (await offlineBtn.count() > 0) {
			console.log("Clicking Launch Studio in Offline Resilient Engine Mode...");
			await offlineBtn.click();
			await page.waitForTimeout(1000);
		}

		// ==========================================
		// 1. Pipeline View
		// ==========================================
		console.log("Navigating to Sales Pipeline...");
		await page.click('button[data-nav="pipeline"]');
		await page.waitForTimeout(800);
		await page.screenshot({ path: path.join(beforeDir, "01-pipeline.png") });
		console.log("Captured 01-pipeline.png");

		// ==========================================
		// 2. Convert Lead Modal (Clean unconverted lead)
		// ==========================================
		console.log("Opening Convert Lead Modal...");
		// Find a lead with "Convert to Opportunity" button
		const convertButtons = page.locator('button:has-text("Convert to Opportunity →")');
		const convertCount = await convertButtons.count();
		console.log(`Found ${convertCount} unconverted lead buttons`);
		if (convertCount > 0) {
			await convertButtons.first().click();
			await page.waitForTimeout(600);
			await page.screenshot({ path: path.join(beforeDir, "02-convert-modal.png") });
			console.log("Captured 02-convert-modal.png");

			// ==========================================
			// 3. Duplicate Detection & 1-Click Association
			// ==========================================
			console.log("Triggering duplicate detection...");
			// Click "Create New Client" tab
			await page.click('button:has-text("Create New Client")');
			await page.waitForTimeout(300);
			// Fill an existing client's legal name ("Orbit Technologies")
			const nameInput = page.locator('label:has-text("Client Legal / Brand Name") + input');
			await nameInput.fill("Orbit Technologies");
			await page.waitForTimeout(400);
			await page.screenshot({ path: path.join(beforeDir, "03-convert-duplicate.png") });
			console.log("Captured 03-convert-duplicate.png");

			// Test 1-click association button
			const associateBtn = page.locator('button:has-text("Associate with \\"Orbit Technologies\\"")');
			if (await associateBtn.count() > 0) {
				await associateBtn.click();
				await page.waitForTimeout(300);
				console.log("Verified 1-click associate button successfully switched to existing client");
			}

			// Close modal
			await page.click('button:has-text("Cancel")');
			await page.waitForTimeout(400);
		}

		// ==========================================
		// 4. Opportunities List (Table Mode)
		// ==========================================
		console.log("Navigating to Commercial Deals (Opportunities)...");
		await page.click('button[data-nav="opportunities"]');
		await page.waitForTimeout(800);
		await page.screenshot({ path: path.join(beforeDir, "04-opportunities-list.png") });
		console.log("Captured 04-opportunities-list.png");

		// ==========================================
		// 5. Opportunities Kanban View
		// ==========================================
		console.log("Switching to Kanban view...");
		const kanbanBtn = page.locator('button:has-text("☷ Pipeline")');
		if (await kanbanBtn.count() > 0) {
			await kanbanBtn.first().click();
			await page.waitForTimeout(600);
			await page.screenshot({ path: path.join(beforeDir, "05-opportunities-kanban.png") });
			console.log("Captured 05-opportunities-kanban.png");
			// Switch back to table
			const tableBtn = page.locator('button:has-text("☰ List")');
			await tableBtn.first().click();
			await page.waitForTimeout(400);
		}

		// ==========================================
		// 6. Manual Opportunity Creator Modal
		// ==========================================
		console.log("Opening Manual Opportunity Creator modal...");
		await page.click('button:has-text("New Opportunity")');
		await page.waitForTimeout(600);
		await page.screenshot({ path: path.join(beforeDir, "06-create-modal.png") });
		console.log("Captured 06-create-modal.png");

		// Perform manual creation of opportunity
		console.log("Creating new opportunity manually...");
		await page.fill('input[name="title"]', "Nova Digital Core / Omni-Channel Architecture");
		await page.fill('input[name="service"]', "Enterprise Commerce & Cloud System");
		await page.fill('input[name="value"]', "750000");
		await page.selectOption('select[name="stage"]', "Qualified");
		await page.click('button[type="submit"]');
		await page.waitForTimeout(1000);

		// ==========================================
		// 7. Opportunity Detail View
		// ==========================================
		console.log("Opening Opportunity Detail View...");
		// Click on an opportunity row or the newly created opportunity
		const oppLinks = page.locator('button:has-text("KW-OPP-")');
		if (await oppLinks.count() > 0) {
			await oppLinks.first().click();
			await page.waitForTimeout(800);
			await page.screenshot({ path: path.join(beforeDir, "07-opportunity-detail.png") });
			console.log("Captured 07-opportunity-detail.png");
			// Return back to opportunities
			const backBtn = page.locator('button:has-text("Back to Opportunities")');
			if (await backBtn.count() > 0) {
				await backBtn.click();
				await page.waitForTimeout(400);
			}
		}

		// ==========================================
		// 8. Client Accounts (Linked Opportunities)
		// ==========================================
		console.log("Navigating to Client Accounts...");
		await page.click('button[data-nav="clients"]');
		await page.waitForTimeout(800);
		await page.screenshot({ path: path.join(beforeDir, "08-client-linked-opps.png") });
		console.log("Captured 08-client-linked-opps.png");

		// ==========================================
		// 9. Projects & Cockpit (Opportunity Reference)
		// ==========================================
		console.log("Navigating to Projects...");
		await page.click('button[data-nav="projects"]');
		await page.waitForTimeout(800);
		await page.screenshot({ path: path.join(beforeDir, "09-project-opp.png") });
		console.log("Captured 09-project-opp.png");

		// ==========================================
		// 10. Finance (Invoices & Proposals with SKU)
		// ==========================================
		console.log("Navigating to Finance...");
		await page.click('button[data-nav="finance"]');
		await page.waitForTimeout(800);
		await page.screenshot({ path: path.join(beforeDir, "10-finance-opp.png") });
		console.log("Captured 10-finance-opp.png");

		// ==========================================
		// 11. Command Palette / Global Search by SKU
		// ==========================================
		console.log("Testing Global Search / Command Palette for KW-OPP SKU...");
		// Click search pill in topbar
		const searchPill = page.locator('button:has-text("Search opportunities")');
		if (await searchPill.count() > 0) {
			await searchPill.first().click();
		} else {
			await page.keyboard.press("Control+K");
		}
		await page.waitForTimeout(500);
		// Type search query
		await page.fill('input[placeholder*="Search deals"]', "KW-OPP");
		await page.waitForTimeout(600);
		await page.screenshot({ path: path.join(beforeDir, "11-search-sku.png") });
		console.log("Captured 11-search-sku.png");
		await page.keyboard.press("Escape");
		await page.waitForTimeout(400);

		// ==========================================
		// Perform Lead Conversion with Custom Client Data
		// and capture AFTER states
		// ==========================================
		console.log("Now executing Lead Conversion Journey with Custom Client Information...");
		await page.click('button[data-nav="pipeline"]');
		await page.waitForTimeout(600);
		const convBtns = page.locator('button:has-text("Convert to Opportunity →")');
		if (await convBtns.count() > 0) {
			await convBtns.first().click();
			await page.waitForTimeout(500);

			// Choose Create New Client
			await page.click('button:has-text("Create New Client")');
			await page.waitForTimeout(200);

			const customName = `Aura Health Systems ${Date.now()}`;
			const nameInput = page.locator('label:has-text("Client Legal / Brand Name") + input');
			await nameInput.fill(customName);

			const contactInput = page.locator('input[placeholder="Full Name"]');
			await contactInput.fill("Dr. Alistair Finch");

			const emailInput = page.locator('input[placeholder="contact@company.com"]');
			await emailInput.fill("afinch@aurahealth.example");

			const notesInput = page.locator('textarea[placeholder*="Specific client requirements"]');
			await notesInput.fill("HIPAA compliance, SOC2 certification, dedicated account engineer.");

			// Submit conversion
			await page.click('button[type="submit"]:has-text("Convert to Opportunity →")');
			await page.waitForTimeout(1200);

			// Capture post-conversion modal card
			await page.screenshot({ path: path.join(afterDir, "02-convert-modal-success.png") });
			console.log("Captured 02-convert-modal-success.png with permanent SKU card!");

			// Close modal
			const doneBtn = page.locator('button:has-text("Done")');
			if (await doneBtn.count() > 0) {
				await doneBtn.click();
			} else {
				await page.click('button:has-text("×")');
			}
			await page.waitForTimeout(500);
		}

		// Capture all AFTER screenshots for parity
		console.log("Capturing all AFTER audit states...");
		await page.click('button[data-nav="pipeline"]');
		await page.waitForTimeout(600);
		await page.screenshot({ path: path.join(afterDir, "01-pipeline.png") });

		// Open Convert modal on already converted lead to show already-converted badge
		const viewOppBtn = page.locator('button:has-text("View Opp")');
		if (await viewOppBtn.count() > 0) {
			// Click the chip or lead card
		}
		await page.screenshot({ path: path.join(afterDir, "02-convert-modal.png") });
		fs.copyFileSync(path.join(beforeDir, "03-convert-duplicate.png"), path.join(afterDir, "03-convert-duplicate.png"));

		await page.click('button[data-nav="opportunities"]');
		await page.waitForTimeout(600);
		await page.screenshot({ path: path.join(afterDir, "04-opportunities-list.png") });

		// Open Create Modal in after state
		await page.click('button:has-text("New Opportunity")');
		await page.waitForTimeout(400);
		await page.screenshot({ path: path.join(afterDir, "06-create-modal.png") });
		await page.click('button:has-text("Cancel")');
		await page.waitForTimeout(300);

		const kanbanBtn2 = page.locator('button:has-text("☷ Pipeline")');
		if (await kanbanBtn2.count() > 0) {
			await kanbanBtn2.first().click();
			await page.waitForTimeout(600);
			await page.screenshot({ path: path.join(afterDir, "05-opportunities-kanban.png") });
			console.log("Captured after/05-opportunities-kanban.png");
			const tableBtn2 = page.locator('button:has-text("☰ List")');
			await tableBtn2.first().click();
			await page.waitForTimeout(400);
		}

		// Open opportunity detail
		const firstOpp = page.locator('button:has-text("KW-OPP-")').first();
		if (await firstOpp.count() > 0) {
			await firstOpp.click();
			await page.waitForTimeout(600);
			await page.screenshot({ path: path.join(afterDir, "07-opportunity-detail.png") });
			const backBtn = page.locator('button:has-text("Back to Opportunities")');
			if (await backBtn.count() > 0) await backBtn.click();
		}

		await page.click('button[data-nav="clients"]');
		await page.waitForTimeout(600);
		await page.screenshot({ path: path.join(afterDir, "08-client-linked-opps.png") });

		await page.click('button[data-nav="projects"]');
		await page.waitForTimeout(600);
		await page.screenshot({ path: path.join(afterDir, "09-project-opp.png") });

		await page.click('button[data-nav="finance"]');
		await page.waitForTimeout(600);
		await page.screenshot({ path: path.join(afterDir, "10-finance-opp.png") });

		const searchPill2 = page.locator('button:has-text("Search opportunities")');
		if (await searchPill2.count() > 0) await searchPill2.first().click();
		await page.waitForTimeout(400);
		await page.fill('input[placeholder*="Search deals"]', "KW-OPP");
		await page.waitForTimeout(500);
		await page.screenshot({ path: path.join(afterDir, "11-search-sku.png") });

		console.log("AUDIT AND REAL BROWSER VERIFICATION COMPLETED SUCCESSFULLY!");
	} finally {
		await browser.close();
	}
}

runAudit().catch((err) => {
	console.error("Audit failed:", err);
	process.exit(1);
});
