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

// All 12 portals — credentials mirror DEMO_RUNBOOK.md
const PORTALS = [
  { label: "Citizen",      username: "citizen_demo",    password: "Citizen@2026",   path: "/citizen" },
  { label: "Doctor",       username: "dr.rashidi",      password: "Doctor@2026",    path: "/doctor" },
  { label: "Admin",        username: "admin.saad",      password: "Admin@2026",     path: "/admin" },
  { label: "Emergency",    username: "emergency_unit7", password: "Emergency@2026", path: "/emergency" },
  { label: "Lab",          username: "lab.sara",        password: "Lab@2026",       path: "/lab" },
  { label: "Pharmacy",     username: "pharm.hassan",    password: "Pharmacy@2026",  path: "/pharmacy" },
  { label: "Hospital",     username: "hosp.ops",        password: "Hospital@2026",  path: "/hospital" },
  { label: "Insurance",    username: "ins.nora",        password: "Insurance@2026", path: "/insurance" },
  { label: "AI Control",   username: "ai.khalid",       password: "AiControl@2026", path: "/ai-control" },
  { label: "Research",     username: "research.reem",   password: "Research@2026",  path: "/research" },
  { label: "Family",       username: "family.fatima",   password: "Family@2026",    path: "/family" },
  { label: "Supply Chain", username: "supply.ibrahim",  password: "Supply@2026",    path: "/supply-chain" },
];

async function runTests() {
  console.log("\n══ Playwright Smoke Tests — all 12 portals ══");

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();

  for (const p of PORTALS) {
    try {
      const page = await context.newPage();
      await page.goto(`${baseURL}/login`);
      await page.fill('input[type="text"]', p.username);
      await page.fill('input[type="password"]', p.password);
      await page.click('button[type="submit"]');
      await page.waitForURL(`**${p.path}*`, { timeout: 15000 });
      check(`${p.label} login navigated to ${p.path}`, page.url().includes(p.path));
      await page.close();
    } catch (err) {
      check(`${p.label} login navigated to ${p.path}`, false);
      console.error(`        ${err.message?.split("\n")[0]}`);
    }
  }

  await browser.close();

  console.log(`\n══ ${pass} passed, ${fail} failed ══`);
  process.exitCode = fail ? 1 : 0;
}

runTests();
