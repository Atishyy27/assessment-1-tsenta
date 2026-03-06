import { BaseAutomator } from "./base.automator";
import { UserProfile } from "../types";
import path from "path";

export class GlobexAutomator extends BaseAutomator {
  constructor(page: any) {
    super(page, "GlobexCorp");
  }

  async canHandle(): Promise<boolean> {
    return this.page.url().includes("globex");
  }

  async apply(profile: UserProfile): Promise<{ success: boolean; confirmationId?: string; error?: string }> {
    this.log("Initiating Accordion Destruction...");
    
    try {
      // 1. Expand all sections safely
      const closedHeaders = await this.page.$$('.section-header:not(.open)');
      for (const header of closedHeaders) { 
        await header.click(); 
        await this.wait(200, 400); 
      }

      // 2. Personal Details
      await this.humanType("#g-fname", profile.firstName);
      await this.humanType("#g-lname", profile.lastName);
      await this.humanType("#g-email", profile.email);
      await this.humanType("#g-phone", profile.phone);
      await this.humanType("#g-city", profile.location);

      // 3. Qualifications
      const filePath = path.resolve("fixtures/sample-resume.pdf");
      const fileInput = await this.page.$("#g-resume");
      if (fileInput) await fileInput.setInputFiles(filePath);

      await this.page.selectOption("#g-experience", { value: "junior" });
      await this.page.selectOption("#g-degree", { value: "bs" });

      // Async School Typeahead (The Trickiest Part)
      await this.humanType("#g-school", "University");
      await this.page.waitForSelector("#g-school-results li:not(.typeahead-no-results)", { state: "visible", timeout: 8000 });
      await this.humanClick("#g-school-results li:first-child");

      // Skill Chips
      const chipsToClick = ["React", "JavaScript", "Git"];
      for (const skill of chipsToClick) {
        const chip = await this.page.locator('.chip', { hasText: skill });
        if (await chip.count() > 0) {
          await chip.click();
          await this.wait(100, 200);
        }
      }

      // 4. Additional Info
      const authToggle = await this.page.$("#g-work-auth-toggle");
      if (authToggle) {
        const isAuth = await authToggle.getAttribute("data-value");
        if (isAuth === "false") await authToggle.click(); // Turn it ON
      }

      await this.humanType("#g-start-date", "2026-06-01");
      
      // Salary Slider Precision
      const slider = await this.page.$("#g-salary");
      if (slider) {
        const box = await slider.boundingBox();
        if (box) {
          // Range is 30k to 200k. Target 120k is ~52% along the track.
          const targetX = box.x + (box.width * 0.52);
          await this.page.mouse.click(targetX, box.y + (box.height / 2));
        }
      }

      await this.page.selectOption("#g-source", { value: "linkedin" });
      await this.humanType("#g-motivation", "I am highly adaptable, eager to contribute to the frontend architecture, and I love the mission of Globex Corporation.");

      // 5. Submit
      await this.humanClick("#g-consent");
      await this.humanClick("#globex-submit");

      // Success
      await this.page.waitForSelector("#globex-ref", { timeout: 10000 });
      const ref = await this.page.innerText("#globex-ref");

      return { success: true, confirmationId: ref };
    } catch (e: any) {
      this.log(`Accordion Failed: ${e.message}`);
      return { success: false, error: e.message };
    }
  }
}