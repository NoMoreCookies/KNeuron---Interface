# KNeuron Shell

Desktop shell for the modular KNeuron BCI platform. This milestone deliberately contains **no EEG/BCI modules and no Python backend**. It establishes the UI, module-registry contract, custom Windows window, navigation and the boundary where the EEG Core will be integrated.

## Stack
- Tauri 2 — native desktop window and installer boundary
- React + TypeScript — UI
- Vite — frontend tooling
- Rust — intentionally minimal Tauri host

## Run on Windows
Prerequisites: Node.js LTS, Rust stable with the MSVC toolchain, Microsoft C++ Build Tools, and WebView2 (normally present on Windows 10/11).

```powershell
npm install
npm run tauri:dev
```

Production build:

```powershell
npm run tauri:build
```

## Architecture
`src/lib/moduleRegistry.ts` is the current module-discovery boundary. The shell never hard-codes SSVEP, Cortex or Miner. Developer-added manifests are stored locally only to exercise the launcher UX before the real module loader exists.

A future module manifest should satisfy `KNeuronModuleManifest` in `src/types/module.ts`. Replacing the local registry with a Tauri/Rust filesystem loader should not require changes to `ModuleCard` or the dashboard.

### Thumbnail selection
Use **Add Module** and choose PNG/JPG/WebP up to 2 MB. The image is converted to a data URL and stored with the temporary local registry. This is suitable for shell prototyping. The production module system should package thumbnails as module assets rather than store large images in localStorage.

## Deliberately not implemented yet
- BrainAccess / LSL
- Python EEG Core / sidecar
- module execution
- sessions
- module installation from untrusted packages

These are intentionally deferred so the shell and its contracts can be validated first.
