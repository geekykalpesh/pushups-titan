# 🏋️ Pushup Titan - GeekyKalpesh

An athletic, psychology-grounded mobile fitness application built with **React Native CLI**, powered by a high-performance **Node.js Express** backend, **Neon Cloud PostgreSQL** database, and **JWT authentication** with **4-Digit Quick Passcode Unlock**.

- **Application ID / Package:** `com.geekykalpesh.pushups`
- **Version:** `1.0.0` (Build `1`)
- **Developer:** GeekyKalpesh (`geekykalpesh@gmail.com`)
- **Official Privacy Policy:** Included in-app and at `/privacy-policy`

---

## 🛡️ Google Play Store Reviewer Access
Reviewer credentials for the Google Play review team are securely declared in Google Play Console (App Access). The account is pre-seeded with pushup logs, egg nutrition entries, and streak records in the cloud database so the entire dashboard and GitHub-style contribution heatmap are immediately active upon evaluation.

---

## ⚡ Core Features

### 1. 🛡️ Daily Pushup Arena
- **Real-Time Logging**: Track pushup sets on the fly with timestamps, rep counts, and notes (e.g., *Diamond*, *Failure set*).
- **Daily Benchmark Ring**: Visual progress ring tracking completed reps against your target goal.
- **Quick-Add Chips**: One-tap addition for `+10`, `+15`, `+20`, `+25`, `+50` reps or custom numpad input.
- **Streak & Rank Engine**: Daily discipline streak preservation with rank tiers (from *Rising Gladiator* up to *Immortal Spartan God*).

### 2. 🥚 Eggs & Anabolic Protein Fuel Tracker
- **Daily Egg Counter**: Log eggs consumed per meal with one-tap quick selectors.
- **Automated Bio-available Protein Computation**: Automatically calculates dietary protein intake (~6.3g per egg).
- **Daily Protein Target Bar**: Visual progression toward daily nutritional targets.

### 3. 🟩 GitHub-Style Pixel Heatmap & Interactive Calendar
- **Interactive Calendar View**: Select any date to inspect historical pushups, egg counts, and notes.
- **GitHub Contribution Matrix**: Square-pixel contribution heatmap where cell shade darkens proportionally to daily volume.
- **Date Inspector Modal**: Deep-dive inspection into specific historical training sessions.

### 4. 📊 Monthly Performance Analytics
- **Pushup Analytics Chart**: Daily workout volume curves across the entire month.
- **Nutritional Analytics Chart**: Daily egg & protein intake curves.
- **Personal Records**: Monthly aggregate, daily average, and peak day tracking.

### 5. ⏰ Pushup Alarms & Habit Reminders
- **Discipline Alarms**: Custom scheduled reminders with target rep count prompts.
- **In-App Tactical Alert**: High-visibility popups with snooze options.

### 6. 🔒 Security, Passcode & Privacy
- **JWT Authentication**: Secure account registration and login.
- **4-Digit Quick Unlock**: Instant passcode access without retyping email/password repeatedly.
- **In-App Privacy Policy**: Comprehensive GDPR & CCPA compliant privacy disclosure screen with developer contact and account deletion instructions.

---

## 🗄️ Database Architecture (Neon Cloud PostgreSQL)
The application is connected to **Neon Serverless PostgreSQL**:
- **Project:** `pushups-titan` (`autumn-frost-81641883`)
- **Branch:** `production` (`br-autumn-night-bdqdvyzx`)
- **Driver:** `pg` Pool with SSL encryption (`rejectUnauthorized: false`)

### Synchronized Database Tables
- `users`: User profiles, hashed passwords (bcrypt), 4-digit PIN hashes, and daily benchmark goals.
- `pushup_logs`: Workout logs with exact timestamps, date, rep count, and notes.
- `egg_logs`: Nutrition entries with egg counts and calculated protein metrics.
- `reminders`: Pushup reminder schedules and active toggles.

---

## 🚀 Backend Deployment on Render

This repository includes a production-ready `render.yaml` blueprint for 1-click deployment.

### Steps to Deploy on Render:
1. Log into your [Render Dashboard](https://dashboard.render.com).
2. Click **New +** -> **Blueprint** (or **Web Service**).
3. Connect your GitHub repository.
4. If deploying manually as a **Web Service**:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `node src/server.js`
   - **Environment Variables**:
     - `NODE_ENV`: `production`
     - `PORT`: `5000`
     - `DATABASE_URL`: *(Your Neon PostgreSQL connection string from your Neon dashboard)*
     - `DATABASE_URL_UNPOOLED`: *(Your Neon unpooled connection string)*
     - `JWT_SECRET`: *(A secure 32+ character random string)*
     - `JWT_EXPIRES_IN`: `30d`
5. Click **Deploy Web Service**.
6. Render will assign you a live production URL (e.g., `https://pushup-titan.onrender.com`).
   - Your Privacy Policy URL will be live at: `https://pushup-titan.onrender.com/privacy-policy`
   - Your API Health endpoint will be live at: `https://pushup-titan.onrender.com/api/health`

---

## 📤 How to Push to GitHub

To push this codebase to your GitHub repository:

```bash
# 1. Add your GitHub remote URL
git remote add origin https://github.com/<your-username>/<your-repo-name>.git

# 2. Rename branch to main (if preferred)
git branch -M main

# 3. Push all production commits to GitHub
git push -u origin main
```

---

## 📱 Mobile App Configuration (Building APK & AAB)

After deploying on Render and obtaining your live backend URL:

1. Update the production endpoint in `mobile/src/api/client.ts`.
2. Generate Release APK / AAB:
   ```bash
   cd mobile/android
   # For APK:
   ./gradlew assembleRelease
   # For Google Play AAB:
   ./gradlew bundleRelease
   ```
3. Generated files:
   - APK: `mobile/android/app/build/outputs/apk/release/app-release.apk`
   - AAB: `mobile/android/app/build/outputs/bundle/release/app-release.aab`

---

## 📄 License & Attribution
Developed and published by **GeekyKalpesh**. All rights reserved.
