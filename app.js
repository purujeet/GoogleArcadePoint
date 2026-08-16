/**
 * Google Cloud ArcadeCalc - Prototype Script
 * Dynamic Profile Evaluation Engine & Linked Weekly Completion Activity
 */

document.addEventListener('DOMContentLoaded', () => {
  // Navigation & Views
  const tabHome = document.querySelector('#tab-home');
  const tabDashboard = document.querySelector('#tab-dashboard');
  const brandLink = document.querySelector('#brand-home-link');

  const viewHome = document.querySelector('#view-home');
  const viewDashboard = document.querySelector('#view-dashboard');

  // Form & Inputs
  const heroForm = document.querySelector('#hero-calc-form');
  const profileUrlInput = document.querySelector('#profile-url-input');
  const heroCalcBtn = document.querySelector('#hero-calc-btn');

  // Help Modal
  const helpTrigger = document.querySelector('#help-modal-trigger');
  const helpModal = document.querySelector('#help-modal');
  const modalCloseBtn = document.querySelector('#modal-close-btn');

  // Theme Toggle & Presets
  const themeToggleBtn = document.querySelector('#theme-toggle-btn');
  const presetChips = document.querySelectorAll('.preset-chip-btn');

  // Switch View Helper
  function switchView(viewName) {
    if (viewName === 'home') {
      viewHome.classList.remove('hidden');
      viewDashboard.classList.add('hidden');
      tabHome.classList.add('active');
      tabDashboard.classList.remove('active');
    } else if (viewName === 'dashboard') {
      viewHome.classList.add('hidden');
      viewDashboard.classList.remove('hidden');
      tabHome.classList.remove('active');
      tabDashboard.classList.add('active');
    }
  }

  if (tabHome) tabHome.addEventListener('click', () => switchView('home'));
  if (tabDashboard) tabDashboard.addEventListener('click', () => switchView('dashboard'));
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

  // Preset Chips
  presetChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const url = chip.getAttribute('data-url');
      if (url && profileUrlInput) {
        profileUrlInput.value = url;
        processCalculation(url);
      }
    });
  });

  // Dynamic Profile Evaluation Handler
  async function processCalculation(url) {
    if (heroCalcBtn) {
      heroCalcBtn.disabled = true;
      heroCalcBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i><br>Evaluating...';
    }

    try {
      const response = await fetch('/api/calculate?url=' + encodeURIComponent(url));
      if (!response.ok) {
        throw new Error('Could not fetch profile data');
      }

      const data = await response.json();

      if (data.success) {
        renderDashboard(data);
        switchView('dashboard');
      } else {
        alert('Could not parse profile URL. Please check that your profile is public.');
      }
    } catch (err) {
      console.error('Calculation error:', err);
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
        totalPoints: 0.0,
        weeklyActivity: { Sunday: 0, Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0, Saturday: 0 }
      });
      switchView('dashboard');
    } finally {
      if (heroCalcBtn) {
        heroCalcBtn.disabled = false;
        heroCalcBtn.innerHTML = 'Calculate<br>Points';
      }
    }
  }

  // Render Scraped Profile Data & Dynamically Update Dashboard
  function renderDashboard(data) {
    // User Profile Card
    const avatarEl = document.querySelector('#avatar-initial');
    const nameEl = document.querySelector('#user-name-title');
    if (avatarEl) avatarEl.textContent = data.initial || 'G';
    if (nameEl) nameEl.textContent = data.userHandle || 'Google Cloud Learner';

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

    // Ultimate Milestone Box
    const reqGames = document.querySelector('#req-games-count');
    const reqSkills = document.querySelector('#req-skills-count');
    const bonusText = document.querySelector('#bonus-amount-text');
    const barGames = document.querySelector('#bar-fill-games');
    const barSkills = document.querySelector('#bar-fill-skills');
    const iconGameCheck = document.querySelector('#icon-game-check');
    const iconSkillCheck = document.querySelector('#icon-skill-check');
    const ultimateStatusTag = document.querySelector('#ultimate-status-tag');

    if (reqGames) reqGames.textContent = `${games} / 10`;
    if (reqSkills) reqSkills.textContent = `${skills} / 66`;
    if (bonusText) bonusText.textContent = `+${data.bonusPoints || 0} Bonus Points Earned`;

    const gamePct = Math.min((games / 10) * 100, 100);
    const skillPct = Math.min((skills / 66) * 100, 100);

    if (barGames) barGames.style.width = `${gamePct}%`;
    if (barSkills) barSkills.style.width = `${skillPct}%`;

    if (iconGameCheck) {
      if (games >= 10) {
        iconGameCheck.className = 'fa-solid fa-circle-check';
        iconGameCheck.style.color = 'var(--green-accent)';
      } else {
        iconGameCheck.className = 'fa-solid fa-circle-xmark';
        iconGameCheck.style.color = 'var(--text-dim)';
      }
    }

    if (iconSkillCheck) {
      if (skills >= 66) {
        iconSkillCheck.className = 'fa-solid fa-circle-check';
        iconSkillCheck.style.color = 'var(--green-accent)';
      } else {
        iconSkillCheck.className = 'fa-solid fa-circle-xmark';
        iconSkillCheck.style.color = 'var(--text-dim)';
      }
    }

    if (ultimateStatusTag) {
      if (hasUltimate) {
        ultimateStatusTag.textContent = 'Achieved! 🎉';
        ultimateStatusTag.className = 'achieved-tag tag-achieved';
      } else {
        ultimateStatusTag.textContent = 'In Progress ⏳';
        ultimateStatusTag.className = 'achieved-tag tag-progress';
      }
    }

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

    // --- 3. DYNAMIC WEEKLY BADGE ACTIVITY LINKED TO COMPLETION DATES ---
    const wa = data.weeklyActivity || { Sunday: 0, Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0, Saturday: 0 };
    const counts = [wa.Sunday || 0, wa.Monday || 0, wa.Tuesday || 0, wa.Wednesday || 0, wa.Thursday || 0, wa.Friday || 0, wa.Saturday || 0];
    const maxVal = Math.max(...counts, 1);

    // Update Y-Axis Scale
    const y4 = document.querySelector('#y-val-4');
    const y3 = document.querySelector('#y-val-3');
    const y2 = document.querySelector('#y-val-2');
    const y1 = document.querySelector('#y-val-1');
    const y0 = document.querySelector('#y-val-0');

    if (y4) y4.textContent = maxVal;
    if (y3) y3.textContent = Math.round(maxVal * 0.75);
    if (y2) y2.textContent = Math.round(maxVal * 0.5);
    if (y1) y1.textContent = Math.round(maxVal * 0.25);
    if (y0) y0.textContent = '0';

    // Helper to set bar height and tooltip badge
    function updateDayBar(dayKey, valId, barId) {
      const valBadge = document.querySelector(valId);
      const barFill = document.querySelector(barId);
      const count = wa[dayKey] || 0;
      const heightPct = count > 0 ? Math.max((count / maxVal) * 100, 8) : 0;

      if (valBadge) valBadge.textContent = count;
      if (barFill) barFill.style.height = `${heightPct}%`;
    }

    updateDayBar('Sunday', '#val-sun', '#bar-sun');
    updateDayBar('Monday', '#val-mon', '#bar-mon');
    updateDayBar('Tuesday', '#val-tue', '#bar-tue');
    updateDayBar('Wednesday', '#val-wed', '#bar-wed');
    updateDayBar('Thursday', '#val-thu', '#bar-thu');
    updateDayBar('Friday', '#val-fri', '#bar-fri');
    updateDayBar('Saturday', '#val-sat', '#bar-sat');

    // --- 4. BOTTOM BADGE CATEGORIES TABLE ---
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

  // Initial Load
  if (profileUrlInput && profileUrlInput.value) {
    processCalculation(profileUrlInput.value);
  }
});
