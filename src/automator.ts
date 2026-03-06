import { chromium, Browser, BrowserContext, Page } from "playwright";
import { sampleProfile } from "./profile";
import type { ApplicationResult, UserProfile } from "./types";
import { AcmeAutomator } from "./engines/acme.automator";
import { GlobexAutomator } from "./engines/globex.automator";

const BASE_URL = "http://localhost:3939";

async function applyToJob(
  url: string,
  profile: UserProfile
): Promise<ApplicationResult> {
  const startTime = Date.now();
  const browser: Browser = await chromium.launch({ 
    headless: false,
    slowMo: 50 // Slight global slow down to assist visibility
  });
  
  const context: BrowserContext = await browser.newContext();
  const page: Page = await context.newPage();

  try {
    await page.goto(url);

    // Platform Detection & Engine Selection
    const engines = [
      new AcmeAutomator(page),
      new GlobexAutomator(page)
    ];

    let result: ApplicationResult | null = null;

    for (const engine of engines) {
      if (await engine.canHandle()) {
        // Execute the strategy
        const submission = await engine.apply(profile);
        
        result = {
          success: submission.success,
          confirmationId: submission.confirmationId,
          durationMs: Date.now() - startTime,
          error: submission.error
        };
        break;
      }
    }

    if (!result) {
      throw new Error(`No compatible engine found for URL: ${url}`);
    }

    await browser.close();
    return result;

  } catch (err: any) {
    // Take a failure screenshot if things go south
    const screenshotPath = `failures/error-${Date.now()}.png`;
    await page.screenshot({ path: screenshotPath });
    await browser.close();

    return {
      success: false,
      error: err.message,
      screenshotPath,
      durationMs: Date.now() - startTime,
    };
  }
}

async function main() {
  const targets = [
    { name: "Acme Corp", url: `${BASE_URL}/acme.html` },
    { name: "Globex Corporation", url: `${BASE_URL}/globex.html` },
  ];

  const finalSummary = [];

  for (const target of targets) {
    console.log(`\n[INITIATING] Applying to ${target.name}...`);

    try {
      const result = await applyToJob(target.url, sampleProfile);

      if (result.success) {
        console.log(`SUCCESS] Application submitted!`);
        console.log(`Confirmation: ${result.confirmationId}`);
        console.log(`Duration: ${result.durationMs}ms`);
        finalSummary.push({ Platform: target.name, Status: "PASSED", ID: result.confirmationId });
      } else {
        console.error(`[FAILED] ${result.error}`);
        finalSummary.push({ Platform: target.name, Status: "FAILED", ID: "N/A" });
      }
    } catch (err) {
      console.error(`[FATAL ERROR]:`, err);
    }
  }

  console.log("\n--- FINAL EXECUTION SUMMARY ---");
  console.table(finalSummary);
}

main();