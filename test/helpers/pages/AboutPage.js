import BasePage from "./BasePage.js";
import fs from "fs";
import path from "path";

/**
 * About Page Object
 * Represents the about/information screen
 */
class AboutPage extends BasePage {
  /**
   * Wait for about page to load
   * @param {number} timeout - Maximum time to wait
   */
  async waitForPageLoad(timeout = 5000) {
    await this.waitForElement('[data-testid="app-version"]', timeout);
  }

  /**
   * Get the app version element
   * @returns {Promise<WebdriverIO.Element>}
   */
  async getAppVersionElement() {
    return await this.getByTestId("app-version");
  }

  /**
   * Check if app version is displayed
   * @returns {Promise<boolean>}
   */
  async isAppVersionDisplayed() {
    const appVersion = await this.getAppVersionElement();
    return await appVersion.isDisplayedInViewport();
  }

  /**
   * Get the app version text
   * @returns {Promise<string>}
   */
  async getAppVersion() {
    const appVersion = await this.getAppVersionElement();
    return await appVersion.getText();
  }

  /**
   * Get the version from package.json
   * @returns {string}
   */
  getPackageVersion() {
    const packageJsonPath = path.resolve(fs.realpathSync("."), "package.json");
    const packageJsonData = fs.readFileSync(packageJsonPath, "utf8");
    const packageJson = JSON.parse(packageJsonData);
    return packageJson.version;
  }

  /**
   * Check if app version matches package.json version
   * @returns {Promise<boolean>}
   */
  async doesVersionMatchPackage() {
    const displayedVersion = await this.getAppVersion();
    const packageVersion = this.getPackageVersion();
    return displayedVersion.includes(packageVersion);
  }

  /**
   * Check if app information is displayed
   * @param {string} expectedText - Text that should be present (e.g., "Grenadier")
   * @returns {Promise<boolean>}
   */
  async hasAppInformation(expectedText = "Grenadier") {
    return await this.hasText(expectedText);
  }

  /**
   * Check if page is loaded properly
   * @returns {Promise<boolean>}
   */
  async isPageLoaded() {
    return await this.isAppVersionDisplayed();
  }

  /**
   * Get page content
   * @returns {Promise<string>}
   */
  async getPageContent() {
    return await this.getBodyText();
  }

  /**
   * Check if page has sufficient content
   * @param {number} minLength - Minimum content length expected
   * @returns {Promise<boolean>}
   */
  async hasSufficientContent(minLength = 50) {
    const bodyText = await this.getBodyText();
    return bodyText.length > minLength;
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
   * Verify version format is valid (semver pattern)
   * @returns {Promise<boolean>}
   */
  async hasValidVersionFormat() {
    const version = await this.getAppVersion();
    const versionPattern = /\d+\.\d+\.\d+/;
    return versionPattern.test(version);
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

export default new AboutPage();
