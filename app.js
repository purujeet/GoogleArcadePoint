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
    bonusPoints: 0
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

  // Dynamic Profile Evaluation Handler (Local API + GitHub Pages Fallback Engine)
  async function processCalculation(url) {
    if (!url || !url.trim()) return;

    if (heroCalcBtn) {
      heroCalcBtn.disabled = true;
      heroCalcBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i><br>Evaluating...';
    }

    let calculatedData = null;

    // 1. Try Local Scraper Server API (/api/calculate) first
    try {
      const response = await fetch('/api/calculate?url=' + encodeURIComponent(url));
      if (response.ok) {
        const data = await response.json();
        if (data && data.success) {
          calculatedData = data;
        }
      }
    } catch (err) {
      // Local backend not running (e.g. hosted on GitHub Pages)
    }

    // 2. If Local API is unavailable (GitHub Pages deployment), use Client-Side Scraper Engine
    if (!calculatedData) {
      try {
        calculatedData = await scrapeProfileClientSide(url);
      } catch (err) {
        console.error('Client-side calculation error:', err);
      }
    }

    if (calculatedData && calculatedData.success) {
      renderDashboard(calculatedData);
      switchView('dashboard');
    } else {
      alert('Could not fetch public profile data. Please verify that your profile URL is public.');
      renderDashboard({
        userHandle: 'Google Cloud Learner',
        initial: 'G',
        totalBadges: 0,
        arcadeGames: 0,
        triviaBadges: 0,
        specialGames: 0,
        skillBadges: 0,
        completionBadges: 0,
        arcadePoints: 0.0,
        bonusPoints: 0,
        totalPoints: 0.0
      });
      switchView('dashboard');
    }

    if (heroCalcBtn) {
      heroCalcBtn.disabled = false;
      heroCalcBtn.innerHTML = 'Calculate<br>Points';
    }
  }

  // Client-Side Scraper Engine for GitHub Pages
  async function scrapeProfileClientSide(targetUrl) {
    let cleanUrl = targetUrl.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = 'https://' + cleanUrl;
    }

    const proxies = [
      `https://api.allorigins.win/raw?url=${encodeURIComponent(cleanUrl)}`,
      `https://corsproxy.io/?${encodeURIComponent(cleanUrl)}`,
      `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(cleanUrl)}`
    ];

    let html = null;
    for (const proxyUrl of proxies) {
      try {
        const res = await fetch(proxyUrl);
        if (res.ok) {
          html = await res.text();
          if (html && html.includes('profile-badge')) break;
        }
      } catch (e) {
        continue;
      }
    }

    if (!html) {
      throw new Error('Failed to fetch profile HTML via CORS proxies');
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // 1. User Name
    const nameEl = doc.querySelector('h1.ql-display-small');
    const userHandle = nameEl ? nameEl.textContent.trim() : 'Google Cloud Learner';

    // 2. Badge Cards & Modals
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

    badgeElements.forEach((b, i) => {
      const titleEl = b.querySelector('span.ql-title-medium');
      const title = titleEl ? titleEl.textContent.trim() : '';
      if (!title) return;

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
      totalPoints: Math.round(totalPoints * 10) / 10
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

    // Highlight timeline node
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

    // Auto-select highest achieved milestone (or ultimate default)
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
