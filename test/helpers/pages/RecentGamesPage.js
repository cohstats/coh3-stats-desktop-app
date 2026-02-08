import BasePage from "./BasePage.js";

/**
 * Recent Games Page Object
 * Represents the recent games history screen
 */
class RecentGamesPage extends BasePage {
  /**
   * Wait for recent games page to load
   * @param {number} timeout - Maximum time to wait
   */
  async waitForPageLoad(timeout = 10000) {
    await this.pause(timeout);
  }

  /**
   * Check if page is displaying games
   * @returns {Promise<boolean>}
   */
  async hasGames() {
    const bodyText = await this.getBodyText();
    return bodyText.includes("Played");
  }

  /**
   * Check if player information is displayed
   * @returns {Promise<boolean>}
   */
  async hasPlayerInformation() {
    const bodyText = await this.getBodyText();
    return bodyText.includes("Played");
  }

  /**
   * Check if recent games data is loaded
   * @returns {Promise<boolean>}
   */
  async isDataLoaded() {
    const bodyText = await this.getBodyText();
    return bodyText.length > 50;
  }

  /**
   * Get all game entries
   * @returns {Promise<WebdriverIO.ElementArray>}
   */
  async getGameEntries() {
    // This selector may need to be adjusted based on actual implementation
    return await this.getElements("div[class*='game-entry']");
  }

  /**
   * Get the number of games displayed
   * @returns {Promise<number>}
   */
  async getGameCount() {
    const entries = await this.getGameEntries();
    return entries.length;
  }

  /**
   * Check if a specific game type is displayed
   * @param {string} gameType - Game type to check for (e.g., "automatch")
   * @returns {Promise<boolean>}
   */
  async hasGameType(gameType) {
    return await this.hasText(gameType);
  }

  /**
   * Check if "Played" text is present (indicating game history)
   * @returns {Promise<boolean>}
   */
  async hasPlayedGames() {
    return await this.hasText("Played");
  }

  /**
   * Wait for player information to load
   * @param {number} timeout - Maximum time to wait
   */
  async waitForPlayerInfo(timeout = 3000) {
    await this.pause(timeout);
  }

  /**
   * Check if page has no errors
   * @returns {Promise<boolean>}
   */
  async hasNoErrors() {
    const bodyText = await this.getBodyText();
    return (
      !bodyText.includes("Error") &&
      !bodyText.includes("Failed") &&
      !bodyText.includes("Something went wrong")
    );
  }

  /**
   * Get page content
   * @returns {Promise<string>}
   */
  async getPageContent() {
    return await this.getBodyText();
  }

  /**
   * Check if data table is displayed
   * @param {number} minRows - Minimum number of rows expected
   * @returns {Promise<boolean>}
   */
  async hasDataTable(minRows = 1) {
    const tableRows = await this.getElements("tr[class*='mantine-DataTable']");
    if (tableRows.length === 0) {
      const altRows = await this.getElements("table tr");
      return altRows.length >= minRows;
    }
    return tableRows.length >= minRows;
  }
}

export default new RecentGamesPage();
