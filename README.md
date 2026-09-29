# KNeuron

KNeuron is a modular desktop platform for EEG / BCI applications.

The project is built around a strict separation of responsibilities:

- the **desktop shell** owns navigation, settings, notifications, logging and module lifecycle,
- the **device layer** owns connection state and hardware adapters,
- the **EEG core** owns normalized EEG streaming, buffering and channel selection,
- **modules** consume stable KNeuron APIs and must not depend directly on hardware manufacturers.

The main architectural goal is extensibility:

> Adding a new module or a new device should not require modifying the rest of the application architecture.

---

# Table of contents

1. [Current project status](#1-current-project-status)
2. [Technology stack](#2-technology-stack)
3. [Architecture overview](#3-architecture-overview)
4. [Repository structure](#4-repository-structure)
5. [Requirements](#5-requirements)
6. [Installation](#6-installation)
7. [Running the application](#7-running-the-application)
8. [Production build](#8-production-build)
9. [Quality commands](#9-quality-commands)
10. [Development workflow](#10-development-workflow)
11. [Shell architecture](#11-shell-architecture)
12. [Module architecture](#12-module-architecture)
13. [Adding a new module](#13-adding-a-new-module)
14. [Device architecture](#14-device-architecture)
15. [Adding a new device](#15-adding-a-new-device)
16. [EEG architecture](#16-eeg-architecture)
17. [Using EEG inside a module](#17-using-eeg-inside-a-module)
18. [Channel selection](#18-channel-selection)
19. [Simulation EEG](#19-simulation-eeg)
20. [Tests required by change type](#20-tests-required-by-change-type)
21. [Logging and notifications](#21-logging-and-notifications)
22. [Settings](#22-settings)
23. [Development vs production](#23-development-vs-production)
24. [Tauri security](#24-tauri-security)
25. [Versioning](#25-versioning)
26. [Release checklist](#26-release-checklist)
27. [Architectural invariants](#27-architectural-invariants)
28. [Common mistakes](#28-common-mistakes)
29. [Planned modules](#29-planned-modules)
30. [Quick command reference](#30-quick-command-reference)

---

# 1. Current project status

The common KNeuron platform infrastructure is already implemented.

## Implemented shell features

- Tauri desktop shell
- custom title bar
- Dashboard
- Device page
- Settings page
- left Sidebar
- right DevicePanel
- module focus mode
- notifications
- central logger
- development DebugPanel
- persistent settings
- module exit confirmation
- production/development separation

## Implemented module infrastructure

- `KNeuronModuleManifest`
- manifest validation
- `ModuleRegistry`
- `ModuleManager`
- module lifecycle states
- `ModuleErrorBoundary`
- `ModuleDefinition`
- `ModuleComponentRegistry`
- complete module definition registration
- built-in module registration entry point
- dynamic React module mounting through `ModuleHost`
- development-module fallback for manifests without a React implementation

## Implemented device infrastructure

- generic `DeviceAdapter`
- specialized `EEGDeviceAdapter`
- `DeviceRegistry`
- `DeviceManager`
- global device state
- device connection lifecycle
- Device page UI
- DevicePanel runtime state
- built-in device registration
- generic EEG device type guard

## Implemented EEG infrastructure

- normalized `EEGSampleBatch`
- normalized consumer batches
- `EEGRingBuffer`
- `EEGStreamService`
- shared physical stream for multiple consumers
- per-consumer channel selection
- historical EEG windows
- sample sequence numbers
- optional native/source sample numbers
- deterministic 32-channel Simulation EEG adapter
- automated tests for the EEG core

## Not implemented yet

At the current stage there are no finished production modules such as:

- Cortex 3D
- SSVEP Control
- Miner

There is also no production BrainAccess adapter yet.

The real BrainAccess/Python integration will be added behind the existing `EEGDeviceAdapter` boundary.

---

# 2. Technology stack

## Desktop

- Tauri 2
- Rust
- native desktop WebView

## Frontend

- React
- TypeScript
- Vite
- CSS
- `lucide-react`

## Testing and code quality

- Vitest
- React Testing Library
- jsdom
- ESLint
- TypeScript ESLint
- React Hooks ESLint rules
- Prettier
- TypeScript type checking

## Planned signal-processing / hardware backend

A future Python sidecar is expected to handle tasks such as:

- BrainAccess integration
- NumPy
- SciPy
- filtering
- Welch PSD
- bandpower
- FBCCA
- future BCI classifiers
- device SDK integration

Python must remain behind a defined device/service boundary.

React modules must not import hardware SDK code directly.

---

# 3. Architecture overview

```text
                         KNeuron Desktop Shell
                                  |
          +-----------------------+-----------------------+
          |                       |                       |
      Dashboard                 Device                 Settings
          |
          v
     ModuleRegistry
          |
     ModuleManager
          |
   ModuleComponentRegistry
          |
       ModuleHost
          |
          v
      KNeuron Module


                          Device Layer
                              |
                       DeviceRegistry
                              |
                       DeviceManager
                              |
                        DeviceAdapter
                              |
                  +-----------+-----------+
                  |                       |
           EEGDeviceAdapter         future device types
                  |
          +-------+------------------------------+
          |                                      |
SimulationEEGAdapter                      future adapters
                                          BrainAccess
                                          OpenBCI
                                          Muse
                                          LSL
                                          ...


                           EEG Core
                              |
                      EEGStreamService
                              |
                        EEGRingBuffer
                              |
               +--------------+--------------+
               |              |              |
           all channels    selected ch.   selected ch.
               |              |              |
            Cortex          SSVEP           Miner
```

The most important dependency direction is:

```text
Module
  ↓
KNeuron Core API
  ↓
Device / EEG abstraction
  ↓
Concrete adapter
  ↓
Hardware / SDK / Python
```

Never reverse this direction.

---

# 4. Repository structure

The important project structure is:

```text
src/
├── components/
│   ├── TitleBar.tsx
│   ├── Sidebar.tsx
│   ├── DevicePanel.tsx
│   └── ...
│
├── config/
│   ├── appConfig.ts
│   ├── defaultSettings.ts
│   └── ...
│
├── core/
│   ├── devices/
│   │   ├── models/
│   │   │   ├── device.ts
│   │   │   └── eeg.ts
│   │   │
│   │   ├── contracts/
│   │   │   ├── DeviceAdapter.ts
│   │   │   ├── EEGDeviceAdapter.ts
│   │   │   └── deviceGuards.ts
│   │   │
│   │   ├── adapters/
│   │   │   └── simulation/
│   │   │       ├── SimulationEEGAdapter.ts
│   │   │       └── SimulationEEGAdapter.test.ts
│   │   │
│   │   ├── eeg/
│   │   │   ├── channelSelection.ts
│   │   │   └── channelSelection.test.ts
│   │   │
│   │   ├── deviceRegistry.ts
│   │   ├── deviceManager.ts
│   │   └── registerBuiltInDevices.ts
│   │
│   └── eeg/
│       ├── models.ts
│       ├── EEGRingBuffer.ts
│       ├── EEGRingBuffer.test.ts
│       ├── EEGStreamService.ts
│       ├── EEGStreamService.test.ts
│       └── index.ts
│
├── features/
│   ├── dashboard/
│   │
│   ├── debug/
│   │
│   ├── device/
│   │   ├── DevicePage.tsx
│   │   ├── DeviceCard.tsx
│   │   └── useDevice.ts
│   │
│   ├── modules/
│   │   ├── ModuleHost.tsx
│   │   ├── ModuleErrorBoundary.tsx
│   │   ├── moduleManager.ts
│   │   ├── moduleLauncher.ts
│   │   ├── moduleDefinition.ts
│   │   ├── moduleComponentRegistry.ts
│   │   ├── registerModuleDefinition.ts
│   │   ├── registerBuiltInModules.ts
│   │   ├── registerDevelopmentModules.ts
│   │   ├── useRegisteredModules.ts
│   │   ├── moduleComponentRegistry.test.ts
│   │   └── registerModuleDefinition.test.tsx
│   │
│   ├── notifications/
│   │
│   └── settings/
│
├── lib/
│   ├── logger.ts
│   ├── moduleRegistry.ts
│   ├── moduleRegistry.test.ts
│   ├── moduleValidation.ts
│   ├── moduleValidation.test.ts
│   ├── notificationStore.ts
│   ├── settingsStore.ts
│   └── settingsStore.test.ts
│
├── test/
│   ├── setup.ts
│   └── moduleFixtures.ts
│
├── types/
│   ├── logging.ts
│   ├── module.ts
│   ├── navigation.ts
│   ├── notification.ts
│   └── settings.ts
│
├── App.tsx
└── main.tsx


src-tauri/
├── capabilities/
│   └── default.json
│
├── src/
│   └── lib.rs
│
├── Cargo.toml
└── tauri.conf.json
```

Future production modules should live under:

```text
src/modules/
```

Example:

```text
src/modules/cortex/
src/modules/ssvep/
src/modules/miner/
```

---

# 5. Requirements

## Windows

Recommended development environment:

- Windows 10 or Windows 11
- Node.js
- npm
- Rust
- Cargo
- Microsoft Visual Studio Build Tools
- C++ desktop development toolchain
- WebView2 Runtime
- Git
- VS Code

Verify the environment:

```powershell
node --version
npm --version
rustc --version
cargo --version
git --version
```

## Linux

KNeuron can also be built on Linux.

Linux-specific Tauri dependencies must be installed according to the Tauri platform requirements.

Important:

```json
"targets": "all"
```

means:

> build every supported bundle type for the current operating system.

It does not mean:

> cross-compile Windows, Linux and macOS from one machine.

---

# 6. Installation

Clone or copy the repository.

Open a terminal in the project root:

```powershell
npm install
```

Then check dependencies:

```powershell
npm audit
```

The preferred result is:

```text
found 0 vulnerabilities
```

Do not run the application as Administrator unless a specific feature explicitly requires elevated privileges.

---

# 7. Running the application

## Full desktop development

Use:

```powershell
npm run tauri:dev
```

This starts:

- Vite
- the Tauri development process
- the KNeuron desktop window

This is the recommended development command.

## Frontend-only development

Use:

```powershell
npm run dev
```

Use this only when debugging frontend behavior that does not depend on Tauri.

---

# 8. Production build

Before production build:

```powershell
npm run quality:full
npm audit
```

Then:

```powershell
npm run tauri:build
```

Typical release output:

```text
src-tauri/target/release/
src-tauri/target/release/bundle/
```

Always test the real production executable / installer.

Passing `tauri:dev` is not sufficient release validation.

---

# 9. Quality commands

## Type checking

```powershell
npm run typecheck
```

## Unit/integration tests

```powershell
npm test
```

## Watch tests

```powershell
npm run test:watch
```

## Coverage

```powershell
npm run test:coverage
```

## Lint

```powershell
npm run lint
```

## Auto-fix lint where possible

```powershell
npm run lint:fix
```

## Format

```powershell
npm run format
```

## Format check

```powershell
npm run format:check
```

## Frontend quality gate

```powershell
npm run quality
```

Expected pipeline:

```text
typecheck
→ lint
→ format:check
→ tests
→ frontend build
```

## Full quality gate

```powershell
npm run quality:full
```

This additionally checks Rust/Tauri:

```powershell
cargo check --manifest-path src-tauri/Cargo.toml
```

---

# 10. Development workflow

For every meaningful change:

```text
1. make one coherent change
2. run formatting
3. run type checking
4. run relevant tests
5. run lint
6. run the complete quality gate
7. manually test the affected workflow
8. update this README when an extension contract changed
```

Recommended command sequence:

```powershell
npm run format
npm run typecheck
npm test
npm run lint
npm run quality
```

Before release:

```powershell
npm run quality:full
npm audit
npm run tauri:build
```

Do not weaken a failing test before first checking whether the implementation is actually wrong.

---

# 11. Shell architecture

`App.tsx` is the shell coordinator.

It owns:

- shell route state
- Dashboard / Device / Settings navigation
- module opening
- module closing
- optional close confirmation
- shell layout
- focus mode
- NotificationCenter
- development DebugPanel

It must not own:

- device-specific SDK code
- BrainAccess implementation
- Bluetooth implementation
- electrode maps
- filtering
- FBCCA
- Three.js module rendering
- module-specific business logic

When a module is open, the shell enters focus mode.

The Sidebar and DevicePanel collapse, but the global application remains mounted.

This ensures that shared state can survive module navigation.

---

# 12. Module architecture

The module system consists of several independent responsibilities.

## Manifest

`KNeuronModuleManifest` contains module metadata.

Example shape:

```ts
export interface KNeuronModuleManifest {
  schemaVersion: 1;
  id: string;
  name: string;
  version: string;
  description: string;
  category: ModuleCategory;
  appearance: ModuleAppearance;
  entryPoint: string;
  capabilities: ModuleCapabilities;
}
```

## Manifest validation

`moduleValidation.ts` checks:

- supported schema version
- valid module ID
- required metadata
- allowed category
- valid entry point

Module IDs use slug notation:

```text
cortex-3d
ssvep-control
miner-game
signal-monitor
```

Avoid:

```text
Cortex3D
Cortex 3D
cortex_3d
```

The entry point should match:

```text
/modules/<module-id>
```

Example:

```ts
id: "cortex-3d",
entryPoint: "/modules/cortex-3d",
```

## ModuleRegistry

Stores:

- manifest
- runtime state
- optional runtime error

It does not store React components.

## ModuleManager

Owns lifecycle transitions.

Current runtime states:

```text
available
starting
running
error
disabled
```

## ModuleComponentRegistry

Stores React module implementations.

Conceptually:

```text
module ID
    ↓
React Component
```

`ModuleHost` resolves a module implementation dynamically.

It does not contain module-specific conditions.

Correct:

```text
moduleId
  ↓
ModuleComponentRegistry
  ↓
dynamic React component
```

Wrong:

```tsx
if (moduleId === "cortex-3d") {
  return <CortexModule />;
}
```

## ModuleDefinition

A complete module definition combines:

```text
manifest + React component
```

through:

```ts
KNeuronModuleDefinition
```

## registerModuleDefinition

Registers both:

- manifest
- component

as one logical operation.

If registration fails midway, the registration is rolled back to avoid a partially registered module.

## ModuleHost

`ModuleHost`:

- finds registered module metadata
- resolves the React component
- renders it dynamically
- provides `onRequestClose`
- displays a fallback if a development manifest exists without a registered component

Dynamic component mounting currently uses React `createElement(...)`.

---

# 13. Adding a new module

Production modules should use this structure:

```text
src/modules/<module-id>/
├── <ModuleName>Module.tsx
├── <moduleName>Manifest.ts
├── <moduleName>ModuleDefinition.ts
├── components/
├── hooks/
├── services/
├── styles/
└── tests/
```

Example:

```text
src/modules/cortex/
├── CortexModule.tsx
├── cortexManifest.ts
├── cortexModuleDefinition.ts
├── components/
├── hooks/
├── eeg/
├── rendering/
├── styles/
└── tests/
```

## Step 1 — create the manifest

Example:

```ts
import type {
  KNeuronModuleManifest,
} from "../../types/module";

export const cortexManifest: KNeuronModuleManifest = {
  schemaVersion: 1,

  id: "cortex-3d",

  name: "Cortex 3D",

  version: "1.0.0",

  description:
    "Real-time 3D visualization of EEG activity.",

  category: "VISUALIZATION",

  appearance: {},

  entryPoint: "/modules/cortex-3d",

  capabilities: {
    eeg: {
      required: true,
    },
  },
};
```

## Step 2 — create the React component

```tsx
import type {
  KNeuronModuleProps,
} from "../../features/modules/moduleDefinition";

export function CortexModule({
  onRequestClose,
}: KNeuronModuleProps) {
  return (
    <section>
      <h1>Cortex 3D</h1>

      <button
        type="button"
        onClick={onRequestClose}
      >
        Close
      </button>
    </section>
  );
}
```

## Step 3 — create the definition

```ts
import {
  CortexModule,
} from "./CortexModule";

import {
  cortexManifest,
} from "./cortexManifest";

import type {
  KNeuronModuleDefinition,
} from "../../features/modules/moduleDefinition";

export const cortexModuleDefinition:
  KNeuronModuleDefinition = {
  manifest: cortexManifest,
  component: CortexModule,
};
```

## Step 4 — register it as built-in

Edit:

```text
src/features/modules/registerBuiltInModules.ts
```

Import:

```ts
import {
  cortexModuleDefinition,
} from "../../modules/cortex/cortexModuleDefinition";
```

Then return:

```ts
return [
  cortexModuleDefinition,
];
```

Do not edit:

```text
App.tsx
Dashboard.tsx
ModuleHost.tsx
ModuleManager.ts
```

just to add another module.

## Step 5 — declare requirements

A generic EEG visualization:

```ts
capabilities: {
  eeg: {
    required: true,
  },
}
```

An SSVEP module:

```ts
capabilities: {
  eeg: {
    required: true,

    requiredChannels: [
      "O1",
      "O2",
      "Oz",
      "PO3",
      "PO4",
      "POz",
    ],
  },
}
```

## Step 6 — keep hardware out of the module

Allowed:

```ts
import {
  eegStreamService,
} from "../../core/eeg";
```

Not allowed:

```ts
import { BrainAccessAdapter } from "...";
import { SimulationEEGAdapter } from "...";
```

The module must not care which adapter is active.

## Step 7 — release resources

Any module that acquires EEG must release the handle.

Example:

```ts
const handle =
  await eegStreamService.acquire({
    channels: "all",
  });

await handle.release();
```

For React modules, cleanup must be tied to component lifecycle.

The implementation must also handle the race where the component unmounts before an asynchronous `acquire()` finishes.

## Step 8 — module tests

At minimum test:

```text
manifest validation
module definition registration
duplicate module ID behavior
component mounting
component unmounting
ErrorBoundary behavior
EEG requirements
missing channel behavior
EEG stream cleanup
```

Manual flow:

```text
Dashboard
→ module card visible
→ Open
→ module mounted
→ focus mode active
→ close/back
→ module resources released
→ runtime state returns correctly
```

Then:

```powershell
npm run quality
```

---

# 14. Device architecture

The device layer is generic.

```text
DeviceRegistry
     |
DeviceManager
     |
DeviceAdapter
     |
     +-- EEGDeviceAdapter
     |    |
     |    +-- SimulationEEGAdapter
     |    +-- BrainAccessAdapter     future
     |    +-- OpenBCIAdapter         future
     |    +-- MuseAdapter            future
     |
     +-- future non-EEG adapters
```

## DeviceRegistry

Responsible for:

- registering adapters
- unregistering adapters
- finding adapters by ID
- exposing all adapters
- notifying subscribers

It does not own hardware connection logic.

## DeviceManager

Responsible for:

- global active device
- connect
- disconnect
- busy state
- active status
- forwarding device status changes

Current limitation:

> KNeuron currently supports one active device at a time through `DeviceManager`.

This does not prevent multiple modules from sharing one active EEG device.

The one active EEG stream can have many consumers.

## DeviceAdapter

Generic contract:

```text
info
getStatus()
connect()
disconnect()
subscribeStatus()
```

## EEGDeviceAdapter

Additional EEG contract:

```text
getStreamInfo()
startStream()
stopStream()
isStreaming()
subscribeSamples()
```

---

# 15. Adding a new device

Assume a new EEG device:

```text
OpenBCI Cyton
```

## Step 1 — create adapter folder

```text
src/core/devices/adapters/openbci/
```

Files:

```text
OpenBCIAdapter.ts
OpenBCIAdapter.test.ts
```

## Step 2 — implement the EEG adapter contract

```ts
export class OpenBCIAdapter
  implements EEGDeviceAdapter
{
  // ...
}
```

For a non-EEG device use:

```ts
DeviceAdapter
```

instead.

## Step 3 — define stable metadata

Example:

```ts
readonly info = {
  id: "openbci-cyton",
  name: "OpenBCI Cyton",
  kind: "eeg",
  transport: "serial",
  manufacturer: "OpenBCI",
  model: "Cyton",
} as const;
```

IDs should be:

- lowercase
- stable
- unique
- letters/numbers/hyphens only

## Step 4 — implement lifecycle

Expected lifecycle:

```text
disconnected
     ↓
connecting
     ↓
connected
     ↓
disconnecting
     ↓
disconnected
```

On failure:

```text
connecting
     ↓
error
```

Status changes must notify `subscribeStatus(...)`.

## Step 5 — expose stream metadata

Example:

```ts
getStreamInfo()
```

returns:

```ts
{
  sampleRateHz: 250,
  channels: [...]
}
```

Do not hard-code globally that every EEG device has:

```text
250 Hz
32 channels
same electrodes
same order
```

Each adapter reports its own metadata.

## Step 6 — normalize channels

Example:

```ts
{
  index: 0,
  label: "O1",
  type: "eeg",
  unit: "uV",
  sourceIndex: 11,
}
```

Meaning:

```text
index
= normalized KNeuron stream index

sourceIndex
= original hardware/driver index
```

Modules must never use `sourceIndex`.

## Step 7 — emit normalized batches

The normalized matrix layout is:

```text
values[channelIndex][sampleIndex]
```

Example:

```ts
{
  sequenceStart: 1000,

  timestampStartMs: 1710000000000,

  sampleRateHz: 250,

  sampleCount: 10,

  channelCount: 32,

  values: [
    [...],
    [...],
    ...
  ],

  sourceSampleNumberStart: 40000,
}
```

If the hardware exposes a native sample number, preserve it through:

```ts
sourceSampleNumberStart
```

This is useful for detecting dropped samples.

## Step 8 — register adapter

Edit:

```text
src/core/devices/registerBuiltInDevices.ts
```

Example:

```ts
return [
  new SimulationEEGAdapter(),
  new OpenBCIAdapter(),
];
```

Do not modify these merely because another manufacturer is supported:

```text
DeviceManager.ts
DevicePage.tsx
DevicePanel.tsx
EEGStreamService.ts
App.tsx
```

If manufacturer-specific logic is needed there, the adapter abstraction is leaking.

## Step 9 — write tests

Required adapter tests should cover:

```text
initial disconnected state
metadata
connect
disconnect
status notifications
stream info
sample rate
channel map
stream cannot start before connection
stream start
stream stop
batch dimensions
sequence numbering
source sample numbering when available
unsubscribe
disconnect while streaming
reconnect
```

## Step 10 — manual validation

Run:

```powershell
npm run quality
npm run tauri:dev
```

Then verify:

```text
Device
→ adapter appears
→ Connect
→ connecting/connected states
→ DevicePanel updates
→ Disconnect
→ disconnected state
```

---

# 16. EEG architecture

The shared EEG core solves this problem:

> One headset can provide data to multiple KNeuron modules without opening the hardware stream multiple times.

Correct architecture:

```text
32-channel EEG
      |
EEGStreamService
      |
      +--> Cortex       all / many channels
      |
      +--> SSVEP        selected 6 channels
      |
      +--> Miner        selected 6 channels
```

The system should have:

```text
1 active device connection
1 physical EEG stream
1 shared ring buffer
N consumers
```

Not:

```text
Cortex opens device
SSVEP opens device again
Miner opens device again
```

## EEGSampleBatch

Adapter batches contain:

```text
sequenceStart
timestampStartMs
sampleRateHz
sampleCount
channelCount
values
optional sourceSampleNumberStart
```

## EEGRingBuffer

Stores a fixed number of the newest samples.

It keeps:

- values
- timestamps
- KNeuron sequence numbers
- optional native/source sample numbers

The current default service history duration is configured in `EEGStreamService`.

## EEGStreamService

The first consumer starts the adapter stream.

Additional consumers reuse it.

The last released consumer stops the adapter stream.

Example:

```text
consumer 1 acquired
→ physical stream starts

consumer 2 acquired
→ physical stream already running

consumer 1 released
→ physical stream remains

consumer 2 released
→ physical stream stops
```

---

# 17. Using EEG inside a module

## Real-time stream

Example:

```ts
import {
  eegStreamService,
} from "../../core/eeg";

const handle =
  await eegStreamService.acquire({
    channels: [
      "O1",
      "O2",
      "Oz",
      "PO3",
      "PO4",
      "POz",
    ],

    onBatch: (batch) => {
      // Real-time selected EEG batch.
    },
  });
```

## All channels

Cortex-like module:

```ts
const handle =
  await eegStreamService.acquire({
    channels: "all",

    onBatch: (batch) => {
      // Full normalized device stream.
    },
  });
```

## Historical window

Example:

```ts
const trial =
  eegStreamService.getLatestWindow(
    2,
    [
      "O1",
      "O2",
      "Oz",
      "PO3",
      "PO4",
      "POz",
    ],
  );
```

At 250 Hz:

```text
2 s × 250 samples/s
= 500 samples per selected channel
```

## Cleanup

Mandatory:

```ts
await handle.release();
```

Never leave an invisible EEG consumer active after a module closes.

---

# 18. Channel selection

Hardware channel count and module channel requirements are separate concepts.

Example:

```text
Device:
32 channels

SSVEP module:
6 required channels
```

Request:

```ts
channels: [
  "O1",
  "O2",
  "Oz",
  "PO3",
  "PO4",
  "POz",
]
```

The service resolves those labels against the active stream.

The module receives the selected channels in the requested order.

## Never hard-code native indexes in modules

Wrong:

```ts
const o1 = values[11];
const o2 = values[1];
const oz = values[6];
```

Correct:

```ts
channels: [
  "O1",
  "O2",
  "Oz",
]
```

Hardware-specific mappings belong inside the adapter.

## Matching behavior

Channel matching is tolerant of simple casing/whitespace differences.

Examples:

```text
"O1"
"o1"
" O1 "
```

may resolve to the same channel.

It deliberately does not perform fuzzy anatomical substitutions.

Example:

```text
PO3 != P3
```

Missing required channels should fail explicitly.

---

# 19. Simulation EEG

The built-in simulator verifies the entire Device/EEG architecture without physical hardware.

Current properties:

```text
ID: simulation-eeg
Kind: EEG
Transport: simulation
Manufacturer: KNeuron
Sample rate: 250 Hz
Channels: 32
```

It includes channels required by the future SSVEP/Miner workflow, including:

```text
O1
O2
Oz
PO3
PO4
POz
```

The simulator emits deterministic synthetic signals rather than random data.

This makes automated tests repeatable.

The simulator currently generates synthetic components including a dominant alpha-like component and a weaker harmonic component.

It is a test/diagnostic source, not a physiological model of real EEG.

---

# 20. Tests required by change type

## UI-only change

Run:

```powershell
npm run format
npm run typecheck
npm run lint
npm test
npm run quality
```

Then manually inspect the affected screen.

## Settings change

Verify:

```text
change setting
→ restart
→ setting persists

reset settings
→ defaults restored
→ notification displayed
```

## Module infrastructure change

Run tests covering:

```text
moduleValidation
ModuleRegistry
ModuleManager
ModuleComponentRegistry
registerModuleDefinition
ModuleHost
ModuleErrorBoundary
```

Manual flow:

```text
Dashboard
→ Open
→ module runtime starts
→ module renders or fallback renders
→ Back
→ runtime closes
```

## New module

At minimum test:

```text
manifest validation
definition registration
duplicate ID rejection
component mount
component unmount
error isolation
required EEG handling
required channels
stream handle cleanup
```

Then:

```powershell
npm run quality
npm run tauri:dev
```

## New device

At minimum test:

```text
initial state
metadata
connect
disconnect
errors
stream metadata
stream start
stream stop
sample shape
channel mapping
sequence numbering
native sample number if available
unsubscribe
disconnect while streaming
reconnect
```

## EEG Core change

Always run tests for:

```text
SimulationEEGAdapter
channelSelection
EEGRingBuffer
EEGStreamService
```

Then:

```powershell
npm run quality
```

## Before release

Always:

```powershell
npm run quality:full
npm audit
npm run tauri:build
```

---

# 21. Logging and notifications

## Logger

Use the central logger:

```ts
logger.debug(...)
logger.info(...)
logger.warning(...)
logger.error(...)
```

Avoid scattered production:

```ts
console.log(...)
```

Example:

```ts
logger.info(
  "DeviceManager",
  `Device connected: ${deviceId}`,
);
```

The development DebugPanel consumes central log entries.

## Notifications

Use notifications for user-facing state.

Example:

```ts
notificationStore.add({
  type: "success",
  title: "Device connected",
  message: "Simulation EEG",
});
```

Do not create notifications for high-frequency EEG batches.

---

# 22. Settings

Settings are managed through:

```text
SettingsStore
→ useSettings
→ Settings UI
```

Current settings include:

```text
confirmBeforeClosingModule
showDebugInformation
```

Settings are non-sensitive preferences.

Do not put secrets in frontend/localStorage persistence.

Do not store:

```text
passwords
API keys
authentication tokens
private credentials
```

in `SettingsStore`.

---

# 23. Development vs production

Development-only behavior is controlled through `APP_CONFIG`.

Development may include:

- development Test Module
- Developer Settings section
- DebugPanel

Production must hide development-only behavior.

Expected:

```text
development:
Test Module may exist
Developer section may exist
DebugPanel may be enabled

production:
Test Module absent
Developer section absent
DebugPanel absent
```

The development Test Module may still be manifest-only.

In that case `ModuleHost` intentionally shows the fallback:

```text
Module implementation not registered
```

This is valid development behavior.

Built-in production modules will register both:

```text
manifest
+
React component
```

through `registerModuleDefinition(...)`.

---

# 24. Tauri security

KNeuron uses narrow Tauri permissions.

Current native shell behavior requires only specific window operations such as:

```text
close
minimize
toggle maximize
start dragging
```

Avoid broad permissions unless needed.

Do not enable unrestricted capabilities for convenience.

Examples requiring explicit justification:

```text
filesystem access
arbitrary file paths
shell execution
process spawning
external network access
```

## Content Security Policy

Development and production CSP may differ.

Production should remain stricter.

Do not weaken production CSP only to solve Vite/HMR development behavior.

## Native feature workflow

When a new native feature is required:

```text
1. identify exact native operation
2. add minimum permission
3. test development mode
4. test production build
5. document the reason
```

---

# 25. Versioning

Keep project version metadata synchronized.

Relevant places may include:

```text
package.json
package-lock.json
src/config/appConfig.ts
src-tauri/tauri.conf.json
src-tauri/Cargo.toml
```

Update npm package metadata with:

```powershell
npm version X.Y.Z --no-git-tag-version
```

Then synchronize remaining application/Tauri metadata.

Do not show a UI version that differs from the native bundle version.

---

# 26. Release checklist

Before distributing a release:

```text
[ ] npm run format:check passes
[ ] npm run typecheck passes
[ ] npm run lint passes
[ ] npm test passes
[ ] npm run quality passes
[ ] npm run quality:full passes
[ ] npm audit has no unresolved known vulnerabilities
[ ] npm run tauri:build succeeds
[ ] production executable starts
[ ] Dashboard works
[ ] Device page works
[ ] Settings page works
[ ] settings survive restart
[ ] title bar controls work
[ ] focus mode works
[ ] Test Module absent in production
[ ] Developer settings absent in production
[ ] DebugPanel absent in production
[ ] Device connect/disconnect works
[ ] Simulation EEG works if intentionally shipped
[ ] no unexpected CSP errors
[ ] no unexpected Tauri permission errors
[ ] no uncaught runtime errors
[ ] version metadata synchronized
[ ] installer works
[ ] clean installation starts successfully
```

For a real EEG adapter additionally verify:

```text
[ ] device discovery/detection
[ ] connection
[ ] repeated connect/disconnect
[ ] correct sample rate
[ ] correct channel count
[ ] correct channel labels
[ ] correct normalized ordering
[ ] native/source sample numbers if available
[ ] stream start/stop
[ ] disconnect during stream
[ ] reconnect
[ ] application shutdown releases hardware
[ ] long-running stream stability
[ ] dropped-sample behavior tested
```

---

# 27. Architectural invariants

These rules should remain true as KNeuron grows.

## Invariant 1

`App.tsx` does not know individual hardware manufacturers.

## Invariant 2

`DeviceManager` does not know individual hardware manufacturers.

## Invariant 3

Modules do not import concrete hardware adapters.

## Invariant 4

EEG modules request channels by label.

They do not depend on native headset indexes.

## Invariant 5

One physical EEG stream may serve many module consumers.

## Invariant 6

Every acquired EEG stream handle must eventually be released.

## Invariant 7

Adding a production module does not require adding module-specific conditions to `ModuleHost`, Dashboard or `App.tsx`.

## Invariant 8

Adding a new EEG adapter does not require manufacturer-specific changes in `DeviceManager` or `EEGStreamService`.

## Invariant 9

Development-only functionality must not leak into production.

## Invariant 10

Tauri permissions follow least privilege.

## Invariant 11

Every new device adapter receives automated tests.

## Invariant 12

Every new shared core service receives automated tests.

## Invariant 13

Public extension contracts and workflows must be documented here.

---

# 28. Common mistakes

## Manufacturer-specific DeviceManager logic

Wrong:

```ts
if (deviceId === "brainaccess") {
  connectBrainAccess();
}
```

Correct:

```text
BrainAccessAdapter contains BrainAccess behavior.
DeviceManager only sees EEGDeviceAdapter.
```

---

## Concrete hardware import inside a module

Wrong:

```ts
import {
  BrainAccessAdapter,
} from "...";
```

Correct:

```ts
import {
  eegStreamService,
} from "../../core/eeg";
```

---

## Hard-coded EEG indexes

Wrong:

```ts
const oz = values[6];
```

Correct:

```ts
channels: ["Oz"]
```

---

## Starting a hardware stream independently in every module

Wrong:

```text
Cortex starts device stream
SSVEP starts another
Miner starts another
```

Correct:

```text
all consumers use EEGStreamService
```

---

## Forgetting `release()`

Every successful:

```ts
eegStreamService.acquire(...)
```

must eventually have:

```ts
handle.release()
```

---

## Adding modules directly to `App.tsx`

Wrong:

```tsx
if (moduleId === "cortex") {
  return <CortexModule />;
}
```

Correct:

```text
module definition
→ built-in registration
→ component registry
→ ModuleHost
```

---

## Editing DeviceManager for every headset

If a new headset requires:

```text
if manufacturer === ...
```

inside `DeviceManager`, the adapter abstraction is probably broken.

---

## Confusing `index` and `sourceIndex`

```text
index
= normalized KNeuron stream position

sourceIndex
= hardware/native mapping
```

Modules use normalized labels and KNeuron ordering.

---

## Treating the simulator as real EEG

Simulation EEG is intended for:

```text
architecture tests
UI tests
module integration
pipeline testing
```

It is not physiological validation.

---

# 29. Planned modules

## Cortex 3D

Expected structure:

```text
src/modules/cortex/
├── CortexModule.tsx
├── cortexManifest.ts
├── cortexModuleDefinition.ts
├── components/
├── hooks/
├── eeg/
├── rendering/
├── styles/
└── tests/
```

Planned functionality:

- interactive brain
- Three.js renderer
- real-time EEG activity
- electrode positions
- hotspot color mapping
- possible mesh deformation
- EEG band visualization
- Simulation / LIVE mode
- edit mode
- persistent electrode editing
- render quality LOW / MEDIUM / HIGH
- brain mesh based on fsaverage assets

Cortex should use the common EEG service, typically:

```ts
channels: "all"
```

It must not know whether the active device is Simulation EEG, BrainAccess or another adapter.

---

## SSVEP Control

Planned functionality:

- 4-direction interface
- configurable frequencies
- configurable analysis window
- FBCCA
- SNR / quality information
- future LIVE BrainAccess support

Typical requested channels:

```text
O1
O2
Oz
PO3
PO4
POz
```

It should acquire:

```ts
channels: [
  "O1",
  "O2",
  "Oz",
  "PO3",
  "PO4",
  "POz",
]
```

---

## Miner

Miner should use the SSVEP infrastructure.

Desired dependency direction:

```text
Miner
  ↓
SSVEP processing/service
  ↓
EEGStreamService
  ↓
active EEG adapter
```

The game must not contain BrainAccess-specific logic.

---

# 30. Quick command reference

Install:

```powershell
npm install
```

Development:

```powershell
npm run tauri:dev
```

Frontend only:

```powershell
npm run dev
```

Format:

```powershell
npm run format
```

Type checking:

```powershell
npm run typecheck
```

Tests:

```powershell
npm test
```

Watch tests:

```powershell
npm run test:watch
```

Coverage:

```powershell
npm run test:coverage
```

Lint:

```powershell
npm run lint
```

Complete frontend quality:

```powershell
npm run quality
```

Frontend + Rust quality:

```powershell
npm run quality:full
```

Security check:

```powershell
npm audit
```

Production build:

```powershell
npm run tauri:build
```

---

# Documentation maintenance rule

Update this README in the same change whenever one of the following public contracts or workflows changes:

```text
KNeuronModuleManifest
KNeuronModuleDefinition
ModuleComponentRegistry
registerModuleDefinition
registerBuiltInModules
DeviceAdapter
EEGDeviceAdapter
DeviceRegistry
DeviceManager
EEGSampleBatch
EEGRingBuffer
EEGStreamService
channel selection
device registration
module registration
Tauri capabilities
build commands
quality commands
release process
```

The intended standard is:

> A new contributor should be able to understand the system and correctly add a module or hardware adapter by following this README without reverse-engineering the entire repository.
