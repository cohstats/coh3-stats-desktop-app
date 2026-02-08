/**
 * Base Page Object
 * Contains common functionality shared across all pages
 */
class BasePage {
  /**
   * Get element by data-testid attribute
   * @param {string} testId - The data-testid value
   * @returns {Promise<WebdriverIO.Element>}
   */
  async getByTestId(testId) {
    return await $(`[data-testid="${testId}"]`);
  }

  /**
   * Get the body element
   * @returns {Promise<WebdriverIO.Element>}
   */
  async getBody() {
    return await $("body");
  }

  /**
   * Get the text content of the body
   * @returns {Promise<string>}
   */
  async getBodyText() {
    const body = await this.getBody();
    return await body.getText();
  }

  /**
   * Wait for an element to be displayed in viewport
   * @param {string} selector - Element selector
   * @param {number} timeout - Maximum time to wait
   * @param {string} errorMessage - Custom error message
   * @returns {Promise<WebdriverIO.Element>}
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
        const bodyText = await this.getBodyText();
        return bodyText.includes(text);
      },
      {
        timeout,
        timeoutMsg: `Text "${text}" did not appear within ${timeout}ms`,
      },
    );
  }

  /**
   * Wait for text to disappear from the page
   * @param {string} text - Text to wait for disappearance
   * @param {number} timeout - Maximum time to wait
   */
  async waitForTextToDisappear(text, timeout = 10000) {
    await browser.waitUntil(
      async () => {
        const bodyText = await this.getBodyText();
        return !bodyText.includes(text);
      },
      {
        timeout,
        timeoutMsg: `Text "${text}" did not disappear within ${timeout}ms`,
      },
    );
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

  /**
   * Check if text is present on the page
   * @param {string} text - Text to check for
   * @returns {Promise<boolean>}
   */
  async hasText(text) {
    const bodyText = await this.getBodyText();
    return bodyText.includes(text);
  }

  /**
   * Pause execution
   * @param {number} ms - Milliseconds to pause
   */
  async pause(ms) {
    await browser.pause(ms);
  }

  /**
   * Click an element
   * @param {string} selector - Element selector
   */
  async click(selector) {
    const element = await $(selector);
    await element.click();
  }

  /**
   * Get multiple elements
   * @param {string} selector - Element selector
   * @returns {Promise<WebdriverIO.ElementArray>}
   */
  async getElements(selector) {
    return await $$(selector);
  }

  /**
   * Get CSS property of an element
   * @param {string} selector - Element selector
   * @param {string} property - CSS property name
   * @returns {Promise<object>}
   */
  async getCSSProperty(selector, property) {
    const element = await $(selector);
    return await element.getCSSProperty(property);
  }
}

export default BasePage;
