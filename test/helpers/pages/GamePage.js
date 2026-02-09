import BasePage from "./BasePage.js";

/**
 * Game Page Object
 * Represents the main game screen showing current match information
 */
class GamePage extends BasePage {
  /**
   * Wait for game data to load
   * @param {number} timeout - Maximum time to wait
   */
  async waitForGameDataToLoad(timeout = 15000) {
    await browser.waitUntil(
      async () => {
        const bodyText = await this.getBodyText();
        // Check if we have moved past "Waiting for a game" state
        return !bodyText.includes("Waiting for a game") && bodyText.length > 100;
      },
      {
        timeout,
        timeoutMsg: `Game data did not load within ${timeout}ms`,
      },
    );
  }

  /**
   * Check if game is in waiting state
   * @returns {Promise<boolean>}
   */
  async isWaitingForGame() {
    return await this.hasText("Waiting for a game");
  }

  /**
   * Get all player cards
   * @returns {Promise<WebdriverIO.ElementArray>}
   */
  async getPlayerCards() {
    return await this.getElements("div[class*='player-card']");
  }

  /**
   * Get the number of player cards displayed
   * @returns {Promise<number>}
   */
  async getPlayerCardCount() {
    const cards = await this.getPlayerCards();
    return cards.length;
  }

  /**
   * Check if player cards are displayed
   * @returns {Promise<boolean>}
   */
  async hasPlayerCards() {
    const count = await this.getPlayerCardCount();
    return count > 0;
  }

  /**
   * Check if map information is displayed
   * @returns {Promise<boolean>}
   */
  async hasMapInformation() {
    return await this.hasText("Map -");
  }

  /**
   * Get map name if displayed
   * @returns {Promise<string|null>}
   */
  async getMapName() {
    const bodyText = await this.getBodyText();
    const mapMatch = bodyText.match(/Map - (.+)/);
    return mapMatch ? mapMatch[1] : null;
  }

  /**
   * Check if faction images are displayed
   * @param {number} minCount - Minimum number of faction images expected
   * @returns {Promise<boolean>}
   */
  async hasFactionImages(minCount = 1) {
    const factionImages = await this.getElements("img[src*='/factions/']");
    return factionImages.length >= minCount;
  }

  /**
   * Check if player stats are displayed (ELO, wins, losses, etc.)
   * @returns {Promise<boolean>}
   */
  async hasPlayerStats() {
    const bodyText = await this.getBodyText();
    return (
      bodyText.includes("ELO") ||
      bodyText.includes("Wins") ||
      bodyText.includes("Losses") ||
      bodyText.includes("Rank")
    );
  }

  /**
   * Check if a specific player is displayed
   * @param {string} playerName - Player name to check for
   * @returns {Promise<boolean>}
   */
  async hasPlayer(playerName) {
    return await this.hasText(playerName);
  }

  /**
   * Verify game data is loaded (not in waiting state)
   * @returns {Promise<boolean>}
   */
  async isGameDataLoaded() {
    const bodyText = await this.getBodyText();
    return !bodyText.includes("Waiting for a game") && !bodyText.includes("Waiting for logfile");
  }

  /**
   * Wait for specific player to appear
   * @param {string} playerName - Player name to wait for
   * @param {number} timeout - Maximum time to wait
   */
  async waitForPlayer(playerName, timeout = 10000) {
    await this.waitForText(playerName, timeout);
  }

  /**
   * Get all faction images
   * @returns {Promise<WebdriverIO.ElementArray>}
   */
  async getFactionImages() {
    return await this.getElements("img[src*='/factions/']");
  }

  /**
   * Check if game has no errors displayed
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
   * Check if extended player info is displayed on player cards
   * Extended info includes: faction stats (best rank, mode, faction WR) and total WR
   * @returns {Promise<boolean>}
   */
  async hasExtendedPlayerInfo() {
    const bodyText = await this.getBodyText();
    // Extended player info shows:
    // - "R #" (best rank)
    // - "WR" (win rate for faction)
    // - "Total WR" (overall win rate)
    // - "in X games" (game count)
    // Check for these indicators that are unique to extended info
    return bodyText.includes("Total WR") && bodyText.includes("in") && bodyText.includes("games");
  }

  /**
   * Wait for extended player info to appear or disappear
   * @param {boolean} shouldBeVisible - Whether extended info should be visible
   * @param {number} timeout - Maximum time to wait
   */
  async waitForExtendedPlayerInfo(shouldBeVisible, timeout = 5000) {
    await browser.waitUntil(
      async () => {
        const hasInfo = await this.hasExtendedPlayerInfo();
        return hasInfo === shouldBeVisible;
      },
      {
        timeout,
        timeoutMsg: `Extended player info did not ${shouldBeVisible ? "appear" : "disappear"} within ${timeout}ms`,
      },
    );
  }
}

export default new GamePage();
