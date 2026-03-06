import { BaseAutomator } from "./base.automator";
import { UserProfile } from "../types";
import path from "path";

export class AcmeAutomator extends BaseAutomator {
  constructor(page: any) {
    super(page, "AcmeCorp");
  }

  async canHandle(): Promise<boolean> {
    return this.page.url().includes("acme");
  }

  async apply(profile: UserProfile): Promise<{ success: boolean; confirmationId?: string; error?: string }> {
    this.log("Starting Multi-Step Wizard Flow...");

    try {
      // STEP 1: Personal Info (Using exact IDs from HTML)
      await this.humanType("#first-name", profile.firstName);
      await this.humanType("#last-name", profile.lastName);
      await this.humanType("#email", profile.email);
      await this.humanType("#phone", profile.phone);
      await this.humanType("#location", profile.location);
      await this.humanClick('button[onclick="nextStep(1)"]');

      // STEP 2: Experience & Education
      const filePath = path.resolve("fixtures/sample-resume.pdf");
      const fileInput = await this.page.$("#resume");
      if (fileInput) await fileInput.setInputFiles(filePath);

      // Select dropdowns
      await this.page.selectOption("#experience-level", { index: 2 }); // Just picks a valid option
      await this.page.selectOption("#education", { value: "bachelors" });

      // School Typeahead
      await this.humanType("#school", "University");
      await this.page.waitForSelector("#school-dropdown li", { state: "visible" });
      await this.humanClick("#school-dropdown li:first-child");

      // Checkboxes (Skills)
      const standardSkills = ["javascript", "react", "python", "git"];
      for (const skill of standardSkills) {
        const checkbox = await this.page.$(`input[name="skills"][value="${skill}"]`);
        if (checkbox) await checkbox.click(); // Standard click for checkboxes
      }
      await this.humanClick('button[onclick="nextStep(2)"]');

      // STEP 3: Questions
      await this.humanClick('input[name="workAuth"][value="yes"]');
      await this.humanType("#start-date", "2026-06-01"); // YYYY-MM-DD
      await this.humanType("#salary-expectation", "120000");
      await this.page.selectOption("#referral", { value: "linkedin" });
      await this.humanType("#cover-letter", "I love building scalable automation systems and I am highly motivated to join your engineering team. Let's build great things together!");
      await this.humanClick('button[onclick="nextStep(3)"]');

      // STEP 4: Review & Submit
      await this.wait(1000, 1500); // Read the review page
      await this.humanClick("#terms-agree");
      await this.humanClick("#submit-btn");

      // SUCCESS!
      await this.page.waitForSelector("#confirmation-id", { timeout: 10000 });
      const confId = await this.page.innerText("#confirmation-id");

      return { success: true, confirmationId: confId };
    } catch (e: any) {
      this.log(`Wizard Interrupted: ${e.message}`);
      return { success: false, error: e.message };
    }
  }
}