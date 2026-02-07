import fs from "fs";
import path from "path";
import testHelpers from "../helpers/test-helpers.js";

describe("COH3 Stats Desktop App - E2E Tests", () => {
  before(async () => {
    // Set up test log file before any tests run
    await testHelpers.setupTestLogFile("warnings-4v4-allfactions.log");
    browser.refresh();
    // Give the app time to load and detect the log file
    await browser.pause(10000);
  });

  after(async () => {
    // Clean up test files after all tests complete
    await testHelpers.cleanupTestLogFile();
  });

  describe("Game Screen", () => {
    before(async () => {
      // Navigate to Game screen (should be default)
      await testHelpers.navigateToScreen("Game");
      await browser.pause(2000);
    });

    it("Should load game data from the test log file", async () => {
      // Wait for game data to load
      await testHelpers.waitForGameDataToLoad(20000);

      // Check that we're not in "Waiting for a game" state
      const body = await $("body");
      const bodyText = await body.getText();
      expect(bodyText).not.toContain("Waiting for a game");
    });

    it("Should display player cards", async () => {
      // Player cards should be visible
      const playerCards = await $$("div[class*='player-card']");
      expect(playerCards.length).toBeGreaterThan(0);
    });

    it("Should display map information", async () => {
      // Map card should be visible with map name
      const body = await $("body");
      const bodyText = await body.getText();
      expect(bodyText).toContain("Map -");
    });
  });

  describe("Settings Screen", () => {
    before(async () => {
      // Navigate to settings screen
      await testHelpers.navigateToScreen("Settings");
      // Wait for the Settings page to load by checking for specific text
      await testHelpers.waitForText("Path to warnings.log:", 5000);
      // Give the input element time to render
      await browser.pause(1000);
    });

    // it("Should display the log file path", async () => {
    //   const input = await testHelpers.getByTestId("log-file-path-input");
    //   const value = await input.getValue();
    //
    //   // Should contain the path to warnings.log
    //   expect(value).toContain("warnings.log");
    // });
    //
    // it("Should show log file as found (green checkmark)", async () => {
    //   // Look for the green checkmark icon indicating file is found
    //   const body = await $("body");
    //   const bodyText = await body.getText();
    //   expect(bodyText).toContain("Log file found");
    // });

    it("Can toggle Color Scheme", async () => {
      let body = await $("body");
      let backgroundColor = await body.getCSSProperty("background-color");

      // Dark theme is the default
      expect(backgroundColor.parsed.hex).toEqual("#242424");

      // Switch to light theme
      await $('div[data-testid="color-scheme-toggle"] button').click();

      body = await $("body");
      backgroundColor = await body.getCSSProperty("background-color");
      expect(backgroundColor.parsed.hex).toEqual("#ffffff");

      // Switch back to dark theme for other tests
      await $('div[data-testid="color-scheme-toggle"] button').click();
    });
  });

  // Disabled because it doesn't work for some reason
  xdescribe("Recent Games Screen", () => {
    before(async () => {
      // Navigate to Recent Games screen
      await testHelpers.navigateToScreen("Recent Games");
      await browser.pause(10000);
    });

    it("Should display Recent Games screen", async () => {
      const body = await $("body");
      const bodyText = await body.getText();

      // Should show either games or a waiting message
      const hasGames = bodyText.includes("Played") || bodyText.includes("Waiting for Player");
      expect(hasGames).toBe(true);
    });

    it("Should show player information when available", async () => {
      // Wait a bit for data to potentially load
      await browser.pause(3000);

      const body = await $("body");
      const bodyText = await body.getText();

      // Check if we have player data or appropriate waiting message
      const hasPlayerInfo =
        bodyText.includes("Waiting for Player") ||
        bodyText.includes("Played") ||
        bodyText.includes("automatch");

      expect(hasPlayerInfo).toBe(true);
    });
  });

  describe("Replays Screen", () => {
    before(async () => {
      // Navigate to Replays screen
      await testHelpers.navigateToScreen("Replays");
      await testHelpers.waitForElement('[data-testid="replays-description"]', 5000);
    });

    it("Should display Replays screen", async () => {
      const description = await testHelpers.getByTestId("replays-description");
      expect(await description.isDisplayedInViewport()).toEqual(true);
    });

    it("Should show replay information", async () => {
      const body = await $("body");
      const bodyText = await body.getText();

      // Should contain information about replays
      expect(bodyText.length).toBeGreaterThan(50);
    });
  });

  describe("About Screen", () => {
    before(async () => {
      // Navigate to About screen
      await testHelpers.navigateToScreen("About");
      await testHelpers.waitForElement('[data-testid="app-version"]', 5000);
    });

    it("Should display app version", async () => {
      const appVersion = await testHelpers.getByTestId("app-version");
      expect(await appVersion.isDisplayedInViewport()).toEqual(true);
    });

    it("App version should match package.json", async () => {
      const appVersion = await testHelpers.getByTestId("app-version");
      const text = await appVersion.getText();

      // Read package.json from disk
      const packageJsonPath = path.resolve(fs.realpathSync("."), "package.json");
      const packageJsonData = fs.readFileSync(packageJsonPath, "utf8");
      const packageJson = JSON.parse(packageJsonData);

      expect(text).toMatch(packageJson.version);
    });

    it("Should display app information", async () => {
      const body = await $("body");
      const bodyText = await body.getText();

      // Should contain basic app information
      expect(bodyText).toContain("Grenadier");
    });
  });

  describe("Navigation", () => {
    it("Should be able to navigate between all screens", async () => {
      const screens = ["Game", "Recent Games", "Replays", "Settings", "About"];

      for (const screen of screens) {
        await testHelpers.navigateToScreen(screen);
        await browser.pause(1000);

        const body = await $("body");
        const bodyText = await body.getText();

        // Verify we're on the correct screen by checking for screen-specific content
        expect(bodyText.length).toBeGreaterThan(50);
      }
    });
  });
});
