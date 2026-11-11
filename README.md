# 🏋️ GYM App — Professional Workout Video Hub & Coaching Platform

A sleek, responsive, and performance-focused athlete training platform designed for gym coaches and athletes. Built with **React 19**, **TypeScript**, **Tailwind CSS v4**, and **Google Cloud Firestore**.

![Node.js](https://img.shields.io/badge/Node.js-v20%2B-green.svg)
![React](https://img.shields.io/badge/React-19.0-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4.0-38bdf8.svg)
![License](https://img.shields.io/badge/License-Apache--2.0-yellow.svg)

---

## 🌟 Key Highlights

- **👑 Coach Muhammad Command Center**:
  - Full administrator control panel with athlete management, video library management, stage advancement requests, and physique check-in reviews.
  - **Change Password Feature**: Coach Muhammad can change his administrator password at any time directly through the UI or settings, with instant session update, input verification, strength meter, and persistence.
- **📈 3-Stage Athlete Progression**:
  - **Normal Tier**: 1 curated exercise per routine.
  - **Extra Tier**: 3 curated exercises per routine.
  - **Premium Tier**: 5 curated exercises per routine.
  - Athletes can request stage promotions; Coach Muhammad can approve or reject with 1 click.
- **🎥 Native Device Video Hub**:
  - 100% self-contained native device video player.
  - Dynamic forensic anti-piracy watermarking (`Athlete ID · Timestamp · Anti-Piracy Tag`).
  - Personal athlete workout notes attached to each exercise.
  - Interactive playback, completion tracking, and recently watched history.
- **📊 D3.js Calorie & Fitness Analytics**:
  - 7-day completion and estimated calorie expenditure charts.
  - Customizable **Daily Calorie Goal** configurable per athlete.
  - Real-time SVG reference lines and day-over-day trend indicators.
- **📸 Optional Before & After Physique Check-ins**:
  - Athletes can optionally submit before and after training physique photos.
  - Coach Muhammad evaluates physique progress and provides personalized written feedback and ratings (*Notable Progress*, *Consistent Work*, *Form Focus Needed*).
- **🎨 Theme & Accent Customizer**:
  - Dark mode and light mode.
  - Athletic accent presets: Cyber Cyan, Toxic Volt, Ember Orange, Neon Crimson, Electric Purple, Acid Lime.
  - Custom HEX color picker with real-time CSS variable bindings.
- **☁️ Cloud Sync & Offline Resilience**:
  - Synchronizes seamlessly with Google Cloud Firestore.
  - LocalStorage fallbacks ensure 100% functionality offline.
  - Full cross-device JSON backup and restore.

---

## 🔐 Default Credentials

| Role | Username / Email | Default Password | Notes |
| :--- | :--- | :--- | :--- |
| **Admin (Coach)** | `muhammad@gymapp.com` or `muhammad` or `admin` | `123` | Can be changed anytime via UI |
| **Athlete** | Added by Muhammad in Admin Console | Defined upon creation | Auto-assigned to Normal tier by default |

> 💡 **Tip**: To change the admin password, log in as Coach Muhammad, click the golden **Key icon** in the top navigation or the **Change Password** button in the Admin Dashboard, enter your current password, and set your new password.

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js**: `v20.0.0` or higher
- **npm**: `v10.0.0` or higher

### 2. Export & Push to Your GitHub Repository
1. In your local terminal or downloaded folder, run:
```bash
# Initialize branch and link to your GitHub repository
git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/YOUR_REPO_NAME.git

# Push code to GitHub
git push -u origin main
```

---

## 🌐 How to Get Your Live Web Link (Free Hosting)

Once you add your files to GitHub, pick the easiest method:

### 🌟 Method 1: Instant GitHub Pages via `/docs` (Simplest — 1 Minute!)
We have included a pre-built, production-ready `/docs` folder directly inside the repo:
1. Open your repository on GitHub.
2. Click **Settings** (top tab) > **Pages** (in the left sidebar under *Code and automation*).
3. Under **Build and deployment > Source**, leave it as **"Deploy from a branch"**.
4. Under **Branch**:
   - Select **`main`** from the first dropdown.
   - Select **`/docs`** from the folder dropdown (instead of `/root`).
5. Click **Save**!
6. In about 30 seconds, refresh the page and GitHub will display your live public link at the top:  
   👉 `https://YOUR_GITHUB_USERNAME.github.io/YOUR_REPO_NAME/`

### ⚡ Method 2: GitHub Actions (Automated CI/CD)
1. Go to **Settings** > **Pages**.
2. Under **Build and deployment > Source**, select **GitHub Actions**.
3. GitHub automatically runs the included `.github/workflows/deploy.yml` workflow and deploys your site.

### Option B: Vercel (Recommended for 1-Click Fast CDN)
1. Go to [vercel.com](https://vercel.com) and sign in with GitHub.
2. Click **"Add New Project"** and select your GitHub repository.
3. Keep default settings (Vite / React preset is auto-detected).
4. Click **Deploy**.
5. Within 30 seconds, you get a live SSL link:  
   👉 `https://YOUR_PROJECT_NAME.vercel.app`

### Option C: Netlify
1. Go to [netlify.com](https://netlify.com) and sign in with GitHub.
2. Click **"Add new site"** > **"Import an existing project"**.
3. Choose your repository. Build command is `npm run build`, and publish directory is `dist`.
4. Click **Deploy**. You get a live link:  
   👉 `https://YOUR_SITE.netlify.app`

---

### 3. Local Installation & Development
```bash
npm install --legacy-peer-deps
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your web browser.

### 4. Run Automated Tests
```bash
npm test
```
Runs 24 automated unit tests covering storage, password management, calorie analytics, stage permissions, and data import/export.

### 5. Build for Production
```bash
npm run build
```
Production assets are generated in the `dist/` directory with relative asset paths ready for any static web host.

---

## 📁 Project Architecture

```
├── .env.example               # Environment variable templates
├── index.html                 # HTML entry point with athletic typography
├── metadata.json              # App capabilities & studio configuration
├── package.json               # NPM scripts and dependencies
├── tsconfig.json              # TypeScript compilation configuration
├── vite.config.ts             # Vite configuration with Tailwind CSS v4
├── src/
│   ├── App.tsx                # Main application orchestrator & routing
│   ├── main.tsx               # React root entry point
│   ├── index.css              # Global styles & Tailwind v4 directives
│   ├── types/
│   │   └── workout.ts         # TypeScript interfaces & stage permissions
│   ├── utils/
│   │   ├── storage.ts         # LocalStorage persistence & auth logic
│   │   ├── cloudSync.ts       # Google Cloud Firestore synchronization
│   │   ├── analytics.ts       # D3.js calorie data processing
│   │   ├── media.ts           # Web Audio API sound synthesis & thumbnails
│   │   ├── theme.ts           # Athletic color theme manager
│   │   ├── password.test.ts   # Password update unit tests
│   │   ├── analytics.test.ts  # Calorie analytics unit tests
│   │   └── workout.test.ts    # Stage & permissions unit tests
│   └── components/
│       ├── Navbar.tsx             # Responsive header with key quick-actions
│       ├── LoginView.tsx          # Dual-mode authentication screen
│       ├── AdminDashboard.tsx     # Coach Muhammad management console
│       ├── UserDashboard.tsx      # Athlete workout feed & analytics
│       ├── ChangePasswordModal.tsx# Secure password change modal
│       ├── VideoModal.tsx         # Native video player with forensic watermark
│       ├── UserSettingsModal.tsx  # Daily calorie goal & athlete settings
│       ├── ProgressPhotoModal.tsx # Before & after physique check-ins
│       ├── ThemeSettingsModal.tsx # Visual color palette customizer
│       ├── StorageModal.tsx       # Diagnostics, backup & JSON export/restore
│       └── InstructionsModal.tsx  # Stage tier progression guide
```

---

## 📱 Mobile App (PWA) & APK Download Instructions

GYM App is configured as an installable **Progressive Web App (PWA)** and can be packaged into an **Android APK**:

### 📲 1. Instant Install on Mobile (Zero App Store Required)
- **On Android (Chrome / Edge / Samsung Internet)**:
  - Open your deployed URL.
  - A bottom prompt `"Add GYM App to Home Screen"` will appear, or tap the top-right menu `⋮` and tap **"Install App"**.
  - GYM App runs in full-screen standalone mode with app icon, offline caching, and native-like performance.
- **On iOS / iPhone (Safari)**:
  - Open your deployed URL in Safari.
  - Tap the **Share button** (square with arrow up).
  - Tap **"Add to Home Screen"**.
  - Launch GYM App directly from your home screen.

### 🤖 2. How to Generate an Android APK (Free & 1-Click via PWABuilder)
1. Deploy your app to GitHub Pages, Vercel, or Netlify to get a live HTTPS URL.
2. Visit **[PWABuilder.com](https://www.pwabuilder.com/)**.
3. Paste your live app URL (e.g. `https://yourusername.github.io/gym-workout-video-hub/`) and click **Start**.
4. PWABuilder tests the PWA Manifest and Service Worker (already bundled in this repository with high score).
5. Click **"Package for Android"** > **"Generate APK"**.
6. Download your signed Android package (`.apk` or `.aab`) and install it directly on any Android phone!

---

## ⏱️ Athlete Features Included

- **📊 Recharts Weekly Workouts Visualizer**:
  - Visualizes daily completed workouts over the last 7 days.
  - Includes 7-day daily average reference line (`Avg / day`), total weekly completed count, and active days metrics (`X/7 days`).
  - Interactive custom tooltips showing daily status, percentage contribution, and active streaks.
- **⏱️ Floating Workout Rest Interval Timer**:
  - One-click presets for 30s, 60s, 90s, and 120s between exercise sets.
  - Live circular progress bar, high-contrast digital display, Web Audio chimes upon completion, and haptic feedback.
  - Accessible via floating trigger or in-workout controls.
- **📱 Phone & Laptop Responsive UI**:
  - On smartphones: Adaptive thumb-navigation bottom bar (`fixed bottom-0`), touch targets $\ge 44\text{px}$, responsive video player, and horizontal-scroll category filters.
  - On laptops: Multi-column grid, persistent top navigation, and comprehensive gym analytics.

---

## 🔒 Security & Privacy

- **Password Rules**: Minimum 3 characters, current password verification, duplicate check, and real-time strength evaluation.
- **Session Protection**: Passwords are never stored in plain session state.
- **Forensic Watermarking**: All video streams dynamically render user identity markers across the viewport to deter screen recording and content leakage.
- **Role-Based Access Control (RBAC)**: Non-admin users cannot access management tools or view other athletes' private check-in photos.

---

## 📄 License

This project is licensed under the Apache License 2.0. See the [LICENSE](LICENSE) file for details.
