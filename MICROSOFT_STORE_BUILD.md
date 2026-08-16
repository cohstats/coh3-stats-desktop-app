# Microsoft Store build (MSIX)

The Microsoft Store version of the app is shipped as an **MSIX package (x64 only)** built with
[`@choochmeque/tauri-windows-bundle`](https://github.com/Choochmeque/tauri-windows-bundle).

It differs from the regular MSI release in two ways:

- the **auto-updater is disabled** (`VITE_DISABLE_UPDATER=true`, `createUpdaterArtifacts: false`) — the Store handles updates
- the package carries the **Store identity** (publisher / package name) issued by Partner Center

## Building via GitHub Actions (recommended)

1. Go to **Actions → "Microsoft Store MSIX" → Run workflow** and pick the branch (usually `master`).
2. When it finishes, download the `msix-x64-<version>` artifact from the run summary.
3. It contains `Grenadier - COH3 Companion_<version>.0_x64.msix` — upload that in Partner Center.

The build also produces a `.msixbundle` next to it locally, but it is not uploaded as an artifact: a
bundle only matters when shipping several architectures in one submission, and we ship x64 only.

The workflow is **manual only** (`workflow_dispatch`) — it never runs on push or tag.

### The package is unsigned — this is intentional

Partner Center **re-signs** every package with the Store certificate on submission, so CI produces an
unsigned package and no certificate secrets are stored in GitHub. The downside: the artifact cannot be
double-clicked to install locally. See [Test-installing locally](#test-installing-locally) if you need that.

## Partner Center submission

App URL: https://apps.microsoft.com/detail/9PBKK60PKDQS

1. Bump the version **before** running the workflow (see [Versioning](#versioning)).
2. Partner Center → your app → **Packages** → upload the `.msix`.
3. Fill in the submission notes, submit, wait for certification.

### Identity values (must match Partner Center exactly)

These live in `src-tauri/gen/windows/bundle.config.json` and are copied from
Partner Center → **Product management → Product identity**:

| Manifest field         | Value                                     |
| ---------------------- | ----------------------------------------- |
| `Name` (package name)  | `petrvecera.Grenadier-COH3Companion`      |
| `Publisher`            | `CN=2559744E-EB16-4B8E-9001-BD9B7A70DF34` |
| `PublisherDisplayName` | `petrvecera`                              |

If any of these is wrong, Partner Center rejects the upload with a package-identity error.

> **Check once, before the first MSIX submission:** the Store product must be an **MSIX/PWA** product.
> A product originally created as an "EXE or MSI app" cannot accept MSIX packages — that would require a
> new product listing.

### WebView2

MSIX cannot bundle the WebView2 bootstrapper the way the MSI does (`webviewInstallMode` has no effect
here — there is no installer to run). The app relies on the Evergreen WebView2 Runtime, which is
preinstalled on Windows 11 and on all up-to-date Windows 10 installs. Worth mentioning in the Store
listing's system requirements.

### Versioning

- Bump `version` in `package.json` **and** `src-tauri/Cargo.toml` (same as a normal release).
- MSIX versions are 4-part; the tool converts `2.3.0` → `2.3.0.0` automatically.
- The Store requires the revision (last) digit to be `0` — satisfied automatically.
- Each submission must have a **higher** version than the previous one.

## Building locally

Prerequisites:

- **Node 24** — on Node 22 the packaging tool crashes with `ERR_REQUIRE_CYCLE_MODULE`
- Rust with the x64 target: `rustup target add x86_64-pc-windows-msvc`
- Windows SDK — only needed if you want to sign the package yourself

```bash
# 1. Apply the Store Tauri config (the packaging tool has no --config flag,
#    it only merges src-tauri/tauri.windows.conf.json over tauri.conf.json)
cp src-tauri/tauri.microsoftstore.conf.json src-tauri/tauri.windows.conf.json

# 2. Build
VITE_DISABLE_UPDATER=true yarn tauri:windows:build --arch x64 --runner yarn --verbose

# 3. Remove it again so normal builds keep the updater
rm src-tauri/tauri.windows.conf.json
```

Output lands in `src-tauri/target/msix/`.

`src-tauri/tauri.windows.conf.json` is gitignored on purpose: Tauri auto-merges that filename into
**every** Windows build, so committing it would silently disable the updater in the MSI release.

### Test-installing locally

To sideload the package you must sign it with a certificate you trust, and its subject **must** equal
the `Publisher` above:

```powershell
New-SelfSignedCertificate -Type Custom -Subject "CN=2559744E-EB16-4B8E-9001-BD9B7A70DF34" `
  -KeyUsage DigitalSignature -FriendlyName "COH3 Stats MSIX test" `
  -CertStoreLocation "Cert:\CurrentUser\My" -TextExtension @("2.5.29.37={text}1.3.6.1.5.5.7.3.3")
# Trust it (as admin): export it and import into Local Machine\Trusted People, then:
& "C:\Program Files (x86)\Windows Kits\10\bin\<sdk-version>\x64\signtool.exe" sign `
  /fd SHA256 /sha1 <thumbprint> "src-tauri\target\msix\Grenadier - COH3 Companion_2.3.0.0_x64.msix"
```

Alternatively set `signing.pfx` in `bundle.config.json` (password via the `MSIX_PFX_PASSWORD`
environment variable) — but **never commit a PFX**, and keep `signing.pfx: null` for Store builds.

## Files involved

| File                                              | Purpose                                                                     |
| ------------------------------------------------- | --------------------------------------------------------------------------- |
| `.github/workflows/msstore-msix.yaml`             | The manual workflow                                                         |
| `src-tauri/tauri.microsoftstore.conf.json`        | Store-specific Tauri config (updater off, `mainBinaryName`, publisher)      |
| `src-tauri/gen/windows/bundle.config.json`        | MSIX identity, capabilities, signing, asset variants                        |
| `src-tauri/gen/windows/AppxManifest.xml.template` | Manifest template rendered at build time                                    |
| `src-tauri/gen/windows/Assets/`                   | Store/tile/taskbar icons (committed; regenerate with `--regenerate-assets`) |

### Gotcha: `mainBinaryName`

The packaging tool derives the executable name from the product name by stripping whitespace
(`Grenadier - COH3 Companion` → `Grenadier-COH3Companion.exe`). That is why
`tauri.microsoftstore.conf.json` sets `"mainBinaryName": "Grenadier-COH3Companion"` — otherwise the
build fails with `Executable not found`. The user-visible name (`productName`) is unaffected, and the
MSI/direct-download build still ships `Grenadier - COH3 Companion.exe` (`tauri.conf.json` is untouched).

**This does not break Store updates for existing users:**

- MSIX identity is `Identity/Name` + `Publisher` + `Application Id="App"` — none of which change.
- Shortcuts, pinned tiles and the taskbar resolve through the AppUserModelID
  (`<PackageFamilyName>!App`), not through the exe path.
- The payload folder is replaced wholesale on update, so the old exe name simply disappears.
- User settings live under the Tauri identifier `com.coh3stats.desktop`, which is unchanged.

### Regenerating icons

```bash
yarn tauri:windows:build --arch x64 --runner yarn --regenerate-assets
```

Rebuilds `src-tauri/gen/windows/Assets/` from `src-tauri/icons/` (scale, targetsize, unplated and
light-unplated variants; `resourceIndex.enabled` must stay `true` for Windows to resolve them).
This overwrites manual edits in that folder.

## Capabilities

Declared in `bundle.config.json`:

- `internetClient` — API calls to coh3stats.com
- `runFullTrust` — added automatically by the tool; required for Tauri apps, and what allows the app to
  read the CoH3 log file from the user's Documents folder without a restricted capability

Adding a **restricted** capability (e.g. `broadFileSystemAccess`) requires extra Store approval, so avoid it.
