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
   * Verifies that:
   * - DataTable exists with at least 5 rows
   * - Multiple different players are mentioned
   * - Game-related content is present (maps, factions, etc.)
   * @returns {Promise<boolean>}
   */
  async hasGames() {
    try {
      // Check 1: Verify DataTable exists with at least 5 rows
      const tableRows = await this.getElements("tbody tr");
      if (tableRows.length < 5) {
        console.log(`Expected at least 5 table rows, found ${tableRows.length}`);
        return false;
      }

      // Check 2: Verify "Played" column header exists (indicates proper table structure)
      const bodyText = await this.getBodyText();
      if (!bodyText.includes("Played")) {
        console.log("Missing 'Played' column header");
        return false;
      }

      // Check 3: Extract player names and verify multiple different players exist
      const playerNames = new Set();

      // Look for player name links (they should be clickable anchors)
      const playerLinks = await this.getElements("a");
      for (const link of playerLinks) {
        const text = await link.getText();
        // Filter out empty strings and common UI elements
        if (text && text.length > 0 && !text.includes("Details") && !text.includes("online")) {
          playerNames.add(text.trim());
        }
      }

      // Should have at least 3 different players in the match history
      if (playerNames.size < 3) {
        console.log(`Expected at least 3 different players, found ${playerNames.size}`);
        return false;
      }

      // Check 4: Verify faction images are present (indicates game data loaded)
      const factionImages = await this.getElements("img[src*='/factions/']");
      if (factionImages.length < 5) {
        console.log(`Expected at least 5 faction images, found ${factionImages.length}`);
        return false;
      }

      // Check 5: Verify map information is present
      const mapImages = await this.getElements("img[alt*='map'], img[src*='maps']");
      if (mapImages.length === 0) {
        console.log("No map images found");
        return false;
      }

      // Check 6: Verify no error messages are present
      if (
        bodyText.includes("Error") ||
        bodyText.includes("Failed to load") ||
        bodyText.includes("Something went wrong")
      ) {
        console.log("Error messages detected on page");
        return false;
      }

      // All checks passed
      return true;
    } catch (error) {
      console.error("Error in hasGames check:", error);
      return false;
    }
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
