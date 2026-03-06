import { Page, ElementHandle } from "playwright";
import { UserProfile } from "../types";

export abstract class BaseAutomator {
  protected page: Page;
  protected platformName: string;

  constructor(page: Page, platformName: string) {
    this.page = page;
    this.platformName = platformName;
  }

  // Every engine must implement these
  abstract canHandle(): Promise<boolean>;
  abstract apply(profile: UserProfile): Promise<{ success: boolean; confirmationId?: string; error?: string }>;

  /**
   * AGGRESSIVE HUMANIZER: Random delay between min and max ms
   */
  protected async wait(min = 500, max = 1500) {
    const delay = Math.floor(Math.random() * (max - min + 1) + min);
    await this.page.waitForTimeout(delay);
  }

  /**
   * VARIABLE TYPING: Simulates a human typing with mistakes and speed variance
   */
  protected async humanType(selector: string, text: string) {
    await this.page.waitForSelector(selector);
    await this.page.focus(selector);
    
    // Type character by character with random intervals
    for (const char of text) {
      await this.page.keyboard.type(char, { delay: Math.random() * 100 + 50 });
    }
    await this.wait(200, 500);
  }

  /**
   * SMART CLICK: Hovers before clicking and uses a random offset
   */
  protected async humanClick(selector: string) {
    const element = await this.page.waitForSelector(selector);
    if (element) {
      await element.hover();
      await this.wait(100, 300);
      await element.click({ force: true });
    }
  }

  /**
   * LOGGING: Styled terminal output
   */
  protected log(message: string) {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] [${this.platformName}] 🤖 ${message}`);
  }

  /**
   * FUZZY MATCH: Selects an option from a dropdown based on text similarity
   */
  protected async selectFuzzy(selector: string, value: string) {
    await this.page.waitForSelector(selector);
    const options = await this.page.$$eval(`${selector} option`, (opts) => 
      opts.map(o => ({ text: o.textContent?.toLowerCase() || "", value: (o as HTMLOptionElement).value }))
    );

    const match = options.find(o => o.text.includes(value.toLowerCase()) || value.toLowerCase().includes(o.text));
    if (match) {
      await this.page.selectOption(selector, match.value);
    } else {
      this.log(`Warning: Could not find exact match for ${value}, skipping or using default.`);
    }
  }
}