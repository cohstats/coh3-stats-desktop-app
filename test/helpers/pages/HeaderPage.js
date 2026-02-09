import BasePage from "./BasePage.js";

/**
 * Header Page Object
 * Represents the header/title bar showing navigation, online players, and game state
 */
class HeaderPage extends BasePage {
  /**
   * Get the online players badge element
   * @returns {Promise<WebdriverIO.Element>}
   */
  async getOnlinePlayersBadge() {
    return await this.getByTestId("online-players-badge-compact");
  }

  /**
   * Get the online players count as a number
   * @returns {Promise<number|null>} Returns the player count or null if not available
   */
  async getOnlinePlayersCount() {
    try {
      const badge = await this.getOnlinePlayersBadge();
      const text = await badge.getText();

      // Handle loading state
      if (text === "...") {
        return null;
      }

      // Handle N/A state
      if (text === "N/A") {
        return null;
      }

      // Parse the number
      const count = parseInt(text, 10);
      return isNaN(count) ? null : count;
    } catch (error) {
      console.error("Error getting online players count:", error);
      return null;
    }
  }

  /**
   * Check if online players badge is displayed
   * @returns {Promise<boolean>}
   */
  async isOnlinePlayersBadgeDisplayed() {
    try {
      const badge = await this.getOnlinePlayersBadge();
      return await badge.isDisplayedInViewport();
    } catch (error) {
      return false;
    }
  }

  /**
   * Wait for online players count to load (not showing "..." or "N/A")
   * @param {number} timeout - Maximum time to wait
   * @returns {Promise<number>} Returns the loaded player count
   */
  async waitForOnlinePlayersToLoad(timeout = 15000) {
    let count = null;
    await browser.waitUntil(
      async () => {
        count = await this.getOnlinePlayersCount();
        return count !== null && count > 0;
      },
      {
        timeout,
        timeoutMsg: `Online players count did not load within ${timeout}ms`,
      },
    );
    return count;
  }

  /**
   * Get the game state badge element
   * @returns {Promise<WebdriverIO.Element>}
   */
  async getGameStateBadge() {
    // Game state badge doesn't have a specific test ID, so we'll find it by text content
    const badges = await this.getElements("div[class*='mantine-Badge']");
    for (const badge of badges) {
      const text = await badge.getText();
      if (["Menu", "Loading", "InGame"].includes(text)) {
        return badge;
      }
    }
    throw new Error("Game state badge not found");
  }

  /**
   * Get the current game state
   * @returns {Promise<string|null>} Returns "Menu", "Loading", "InGame", or null
   */
  async getGameState() {
    try {
      const badge = await this.getGameStateBadge();
      return await badge.getText();
    } catch (error) {
      console.error("Error getting game state:", error);
      return null;
    }
  }

  /**
   * Check if a navigation link is active/selected
   * @param {string} linkText - Text of the navigation link (e.g., "Game", "Settings")
   * @returns {Promise<boolean>}
   */
  async isNavigationLinkActive(linkText) {
    const links = await this.getElements("a");
    for (const link of links) {
      const text = await link.getText();
      if (text === linkText) {
        const className = await link.getAttribute("class");
        return className.includes("selectedLink");
      }
    }
    return false;
  }

  /**
   * Check if header is displayed
   * @returns {Promise<boolean>}
   */
  async isHeaderDisplayed() {
    return await this.isElementVisible("div[data-tauri-drag-region]");
  }
}

export default new HeaderPage();
