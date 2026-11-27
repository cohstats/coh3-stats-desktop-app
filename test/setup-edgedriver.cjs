const fs = require('fs')
const os = require('os')
const path = require('path')
const { execFileSync } = require('child_process')

// The e2e tests drive the app through tauri-driver, which in turn spawns msedgedriver.
// msedgedriver has to match the WebView2 runtime installed on the machine - otherwise the
// browser process never comes up and webdriver fails with "DevToolsActivePort file doesn't exist".
// The GitHub Actions image updates WebView2 regularly, so instead of pinning a binary we detect
// the installed runtime and download the matching driver (falling back to the committed one).

const CACHE_DIR = path.resolve(__dirname, '.edgedriver')
const FALLBACK_DRIVER = path.resolve(__dirname, 'msedgedriver146.exe')

const WEBVIEW2_REGISTRY_KEYS = [
  'HKLM:\\SOFTWARE\\WOW6432Node\\Microsoft\\EdgeUpdate\\Clients\\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}',
  'HKLM:\\SOFTWARE\\Microsoft\\EdgeUpdate\\Clients\\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}',
  'HKCU:\\SOFTWARE\\Microsoft\\EdgeUpdate\\Clients\\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}',
]

// Windows PowerShell 5.1 must not inherit PSModulePath from PowerShell 7 (the default shell of
// GitHub Actions steps on Windows), or it loads PS7's modules and cmdlets like Expand-Archive
// misbehave. ErrorActionPreference=Stop turns non-terminating errors into a non-zero exit code,
// so failures are not silently swallowed.
const powershellEnv = { ...process.env }
delete powershellEnv.PSModulePath

const powershell = (script) =>
  execFileSync(
    'powershell',
    [
      '-NoProfile',
      '-NonInteractive',
      '-ExecutionPolicy',
      'Bypass',
      '-Command',
      `$ErrorActionPreference='Stop'; ${script}`,
    ],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], env: powershellEnv }
  ).trim()

const VERSION_PATTERN = /\d+\.\d+\.\d+\.\d+/

// Decodes the LATEST_RELEASE_* response, which is a UTF-16 text file with a BOM.
const decodeText = (buffer) => {
  if (buffer[0] === 0xff && buffer[1] === 0xfe) return buffer.subarray(2).toString('utf16le')
  if (buffer[0] === 0xfe && buffer[1] === 0xff)
    return buffer.subarray(2).swap16().toString('utf16le')
  return buffer.toString('utf8')
}

// Windows 10+ ships bsdtar, which unpacks zip files without depending on PowerShell modules.
const extractZip = (zipPath, targetDir) => {
  fs.mkdirSync(targetDir, { recursive: true })
  const tar = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'tar.exe')
  if (fs.existsSync(tar)) {
    execFileSync(tar, ['-xf', zipPath, '-C', targetDir], { stdio: ['ignore', 'pipe', 'pipe'] })
  } else {
    powershell(`Expand-Archive -LiteralPath '${zipPath}' -DestinationPath '${targetDir}' -Force`)
  }
}

const getWebView2Version = () => {
  for (const key of WEBVIEW2_REGISTRY_KEYS) {
    try {
      const version = powershell(`(Get-ItemProperty -Path '${key}' -ErrorAction Stop).pv`)
      if (version) return version
    } catch {
      // key not present, try the next one
    }
  }
  return null
}

const download = (url, targetFile) =>
  powershell(
    `$ProgressPreference='SilentlyContinue'; Invoke-WebRequest -Uri '${url}' -OutFile '${targetFile}' -UseBasicParsing`
  )

const downloadDriver = (version) => {
  const driverPath = path.join(CACHE_DIR, `msedgedriver-${version}.exe`)
  if (fs.existsSync(driverPath)) return driverPath

  fs.mkdirSync(CACHE_DIR, { recursive: true })
  const zipPath = path.join(CACHE_DIR, `edgedriver-${version}.zip`)
  const extractDir = path.join(CACHE_DIR, version)

  download(`https://msedgedriver.microsoft.com/${version}/edgedriver_win64.zip`, zipPath)
  fs.rmSync(extractDir, { recursive: true, force: true })
  extractZip(zipPath, extractDir)

  const extracted = path.join(extractDir, 'msedgedriver.exe')
  if (!fs.existsSync(extracted)) throw new Error(`msedgedriver.exe not found in ${extractDir}`)
  fs.copyFileSync(extracted, driverPath)
  return driverPath
}

/**
 * Resolves a msedgedriver.exe that matches the installed WebView2 runtime.
 * Falls back to the committed driver binary if anything goes wrong.
 * @returns {string} absolute path to msedgedriver.exe
 */
const resolveEdgeDriver = () => {
  if (os.platform() !== 'win32') return FALLBACK_DRIVER

  const version = getWebView2Version()
  if (!version) {
    console.warn('[edgedriver] Could not detect WebView2 runtime version, using bundled driver')
    return FALLBACK_DRIVER
  }
  console.log(`[edgedriver] Installed WebView2 runtime: ${version}`)

  const candidates = [version]
  try {
    const major = version.split('.')[0]
    // The endpoint serves UTF-16 text as application/octet-stream, so `.Content` would be a
    // byte array; download it to a file and decode it here instead.
    fs.mkdirSync(CACHE_DIR, { recursive: true })
    const latestFile = path.join(CACHE_DIR, `LATEST_RELEASE_${major}_WINDOWS.txt`)
    download(`https://msedgedriver.microsoft.com/LATEST_RELEASE_${major}_WINDOWS`, latestFile)
    const latest = (decodeText(fs.readFileSync(latestFile)).match(VERSION_PATTERN) || [])[0]
    if (latest && !candidates.includes(latest)) candidates.push(latest)
  } catch (error) {
    // best effort only
    console.warn(`[edgedriver] Could not look up the latest msedgedriver: ${error.message}`)
  }

  for (const candidate of candidates) {
    try {
      const driverPath = downloadDriver(candidate)
      console.log(`[edgedriver] Using msedgedriver ${candidate} (${driverPath})`)
      return driverPath
    } catch (error) {
      console.warn(`[edgedriver] Failed to get msedgedriver ${candidate}: ${error.message}`)
    }
  }

  console.warn('[edgedriver] Falling back to bundled driver')
  return FALLBACK_DRIVER
}

module.exports = { resolveEdgeDriver }
