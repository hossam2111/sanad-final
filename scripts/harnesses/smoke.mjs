import { chromium } from '@playwright/test';

const baseURL = 'http://localhost:3000';
let pass = 0;
let fail = 0;

function check(msg, cond) {
  if (cond) {
    console.log(`  PASS  ${msg}`);
    pass++;
  } else {
    console.log(`  FAIL  ${msg}`);
    fail++;
  }
}

async function runTests() {
  console.log("\n══ Playwright Smoke Tests ══");
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();

  try {
    console.log("── Citizen Portal ──");
    const page1 = await context.newPage();
    await page1.goto(`${baseURL}/login`);
    await page1.fill('input[type="text"]', 'citizen_demo');
    await page1.fill('input[type="password"]', 'Citizen@2026');
    await page1.click('button[type="submit"]');
    await page1.waitForURL('**/citizen*', { timeout: 10000 });
    check("Citizen login navigated to /citizen", page1.url().includes('/citizen'));
    await page1.close();

    console.log("── Doctor Portal ──");
    const page2 = await context.newPage();
    await page2.goto(`${baseURL}/login`);
    await page2.fill('input[type="text"]', 'dr.rashidi');
    await page2.fill('input[type="password"]', 'Doctor@2026');
    await page2.click('button[type="submit"]');
    await page2.waitForURL('**/doctor*', { timeout: 10000 });
    check("Doctor login navigated to /doctor", page2.url().includes('/doctor'));
    await page2.close();

    console.log("── Admin Portal ──");
    const page3 = await context.newPage();
    await page3.goto(`${baseURL}/login`);
    await page3.fill('input[type="text"]', 'admin.saad');
    await page3.fill('input[type="password"]', 'Admin@2026');
    await page3.click('button[type="submit"]');
    await page3.waitForURL('**/admin*', { timeout: 10000 });
    check("Admin login navigated to /admin", page3.url().includes('/admin'));
    await page3.close();

    console.log("── Supply Chain Portal ──");
    const page4 = await context.newPage();
    await page4.goto(`${baseURL}/login`);
    await page4.fill('input[type="text"]', 'supply.ibrahim');
    await page4.fill('input[type="password"]', 'Supply@2026');
    await page4.click('button[type="submit"]');
    await page4.waitForURL('**/supply-chain*', { timeout: 10000 });
    check("Supply Chain login navigated to /supply-chain", page4.url().includes('/supply-chain'));
    await page4.close();

  } catch (err) {
    console.error(err);
    fail++;
  } finally {
    await browser.close();
  }

  console.log(`\n══ ${pass} passed, ${fail} failed ══`);
  process.exitCode = fail ? 1 : 0;
}

runTests();
