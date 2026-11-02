import os
import asyncio
from playwright.async_api import async_playwright

async def capture_before():
    before_dir = "artifacts/ui-audit/before"
    os.makedirs(f"{before_dir}/desktop-light", exist_ok=True)
    os.makedirs(f"{before_dir}/desktop-dark", exist_ok=True)
    os.makedirs(f"{before_dir}/tablet-light", exist_ok=True)
    os.makedirs(f"{before_dir}/mobile-light", exist_ok=True)

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)

        # 1. Desktop Light (1440x900)
        context = await browser.new_context(viewport={"width": 1440, "height": 900})
        await context.add_init_script("localStorage.setItem('kreatiwit_offline_session', 'true'); localStorage.setItem('theme', 'light');")
        page = await context.new_page()
        await page.goto("http://localhost:3000", wait_until="networkidle")
        await page.wait_for_timeout(1000)

        # If offline launch button appears, click it
        offline_btn = page.locator('button:has-text("Launch Studio in Offline Resilient Engine Mode")')
        if await offline_btn.count() > 0:
            await offline_btn.click()
            await page.wait_for_timeout(1000)

        routes = [
            ("overview", "01-dashboard.png"),
            ("pipeline", "02-pipeline.png"),
            ("opportunities", "03-opportunities.png"),
            ("clients", "04-clients.png"),
            ("projects", "05-projects.png"),
            ("tasks", "06-tasks.png"),
            ("finance", "07-finance.png"),
            ("team", "08-team.png"),
        ]

        for nav_id, filename in routes:
            btn = page.locator(f'button[data-nav="{nav_id}"]')
            if await btn.count() > 0:
                await btn.click()
                await page.wait_for_timeout(500)
                await page.screenshot(path=f"{before_dir}/desktop-light/{filename}")

        # 2. Desktop Dark (1440x900)
        context_dark = await browser.new_context(viewport={"width": 1440, "height": 900})
        await context_dark.add_init_script("localStorage.setItem('kreatiwit_offline_session', 'true'); localStorage.setItem('theme', 'dark');")
        page_dark = await context_dark.new_page()
        await page_dark.goto("http://localhost:3000", wait_until="networkidle")
        await page_dark.wait_for_timeout(1000)
        if await page_dark.locator('button:has-text("Launch Studio in Offline Resilient Engine Mode")').count() > 0:
            await page_dark.locator('button:has-text("Launch Studio in Offline Resilient Engine Mode")').click()
            await page_dark.wait_for_timeout(1000)

        for nav_id, filename in routes[:4]:
            btn = page_dark.locator(f'button[data-nav="{nav_id}"]')
            if await btn.count() > 0:
                await btn.click()
                await page_dark.wait_for_timeout(500)
                await page_dark.screenshot(path=f"{before_dir}/desktop-dark/{filename}")

        # 3. Tablet Light (768x1024)
        context_tablet = await browser.new_context(viewport={"width": 768, "height": 1024})
        await context_tablet.add_init_script("localStorage.setItem('kreatiwit_offline_session', 'true'); localStorage.setItem('theme', 'light');")
        page_tablet = await context_tablet.new_page()
        await page_tablet.goto("http://localhost:3000", wait_until="networkidle")
        await page_tablet.wait_for_timeout(1000)
        if await page_tablet.locator('button:has-text("Launch Studio in Offline Resilient Engine Mode")').count() > 0:
            await page_tablet.locator('button:has-text("Launch Studio in Offline Resilient Engine Mode")').click()
            await page_tablet.wait_for_timeout(1000)
        await page_tablet.screenshot(path=f"{before_dir}/tablet-light/01-dashboard.png")

        # 4. Mobile Light (390x844)
        context_mobile = await browser.new_context(viewport={"width": 390, "height": 844})
        await context_mobile.add_init_script("localStorage.setItem('kreatiwit_offline_session', 'true'); localStorage.setItem('theme', 'light');")
        page_mobile = await context_mobile.new_page()
        await page_mobile.goto("http://localhost:3000", wait_until="networkidle")
        await page_mobile.wait_for_timeout(1000)
        if await page_mobile.locator('button:has-text("Launch Studio in Offline Resilient Engine Mode")').count() > 0:
            await page_mobile.locator('button:has-text("Launch Studio in Offline Resilient Engine Mode")').click()
            await page_mobile.wait_for_timeout(1000)
        await page_mobile.screenshot(path=f"{before_dir}/mobile-light/01-dashboard.png")

        await browser.close()
    print("BEFORE UI AUDIT CAPTURED SUCCESSFULLY!")

asyncio.run(capture_before())
