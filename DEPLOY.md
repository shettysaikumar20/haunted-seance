# Deployment Guide: GitHub & Render

This repository is fully configured for **GitHub** and **Render (render.com)**, as well as **GitHub Pages**.

---

## Part 1: Uploading to GitHub

### Step 1: Create a New Repository on GitHub
1. Go to [github.com/new](https://github.com/new).
2. Name your repository (e.g. `ghost-in-the-machine` or `marigold-archive`).
3. Leave **"Initialize this repository with a README"** **unchecked** (we already have all project files initialized).
4. Click **Create repository**.

### Step 2: Push your Local Code to GitHub
Open your terminal in this project directory (`e:\week 5`) and run:

```bash
# Add your GitHub repository as remote (replace with your actual GitHub repo URL)
git remote add origin https://github.com/<YOUR-USERNAME>/<YOUR-REPO-NAME>.git

# Ensure default branch is main
git branch -M main

# Push all files and commits
git push -u origin main
```

*(If you ever make local changes later, simply run `git add .`, `git commit -m "update"`, and `git push`).*

---

## Part 2: Hosting on Render (render.com)

Render allows you to host the application for free. You have three simple options:

### Option A: Render Blueprint (1-Click Automated Setup) — Recommended
This repository includes a [`render.yaml`](render.yaml) configuration file.

1. Log in to [dashboard.render.com](https://dashboard.render.com).
2. Click the **"New +"** button in the top right and select **"Blueprint"**.
3. Connect your GitHub account and select your repository.
4. Render will detect `render.yaml` and show the configured services.
5. Click **"Apply"**. Render will automatically build and launch your live URL!

---

### Option B: Deploy as a Python Web Service (Runs `server.py`)
If you prefer creating the web service manually:

1. In the Render Dashboard, click **"New +"** $\rightarrow$ **"Web Service"**.
2. Connect your GitHub repository.
3. Configure the service settings:
   - **Name:** `ghost-in-the-machine`
   - **Region:** Any (e.g., Oregon or Frankfurt)
   - **Branch:** `main`
   - **Runtime:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt || true`
   - **Start Command:** `python server.py`
   - **Instance Type:** `Free`
4. Click **"Deploy Web Service"**.
5. Within 1-2 minutes, Render will assign you a live HTTPS URL (e.g., `https://ghost-in-the-machine.onrender.com`).

---

### Option C: Deploy as a Free Static Site
If you want zero cold starts and instant CDN delivery:

1. In the Render Dashboard, click **"New +"** $\rightarrow$ **"Static Site"**.
2. Connect your GitHub repository.
3. Settings:
   - **Name:** `ghost-machine-static`
   - **Branch:** `main`
   - **Build Command:** *(leave empty)*
   - **Publish Directory:** `.` *(a single dot represents the root directory)*
4. Click **"Create Static Site"**.
5. Your site is instantly live on Render's global CDN! All procedural Web Audio sounds, fog canvas, seance terminal, and memory garden work 100% in static mode.

---

## Part 3: Deploy on GitHub Pages (Alternative Free Host)

You can also host directly on GitHub with zero third-party accounts:

1. On GitHub, navigate to your repository.
2. Go to **Settings** $\rightarrow$ **Pages** (under "Code and automation" in the left sidebar).
3. Under **Build and deployment**:
   - **Source:** `Deploy from a branch`
   - **Branch:** `main` / `/ (root)`
4. Click **Save**.
5. In ~60 seconds, your site will be live at:
   `https://<YOUR-USERNAME>.github.io/<YOUR-REPO-NAME>/`

---

## Verifying Deployment
Once deployed, open your live URL in Chrome, Edge, or Safari:
1. Click **"✦ Dread Drone: OFF"** or **"♥ Heartbeat: OFF"** in the top bar to unmute the audio engine.
2. Click **"☠ AWAKEN THE GHOST"** or trigger **"⚡ Jump Scare"** to test the screen shockwave and sound stinger.
3. Use the **Ghost Terminal** to whisper questions to the machine.
4. Test the **Arduino UNO Q 8×13 matrix** glyphs.
