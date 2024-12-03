# Job Tracker Application

Electron-based desktop application for job tracking and management.

## Development Setup

### Prerequisites
- Node.js (v16 or higher)
- npm (comes with Node.js)
- Git

### Installation
1. Clone the repository:
```bash
git clone https://github.com/markbrutx/ApplicationTrackerVueElectron.git
cd ApplicationTrackerVueElectron
```

2. Install dependencies:
```bash
npm install
```

3. Run in development mode:
```bash
npm run dev
```

## Building the Application

### For Windows (EXE)
To build the Windows executable:
```bash
npm run electron:build
```
The installer will be created in `dist_electron/applyelectron Setup 1.0.0.exe`

### For macOS (DMG)
To build the macOS disk image:
```bash
npm run electron:build
```
The DMG file will be created in `dist_electron/applyelectron-1.0.0.dmg`

Note: Building for macOS requires running on a macOS system.

## Build Configuration

The build configuration is defined in `package.json` under the `build` section:
- Windows: Creates an NSIS installer (.exe)
- macOS: Creates both DMG and ZIP formats

## Troubleshooting Build Issues

### Common Issues:

1. **Native Dependencies**
If you encounter issues with native dependencies, run:
```bash
npm run rebuild
```

2. **Missing Dependencies**
If you get errors about missing dependencies:
```bash
npm install
npm run postinstall
```

3. **Clean Build**
To perform a clean build:
```bash
rm -rf dist dist_electron
npm run electron:build
```

## Optional Improvements

To enhance the build quality:
1. Add application icon in `build` configuration
2. Add description and author in package.json
3. Optimize large JavaScript chunks using dynamic imports

## License
MIT
