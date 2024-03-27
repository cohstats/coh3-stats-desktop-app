import fs from "fs"
import path from "path"

describe("Game Screen", () => {
  before(async () => {
    // Give it some time to load the app and the state to be set
    await browser.pause(5000)
  })

  it("We can see Game State element in the first screen", async () => {
    const header = await $("div*=Game State")
    const text = await header.getText()
    expect(text).toMatch("Game State")
  })

  it("It shows onlyine players in the game", async () => {
    const span = await $('[data-testid="online-players-badge"]')
    const text = await span.getText()
    expect(text !== "0").toEqual(true)
  })
})

describe("Settings Screen", () => {
  before(async () => {
    // Go to the settings screen
    await $("a*=Settings").click()
    // Give it some time to load the app and the state to be set
    await browser.waitUntil(
      async () => {
        const button = await $('[data-testid="color-scheme-toggle"]')
        return (await button.isDisplayedInViewport()) === true
      },
      { timeout: 5000, timeoutMsg: "Settings screen did not load" }
    )
  })

  it("We can toggle Color Sheme", async () => {
    let body = await $("body")
    let backgroundColor = await body.getCSSProperty("background-color")

    // Dark theme is the default
    expect(backgroundColor.parsed.hex).toEqual("#242424")

    // Switch to light theme
    await $('div[data-testid="color-scheme-toggle"] button').click()

    body = await $("body")
    backgroundColor = await body.getCSSProperty("background-color")
    expect(backgroundColor.parsed.hex).toEqual("#ffffff")
  })
})

describe("Replays Screen", () => {
  before(async () => {
    // Go to the settings screen
    await $("a*=Replays").click()
    // Give it some time to load the app and the state to be set
    await browser.waitUntil(
      async () => {
        const text = await $('[data-testid="replays-description"]')
        return (await text.isDisplayedInViewport()) === true
      },
      { timeout: 5000, timeoutMsg: "Replays screen did not load" }
    )
  })

  it("Replay tab is in view", async () => {
    let text = await $('[data-testid="replays-description"]')
    expect(await text.isDisplayedInViewport()).toEqual(true)
  })
})

describe("About Screen", () => {
  before(async () => {
    // Go to the settings screen
    await $("a*=About").click()
    // Give it some time to load the app and the state to be set
    await browser.waitUntil(
      async () => {
        const text = await $('[data-testid="app-version"]')
        return (await text.isDisplayedInViewport()) === true
      },
      { timeout: 5000, timeoutMsg: "About screen did not load" }
    )
  })

  it("Check app version - it's in sync with package.json", async () => {
    const appVersion = await $('[data-testid="app-version"]')
    const text = await appVersion.getText()

    // Read pacakge.json from disk cos we can't import it of stupid mocha, I really dislike wdio
    const packageJsonPath = path.resolve(fs.realpathSync("."), "package.json")
    const packageJsonData = fs.readFileSync(packageJsonPath, "utf8")
    const packageJson = JSON.parse(packageJsonData)

    expect(text).toMatch(packageJson.version)
  })
})
