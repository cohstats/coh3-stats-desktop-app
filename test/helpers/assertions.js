/**
 * Custom assertion helpers for e2e tests
 * These provide domain-specific assertions for the COH3 Stats Desktop App
 */

/**
 * Assert that a player card is displayed with expected data
 * @param {string} playerName - Expected player name
 */
async function assertPlayerCardDisplayed(playerName) {
  const body = await $("body");
  const bodyText = await body.getText();

  expect(bodyText).toContain(playerName);

  // Check for player card elements
  const playerCards = await $$("div[class*='player-card']");
  expect(playerCards.length).toBeGreaterThan(0);
}

/**
 * Assert that game data is loaded (not in waiting state)
 */
async function assertGameDataLoaded() {
  const body = await $("body");
  const bodyText = await body.getText();

  expect(bodyText).not.toContain("Waiting for a game");
  expect(bodyText).not.toContain("Waiting for logfile");
}

/**
 * Assert that a specific screen is displayed
 * @param {string} screenName - Name of the screen
 * @param {string} expectedContent - Content that should be present on the screen
 */
async function assertScreenDisplayed(screenName, expectedContent) {
  const body = await $("body");
  const bodyText = await body.getText();

  expect(bodyText).toContain(expectedContent);
}

/**
 * Assert that the log file is detected and valid
 */
async function assertLogFileDetected() {
  const body = await $("body");
  const bodyText = await body.getText();

  expect(bodyText).toContain("Log file found");
}

/**
 * Assert that map information is displayed
 * @param {string} mapName - Optional expected map name
 */
async function assertMapDisplayed(mapName = null) {
  const body = await $("body");
  const bodyText = await body.getText();

  expect(bodyText).toContain("Map -");

  if (mapName) {
    expect(bodyText).toContain(mapName);
  }
}

/**
 * Assert that faction images are displayed
 * @param {number} minCount - Minimum number of faction images expected
 */
async function assertFactionsDisplayed(minCount = 1) {
  const factionImages = await $$("img[src*='/factions/']");
  expect(factionImages.length).toBeGreaterThanOrEqual(minCount);
}

/**
 * Assert that player stats are displayed (ELO, wins, losses, etc.)
 */
async function assertPlayerStatsDisplayed() {
  const body = await $("body");
  const bodyText = await body.getText();

  // Check for common stat labels
  const hasStats =
    bodyText.includes("ELO") ||
    bodyText.includes("Wins") ||
    bodyText.includes("Losses") ||
    bodyText.includes("Rank");

  expect(hasStats).toBe(true);
}

/**
 * Assert that the app version is valid
 * @param {string} expectedVersion - Expected version string
 */
async function assertValidVersion(expectedVersion) {
  const appVersion = await $('[data-testid="app-version"]');
  const text = await appVersion.getText();

  expect(text).toContain(expectedVersion);

  // Version should match semver pattern (e.g., 2.1.1)
  const versionPattern = /\d+\.\d+\.\d+/;
  expect(text).toMatch(versionPattern);
}

/**
 * Assert that navigation links are present
 * @param {string[]} expectedLinks - Array of expected link names
 */
async function assertNavigationLinksPresent(expectedLinks) {
  for (const linkName of expectedLinks) {
    const link = await $(`a*=${linkName}`);
    expect(await link.isDisplayed()).toBe(true);
  }
}

/**
 * Assert that no error messages are displayed
 */
async function assertNoErrors() {
  const body = await $("body");
  const bodyText = await body.getText();

  // Check for common error indicators
  expect(bodyText).not.toContain("Error");
  expect(bodyText).not.toContain("Failed");
  expect(bodyText).not.toContain("Something went wrong");
}

/**
 * Assert that a data table is displayed with rows
 * @param {number} minRows - Minimum number of rows expected
 */
async function assertDataTableDisplayed(minRows = 1) {
  // Mantine DataTable uses specific class names
  const tableRows = await $$("tr[class*='mantine-DataTable']");

  if (tableRows.length === 0) {
    // Try alternative selector
    const altRows = await $$("table tr");
    expect(altRows.length).toBeGreaterThanOrEqual(minRows);
  } else {
    expect(tableRows.length).toBeGreaterThanOrEqual(minRows);
  }
}

/**
 * Assert that color scheme matches expected theme
 * @param {string} theme - 'dark' or 'light'
 */
async function assertColorScheme(theme) {
  const body = await $("body");
  const backgroundColor = await body.getCSSProperty("background-color");

  if (theme === "dark") {
    expect(backgroundColor.parsed.hex).toEqual("#242424");
  } else if (theme === "light") {
    expect(backgroundColor.parsed.hex).toEqual("#ffffff");
  }
}

export default {
  assertPlayerCardDisplayed,
  assertGameDataLoaded,
  assertScreenDisplayed,
  assertLogFileDetected,
  assertMapDisplayed,
  assertFactionsDisplayed,
  assertPlayerStatsDisplayed,
  assertValidVersion,
  assertNavigationLinksPresent,
  assertNoErrors,
  assertDataTableDisplayed,
  assertColorScheme,
};
