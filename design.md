# Tsenta ATS Automation Engine

## 🏗️ Architecture & Approach
To handle the stark differences between Acme (Multi-step Wizard) and Globex (Accordion + Async UI), I implemented a **Strategy Pattern**. 
- **`BaseAutomator`**: An abstract class containing core logic and "humanizing" utilities to ensure interactions feel organic.
- **`AcmeAutomator` & `GlobexAutomator`**: Concrete implementations that handle platform-specific UI quirks (e.g., handling conditional visa blocks or async shuffled typeaheads).
- **`automator.ts` (Orchestrator)**: Dynamically iterates through available engines and matches them to the current URL. This means adding a third ATS (like Workday or Lever) requires *zero* changes to existing code—you simply drop in a new engine class.

## 🤖 Human-Like Behavior Implementation
To bypass bot detection and simulate real user interaction, I built custom Playwright wrappers:
1. **`humanType`**: Replaces standard `page.fill()` by typing character-by-character with randomized millisecond delays between keystrokes.
2. **`humanClick`**: Adds a micro-delay (hover simulation) before executing the click.
3. **Pacing**: Added strategic `this.wait()` pauses to simulate reading and reviewing pages.

## ⚡ Handling the Edge Cases
- **The Globex Async Typeahead**: Instead of relying on fragile CSS indices for a shuffled list, I used Playwright's `:has-text` locators to wait dynamically until the exact text node was injected into the DOM by the simulated network request.
- **The Globex Salary Slider**: Calculated the precise bounding box of the `<input type="range">` and used coordinate-based mouse clicks to hit the exact 52% mark for the target salary.

## 🛠️ Tools Used
- **Playwright** for browser automation.
- **TypeScript** for strict type safety and OOP implementation.
- **Gemini** as an AI pair-programmer to bounce architectural patterns (like the Strategy pattern) and rapidly generate boilerplate Playwright configurations.

## 📉 Trade-offs & Next Steps
Given the time constraint, I opted for strict DOM selector mapping over full LLM-vision interpretation. While an LLM-vision agent is more resilient to major UI overhauls, the Strategy Pattern approach is significantly faster, more deterministic, and less expensive to run at scale.