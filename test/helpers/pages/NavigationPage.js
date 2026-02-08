import BasePage from "./BasePage.js";

/**
 * Navigation Page Object
 * Handles navigation between different screens in the app
 */
class NavigationPage extends BasePage {
  /**
   * Navigate to a specific screen in the app
   * @param {string} screenName - Name of the screen (e.g., "Settings", "Replays", "About", "Recent Games", "Game")
   * @param {number} pauseAfter - Milliseconds to pause after navigation
   */
  async navigateToScreen(screenName, pauseAfter = 500) {
    const link = await $(`a*=${screenName}`);
    await link.click();
    await this.pause(pauseAfter);
  }

  /**
   * Navigate to Game screen
   */
  async navigateToGame() {
    await this.navigateToScreen("Game");
  }

  /**
   * Navigate to Settings screen
   */
  async navigateToSettings() {
    await this.navigateToScreen("Settings");
  }

  /**
   * Navigate to Recent Games screen
   */
  async navigateToRecentGames() {
    await this.navigateToScreen("Recent Games");
  }

  /**
   * Navigate to Replays screen
   */
  async navigateToReplays() {
    await this.navigateToScreen("Replays");
  }

  /**
   * Navigate to About screen
   */
  async navigateToAbout() {
    await this.navigateToScreen("About");
  }

  /**
   * Get all available navigation links
   * @returns {Promise<string[]>}
   */
  async getNavigationLinks() {
    return ["Game", "Recent Games", "Replays", "Settings", "About"];
  }

  /**
   * Verify navigation link is present
   * @param {string} linkName - Name of the link
   * @returns {Promise<boolean>}
   */
  async isNavigationLinkPresent(linkName) {
    try {
      const link = await $(`a*=${linkName}`);
      return await link.isDisplayed();
    } catch (error) {
      return false;
    }
  }

  /**
   * Navigate through all screens
   * @param {number} pauseBetween - Milliseconds to pause between navigations
   */
  async navigateThroughAllScreens(pauseBetween = 1000) {
    const screens = await this.getNavigationLinks();
    for (const screen of screens) {
      await this.navigateToScreen(screen);
      await this.pause(pauseBetween);
    }
  }
}

export default new NavigationPage();
