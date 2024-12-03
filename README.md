# Application Tracker

> A desktop application built with Vue.js and Electron for tracking and gamifying your job application process.

## Overview

Application Tracker is a desktop tool designed to transform the job application process into a more engaging experience. It helps maintain motivation during job searching by providing immediate feedback, progress tracking, and gamification elements.

## Features

- **Application Tracking**
  - Daily application counter
  - Job board categorization
  - Timestamp tracking with timezone support
  - Recent applications history
  - Cloud synchronization with Firebase

- **Progress Gamification**
  - Achievement streaks system (5 applications = 1 streak)
  - Dual streak modes (basic/advanced)
  - Audio feedback system
  - Visual progress indicators

- **Analytics & Insights**
  - Daily activity charts
  - Job board distribution analysis
  - Detailed statistical summaries
  - Data export capabilities

## Tech Stack

- **Frontend Framework**: Vue.js 3
- **State Management**: Vuex
- **UI Framework**: Vuetify
- **Desktop Framework**: Electron
- **Charts**: Chart.js with Vue-ChartJS
- **Database**: Firebase Realtime Database
- **Build Tools**: Vue CLI + Electron Builder

## Why This Project Exists

Job searching can feel like throwing applications into a void - you send them out day after day, often without any immediate response. This can be mentally draining and demotivating. I created this application to make this process more bearable and even engaging.

The idea was simple: what if each application submission could give you immediate positive feedback? What if you could see your progress and feel a sense of achievement, even before getting responses from employers?

That's how Application Tracker was born. It turns each application into a small victory with satisfying sound effects. It keeps track of your "streaks" like a game, making you want to maintain your momentum. The visual charts and statistics help you see your progress over time, proving that you're moving forward even when it doesn't feel like it.

Plus, with Firebase integration, your progress syncs across devices, so you never lose track of your efforts. It's not just a tracker - it's a companion for your job search journey, helping you stay motivated and organized when you need it most.

## Getting Started

1. See [BUILD.md](src/docs/BUILD.md) for build and development instructions
2. Follow [FIREBASE_SETUP.md](src/docs/FIREBASE_SETUP.md) to configure Firebase integration

## License
MIT
