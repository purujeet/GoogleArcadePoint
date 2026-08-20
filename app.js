/**
 * Google Cloud ArcadeCalc - Production Client Engine
 * Clean Input Engine for GitHub Pages & Local Hosting
 */

document.addEventListener('DOMContentLoaded', () => {
  // Navigation & Views
  const tabHome = document.querySelector('#tab-home');
  const tabDashboard = document.querySelector('#tab-dashboard');
  const tabSwag = document.querySelector('#tab-swag');
  const brandLink = document.querySelector('#brand-home-link');

  const viewHome = document.querySelector('#view-home');
  const viewDashboard = document.querySelector('#view-dashboard');
  const viewSwag = document.querySelector('#view-swag');

  // Form & Inputs
  const heroForm = document.querySelector('#hero-calc-form');
  const profileUrlInput = document.querySelector('#profile-url-input');
  const heroCalcBtn = document.querySelector('#hero-calc-btn');

  // Help Modal
  const helpTrigger = document.querySelector('#help-modal-trigger');
  const helpModal = document.querySelector('#help-modal');
  const modalCloseBtn = document.querySelector('#modal-close-btn');

  // Theme Toggle
  const themeToggleBtn = document.querySelector('#theme-toggle-btn');

  // Global State for Scraped Profile Data
  let currentProfileData = {
    arcadeGames: 0,
    skillBadges: 0,
    bonusPoints: 0,
    totalPoints: 0,
    earnedBadgeTitles: []
  };

  // Switch View Helper
  function switchView(viewName) {
    if (viewHome) viewHome.classList.add('hidden');
    if (viewDashboard) viewDashboard.classList.add('hidden');
    if (viewSwag) viewSwag.classList.add('hidden');

    if (tabHome) tabHome.classList.remove('active');
    if (tabDashboard) tabDashboard.classList.remove('active');
    if (tabSwag) tabSwag.classList.remove('active');

    if (viewName === 'home') {
      if (viewHome) viewHome.classList.remove('hidden');
      if (tabHome) tabHome.classList.add('active');
    } else if (viewName === 'dashboard') {
      if (viewDashboard) viewDashboard.classList.remove('hidden');
      if (tabDashboard) tabDashboard.classList.add('active');
    } else if (viewName === 'swag') {
      if (viewSwag) viewSwag.classList.remove('hidden');
      if (tabSwag) tabSwag.classList.add('active');
    }
  }

  if (tabHome) tabHome.addEventListener('click', () => switchView('home'));
  if (tabDashboard) tabDashboard.addEventListener('click', () => switchView('dashboard'));
  if (tabSwag) tabSwag.addEventListener('click', () => switchView('swag'));
  if (brandLink) brandLink.addEventListener('click', (e) => { e.preventDefault(); switchView('home'); });

  // Theme Toggle
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', newTheme);

      const icon = themeToggleBtn.querySelector('i');
      if (icon) {
        icon.className = newTheme === 'dark' ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
      }
    });
  }

  // Help Modal Toggle
  if (helpTrigger && helpModal) {
    helpTrigger.addEventListener('click', () => helpModal.classList.add('active'));
  }
  if (modalCloseBtn && helpModal) {
    modalCloseBtn.addEventListener('click', () => helpModal.classList.remove('active'));
  }
  if (helpModal) {
    helpModal.addEventListener('click', (e) => {
      if (e.target === helpModal) helpModal.classList.remove('active');
    });
  }

  // Non-Skill Completion Badges Excluded List
  const EXCLUDED_COMPLETION_BADGES = [
    'safe spaces',
    'introduction to generative ai',
    'introduction to large language models',
    'introduction to responsible ai',
    'introduction to image generation',
    'build a certification study guide: ace exam prep'
  ];

  // Dynamic Profile Evaluation Handler with Fail-Safe Reset
  async function processCalculation(url) {
    if (!url || !url.trim()) return;

    if (heroCalcBtn) {
      heroCalcBtn.disabled = true;
      heroCalcBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i><br>Evaluating...';
    }

    try {
      let calculatedData = null;

      // 1. Try local server API ONLY if running on localhost / local development environment
      const isLocalEnvironment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      if (isLocalEnvironment) {
        try {
          const response = await fetch('/api/calculate?url=' + encodeURIComponent(url));
          if (response.ok) {
            const data = await response.json();
            if (data && data.success) {
              calculatedData = data;
            }
          }
        } catch (err) {
          console.warn('Local server endpoint unavailable, using client-side scraper fallback');
        }
      }

      // 2. Client-Side Scraper Engine for Hosted Environments (GitHub Pages / Web)
      if (!calculatedData) {
        calculatedData = await scrapeProfileClientSide(url);
      }

      if (calculatedData && calculatedData.success) {
        renderDashboard(calculatedData);
        switchView('dashboard');
      } else {
        alert('Could not fetch public profile data. Please verify that your profile URL is set to Public on Google Skills Boost.');
      }
    } catch (err) {
      console.error('Calculation Error:', err);
      alert('Could not fetch public profile data. Please check that your profile link is public and try again.');
    } finally {
      if (heroCalcBtn) {
        heroCalcBtn.disabled = false;
        heroCalcBtn.innerHTML = 'Calculate<br>Points';
      }
    }
  }

  // Helper fetch with timeout
  async function fetchWithTimeout(resource, options = {}) {
    const { timeout = 6000 } = options;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(resource, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(id);
      return response;
    } catch (error) {
      clearTimeout(id);
      throw error;
    }
  }

  // Robust Client-Side Scraper Engine with Fast Multi-Proxy Strategy
  async function scrapeProfileClientSide(targetUrl) {
    let cleanUrl = targetUrl.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = 'https://' + cleanUrl;
    }

    let html = null;

    // Proxy Strategy 1: corsproxy.io
    try {
      const res = await fetchWithTimeout(`https://corsproxy.io/?${encodeURIComponent(cleanUrl)}`, { timeout: 6000 });
      if (res.ok) {
        const text = await res.text();
        if (text && text.includes('profile-badge')) html = text;
      }
    } catch (e) {}

    // Proxy Strategy 2: AllOrigins JSON API
    if (!html) {
      try {
        const res = await fetchWithTimeout(`https://api.allorigins.win/get?url=${encodeURIComponent(cleanUrl)}`, { timeout: 6000 });
        if (res.ok) {
          const json = await res.json();
          if (json && json.contents && json.contents.includes('profile-badge')) {
            html = json.contents;
          }
        }
      } catch (e) {}
    }

    // Proxy Strategy 3: CodeTabs Proxy
    if (!html) {
      try {
        const res = await fetchWithTimeout(`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(cleanUrl)}`, { timeout: 6000 });
        if (res.ok) {
          const text = await res.text();
          if (text && text.includes('profile-badge')) html = text;
        }
      } catch (e) {}
    }

    if (!html) {
      throw new Error('Failed to fetch public profile HTML via CORS proxies');
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const nameEl = doc.querySelector('h1.ql-display-small');
    const userHandle = nameEl ? nameEl.textContent.trim() : 'Google Cloud Learner';

    const badgeElements = doc.querySelectorAll('div.profile-badge');

    const modalTexts = {};
    doc.querySelectorAll('ql-dialog').forEach(dialog => {
      if (dialog.id) {
        modalTexts[dialog.id] = dialog.textContent.toLowerCase();
      }
    });

    const arcadeGames = [];
    const triviaBadges = [];
    const specialGames = [];
    const skillBadges = [];
    const completionBadges = [];
    const allTitles = [];

    badgeElements.forEach((b, i) => {
      const titleEl = b.querySelector('span.ql-title-medium');
      const title = titleEl ? titleEl.textContent.trim() : '';
      if (!title) return;

      allTitles.push(title);
      const lower = title.toLowerCase();

      if (lower.includes('special monthly') || lower.includes('special game') || lower.includes('monumental')) {
        specialGames.push(title);
      } else if (['arcade base camp', 'level 1', 'level 2', 'level 3', 'arcade voyage', 'arcade adventure', 'arcade simulator', 'arcade trail', 'arcade game', 'base camp'].some(k => lower.includes(k))) {
        arcadeGames.push(title);
      } else if (lower.includes('trivia') || lower.includes('spans and plans') || lower.includes('weekly challenge')) {
        triviaBadges.push(title);
      } else {
        const btn = b.querySelector('ql-button');
        const modalId = btn ? btn.getAttribute('modal') : `public-profile-award-modal-${i}`;
        const modalDesc = modalTexts[modalId] || '';

        let isSkillBadge = modalDesc.includes('skill badge') || lower.includes('skill badge');
        if (title.startsWith('[Deprecated]') || EXCLUDED_COMPLETION_BADGES.includes(lower)) {
          isSkillBadge = false;
        }

        if (isSkillBadge) {
          skillBadges.push(title);
        } else {
          completionBadges.push(title);
        }
      }
    });

    const ptsGames = arcadeGames.length * 1.0;
    const ptsTrivia = triviaBadges.length * 1.0;
    const ptsSpecial = specialGames.length * 2.0;
    const ptsSkills = skillBadges.length * 0.5;

    const arcadePoints = ptsGames + ptsTrivia + ptsSpecial + ptsSkills;

    let bonusPoints = 0;
    if (arcadeGames.length >= 10 && skillBadges.length >= 66) {
      bonusPoints = 35;
    } else if (arcadeGames.length >= 8 && skillBadges.length >= 42) {
      bonusPoints = 25;
    } else if (arcadeGames.length >= 6 && skillBadges.length >= 28) {
      bonusPoints = 15;
    } else if (arcadeGames.length >= 4 && skillBadges.length >= 14) {
      bonusPoints = 5;
    }

    const totalPoints = arcadePoints + bonusPoints;
    const initial = userHandle ? userHandle[0].toUpperCase() : 'G';

    return {
      success: true,
      userHandle,
      initial,
      totalBadges: badgeElements.length,
      arcadeGames: arcadeGames.length,
      triviaBadges: triviaBadges.length,
      specialGames: specialGames.length,
      skillBadges: skillBadges.length,
      completionBadges: completionBadges.length,
      arcadePoints: Math.round(arcadePoints * 10) / 10,
      bonusPoints,
      totalPoints: Math.round(totalPoints * 10) / 10,
      earnedBadgeTitles: allTitles
    };
  }

  // --- INTERACTIVE MILESTONE SELECTION LOGIC ---
  const MILESTONE_DEFINITIONS = {
    start: {
      title: 'Milestone Start Baseline',
      reqGames: 0,
      reqSkills: 0,
      bonusPts: 0
    },
    m1: {
      title: 'Milestone 1 Requirements',
      reqGames: 4,
      reqSkills: 14,
      bonusPts: 5
    },
    m2: {
      title: 'Milestone 2 Requirements',
      reqGames: 6,
      reqSkills: 28,
      bonusPts: 15
    },
    m3: {
      title: 'Milestone 3 Requirements',
      reqGames: 8,
      reqSkills: 42,
      bonusPts: 25
    },
    ultimate: {
      title: 'Ultimate Milestone Requirements',
      reqGames: 10,
      reqSkills: 66,
      bonusPts: 35
    }
  };

  function selectMilestone(milestoneKey) {
    const config = MILESTONE_DEFINITIONS[milestoneKey] || MILESTONE_DEFINITIONS.ultimate;

    document.querySelectorAll('.interactive-node').forEach(node => {
      if (node.getAttribute('data-milestone') === milestoneKey) {
        node.classList.add('active-selected');
      } else {
        node.classList.remove('active-selected');
      }
    });

    const titleEl = document.querySelector('#req-box-title');
    const ptsTagEl = document.querySelector('#req-box-pts-tag');
    const reqGamesEl = document.querySelector('#req-games-count');
    const reqSkillsEl = document.querySelector('#req-skills-count');
    const barGamesEl = document.querySelector('#bar-fill-games');
    const barSkillsEl = document.querySelector('#bar-fill-skills');
    const iconGameCheck = document.querySelector('#icon-game-check');
    const iconSkillCheck = document.querySelector('#icon-skill-check');
    const ultimateStatusTag = document.querySelector('#ultimate-status-tag');

    const games = currentProfileData.arcadeGames || 0;
    const skills = currentProfileData.skillBadges || 0;

    if (titleEl) titleEl.textContent = config.title;
    if (ptsTagEl) ptsTagEl.textContent = `+${config.bonusPts} pts`;

    if (reqGamesEl) reqGamesEl.textContent = `${games} / ${config.reqGames}`;
    if (reqSkillsEl) reqSkillsEl.textContent = `${skills} / ${config.reqSkills}`;

    const gamePct = config.reqGames > 0 ? Math.min((games / config.reqGames) * 100, 100) : 100;
    const skillPct = config.reqSkills > 0 ? Math.min((skills / config.reqSkills) * 100, 100) : 100;

    if (barGamesEl) barGamesEl.style.width = `${gamePct}%`;
    if (barSkillsEl) barSkillsEl.style.width = `${skillPct}%`;

    const isGameDone = games >= config.reqGames;
    const isSkillDone = skills >= config.reqSkills;
    const isCompleted = isGameDone && isSkillDone;

    if (iconGameCheck) {
      if (isGameDone) {
        iconGameCheck.className = 'fa-solid fa-circle-check';
        iconGameCheck.style.color = 'var(--green-accent)';
      } else {
        iconGameCheck.className = 'fa-solid fa-circle-xmark';
        iconGameCheck.style.color = 'var(--text-dim)';
      }
    }

    if (iconSkillCheck) {
      if (isSkillDone) {
        iconSkillCheck.className = 'fa-solid fa-circle-check';
        iconSkillCheck.style.color = 'var(--green-accent)';
      } else {
        iconSkillCheck.className = 'fa-solid fa-circle-xmark';
        iconSkillCheck.style.color = 'var(--text-dim)';
      }
    }

    if (ultimateStatusTag) {
      if (isCompleted) {
        ultimateStatusTag.textContent = 'Achieved! 🎉';
        ultimateStatusTag.className = 'achieved-tag tag-achieved';
      } else {
        ultimateStatusTag.textContent = 'In Progress ⏳';
        ultimateStatusTag.className = 'achieved-tag tag-progress';
      }
    }
  }

  // Attach Click & Keyboard Listeners for Timeline Nodes
  document.querySelectorAll('.interactive-node').forEach(node => {
    const milestoneKey = node.getAttribute('data-milestone');
    if (!milestoneKey) return;

    node.addEventListener('click', () => selectMilestone(milestoneKey));
    node.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectMilestone(milestoneKey);
      }
    });
  });

  // --- GAMIFIED XP LEVEL & ACHIEVEMENTS ENGINE ---
  function updateXPLevel(totalPts) {
    const levelTitleEl = document.querySelector('#user-level-title');
    const xpCounterEl = document.querySelector('#xp-counter-text');
    const xpFillBar = document.querySelector('#xp-fill-bar');

    let levelName = 'Level 1: Arcade Rookie 🎯';
    let targetPts = 30;
    let basePts = 0;

    if (totalPts >= 120) {
      levelName = 'Level 6: Google Cloud Legend 👑';
      basePts = 120;
      targetPts = 150;
    } else if (totalPts >= 95) {
      levelName = 'Level 5: Arcade Champion 🏆';
      basePts = 95;
      targetPts = 120;
    } else if (totalPts >= 75) {
      levelName = 'Level 4: Ranger Master 🚀';
      basePts = 75;
      targetPts = 95;
    } else if (totalPts >= 50) {
      levelName = 'Level 3: Arcade Trooper 📦';
      basePts = 50;
      targetPts = 75;
    } else if (totalPts >= 25) {
      levelName = 'Level 2: Cloud Explorer 🔍';
      basePts = 25;
      targetPts = 50;
    }

    const xpPct = Math.min(((totalPts - basePts) / (targetPts - basePts)) * 100, 100);

    if (levelTitleEl) levelTitleEl.innerHTML = `<i class="fa-solid fa-bolt" style="color: var(--amber-accent);"></i> ${levelName}`;
    if (xpCounterEl) xpCounterEl.textContent = `${totalPts.toFixed(1)} / ${targetPts} XP`;
    if (xpFillBar) xpFillBar.style.width = `${Math.max(xpPct, 5)}%`;
  }

  function renderAchievements(data) {
    const container = document.querySelector('#achievements-container');
    const counterTag = document.querySelector('#achieve-counter-tag');
    if (!container) return;

    const games = data.arcadeGames || 0;
    const skills = data.skillBadges || 0;
    const trivia = data.triviaBadges || 0;

    const list = [
      {
        id: 'first-step',
        icon: '🎯',
        title: 'Arcade Explorer',
        desc: 'Scraped and evaluated your public profile',
        isUnlocked: data.totalBadges > 0
      },
      {
        id: 'skill-hunter',
        icon: '⚡',
        title: 'Skill Badge Collector',
        desc: 'Earned 10+ completed Skill Badges',
        isUnlocked: skills >= 10
      },
      {
        id: 'game-master',
        icon: '🎮',
        title: 'Game Master',
        desc: 'Completed 5+ Arcade Game Badges',
        isUnlocked: games >= 5
      },
      {
        id: 'trivia-wizard',
        icon: '🧠',
        title: 'Trivia Wizard',
        desc: 'Earned at least 1 Arcade Trivia Badge',
        isUnlocked: trivia >= 1
      },
      {
        id: 'facilitator-hero',
        icon: '🌟',
        title: 'Facilitator Hero',
        desc: 'Unlocked Milestone 1+ (+5 Bonus Points)',
        isUnlocked: games >= 4 && skills >= 14
      },
      {
        id: 'ultimate-legend',
        icon: '👑',
        title: 'Ultimate Champion',
        desc: 'Achieved Ultimate Milestone (10 Games & 66 Skills)',
        isUnlocked: games >= 10 && skills >= 66
      }
    ];

    const unlockedCount = list.filter(item => item.isUnlocked).length;
    if (counterTag) counterTag.textContent = `${unlockedCount} / ${list.length} Unlocked`;

    container.innerHTML = list.map(item => `
      <div class="achievement-card ${item.isUnlocked ? 'unlocked' : 'locked'}">
        <div class="achievement-icon">${item.icon}</div>
        <div class="achievement-info">
          <span class="achievement-title">${item.title}</span>
          <span class="achievement-desc">${item.desc}</span>
        </div>
      </div>
    `).join('');
  }

  // --- DYNAMIC INCOMPLETE BADGES ENGINE ---
  const MASTER_ARCADE_BADGES_CATALOG = [
    {
      id: 'rec-1',
      title: 'Arcade Re-Trail: Vaults & Vectors',
      category: 'Game',
      level: 'Intermediate',
      labsOrPts: '1 Points',
      link: 'https://www.cloudskillsboost.google/games/5225',
      icon: 'fa-gamepad'
    },
    {
      id: 'rec-2',
      title: 'Implement DevOps Workflows in Google Cloud',
      category: 'Skill',
      level: 'Intermediate',
      labsOrPts: '4 Labs',
      link: 'https://www.cloudskillsboost.google/course_templates/341',
      icon: 'fa-certificate'
    },
    {
      id: 'rec-3',
      title: 'Create a Streaming Data Lake on Cloud Storage',
      category: 'Skill',
      level: 'Introductory',
      labsOrPts: '4 Labs',
      link: 'https://www.cloudskillsboost.google/course_templates/627',
      icon: 'fa-certificate'
    },
    {
      id: 'rec-4',
      title: 'Build Google Cloud Infrastructure for AWS Professionals',
      category: 'Skill',
      level: 'Intermediate',
      labsOrPts: '5 Labs',
      link: 'https://www.cloudskillsboost.google/course_templates/649',
      icon: 'fa-certificate'
    },
    {
      id: 'rec-5',
      title: 'Implement Multimodal Vector Search with BigQuery',
      category: 'Skill',
      level: 'Intermediate',
      labsOrPts: '4 Labs',
      link: 'https://www.cloudskillsboost.google/course_templates/978',
      icon: 'fa-certificate'
    },
    {
      id: 'rec-6',
      title: 'Protect Cloud Traffic with Chrome Enterprise Premium Security',
      category: 'Skill',
      level: 'Intermediate',
      labsOrPts: '4 Labs',
      link: 'https://www.cloudskillsboost.google/course_templates/1020',
      icon: 'fa-certificate'
    },
    {
      id: 'rec-7',
      title: 'Perform Foundational Infrastructure Tasks in Google Cloud',
      category: 'Skill',
      level: 'Introductory',
      labsOrPts: '5 Labs',
      link: 'https://www.cloudskillsboost.google/course_templates/639',
      icon: 'fa-certificate'
    },
    {
      id: 'rec-8',
      title: 'Set Up an App Dev Environment in Google Cloud',
      category: 'Skill',
      level: 'Introductory',
      labsOrPts: '4 Labs',
      link: 'https://www.cloudskillsboost.google/course_templates/637',
      icon: 'fa-certificate'
    },
    {
      id: 'rec-9',
      title: 'Create and Manage Cloud Spanner Instances',
      category: 'Skill',
      level: 'Intermediate',
      labsOrPts: '4 Labs',
      link: 'https://www.cloudskillsboost.google/course_templates/638',
      icon: 'fa-certificate'
    },
    {
      id: 'rec-10',
      title: 'Deploy Kubernetes Applications on Google Kubernetes Engine',
      category: 'Skill',
      level: 'Intermediate',
      labsOrPts: '5 Labs',
      link: 'https://www.cloudskillsboost.google/course_templates/640',
      icon: 'fa-certificate'
    },
    {
      id: 'rec-11',
      title: 'Develop GenAI Apps with Gemini and Streamlit',
      category: 'Skill',
      level: 'Advanced',
      labsOrPts: '4 Labs',
      link: 'https://www.cloudskillsboost.google/course_templates/977',
      icon: 'fa-certificate'
    },
    {
      id: 'rec-12',
      title: 'Build Infrastructure with Terraform on Google Cloud',
      category: 'Skill',
      level: 'Intermediate',
      labsOrPts: '5 Labs',
      link: 'https://www.cloudskillsboost.google/course_templates/641',
      icon: 'fa-certificate'
    },
    {
      id: 'rec-13',
      title: 'Analyze Big Data with BigQuery',
      category: 'Skill',
      level: 'Intermediate',
      labsOrPts: '5 Labs',
      link: 'https://www.cloudskillsboost.google/course_templates/642',
      icon: 'fa-certificate'
    },
    {
      id: 'rec-14',
      title: 'Monitor and Log Google Cloud Services',
      category: 'Skill',
      level: 'Intermediate',
      labsOrPts: '4 Labs',
      link: 'https://www.cloudskillsboost.google/course_templates/643',
      icon: 'fa-certificate'
    },
    {
      id: 'rec-15',
      title: 'Optimize Costs for Google Cloud Network & Compute',
      category: 'Skill',
      level: 'Intermediate',
      labsOrPts: '5 Labs',
      link: 'https://www.cloudskillsboost.google/course_templates/644',
      icon: 'fa-certificate'
    },
    {
      id: 'rec-16',
      title: 'Arcade Base Camp: Cloud Essentials',
      category: 'Game',
      level: 'Introductory',
      labsOrPts: '1 Points',
      link: 'https://www.cloudskillsboost.google/games/5000',
      icon: 'fa-gamepad'
    }
  ];

  let currentBadgeCategoryFilter = 'all';
  let currentSearchQuery = '';

  function renderIncompleteBadges(earnedTitles = []) {
    const grid = document.querySelector('#recommended-badges-grid');
    const cntAll = document.querySelector('#cnt-chip-all');
    const cntGame = document.querySelector('#cnt-chip-game');
    const cntSkill = document.querySelector('#cnt-chip-skill');
    if (!grid) return;

    // Create a set of lowercased completed badge titles
    const completedSet = new Set((earnedTitles || []).map(t => t.toLowerCase().trim()));

    // Dynamically filter out badges already completed by the learner
    const incompleteBadges = MASTER_ARCADE_BADGES_CATALOG.filter(item => {
      const itemTitleLower = item.title.toLowerCase().trim();
      const isCompleted = Array.from(completedSet).some(earned => {
        return earned.includes(itemTitleLower) || itemTitleLower.includes(earned);
      });
      return !isCompleted;
    });

    // Update Category Chips Counts dynamically
    const gameCount = incompleteBadges.filter(b => b.category === 'Game').length;
    const skillCount = incompleteBadges.filter(b => b.category === 'Skill').length;

    if (cntAll) cntAll.textContent = incompleteBadges.length;
    if (cntGame) cntGame.textContent = gameCount;
    if (cntSkill) cntSkill.textContent = skillCount;

    // Filter by selected Chip & Search query
    const filtered = incompleteBadges.filter(item => {
      const matchCat = currentBadgeCategoryFilter === 'all' || item.category.toLowerCase() === currentBadgeCategoryFilter;
      const matchSearch = !currentSearchQuery || item.title.toLowerCase().includes(currentSearchQuery.toLowerCase());
      return matchCat && matchSearch;
    });

    if (filtered.length === 0) {
      if (incompleteBadges.length === 0) {
        grid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 2.5rem; background: rgba(16, 185, 129, 0.1); border: 1px solid var(--green-accent); border-radius: var(--radius-md); color: var(--green-accent);"><i class="fa-solid fa-circle-check" style="font-size: 2rem; margin-bottom: 0.5rem;"></i><h4 style="font-size: 1.1rem; font-weight: 700;">No Incomplete Badges Remaining!</h4><p style="font-size: 0.9rem; margin-top: 0.25rem;">You have completed all active Arcade challenge badges!</p></div>';
      } else {
        grid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: var(--text-dim);">No incomplete badges matching your search query.</div>';
      }
      return;
    }

    grid.innerHTML = filtered.map(item => `
      <div class="challenge-card">
        <div>
          <div class="challenge-img-wrapper">
            <span class="challenge-tag-badge ${item.category === 'Game' ? 'tag-game-type' : 'tag-skill-type'}">
              ${item.category}
            </span>
            <i class="fa-solid ${item.icon}" style="font-size: 3rem; color: ${item.category === 'Game' ? 'var(--blue-accent)' : 'var(--green-accent)'};"></i>
          </div>

          <h4 class="challenge-title">${item.title}</h4>

          <div class="challenge-meta-row">
            <span class="challenge-level-pill">${item.level}</span>
            <span><i class="fa-solid fa-fire" style="color: var(--amber-accent);"></i> ${item.labsOrPts}</span>
          </div>
        </div>

        <a href="${item.link}" target="_blank" rel="noopener noreferrer" class="start-challenge-btn">
          Start Challenge <i class="fa-solid fa-chevron-right" style="font-size: 0.75rem;"></i>
        </a>
      </div>
    `).join('');
  }

  // Filter Chips Listeners
  const chipAll = document.querySelector('#chip-filter-all');
  const chipGame = document.querySelector('#chip-filter-game');
  const chipSkill = document.querySelector('#chip-filter-skill');
  const searchInput = document.querySelector('#badge-search-input');

  if (chipAll) chipAll.onclick = () => { setActiveChip(chipAll, 'all'); };
  if (chipGame) chipGame.onclick = () => { setActiveChip(chipGame, 'game'); };
  if (chipSkill) chipSkill.onclick = () => { setActiveChip(chipSkill, 'skill'); };

  function setActiveChip(btn, cat) {
    [chipAll, chipGame, chipSkill].forEach(c => c && c.classList.remove('active'));
    if (btn) btn.classList.add('active');
    currentBadgeCategoryFilter = cat;
    renderIncompleteBadges(currentProfileData.earnedBadgeTitles || []);
  }

  if (searchInput) {
    searchInput.oninput = (e) => {
      currentSearchQuery = e.target.value.trim();
      renderIncompleteBadges(currentProfileData.earnedBadgeTitles || []);
    };
  }

  // Initial render of incomplete badges
  renderIncompleteBadges([]);

  // Render Scraped Profile Data onto Dashboard UI
  function renderDashboard(data) {
    currentProfileData = data;

    // User Profile Card & Top Nav Avatar
    const avatarEl = document.querySelector('#avatar-initial');
    const navAvatarEl = document.querySelector('#nav-avatar-initial');
    const nameEl = document.querySelector('#user-name-title');

    const initial = data.initial || 'G';
    const name = data.userHandle || 'Google Cloud Learner';

    if (avatarEl) avatarEl.textContent = initial;
    if (navAvatarEl) navAvatarEl.textContent = initial;
    if (nameEl) nameEl.textContent = name;

    // Gamification Engines
    updateXPLevel(data.totalPoints || 0);
    renderAchievements(data);
    renderIncompleteBadges(data.earnedBadgeTitles || []);

    // Stats Card
    const formulaArcade = document.querySelector('#val-arcade-raw');
    const formulaBonus = document.querySelector('#val-bonus-raw');
    const formulaTotal = document.querySelector('#val-total-formula');
    const statArcadePts = document.querySelector('#stat-arcade-pts');
    const statBonusPts = document.querySelector('#stat-bonus-pts');
    const statTotalBadges = document.querySelector('#stat-total-badges');

    if (formulaArcade) formulaArcade.textContent = (data.arcadePoints || 0).toFixed(1);
    if (formulaBonus) formulaBonus.textContent = data.bonusPoints || 0;
    if (formulaTotal) formulaTotal.textContent = (data.totalPoints || 0).toFixed(1);
    if (statArcadePts) statArcadePts.textContent = `${(data.arcadePoints || 0).toFixed(1)} Pts`;
    if (statBonusPts) statBonusPts.textContent = `+${data.bonusPoints || 0} Pts`;
    if (statTotalBadges) statTotalBadges.textContent = `${data.totalBadges || 0} Badges`;

    // --- 1. DYNAMIC FACILITATOR MILESTONE EVALUATION ---
    const games = data.arcadeGames || 0;
    const skills = data.skillBadges || 0;

    const hasM1 = games >= 4 && skills >= 14;
    const hasM2 = games >= 6 && skills >= 28;
    const hasM3 = games >= 8 && skills >= 42;
    const hasUltimate = games >= 10 && skills >= 66;

    function setStepNodeState(nodeId, isCompleted) {
      const node = document.querySelector(nodeId);
      if (!node) return;
      const circle = node.querySelector('.node-circle');
      const statusText = node.querySelector('.node-status');

      if (isCompleted) {
        node.classList.add('completed');
        if (circle) circle.innerHTML = '<i class="fa-solid fa-check"></i>';
        if (statusText) statusText.textContent = 'Completed';
      } else {
        node.classList.remove('completed');
        if (circle) circle.innerHTML = '<i class="fa-solid fa-circle"></i>';
        if (statusText) statusText.textContent = 'Locked';
      }
    }

    setStepNodeState('#node-start', true);
    setStepNodeState('#node-m1', hasM1);
    setStepNodeState('#node-m2', hasM2);
    setStepNodeState('#node-m3', hasM3);
    setStepNodeState('#node-ultimate', hasUltimate);

    let timelinePct = 0;
    if (hasUltimate) timelinePct = 100;
    else if (hasM3) timelinePct = 75;
    else if (hasM2) timelinePct = 50;
    else if (hasM1) timelinePct = 25;

    const timelineBar = document.querySelector('#timeline-fill-bar');
    if (timelineBar) timelineBar.style.width = `${timelinePct}%`;

    const bonusText = document.querySelector('#bonus-amount-text');
    if (bonusText) bonusText.textContent = `+${data.bonusPoints || 0} Bonus Points Earned`;

    let autoMilestone = 'ultimate';
    if (!hasM1) autoMilestone = 'm1';
    else if (!hasM2) autoMilestone = 'm2';
    else if (!hasM3) autoMilestone = 'm3';
    else autoMilestone = 'ultimate';

    selectMilestone(autoMilestone);

    // --- 2. DYNAMIC SWAG TIER EVALUATION ---
    const totalPts = data.totalPoints || 0;
    const hasTrooper = totalPts >= 50;
    const hasRanger = totalPts >= 75;
    const hasChampion = totalPts >= 95;
    const hasLegend = totalPts >= 120;

    function setTierNodeState(nodeId, isCompleted, isActive) {
      const node = document.querySelector(nodeId);
      if (!node) return;
      const circle = node.querySelector('.tier-circle');
      const subStatus = node.querySelector('.tier-sub-status');

      if (isCompleted) {
        node.classList.add('completed');
        node.classList.remove('active');
        if (circle) circle.innerHTML = '<i class="fa-solid fa-check"></i>';
        if (subStatus) subStatus.textContent = 'Completed';
      } else if (isActive) {
        node.classList.add('active');
        node.classList.remove('completed');
        if (circle) circle.innerHTML = '<i class="fa-solid fa-circle"></i>';
        if (subStatus) subStatus.textContent = 'In Progress';
      } else {
        node.classList.remove('completed');
        node.classList.remove('active');
        if (circle) circle.innerHTML = '<i class="fa-solid fa-circle"></i>';
        if (subStatus) subStatus.textContent = 'Locked';
      }
    }

    setTierNodeState('#swag-node-start', true, false);
    setTierNodeState('#swag-node-trooper', hasTrooper, !hasTrooper && totalPts > 0);
    setTierNodeState('#swag-node-ranger', hasRanger, hasTrooper && !hasRanger);
    setTierNodeState('#swag-node-champion', hasChampion, hasRanger && !hasChampion);
    setTierNodeState('#swag-node-legend', hasLegend, hasChampion && !hasLegend);

    const tierFillLine = document.querySelector('#tier-line-fill');
    const tierLinePct = Math.min((totalPts / 120) * 100, 100);
    if (tierFillLine) tierFillLine.style.width = `${tierLinePct}%`;

    const swagNameEl = document.querySelector('#swag-tier-name');
    const swagReqEl = document.querySelector('#swag-tier-req');

    if (hasLegend) {
      if (swagNameEl) swagNameEl.textContent = 'Legend Tier Unlocked! 🏆';
      if (swagReqEl) swagReqEl.textContent = '120+ Points Achieved';
    } else if (hasChampion) {
      if (swagNameEl) swagNameEl.textContent = 'Champion Tier Unlocked! 🌟';
      if (swagReqEl) swagReqEl.textContent = `${(120 - totalPts).toFixed(1)} Pts Needed for Legend`;
    } else if (hasRanger) {
      if (swagNameEl) swagNameEl.textContent = 'Ranger Tier Unlocked! 🚀';
      if (swagReqEl) swagReqEl.textContent = `${(95 - totalPts).toFixed(1)} Pts Needed for Champion`;
    } else if (hasTrooper) {
      if (swagNameEl) swagNameEl.textContent = 'Arcade Trooper Tier Unlocked! 📦';
      if (swagReqEl) swagReqEl.textContent = `${(75 - totalPts).toFixed(1)} Pts Needed for Ranger`;
    } else {
      if (swagNameEl) swagNameEl.textContent = 'Rookie Explorer Tier';
      if (swagReqEl) swagReqEl.textContent = `${(50 - totalPts).toFixed(1)} Points Needed for Swag`;
    }

    // --- 3. BOTTOM BADGE CATEGORIES TABLE ---
    const pillSeason = document.querySelector('#season-badge-pill');
    const rowSkillCount = document.querySelector('#row-skill-count');
    const rowSkillPts = document.querySelector('#row-skill-pts');
    const rowGameCount = document.querySelector('#row-game-count');
    const rowGamePts = document.querySelector('#row-game-pts');
    const rowTriviaCount = document.querySelector('#row-trivia-count');
    const rowTriviaPts = document.querySelector('#row-trivia-pts');
    const rowCompletionCount = document.querySelector('#row-completion-count');
    const rowBonusPts = document.querySelector('#row-bonus-pts');

    if (pillSeason) pillSeason.textContent = `🟣 ${data.totalBadges || 0} badges total`;
    if (rowSkillCount) rowSkillCount.textContent = skills;
    if (rowSkillPts) rowSkillPts.textContent = `${(skills * 0.5).toFixed(1)} Pts`;
    if (rowGameCount) rowGameCount.textContent = games;
    if (rowGamePts) rowGamePts.textContent = `${(games * 1.0).toFixed(1)} Pts`;
    if (rowTriviaCount) rowTriviaCount.textContent = data.triviaBadges || 0;
    if (rowTriviaPts) rowTriviaPts.textContent = `${((data.triviaBadges || 0) * 1.0).toFixed(1)} Pts`;
    if (rowCompletionCount) rowCompletionCount.textContent = data.completionBadges || 0;
    if (rowBonusPts) rowBonusPts.textContent = `+${data.bonusPoints || 0}.0 Pts`;
  }

  // Hero Form Submit Event
  if (heroForm) {
    heroForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const url = profileUrlInput.value.trim();
      if (url) {
        processCalculation(url);
      }
    });
  }
});
