import fs from "fs";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Test helper utilities for e2e tests
 */
class TestHelpers {
  constructor() {
    this.testLogFilePath = null;
    this.originalLogFilePath = null;
  }

  /**
   * Get the expected log file path based on the OS
   * @returns {string} The path where the app expects to find warnings.log
   */
  getExpectedLogFilePath() {
    const documentsDir = path.join(os.homedir(), "Documents");
    return path.join(documentsDir, "My Games", "Company of Heroes 3", "warnings.log");
  }

  /**
   * Copy a test log file to the location where the app expects it
   * @param {string} testAssetFileName - Name of the test file in src-tauri/test_assets/
   * @returns {Promise<string>} The path where the file was copied
   */
  async setupTestLogFile(testAssetFileName = "warnings-4v4-allfactions.log") {
    const sourceFile = path.resolve(__dirname, "../../src-tauri/test_assets", testAssetFileName);
    const targetPath = this.getExpectedLogFilePath();
    const targetDir = path.dirname(targetPath);

    // Create directory if it doesn't exist
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // Backup existing file if it exists
    if (fs.existsSync(targetPath)) {
      this.originalLogFilePath = targetPath + ".backup";
      fs.copyFileSync(targetPath, this.originalLogFilePath);
    }

    // Copy test file
    fs.copyFileSync(sourceFile, targetPath);
    this.testLogFilePath = targetPath;

    console.log(`Test log file copied from ${sourceFile} to ${targetPath}`);
    return targetPath;
  }

  /**
   * Clean up test files and restore original log file if it existed
   */
  async cleanupTestLogFile() {
    if (this.testLogFilePath && fs.existsSync(this.testLogFilePath)) {
      fs.unlinkSync(this.testLogFilePath);
      console.log(`Removed test log file: ${this.testLogFilePath}`);
    }

    if (this.originalLogFilePath && fs.existsSync(this.originalLogFilePath)) {
      const targetPath = this.getExpectedLogFilePath();
      fs.copyFileSync(this.originalLogFilePath, targetPath);
      fs.unlinkSync(this.originalLogFilePath);
      console.log(`Restored original log file from backup`);
    }

    this.testLogFilePath = null;
    this.originalLogFilePath = null;
  }

  /**
   * Navigate to a specific screen in the app
   * @param {string} screenName - Name of the screen (e.g., "Settings", "Replays", "About", "Recent Games")
   * @param {number} timeout - Maximum time to wait for navigation
   */
  async navigateToScreen(screenName, timeout = 10000) {
    const link = await $(`a*=${screenName}`);
    await link.click();
    await browser.pause(500); // Small pause to allow navigation to start
  }

  /**
   * Wait for an element to be displayed in viewport
   * @param {string} selector - Element selector (can be data-testid or any selector)
   * @param {number} timeout - Maximum time to wait
   * @param {string} errorMessage - Custom error message
   */
  async waitForElement(selector, timeout = 10000, errorMessage = null) {
    const element = await $(selector);
    await browser.waitUntil(
      async () => {
        return (await element.isDisplayedInViewport()) === true;
      },
      {
        timeout,
        timeoutMsg: errorMessage || `Element ${selector} did not appear within ${timeout}ms`,
      },
    );
    return element;
  }

  /**
   * Wait for text to appear on the page
   * @param {string} text - Text to wait for
   * @param {number} timeout - Maximum time to wait
   */
  async waitForText(text, timeout = 10000) {
    await browser.waitUntil(
      async () => {
        const body = await $("body");
        const bodyText = await body.getText();
        return bodyText.includes(text);
      },
      {
        timeout,
        timeoutMsg: `Text "${text}" did not appear within ${timeout}ms`,
      },
    );
  }

  /**
   * Wait for game data to load (map name appears)
   * @param {number} timeout - Maximum time to wait
   */
  async waitForGameDataToLoad(timeout = 15000) {
    // Wait for either a map name or player card to appear
    await browser.waitUntil(
      async () => {
        const body = await $("body");
        const bodyText = await body.getText();
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
   * Get element by data-testid attribute
   * @param {string} testId - The data-testid value
   */
  async getByTestId(testId) {
    return await $(`[data-testid="${testId}"]`);
  }

  /**
   * Check if element exists and is visible
   * @param {string} selector - Element selector
   * @returns {Promise<boolean>}
   */
  async isElementVisible(selector) {
    try {
      const element = await $(selector);
      return await element.isDisplayedInViewport();
    } catch (error) {
      return false;
    }
  }

  // ==================== OBS Overlay Helpers ====================

  /**
   * OBS Overlay server port
   */
  get OBS_OVERLAY_PORT() {
    return 47824;
  }

  /**
   * OBS Overlay server URL
   */
  get OBS_OVERLAY_URL() {
    return `http://localhost:${this.OBS_OVERLAY_PORT}`;
  }

  /**
   * Make HTTP request to check if OBS overlay server is running
   * Uses native fetch (Node.js 18+) for clean async/await syntax
   * @param {number} timeout - Request timeout in ms
   * @returns {Promise<{running: boolean, content: string|null, error: string|null}>}
   */
  async checkOBSOverlayServer(timeout = 5000) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(this.OBS_OVERLAY_URL, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const content = await response.text();
      return { running: true, content, error: null };
    } catch (err) {
      // Connection refused, timeout, or other network error = server not running
      return { running: false, content: null, error: err.message };
    }
  }

  /**
   * Verify OBS overlay content contains expected player data
   * @param {string} html - HTML content from overlay
   * @returns {{hasPlayerNames: boolean, hasFactionIcons: boolean, playerNames: string[]}}
   */
  parseOBSOverlayContent(html) {
    const hasPlayerNames = html.includes("coh3stats-overlay-player-name");
    const hasFactionIcons = html.includes("coh3stats-overlay-player-factionIcon");

    // Extract player names using regex
    const nameRegex = /class="coh3stats-overlay-player-name">([^<]+)<\/span>/g;
    const playerNames = [];
    let match;
    while ((match = nameRegex.exec(html)) !== null) {
      playerNames.push(match[1]);
    }

    return { hasPlayerNames, hasFactionIcons, playerNames };
  }

  /**
   * Wait for OBS overlay server to be running
   * @param {number} maxWaitTime - Maximum time to wait in ms
   * @param {number} pollInterval - Interval between checks in ms
   * @returns {Promise<boolean>} - True if server is running, false if timeout
   */
  async waitForOBSOverlayServer(maxWaitTime = 30000, pollInterval = 1000) {
    const startTime = Date.now();
    while (Date.now() - startTime < maxWaitTime) {
      const result = await this.checkOBSOverlayServer();
      if (result.running) {
        return true;
      }
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }
    return false;
  }
}

export default new TestHelpers();
