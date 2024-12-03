# Build Guide

## Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Git

## Build Steps

1. Clone the repository:
```bash
git clone [repository-url]
cd ApplicationTrackerVueElectron
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Development mode:
```bash
# Run electron app in development mode
npm run electron:serve
# or
yarn electron:serve
```

4. Build for production:
```bash
# Build for your current platform
npm run electron:build
# or
yarn electron:build
```

## Platform-specific Notes

### macOS
- The application is tested and confirmed working on macOS
- Sound notifications work out of the box
- Application data is stored locally in user's application data directory

### Troubleshooting
If you encounter any issues:
1. Make sure all dependencies are properly installed
2. Clear node_modules and reinstall dependencies
3. Check your Node.js version
4. Ensure you have proper permissions for the project directory
