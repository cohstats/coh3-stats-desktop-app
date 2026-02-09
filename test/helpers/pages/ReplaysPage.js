import BasePage from "./BasePage.js";

/**
 * Replays Page Object
 * Represents the replays screen
 */
class ReplaysPage extends BasePage {
  /**
   * Wait for replays page to load
   * @param {number} timeout - Maximum time to wait
   */
  async waitForPageLoad(timeout = 5000) {
    await this.waitForElement('[data-testid="replays-description"]', timeout);
  }

  /**
   * Get the replays description element
   * @returns {Promise<WebdriverIO.Element>}
   */
  async getReplaysDescription() {
    return await this.getByTestId("replays-description");
  }

  /**
   * Check if replays description is displayed
   * @returns {Promise<boolean>}
   */
  async isReplaysDescriptionDisplayed() {
    const description = await this.getReplaysDescription();
    return await description.isDisplayedInViewport();
  }

  /**
   * Check if replay information is shown
   * @param {number} minLength - Minimum content length expected
   * @returns {Promise<boolean>}
   */
  async hasReplayInformation(minLength = 50) {
    const bodyText = await this.getBodyText();
    return bodyText.length > minLength;
  }

  /**
   * Get the replays description text
   * @returns {Promise<string>}
   */
  async getDescriptionText() {
    const description = await this.getReplaysDescription();
    return await description.getText();
  }

  /**
   * Check if page is loaded properly
   * @returns {Promise<boolean>}
   */
  async isPageLoaded() {
    return await this.isReplaysDescriptionDisplayed();
  }

  /**
   * Get all replay entries
   * @returns {Promise<WebdriverIO.ElementArray>}
   */
  async getReplayEntries() {
    // This selector may need to be adjusted based on actual implementation
    return await this.getElements("div[class*='replay-entry']");
  }

  /**
   * Get the number of replays displayed
   * @returns {Promise<number>}
   */
  async getReplayCount() {
    const entries = await this.getReplayEntries();
    return entries.length;
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
   * Check if specific text is present on the page
   * @param {string} text - Text to check for
   * @returns {Promise<boolean>}
   */
  async containsText(text) {
    return await this.hasText(text);
  }
}

export default new ReplaysPage();
