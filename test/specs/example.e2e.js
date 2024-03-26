describe("Hello Tauri", () => {
  it("should be cordial", async () => {
    const header = await $("div=Game State")
    const text = await header.getText()
    expect(text).toMatch("Game State")
  })

  // it('should be excited', async () => {
  //   const header = await $('body > h1')
  //   const text = await header.getText()
  //   expect(text).toMatch(/!$/)
  // })
})
