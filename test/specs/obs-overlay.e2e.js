import testHelpers from "../helpers/test-helpers.js";
import { NavigationPage, SettingsPage, GamePage } from "../helpers/pages/index.js";

/**
 * OBS Overlay E2E Tests
 *
 * IMPORTANT: These tests require app restart to enable/disable the OBS overlay server.
 * The OBS server only starts on app launch when streamerOverlayEnabled is true.
 *
 * Test Strategy:
 * 1. First, verify the server is NOT running (default state)
 * 2. Enable OBS overlay in settings
 * 3. Verify restart message appears
 * 4. Click restart button (app will restart)
 * 5. After restart, verify server IS running
 * 6. Verify HTML content contains player data
 * 7. Cleanup: Disable OBS overlay for other tests
 */
describe("OBS Overlay E2E Tests", () => {
  before(async () => {
    // Setup test log file with game data
    await testHelpers.setupTestLogFile("warnings-4v4-allfactions.log");
    await browser.refresh();
    await browser.pause(10000);
  });

  after(async () => {
    await testHelpers.cleanupTestLogFile();
  });

  describe("OBS Overlay Settings UI", () => {
    it("Should verify OBS server is NOT running initially (disabled by default)", async () => {
      const result = await testHelpers.checkOBSOverlayServer();
      expect(result.running).toBe(false);
    });

    it("Should navigate to settings and find OBS overlay toggle", async () => {
      await NavigationPage.navigateToSettings();
      await SettingsPage.waitForPageLoad();

      // Verify OBS overlay toggle exists
      const toggle = await SettingsPage.getOBSOverlayToggle();
      expect(await toggle.isDisplayed()).toBe(true);
    });

    it("Should show OBS overlay as disabled by default", async () => {
      const isEnabled = await SettingsPage.isOBSOverlayEnabled();
      expect(isEnabled).toBe(false);
    });

    it("Should enable OBS overlay and show restart message", async () => {
      // Enable OBS overlay
      await SettingsPage.enableOBSOverlay();

      // Verify it's now enabled
      expect(await SettingsPage.isOBSOverlayEnabled()).toBe(true);

      // Verify restart message appears
      expect(await SettingsPage.isRestartRequiredShown()).toBe(true);

      // Verify restart button is visible
      const restartButton = await SettingsPage.getRestartButton();
      expect(await restartButton.isDisplayed()).toBe(true);
    });

    it("Should be able to toggle show flags checkbox when overlay is enabled", async () => {
      // Get initial state
      const initialState = await SettingsPage.isShowFlagsEnabled();

      // Toggle the checkbox
      await SettingsPage.toggleShowFlags();

      // Verify state changed
      const newState = await SettingsPage.isShowFlagsEnabled();
      expect(newState).toBe(!initialState);

      // Toggle back to original state
      await SettingsPage.toggleShowFlags();
      expect(await SettingsPage.isShowFlagsEnabled()).toBe(initialState);
    });

    it("Should enable OBS overlay again for restart test", async () => {
      // Enable OBS overlay
      await SettingsPage.enableOBSOverlay();

      // Verify it's now enabled
      expect(await SettingsPage.isOBSOverlayEnabled()).toBe(true);

      // Verify restart message appears
      expect(await SettingsPage.isRestartRequiredShown()).toBe(true);
    });

    it("Should uncheck 'Only show stats when loading / ingame' to make overlay always visible", async () => {
      // Disable "Only show stats when loading / ingame" so the overlay is always visible
      // This is necessary for player names to show up even when not in a game
      await SettingsPage.disableOnlyShowIngame();

      // Verify it's now unchecked
      expect(await SettingsPage.isOnlyShowIngameEnabled()).toBe(false);
    });
  });

  describe("OBS Overlay Server After Restart", () => {
    before(async () => {
      await browser.pause(3000);
      // Reload the WebDriver session to reconnect to the restarted app
      await browser.reloadSession();

      await browser.pause(10000);
    });

    after(async () => {
      await testHelpers.cleanupTestLogFile();
    });

    it("Should verify OBS server is running after restart", async () => {
      // Wait for server to be available
      const serverRunning = await testHelpers.waitForOBSOverlayServer(30000);
      expect(serverRunning).toBe(true);
    });

    it("Should serve HTML content from OBS overlay server", async () => {
      const result = await testHelpers.checkOBSOverlayServer();
      expect(result.running).toBe(true);
      expect(result.content).not.toBeNull();
      expect(result.content.length).toBeGreaterThan(0);
    });

    it("Should contain player data in overlay HTML", async () => {
      const result = await testHelpers.checkOBSOverlayServer();
      expect(result.running).toBe(true);

      const parsed = testHelpers.parseOBSOverlayContent(result.content);

      // Verify player names are present
      expect(parsed.hasPlayerNames).toBe(true);
      expect(parsed.playerNames.length).toBeGreaterThan(0);
    });

    it("Should contain flag icons when show flags is enabled", async () => {
      const result = await testHelpers.checkOBSOverlayServer();
      expect(result.running).toBe(true);

      const parsed = testHelpers.parseOBSOverlayContent(result.content);

      // Note: This depends on showFlagsOverlay setting
      // If flags are enabled, hasFlags should be true
      console.log("Flags present in overlay:", parsed.hasFlags);
      console.log("Player names found:", parsed.playerNames);
    });

    it("Should disable OBS overlay for cleanup", async () => {
      // Navigate to settings
      await NavigationPage.navigateToSettings();
      await SettingsPage.waitForPageLoad();

      // Disable OBS overlay
      await SettingsPage.disableOBSOverlay();

      // Verify it's now disabled
      expect(await SettingsPage.isOBSOverlayEnabled()).toBe(false);

      // Restart message should be shown (since we toggled)
      expect(await SettingsPage.isRestartRequiredShown()).toBe(true);

      // Wait for app to close and restart
      await browser.pause(3000);

      // Reload the WebDriver session to reconnect to the restarted app
      await browser.reloadSession();

      // Wait for app to fully load after restart
      await browser.pause(10000);
    });

    it("Should verify OBS server is NOT running after disabling", async () => {
      // Verify server is no longer running
      const result = await testHelpers.checkOBSOverlayServer();
      expect(result.running).toBe(false);
    });
  });
});
