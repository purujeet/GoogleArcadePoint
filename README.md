# Google Cloud ArcadeCalc - Arcade Points Calculator & Dashboard

ArcadeCalc is a live Google Cloud Arcade Points Calculator and Dashboard prototype designed following Google Material Design 3 guidelines. It dynamically analyzes public SkillBoost / Google Skills profiles, categorizes badges according to official point rules, and displays live Facilitator Milestones, Swag Tiers, and Weekly Completion Activity.

---

## Features

- **Dynamic Live Profile Scraper (`server.py`)**: Fetches any public Google Skills profile (`https://www.skills.google/public_profiles/...`) in real-time.
- **Strict Skill Badge Distinction**: Distinguishes hands-on assessment **Skill Badges** from non-lab course completion badges (which receive 0 Arcade Points).
- **Official Arcade Point Guidelines**:
  - **Arcade Games**: 1.0 Pt per badge (Level 1, Level 2, Level 3, Base Camp, Voyage, Adventure, Simulator, Trail)
  - **Trivia Badges**: 1.0 Pt per badge
  - **Special Games**: 2.0 Pts per badge
  - **Skill Badges**: 0.5 Pts per badge (Every 2 Skill Badges = 1.0 Pt)
- **Facilitator Program Milestones**: Dynamic threshold evaluation for Milestone 1 (+5 Pts), Milestone 2 (+15 Pts), Milestone 3 (+25 Pts), and Ultimate Milestone (+35 Pts).
- **Arcade Swag Tiers**: Tracks progress across Trooper (50 Pts), Ranger (75 Pts), Champion (95 Pts), and Legend (120 Pts) swag tiers.
- **Weekly Badge Activity**: Automatically parses badge completion timestamps (`Earned <Month> <Day>, <Year>`) and plots live completion activity by day of the week (Sunday – Saturday).

---

## Getting Started

### Run Locally

1. Clone or navigate to the repository folder:
   ```bash
   cd "arcade points"
   ```

2. Start the live Python server:
   ```bash
   python3 server.py
   ```

3. Open your browser and navigate to:
   ```
   http://localhost:8080
   ```

---

## File Structure

```
arcade points/
├── index.html       # Google Material 3 HTML Structure
├── styles.css       # Material Design 3 Theme & Bar Chart Styles
├── app.js           # Frontend Navigation & Dynamic API Rendering
├── server.py        # Python Live Profile Scraper & Static HTTP Server
└── README.md        # Documentation
```
