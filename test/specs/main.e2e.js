import testHelpers from "../helpers/test-helpers.js";
import {
  NavigationPage,
  GamePage,
  SettingsPage,
  RecentGamesPage,
  ReplaysPage,
  AboutPage,
  HeaderPage,
} from "../helpers/pages/index.js";

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
      await NavigationPage.navigateToGame();
      await GamePage.pause(2000);
    });

    it("Should load game data from the test log file", async () => {
      // Wait for game data to load
      await GamePage.waitForGameDataToLoad(20000);

      // Check that we're not in "Waiting for a game" state
      expect(await GamePage.isWaitingForGame()).toBe(false);
    });

    it("Should display player cards", async () => {
      // Player cards should be visible
      expect(await GamePage.hasPlayerCards()).toBe(true);
      expect(await GamePage.getPlayerCardCount()).toBeGreaterThan(0);
    });

    it("Should display map information", async () => {
      // Map card should be visible with map name
      expect(await GamePage.hasMapInformation()).toBe(true);
    });
  });

  describe("Settings Screen", () => {
    before(async () => {
      // Navigate to settings screen
      await NavigationPage.navigateToSettings();
      // Wait for the Settings page to load
      await SettingsPage.waitForPageLoad();
    });

    // it("Should display the log file path", async () => {
    //   const path = await SettingsPage.getLogFilePath();
    //   // Should contain the path to warnings.log
    //   expect(path).toContain("warnings.log");
    // });
    //
    // it("Should show log file as found (green checkmark)", async () => {
    //   expect(await SettingsPage.isLogFileFound()).toBe(true);
    // });

    it("Can toggle Color Scheme", async () => {
      // Dark theme is the default
      expect(await SettingsPage.isDarkTheme()).toBe(true);

      // Switch to light theme
      await SettingsPage.toggleColorScheme();
      expect(await SettingsPage.isLightTheme()).toBe(true);

      // Switch back to dark theme for other tests
      await SettingsPage.toggleColorScheme();
      expect(await SettingsPage.isDarkTheme()).toBe(true);
    });

    it("Can toggle Show Extended Player Info setting", async () => {
      // Navigate to Settings screen
      await NavigationPage.navigateToSettings();
      await SettingsPage.waitForPageLoad();

      // Step 1-2: Uncheck the "Show extended player info" checkbox
      await SettingsPage.disableShowExtendedPlayerInfo();

      // Step 3: Verify the checkbox is unchecked
      expect(await SettingsPage.isShowExtendedPlayerInfoEnabled()).toBe(false);

      // Step 4: Navigate to the Game screen
      await NavigationPage.navigateToGame();
      await GamePage.waitForGameDataToLoad(20000);

      // Step 5: Verify that extended player info is NOT displayed on player cards
      expect(await GamePage.hasExtendedPlayerInfo()).toBe(false);

      // Step 6: Navigate back to the Settings screen
      await NavigationPage.navigateToSettings();
      await SettingsPage.waitForPageLoad();

      // Step 7: Check the "Show extended player info" checkbox
      await SettingsPage.enableShowExtendedPlayerInfo();

      // Step 8: Verify the checkbox is checked
      expect(await SettingsPage.isShowExtendedPlayerInfoEnabled()).toBe(true);

      // Step 9: Navigate to the Game screen
      await NavigationPage.navigateToGame();
      await GamePage.waitForGameDataToLoad(20000);

      // Step 10: Verify that extended player info IS displayed on player cards
      await GamePage.waitForExtendedPlayerInfo(true, 5000);
      expect(await GamePage.hasExtendedPlayerInfo()).toBe(true);
    });
  });

  // Disabled because it doesn't work for some reason
  describe("Recent Games Screen", () => {
    before(async () => {
      // Navigate to Recent Games screen
      await NavigationPage.navigateToRecentGames();
      await RecentGamesPage.waitForPageLoad();
    });

    it("Should display Recent Games screen", async () => {
      // Should show either games or a waiting message
      expect(await RecentGamesPage.hasGames()).toBe(true);
    });

    it("Should show player information when available", async () => {
      // Wait a bit for data to potentially load
      await RecentGamesPage.waitForPlayerInfo();

      // Check if we have player data or appropriate waiting message
      expect(await RecentGamesPage.hasPlayerInformation()).toBe(true);
    });
  });

  describe("Replays Screen", () => {
    before(async () => {
      // Navigate to Replays screen
      await NavigationPage.navigateToReplays();
      await ReplaysPage.waitForPageLoad();
    });

    it("Should display Replays screen", async () => {
      expect(await ReplaysPage.isReplaysDescriptionDisplayed()).toBe(true);
    });

    it("Should show replay information", async () => {
      // Should contain information about replays
      expect(await ReplaysPage.hasReplayInformation()).toBe(true);
    });
  });

  describe("About Screen", () => {
    before(async () => {
      // Navigate to About screen
      await NavigationPage.navigateToAbout();
      await AboutPage.waitForPageLoad();
    });

    it("Should display app version", async () => {
      expect(await AboutPage.isAppVersionDisplayed()).toBe(true);
    });

    it("App version should match package.json", async () => {
      expect(await AboutPage.doesVersionMatchPackage()).toBe(true);
    });

    it("Should display app information", async () => {
      // Should contain basic app information
      expect(await AboutPage.hasAppInformation("Grenadier")).toBe(true);
    });
  });

  describe("Header", () => {
    it("Should display Steam online players count", async () => {
      // Check that the online players badge is displayed
      expect(await HeaderPage.isOnlinePlayersBadgeDisplayed()).toBe(true);
    });

    it("Should show online players count greater than 0", async () => {
      // Wait for the online players count to load
      const count = await HeaderPage.waitForOnlinePlayersToLoad(20000);

      // Verify the count is a valid number and greater than 0
      expect(count).not.toBeNull();
      expect(count).toBeGreaterThan(0);
    });

    it("Should display header elements", async () => {
      // Verify header is displayed
      expect(await HeaderPage.isHeaderDisplayed()).toBe(true);
    });
  });

  describe("Navigation", () => {
    it("Should be able to navigate between all screens", async () => {
      await NavigationPage.navigateThroughAllScreens();

      // Verify we can navigate to each screen individually
      await NavigationPage.navigateToGame();
      expect((await GamePage.getBodyText()).length).toBeGreaterThan(50);

      await NavigationPage.navigateToRecentGames();
      expect((await RecentGamesPage.getBodyText()).length).toBeGreaterThan(50);

      await NavigationPage.navigateToReplays();
      expect((await ReplaysPage.getBodyText()).length).toBeGreaterThan(50);

      await NavigationPage.navigateToSettings();
      expect((await SettingsPage.getBodyText()).length).toBeGreaterThan(50);

      await NavigationPage.navigateToAbout();
      expect((await AboutPage.getBodyText()).length).toBeGreaterThan(50);
    });
  });
});
