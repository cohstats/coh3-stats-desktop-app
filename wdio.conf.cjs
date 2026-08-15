const os = require('os')
const path = require('path')
const { spawn, spawnSync } = require('child_process')
const { pathToFileURL } = require('url')
const { resolveEdgeDriver } = require('./test/setup-edgedriver.cjs')

// keep track of the `tauri-driver` child process
let tauriDriver

exports.config = {
  specs: ['./test/specs/*.js'],
  maxInstances: 1,
  capabilities: [
    {
      maxInstances: 1,
      'tauri:options': {
        application: './src-tauri/target/release/Grenadier - COH3 Companion.exe',
        webviewOptions: {},
      },
    },
  ],
  reporters: ['spec'],
  framework: 'mocha',
  mochaOpts: {
    ui: 'bdd',
    timeout: 60000,
  },

  // ensure the rust project is built since we expect this binary to exist for the webdriver sessions
  // (the manifest lives in `src-tauri`, without the cwd cargo finds nothing and does nothing)
  onPrepare: () =>
    spawnSync('cargo', ['build', '--release'], {
      cwd: path.resolve(__dirname, 'src-tauri'),
      stdio: 'inherit',
    }),

  // ensure we are running `tauri-driver` before the session starts so that we can proxy the webdriver requests
  beforeSession: () =>
    (tauriDriver = spawn(
      path.resolve(os.homedir(), '.cargo', 'bin', 'tauri-driver'),
      // the driver has to match the locally installed WebView2 runtime, see test/setup-edgedriver.cjs
      ['--native-driver', resolveEdgeDriver()],
      { stdio: [null, process.stdout, process.stderr] }
    )),

  // The app opens a second, hidden webview for the in-game overlay and the driver picks
  // whichever of the two it sees first, so the session can start attached to the overlay -
  // where none of the app's UI exists. Always start on the main window.
  before: async () => {
    const { default: testHelpers } = await import(
      pathToFileURL(path.resolve(__dirname, 'test/helpers/test-helpers.js')).href
    )
    await testHelpers.switchToMainWindow()
  },

  // clean up the `tauri-driver` process we spawned at the start of the session
  afterSession: () => tauriDriver.kill(),
}
