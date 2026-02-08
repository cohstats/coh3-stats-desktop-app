# Page Object Pattern

This directory contains Page Object implementations for the COH3 Stats Desktop App E2E tests.

## Overview

The Page Object Pattern is a design pattern that creates an object-oriented class representation of each page/screen in the application. This approach provides several benefits:

- **Maintainability**: Changes to UI elements only require updates in one place (the page object)
- **Readability**: Tests are more readable and express intent clearly
- **Reusability**: Common actions are defined once and reused across multiple tests
- **Separation of Concerns**: Test logic is separated from page interaction logic

## Structure

### BasePage.js

The base class that all page objects extend. Contains common functionality:

- Element selection methods (`getByTestId`, `getBody`, `getBodyText`)
- Wait utilities (`waitForElement`, `waitForText`, `waitForTextToDisappear`)
- Visibility checks (`isElementVisible`, `hasText`)
- Common actions (`click`, `pause`, `getCSSProperty`)

### NavigationPage.js

Handles navigation between different screens:

- `navigateToScreen(screenName)` - Navigate to any screen by name
- `navigateToGame()` - Navigate to Game screen
- `navigateToSettings()` - Navigate to Settings screen
- `navigateToRecentGames()` - Navigate to Recent Games screen
- `navigateToReplays()` - Navigate to Replays screen
- `navigateToAbout()` - Navigate to About screen
- `navigateThroughAllScreens()` - Navigate through all screens sequentially

### GamePage.js

Represents the main game screen:

- `waitForGameDataToLoad()` - Wait for game data to load
- `isWaitingForGame()` - Check if in waiting state
- `getPlayerCards()` - Get all player card elements
- `hasPlayerCards()` - Check if player cards are displayed
- `hasMapInformation()` - Check if map info is displayed
- `hasFactionImages()` - Check if faction images are displayed
- `hasPlayerStats()` - Check if player stats are displayed

### SettingsPage.js

Represents the settings screen:

- `waitForPageLoad()` - Wait for settings page to load
- `getLogFilePath()` - Get the log file path value
- `isLogFileFound()` - Check if log file is found
- `toggleColorScheme()` - Toggle between light/dark theme
- `isDarkTheme()` - Check if dark theme is active
- `isLightTheme()` - Check if light theme is active
- `switchToDarkTheme()` - Switch to dark theme
- `switchToLightTheme()` - Switch to light theme

### RecentGamesPage.js

Represents the recent games screen:

- `waitForPageLoad()` - Wait for page to load
- `hasGames()` - Check if games are displayed
- `isWaitingForPlayer()` - Check if in waiting state
- `hasPlayerInformation()` - Check if player info is displayed
- `getGameCount()` - Get number of games displayed

### ReplaysPage.js

Represents the replays screen:

- `waitForPageLoad()` - Wait for page to load
- `isReplaysDescriptionDisplayed()` - Check if description is visible
- `hasReplayInformation()` - Check if replay info is shown
- `getReplayCount()` - Get number of replays displayed

### AboutPage.js

Represents the about screen:

- `waitForPageLoad()` - Wait for page to load
- `isAppVersionDisplayed()` - Check if version is displayed
- `getAppVersion()` - Get the app version text
- `doesVersionMatchPackage()` - Verify version matches package.json
- `hasAppInformation()` - Check if app info is displayed
- `hasValidVersionFormat()` - Verify version format is valid

## Usage

### Importing Page Objects

```javascript
import {
  NavigationPage,
  GamePage,
  SettingsPage,
  RecentGamesPage,
  ReplaysPage,
  AboutPage,
} from "../helpers/pages/index.js";
```

### Example Test

```javascript
describe("Game Screen", () => {
  before(async () => {
    await NavigationPage.navigateToGame();
    await GamePage.pause(2000);
  });

  it("Should display player cards", async () => {
    expect(await GamePage.hasPlayerCards()).toBe(true);
    expect(await GamePage.getPlayerCardCount()).toBeGreaterThan(0);
  });

  it("Should display map information", async () => {
    expect(await GamePage.hasMapInformation()).toBe(true);
  });
});
```

## Best Practices

1. **Keep page objects focused**: Each page object should only contain methods related to that specific page
2. **Use descriptive method names**: Method names should clearly indicate what they do (e.g., `hasPlayerCards()` instead of `checkCards()`)
3. **Return meaningful values**: Methods should return values that are useful for assertions (booleans, strings, numbers, elements)
4. **Avoid assertions in page objects**: Page objects should return data; tests should perform assertions
5. **Use async/await consistently**: All page object methods should be async and use await for WebDriver calls
6. **Encapsulate selectors**: Keep selectors within page objects, not in tests
7. **Provide wait methods**: Include methods to wait for page-specific conditions

## Adding New Page Objects

When adding a new page object:

1. Create a new file in `test/helpers/pages/` (e.g., `NewPage.js`)
2. Extend `BasePage` class
3. Implement page-specific methods
4. Export as singleton: `export default new NewPage();`
5. Add to `index.js` exports
6. Update this README with the new page object documentation

## Maintenance

When UI changes occur:

1. Update the relevant page object methods
2. Tests using those methods will automatically use the updated implementation
3. No need to update individual test files unless test logic changes
