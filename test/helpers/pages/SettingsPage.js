import BasePage from "./BasePage.js";

/**
 * Settings Page Object
 * Represents the settings/configuration screen
 */
class SettingsPage extends BasePage {
  // Selectors
  get colorSchemeToggleSelector() {
    return 'div[data-testid="color-scheme-toggle"] button';
  }

  get logFilePathInputSelector() {
    return '[data-testid="log-file-path-input"]';
  }

  /**
   * Wait for settings page to load
   * @param {number} timeout - Maximum time to wait
   */
  async waitForPageLoad(timeout = 5000) {
    await this.waitForText("Path to warnings.log:", timeout);
    await this.pause(1000); // Give input element time to render
  }

  /**
   * Get the log file path input element
   * @returns {Promise<WebdriverIO.Element>}
   */
  async getLogFilePathInput() {
    return await this.getByTestId("log-file-path-input");
  }

  /**
   * Get the current log file path value
   * @returns {Promise<string>}
   */
  async getLogFilePath() {
    const input = await this.getLogFilePathInput();
    return await input.getValue();
  }

  /**
   * Check if log file path contains specific text
   * @param {string} text - Text to check for
   * @returns {Promise<boolean>}
   */
  async logFilePathContains(text) {
    const path = await this.getLogFilePath();
    return path.includes(text);
  }

  /**
   * Check if log file is found (green checkmark)
   * @returns {Promise<boolean>}
   */
  async isLogFileFound() {
    return await this.hasText("Log file found");
  }

  /**
   * Get the color scheme toggle button
   * @returns {Promise<WebdriverIO.Element>}
   */
  async getColorSchemeToggle() {
    return await $(this.colorSchemeToggleSelector);
  }

  /**
   * Toggle the color scheme
   */
  async toggleColorScheme() {
    const toggle = await this.getColorSchemeToggle();
    await toggle.click();
  }

  /**
   * Get the current background color
   * @returns {Promise<string>} Hex color code
   */
  async getBackgroundColor() {
    const backgroundColor = await this.getCSSProperty("body", "background-color");
    return backgroundColor.parsed.hex;
  }

  /**
   * Check if dark theme is active
   * @returns {Promise<boolean>}
   */
  async isDarkTheme() {
    const bgColor = await this.getBackgroundColor();
    return bgColor === "#242424";
  }

  /**
   * Check if light theme is active
   * @returns {Promise<boolean>}
   */
  async isLightTheme() {
    const bgColor = await this.getBackgroundColor();
    return bgColor === "#ffffff";
  }

  /**
   * Switch to dark theme
   */
  async switchToDarkTheme() {
    const isLight = await this.isLightTheme();
    if (isLight) {
      await this.toggleColorScheme();
    }
  }

  /**
   * Switch to light theme
   */
  async switchToLightTheme() {
    const isDark = await this.isDarkTheme();
    if (isDark) {
      await this.toggleColorScheme();
    }
  }

  /**
   * Verify color scheme matches expected theme
   * @param {string} theme - 'dark' or 'light'
   * @returns {Promise<boolean>}
   */
  async verifyColorScheme(theme) {
    const bgColor = await this.getBackgroundColor();
    if (theme === "dark") {
      return bgColor === "#242424";
    } else if (theme === "light") {
      return bgColor === "#ffffff";
    }
    return false;
  }

  /**
   * Check if settings page has loaded properly
   * @returns {Promise<boolean>}
   */
  async isPageLoaded() {
    return await this.hasText("Path to warnings.log:");
  }

  /**
   * Get all settings sections
   * @returns {Promise<string>}
   */
  async getSettingsContent() {
    return await this.getBodyText();
  }

  /**
   * Get the "Show extended player info" checkbox element
   * @returns {Promise<WebdriverIO.Element>}
   */
  async getShowExtendedPlayerInfoCheckbox() {
    // The data-testid is on the input element, but we need to click the parent label
    const input = await this.getByTestId("show-extended-player-info-checkbox");
    // Scroll to the element to ensure it's in view
    await input.scrollIntoView();
    await this.pause(300); // Wait for scroll to complete
    // Get the parent element which is the clickable label
    const clickableElement = await input.$("..");
    return clickableElement;
  }

  /**
   * Check if "Show extended player info" is enabled
   * @returns {Promise<boolean>}
   */
  async isShowExtendedPlayerInfoEnabled() {
    // Get the input element directly to check its state
    const input = await this.getByTestId("show-extended-player-info-checkbox");
    return await input.isSelected();
  }

  /**
   * Toggle the "Show extended player info" checkbox
   */
  async toggleShowExtendedPlayerInfo() {
    const checkbox = await this.getShowExtendedPlayerInfoCheckbox();
    await checkbox.waitForClickable({ timeout: 5000 });
    await checkbox.click();
    // Wait a bit for the setting to be saved
    await this.pause(500);
  }

  /**
   * Enable "Show extended player info"
   */
  async enableShowExtendedPlayerInfo() {
    const isEnabled = await this.isShowExtendedPlayerInfoEnabled();
    if (!isEnabled) {
      await this.toggleShowExtendedPlayerInfo();
    }
  }

  /**
   * Disable "Show extended player info"
   */
  async disableShowExtendedPlayerInfo() {
    const isEnabled = await this.isShowExtendedPlayerInfoEnabled();
    if (isEnabled) {
      await this.toggleShowExtendedPlayerInfo();
    }
  }

  // ==================== OBS Overlay Methods ====================

  /**
   * Get the OBS Streamer Overlay toggle switch
   * @returns {Promise<WebdriverIO.Element>}
   */
  async getOBSOverlayToggle() {
    // The data-testid is on the input element, but we need to click the parent label/root
    const input = await this.getByTestId("obs-overlay-toggle");
    await input.scrollIntoView();
    await this.pause(300);
    // Get the parent element which is the clickable label
    const clickableElement = await input.$("..");
    return clickableElement;
  }

  /**
   * Check if OBS overlay is enabled
   * @returns {Promise<boolean>}
   */
  async isOBSOverlayEnabled() {
    // Get the input element directly to check its state
    const input = await this.getByTestId("obs-overlay-toggle");
    const dataChecked = await input.getAttribute("data-checked");
    return dataChecked === "true";
  }

  /**
   * Toggle the OBS overlay switch
   */
  async toggleOBSOverlay() {
    const toggle = await this.getOBSOverlayToggle();
    await toggle.waitForClickable({ timeout: 5000 });
    await toggle.click();
    await this.pause(500);
  }

  /**
   * Enable OBS overlay
   */
  async enableOBSOverlay() {
    const isEnabled = await this.isOBSOverlayEnabled();
    if (!isEnabled) {
      await this.toggleOBSOverlay();
    }
  }

  /**
   * Disable OBS overlay
   */
  async disableOBSOverlay() {
    const isEnabled = await this.isOBSOverlayEnabled();
    if (isEnabled) {
      await this.toggleOBSOverlay();
    }
  }

  /**
   * Check if restart required message is shown
   * @returns {Promise<boolean>}
   */
  async isRestartRequiredShown() {
    return await this.hasText("Restart required to enable / disable streamer overlay");
  }

  /**
   * Get the restart button element
   * @returns {Promise<WebdriverIO.Element>}
   */
  async getRestartButton() {
    return await this.getByTestId("obs-restart-button");
  }

  /**
   * Click the restart button
   */
  async clickRestartButton() {
    const button = await this.getRestartButton();
    await button.click();
  }

  /**
   * Get the show flags checkbox
   * @returns {Promise<WebdriverIO.Element>}
   */
  async getShowFlagsCheckbox() {
    // The data-testid is on the input element, but we need to click the parent label
    const input = await this.getByTestId("obs-show-flags-checkbox");
    await input.scrollIntoView();
    await this.pause(300);
    // Get the parent element which is the clickable label
    const clickableElement = await input.$("..");
    return clickableElement;
  }

  /**
   * Check if show flags is enabled
   * @returns {Promise<boolean>}
   */
  async isShowFlagsEnabled() {
    // Get the input element directly to check its state
    const input = await this.getByTestId("obs-show-flags-checkbox");
    return await input.isSelected();
  }

  /**
   * Toggle the show flags checkbox
   */
  async toggleShowFlags() {
    const checkbox = await this.getShowFlagsCheckbox();
    await checkbox.waitForClickable({ timeout: 5000 });
    await checkbox.click();
    await this.pause(500);
  }

  /**
   * Enable show flags
   */
  async enableShowFlags() {
    const isEnabled = await this.isShowFlagsEnabled();
    if (!isEnabled) {
      await this.toggleShowFlags();
    }
  }

  /**
   * Disable show flags
   */
  async disableShowFlags() {
    const isEnabled = await this.isShowFlagsEnabled();
    if (isEnabled) {
      await this.toggleShowFlags();
    }
  }

  /**
   * Get the "Only show stats when loading / ingame" checkbox
   * @returns {Promise<WebdriverIO.Element>}
   */
  async getOnlyShowIngameCheckbox() {
    // The data-testid is on the input element, but we need to click the parent label
    const input = await this.getByTestId("obs-only-show-ingame-checkbox");
    await input.scrollIntoView();
    await this.pause(300);
    // Get the parent element which is the clickable label
    const clickableElement = await input.$("..");
    return clickableElement;
  }

  /**
   * Check if "Only show stats when loading / ingame" is enabled
   * @returns {Promise<boolean>}
   */
  async isOnlyShowIngameEnabled() {
    // Get the input element directly to check its state
    const input = await this.getByTestId("obs-only-show-ingame-checkbox");
    return await input.isSelected();
  }

  /**
   * Toggle the "Only show stats when loading / ingame" checkbox
   */
  async toggleOnlyShowIngame() {
    const checkbox = await this.getOnlyShowIngameCheckbox();
    await checkbox.waitForClickable({ timeout: 5000 });
    await checkbox.click();
    await this.pause(500);
  }

  /**
   * Enable "Only show stats when loading / ingame"
   */
  async enableOnlyShowIngame() {
    const isEnabled = await this.isOnlyShowIngameEnabled();
    if (!isEnabled) {
      await this.toggleOnlyShowIngame();
    }
  }

  /**
   * Disable "Only show stats when loading / ingame"
   * This makes the overlay always visible (including in menu)
   */
  async disableOnlyShowIngame() {
    const isEnabled = await this.isOnlyShowIngameEnabled();
    if (isEnabled) {
      await this.toggleOnlyShowIngame();
    }
  }
}

export default new SettingsPage();
