const os = require('os')
const path = require('path')
const { spawn, spawnSync } = require('child_process')

// keep track of the `tauri-driver` child process
let tauriDriver

exports.config = {
  specs: ['./test/specs/*.js'],
  maxInstances: 1,
  capabilities: [
    {
      maxInstances: 1,
      'tauri:options': {
        application: './src-tauri/target/release/Coh3 Stats Desktop App.exe',        
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
  onPrepare: () => spawnSync('cargo', ['build', '--release']),

  // ensure we are running `tauri-driver` before the session starts so that we can proxy the webdriver requests
  beforeSession: () =>
    (tauriDriver = spawn(
      path.resolve(os.homedir(), '.cargo', 'bin', 'tauri-driver'),
      // We will most likely need to change this once it changes in our runner in GitHub Actions       
      ['--native-driver', path.resolve(__dirname, 'test' , process.env.GITHUB_ACTIONS ? 'msedgedriver119.exe' : 'msedgedriver122.exe')],
      { stdio: [null, process.stdout, process.stderr] }
    )),

  // clean up the `tauri-driver` process we spawned at the start of the session
  afterSession: () => tauriDriver.kill(),
}