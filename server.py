#!/usr/bin/env python3
import http.server
import socketserver
import urllib.request
import urllib.parse
import json
import re
import os
from datetime import datetime

PORT = 8080
DIRECTORY = "/Users/purujeetsinghal/Desktop/projects/arcade points"

# Non-skill completion badges (introductory non-lab courses, deprecated courses, study guides)
EXCLUDED_COMPLETION_BADGES = [
    'safe spaces',
    'introduction to generative ai',
    'introduction to large language models',
    'introduction to responsible ai',
    'introduction to image generation',
    'build a certification study guide: ace exam prep'
]

class HTTPMethodFallbackRedirectHandler(urllib.request.HTTPRedirectHandler):
    def http_error_308(self, req, fp, code, msg, headers):
        return self.http_error_302(req, fp, code, msg, headers)

class ArcadeCalcHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def do_GET(self):
        parsed_url = urllib.parse.urlparse(self.path)
        
        # API Endpoint: /api/calculate?url=...
        if parsed_url.path == '/api/calculate':
            query_params = urllib.parse.parse_qs(parsed_url.query)
            target_url = query_params.get('url', [''])[0].strip()

            if not target_url:
                self._send_json({"error": "No URL provided", "success": False}, status=400)
                return

            try:
                result = self._scrape_and_calculate(target_url)
                self._send_json(result, status=200)
            except Exception as e:
                print(f"[Scraper Error] {e}")
                self._send_json({"error": str(e), "success": False}, status=500)
            return

        # Serve static files (index.html, styles.css, app.js)
        return super().do_GET()

    def _send_json(self, data, status=200):
        content = json.dumps(data).encode('utf-8')
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Content-Length", str(len(content)))
        self.end_headers()
        self.wfile.write(content)

    def _scrape_and_calculate(self, target_url):
        if not target_url.startswith('http://') and not target_url.startswith('https://'):
            target_url = 'https://' + target_url

        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }

        req = urllib.request.Request(target_url, headers=headers)
        opener = urllib.request.build_opener(HTTPMethodFallbackRedirectHandler)
        
        with opener.open(req, timeout=12) as response:
            html = response.read().decode('utf-8', errors='ignore')

        # 1. Extract User Name
        name_match = re.search(r"<h1 class=['\"]ql-display-small['\"]>\s*(.*?)\s*</h1>", html, re.DOTALL)
        user_name = name_match.group(1).strip() if name_match else "Google Cloud Learner"

        # 2. Extract Badge Titles & Completion Dates
        titles = re.findall(r"<span class=['\"]ql-title-medium l-mts['\"]>\s*(.*?)\s*</span>", html, re.DOTALL)
        clean_titles = [re.sub(r'<[^>]+>', '', t).strip() for t in titles]

        dates = re.findall(r"Earned\s+([A-Za-z]+\s+\d+,\s+\d{4})", html)

        # 3. Calculate Weekly Activity by Badge Completion Day of Week
        weekly_activity = {"Sunday": 0, "Monday": 0, "Tuesday": 0, "Wednesday": 0, "Thursday": 0, "Friday": 0, "Saturday": 0}
        
        for date_str in dates:
            try:
                dt = datetime.strptime(date_str, "%b %d, %Y")
                day_name = dt.strftime("%A")
                if day_name in weekly_activity:
                    weekly_activity[day_name] += 1
            except Exception:
                pass

        # 4. Extract Modal Body Descriptions for Skill Badge Verification
        modal_texts = {}
        for modal_id, modal_body in re.findall(r"<ql-dialog[^>]*id=['\"]([^'\"]+)['\"][^>]*>(.*?)</ql-dialog>", html, re.DOTALL):
            modal_texts[modal_id] = re.sub(r'<[^>]+>', '', modal_body).lower()

        arcade_games = []
        trivia_badges = []
        special_games = []
        skill_badges = []
        completion_badges = []

        # 5. Classify Badges
        for i, title in enumerate(clean_titles):
            lower = title.lower()

            if 'special monthly' in lower or 'special game' in lower or 'monumental' in lower:
                special_games.append(title)
            elif any(k in lower for k in ['arcade base camp', 'level 1', 'level 2', 'level 3', 'arcade voyage', 'arcade adventure', 'arcade simulator', 'arcade trail', 'arcade game', 'base camp']):
                arcade_games.append(title)
            elif 'trivia' in lower or 'spans and plans' in lower or 'weekly challenge' in lower:
                trivia_badges.append(title)
            else:
                modal_id = f"public-profile-award-modal-{i}"
                modal_desc = modal_texts.get(modal_id, "")

                is_skill_badge = ('skill badge' in modal_desc) or ('skill badge' in lower)

                if title.startswith('[Deprecated]') or lower in EXCLUDED_COMPLETION_BADGES:
                    is_skill_badge = False

                if is_skill_badge:
                    skill_badges.append(title)
                else:
                    completion_badges.append(title)

        pts_games = len(arcade_games) * 1.0
        pts_trivia = len(trivia_badges) * 1.0
        pts_special = len(special_games) * 2.0
        pts_skills = len(skill_badges) * 0.5

        arcade_points = pts_games + pts_trivia + pts_special + pts_skills

        # 6. Facilitator Program Milestone Calculation
        bonus_points = 0
        if len(arcade_games) >= 10 and len(skill_badges) >= 66:
            bonus_points = 35
        elif len(arcade_games) >= 8 and len(skill_badges) >= 42:
            bonus_points = 25
        elif len(arcade_games) >= 6 and len(skill_badges) >= 28:
            bonus_points = 15
        elif len(arcade_games) >= 4 and len(skill_badges) >= 14:
            bonus_points = 5

        total_points = arcade_points + bonus_points
        initial = user_name[0].upper() if user_name else 'G'

        return {
            "success": True,
            "userHandle": user_name,
            "initial": initial,
            "totalBadges": len(clean_titles),
            "arcadeGames": len(arcade_games),
            "triviaBadges": len(trivia_badges),
            "specialGames": len(special_games),
            "skillBadges": len(skill_badges),
            "completionBadges": len(completion_badges),
            "arcadePoints": round(arcade_points, 1),
            "bonusPoints": bonus_points,
            "totalPoints": round(total_points, 1),
            "weeklyActivity": weekly_activity
        }

def run_server():
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), ArcadeCalcHandler) as httpd:
        print(f"ArcadeCalc Scraper Server running on http://localhost:{PORT}")
        httpd.serve_forever()

if __name__ == "__main__":
    run_server()
