// --- UI Management ---
let setupServingTeam = 'A';
let lastRenderedScoreA = null;
let lastRenderedScoreB = null;

function updateUI() {
    document.documentElement.style.setProperty('--color-a', state.colorA);
    document.documentElement.style.setProperty('--color-b', state.colorB);
    
    // Background and text contrast colors
    const bg = state.bgColor || '#1a1a1a';
    document.documentElement.style.setProperty('--bg-color', bg);
    document.documentElement.style.setProperty('--text-color', getContrastColor(bg));

    // Serve Indicators
    const indA = document.getElementById('serve-indicator-a');
    const indB = document.getElementById('serve-indicator-b');
    if (indA) {
        indA.classList.toggle('opacity-0', state.servingTeam !== 'A');
        indA.style.pointerEvents = state.servingTeam === 'A' ? 'auto' : 'none';
    }
    if (indB) {
        indB.classList.toggle('opacity-0', state.servingTeam !== 'B');
        indB.style.pointerEvents = state.servingTeam === 'B' ? 'auto' : 'none';
    }
    
    document.getElementById('name-a').textContent = state.teamA;
    document.getElementById('name-b').textContent = state.teamB;

    const setupNameA = document.getElementById('setup-name-a');
    if (setupNameA) setupNameA.textContent = state.teamA;
    const setupNameB = document.getElementById('setup-name-b');
    if (setupNameB) setupNameB.textContent = state.teamB;
    const setupColorA = document.getElementById('setup-color-a');
    if (setupColorA) setupColorA.style.background = state.colorA;
    const setupColorB = document.getElementById('setup-color-b');
    if (setupColorB) setupColorB.style.background = state.colorB;
    
    // Refresh setup serve labels
    if (document.getElementById('setup-serve-a')) {
        setSetupServe(setupServingTeam);
    }
    
    // Sync Settings Inputs
    const maxToEl = document.getElementById('input-max-timeouts');
    if (maxToEl) maxToEl.value = state.maxTimeouts;
    const setsFmtEl = document.getElementById('input-sets-format');
    if (setsFmtEl) setsFmtEl.value = state.maxSets;
    const targetPEl = document.getElementById('input-target-points');
    if (targetPEl) targetPEl.value = state.targetPoints;
    const finalSetTargetEl = document.getElementById('input-final-set-target');
    if (finalSetTargetEl) finalSetTargetEl.value = state.finalSetTarget;

    // Scores & Sets
    updateScoreDigits('A', state.scoreA);
    updateScoreDigits('B', state.scoreB);
    document.getElementById('sets-a').textContent = state.setsA;
    document.getElementById('sets-b').textContent = state.setsB;
    
    // Timeouts
    renderTimeouts('A');
    renderTimeouts('B');

    // Substitutions
    renderSubstitutions('A');
    renderSubstitutions('B');

    // Header Info
    document.getElementById('current-set-num').textContent = state.currentSet;

    // Orientation (Always Auto)
    let isLandscape = window.innerWidth > window.innerHeight;
    document.body.classList.toggle('is-landscape', isLandscape);

    // Court Layout
    const court = document.getElementById('main-court');
    const areaA = document.getElementById('area-a');
    const areaB = document.getElementById('area-b');
    
    if (state.isCourtSwapped) {
        court.insertBefore(areaB, areaA);
        court.style.flexDirection = isLandscape ? 'row' : 'column';
        if (!isLandscape) {
            areaB.style.flexDirection = 'column';
            areaA.style.flexDirection = 'column-reverse';
        } else {
            areaB.style.flexDirection = 'column';
            areaA.style.flexDirection = 'column';
        }
    } else {
        court.insertBefore(areaA, areaB);
        court.style.flexDirection = isLandscape ? 'row' : 'column';
        if (!isLandscape) {
            areaA.style.flexDirection = 'column';
            areaB.style.flexDirection = 'column-reverse';
        } else {
            areaA.style.flexDirection = 'column';
            areaB.style.flexDirection = 'column';
        }
    }

    // Float Controls
    const floatInner = document.getElementById('float-controls-inner');
    if (floatInner) {
        floatInner.style.flexDirection = isLandscape ? 'column' : 'row';
        const iconLand = floatInner.querySelector('.icon-swap-landscape');
        const iconPort = floatInner.querySelector('.icon-swap-portrait');
        if (iconLand) iconLand.classList.toggle('hidden', !isLandscape);
        if (iconPort) iconPort.classList.toggle('hidden', isLandscape);
    }

    // Sync other components
    if (typeof renderCourt === 'function' && currentCourtTeam) {
        renderCourt(currentCourtTeam);
    }
}

function updateScoreDigits(team, currentScore) {
    const lastScore = team === 'A' ? lastRenderedScoreA : lastRenderedScoreB;
    const str = String(currentScore).padStart(2, '0');
    
    if (lastScore === null || lastScore === currentScore) {
        // Initial render or no change, only update DOM if needed
        const tensEl = document.getElementById(`score-${team.toLowerCase()}-tens`);
        const onesEl = document.getElementById(`score-${team.toLowerCase()}-ones`);
        if (tensEl && tensEl.textContent !== str[0]) tensEl.textContent = str[0];
        if (onesEl && onesEl.textContent !== str[1]) onesEl.textContent = str[1];
    } else {
        const isUndo = currentScore < lastScore;
        const oldStr = String(lastScore).padStart(2, '0');
        
        for (let i = 0; i < 2; i++) {
            if (oldStr[i] !== str[i]) {
                animateDigit(`wrap-${team.toLowerCase()}-${i===0?'tens':'ones'}`, `score-${team.toLowerCase()}-${i===0?'tens':'ones'}`, str[i], isUndo);
            }
        }
    }
    
    if (team === 'A') lastRenderedScoreA = currentScore;
    else lastRenderedScoreB = currentScore;
}

function showCustomConfirm(message, confirmText = "OK", cancelText = "キャンセル") {
    return new Promise(resolve => {
        const modal = document.getElementById('custom-confirm-modal');
        if (!modal) {
            console.error("custom-confirm-modal not found!");
            resolve(false);
            return;
        }
        const msgEl = document.getElementById('custom-confirm-msg');
        const okBtn = document.getElementById('custom-confirm-ok');
        const cancelBtn = document.getElementById('custom-confirm-cancel');
        
        if (msgEl) msgEl.textContent = message;
        if (okBtn) okBtn.textContent = confirmText;
        if (cancelBtn) cancelBtn.textContent = cancelText;
        
        const cleanup = () => {
            modal.classList.add('hidden');
            if (okBtn) okBtn.onclick = null;
            if (cancelBtn) cancelBtn.onclick = null;
        };
        
        if (okBtn) {
            okBtn.onclick = () => { cleanup(); resolve(true); };
        } else {
            resolve(true);
        }
        if (cancelBtn) {
            cancelBtn.onclick = () => { cleanup(); resolve(false); };
        } else {
            resolve(false);
        }
        
        modal.classList.remove('hidden');
    });
}

function showCustomAlert(message, okText = "OK") {
    return new Promise(resolve => {
        const modal = document.getElementById('custom-alert-modal');
        if (!modal) {
            console.error("custom-alert-modal not found!");
            resolve();
            return;
        }
        const msgEl = document.getElementById('custom-alert-msg');
        const okBtn = document.getElementById('custom-alert-ok');
        
        if (msgEl) msgEl.textContent = message;
        if (okBtn) okBtn.textContent = okText;
        
        const cleanup = () => {
            modal.classList.add('hidden');
            if (okBtn) okBtn.onclick = null;
        };
        
        if (okBtn) {
            okBtn.onclick = () => { cleanup(); resolve(); };
        } else {
            resolve();
        }
        
        modal.classList.remove('hidden');
    });
}

function animateDigit(wrapperId, spanId, newText, isUndo) {
    const wrap = document.getElementById(wrapperId);
    const span = document.getElementById(spanId);
    if (!wrap || !span) return;
    
    // reset animation
    wrap.classList.remove('flip-up', 'flip-down');
    void wrap.offsetWidth; // trigger reflow
    
    wrap.classList.add(isUndo ? 'flip-down' : 'flip-up');

    // Swap text content at midpoint of animation (125ms out of 250ms)
    setTimeout(() => {
        span.textContent = newText;
    }, 125);
    
    // Clean up animation class after completion to prevent accidental re-triggers
    setTimeout(() => {
        wrap.classList.remove('flip-up', 'flip-down');
    }, 300);
}

function renderTimeouts(team) {
    const container = document.getElementById(team === 'A' ? 'to-indicator-a' : 'to-indicator-b');
    if (!container) return;
    const max = state.maxTimeouts || 2;
    const used = team === 'A' ? state.toA : state.toB;
    const remain = Math.max(0, max - used);
    const color = team === 'A' ? state.colorA : state.colorB;
    
    let html = '';
    for (let i = 0; i < max; i++) {
        if (i < remain) {
            html += `<div class="w-6 h-4 sm:w-8 sm:h-5 rounded-sm shadow-md transition-all pointer-events-none" style="background-color: ${color};"></div>`;
        } else {
            html += `<div class="w-6 h-4 sm:w-8 sm:h-5 rounded-sm bg-zinc-800/50 border border-zinc-700 transition-all opacity-40 pointer-events-none"></div>`;
        }
    }
    container.innerHTML = html;
}

function renderSubstitutions(team) {
    if (!state.actionLog) return;
    const count = state.actionLog.filter(a => a.type === 'substitution' && a.team === team && a.set === state.currentSet && !a.isLibero).length;
    const el = document.getElementById(`sub-counter-${team.toLowerCase()}`);
    if (el) {
        el.innerHTML = `<span class="flex items-center gap-1"><i data-lucide="arrow-left-right" class="w-3 h-3 text-current"></i><span>${count}/6</span></span>`;
        if (count >= 6) {
            el.className = "text-[9px] font-black bg-red-500/20 px-1.5 py-1 rounded text-red-400 select-none shadow-inner shrink-0 border border-red-500/30 transition-all";
        } else if (count > 0) {
            el.className = "text-[9px] font-black bg-zinc-800/90 px-1.5 py-1 rounded text-yellow-500 select-none shadow-inner shrink-0 border border-yellow-500/20 transition-all";
        } else {
            el.className = "text-[9px] font-black bg-zinc-800/90 px-1.5 py-1 rounded text-zinc-400 select-none shadow-inner shrink-0 border border-transparent transition-all";
        }
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
    // Also update in court modal if open
    const modalEl = document.getElementById('court-sub-counter');
    if (modalEl && typeof currentCourtTeam !== 'undefined' && currentCourtTeam === team) {
        modalEl.textContent = `交代枠使用数: ${count} / 6`;
        if (count >= 6) {
            modalEl.className = "text-xs font-bold text-red-400 mt-1";
        } else {
            modalEl.className = "text-xs font-bold text-zinc-500 mt-1";
        }
    }
}

function showToast(msg) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.style.opacity = "1";
    setTimeout(() => t.style.opacity = "0", 2000);
}

// Modal Toggles
let isMenuHubActive = false;

function toggleSettings() { 
    const modal = document.getElementById('settings-modal');
    const isOpening = modal.classList.contains('hidden');
    if (isOpening) {
        document.getElementById('input-max-timeouts').value = state.maxTimeouts;
        const durationEl = document.getElementById('input-timeout-duration');
        if (durationEl) durationEl.value = state.timeoutDuration || 30;
        const bgColorEl = document.getElementById('input-bg-color');
        if (bgColorEl) bgColorEl.value = state.bgColor || '#1a1a1a';
        const methodEl = document.getElementById('input-advanced-method');
        if (methodEl) methodEl.value = state.advancedInputMethod || 'dialog';
        if (typeof updateSyncUI === 'function') updateSyncUI();
    }
    modal.classList.toggle('hidden');
    
    // Return to menu if closed and we were in menu hub
    if (!isOpening && isMenuHubActive) {
        toggleMainMenu(true);
    }
}

function toggleSetupAdvancedSettingsVisibility() {
    const advEl = document.getElementById('setup-advanced-mode');
    const advChecked = advEl ? advEl.checked : false;
    const myTeamOnlyContainer = document.getElementById('setup-myteam-only-container');
    if (myTeamOnlyContainer) {
        if (advChecked) {
            myTeamOnlyContainer.classList.remove('hidden');
        } else {
            myTeamOnlyContainer.classList.add('hidden');
        }
    }
}

function toggleMainMenu(forceShow = null) {
    const modal = document.getElementById('main-menu');
    const resumeBtn = document.getElementById('menu-resume-btn');
    const finishBtn = document.getElementById('menu-finish-btn');
    const discardBtn = document.getElementById('menu-discard-btn');
    
    const isLive = !!state.matchStartTime;
    if (resumeBtn) resumeBtn.classList.toggle('hidden', !isLive);
    if (finishBtn) finishBtn.classList.toggle('hidden', !isLive);
    if (discardBtn) discardBtn.classList.toggle('hidden', !isLive);

    if (forceShow === true) {
        modal.classList.remove('hidden');
        isMenuHubActive = true;
    } else if (forceShow === false) {
        modal.classList.add('hidden');
    } else {
        modal.classList.toggle('hidden');
        isMenuHubActive = !modal.classList.contains('hidden');
    }
    
    if (!modal.classList.contains('hidden')) {
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
}

async function startNewMatchFromMenu() {
    if (await startNewMatch()) {
        toggleMainMenu(false);
    }
}

function finishMatchFromMenu() {
    toggleMainMenu(false);
    finishMatch();
}

async function discardMatchFromMenu() {
    const confirmed = await showCustomConfirm("現在の試合を保存せずに破棄して終了しますか？");
    if (!confirmed) return;
    resetMatchState();
    saveState();
    updateUI();
    toggleMainMenu(true); // Refresh menu to hide live buttons
}

function toggleHistoryFromMenu() {
    toggleMainMenu(false);
    toggleHistory();
}

function toggleSettingsFromMenu() {
    toggleMainMenu(false);
    toggleSettings();
}
function toggleTimeline() { 
    const modal = document.getElementById('timeline-modal');
    const isOpening = modal.classList.contains('hidden');
    modal.classList.toggle('hidden');
    if (isOpening) {
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
}
function toggleHistory() { 
    const modal = document.getElementById('history-modal');
    const isOpening = modal.classList.contains('hidden');
    modal.classList.toggle('hidden'); 
    if (isOpening) {
        renderHistory();
    } else if (isMenuHubActive) {
        toggleMainMenu(true);
    }
}
function toggleMembers() { document.getElementById('member-modal').classList.toggle('hidden'); }
function toggleAnalysis() { document.getElementById('analysis-modal').classList.toggle('hidden'); }
function toggleMatchSetup() { 
    const modal = document.getElementById('match-setup-modal');
    const isOpening = modal.classList.contains('hidden');
    if (isOpening) {
        document.getElementById('setup-sets-format').value = state.maxSets;
        document.getElementById('setup-target-points').value = state.targetPoints;
        document.getElementById('setup-final-set-target').value = state.finalSetTarget;
        setSetupServe(state.servingTeam || 'A');
        updateMatchSetupVisibility();
        const setupAdvancedEl = document.getElementById('setup-advanced-mode');
        if (setupAdvancedEl) setupAdvancedEl.checked = !!state.showAdvancedMode;
        const setupMyTeamOnlyEl = document.getElementById('setup-myteam-only-stats');
        if (setupMyTeamOnlyEl) setupMyTeamOnlyEl.checked = !!state.myTeamOnlyStats;
        if (typeof toggleSetupAdvancedSettingsVisibility === 'function') toggleSetupAdvancedSettingsVisibility();
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
    modal.classList.toggle('hidden'); 
    
    // Return to menu if closed and we were in menu hub
    if (!isOpening && isMenuHubActive) {
        toggleMainMenu(true);
    }
}

function setSetupServe(team) {
    setupServingTeam = team;
    const btnA = document.getElementById('setup-serve-a');
    const btnB = document.getElementById('setup-serve-b');
    
    if (btnA) btnA.textContent = state.teamA;
    if (btnB) btnB.textContent = state.teamB;

    if (team === 'A') {
        btnA.classList.add('bg-yellow-500', 'text-black');
        btnA.classList.remove('text-zinc-500');
        btnB.classList.remove('bg-yellow-500', 'text-black');
        btnB.classList.add('text-zinc-500');
    } else {
        btnB.classList.add('bg-yellow-500', 'text-black');
        btnB.classList.remove('text-zinc-500');
        btnA.classList.remove('bg-yellow-500', 'text-black');
        btnA.classList.add('text-zinc-500');
    }
}

function updateMatchSetupVisibility() {
    const fmt = parseInt(document.getElementById('setup-sets-format').value);
    const container = document.getElementById('setup-final-set-container');
    if (container) {
        // 3セットまたは5セットマッチのときだけ最終セットの設定を表示
        container.classList.toggle('hidden', fmt < 3);
    }
}

// --- Settings Application ---
function applySettings(isInit = false) {
    state.maxTimeouts = parseInt(document.getElementById('input-max-timeouts').value);
    const durationEl = document.getElementById('input-timeout-duration');
    if (durationEl) state.timeoutDuration = parseInt(durationEl.value) || 30;
    const bgColorEl = document.getElementById('input-bg-color');
    if (bgColorEl) state.bgColor = bgColorEl.value;
    const methodEl = document.getElementById('input-advanced-method');
    if (methodEl) state.advancedInputMethod = methodEl.value;
    
    if (isInit) {
        resetMatchState();
    } else {
        toggleSettings();
    }
    saveState();
    updateUI();
}

async function startNewMatch() {
    if (state.actionLog.length > 0) {
        const confirmed = await showCustomConfirm("現在の試合記録を破棄して、新しい試合の準備をしますか？");
        if (!confirmed) return false;
    }
    resetMatchState();
    saveState();
    updateUI();
    toggleMatchSetup();
    return true;
}

async function confirmStartMatch() {
    // Preserve loaded preset lineups, liberos, and members before resetting score state
    const savedLineupA = state.lineupA ? [...state.lineupA] : [];
    const savedLineupB = state.lineupB ? [...state.lineupB] : [];
    const savedLiberosA = state.liberosA ? [...state.liberosA] : [];
    const savedLiberosB = state.liberosB ? [...state.liberosB] : [];
    const savedMembersA = state.membersA ? JSON.parse(JSON.stringify(state.membersA)) : null;
    const savedMembersB = state.membersB ? JSON.parse(JSON.stringify(state.membersB)) : null;

    state.maxSets = parseInt(document.getElementById('setup-sets-format').value);
    state.targetPoints = parseInt(document.getElementById('setup-target-points').value);
    state.finalSetTarget = parseInt(document.getElementById('setup-final-set-target').value);
    state.servingTeam = setupServingTeam;
    state.initialServingTeam = setupServingTeam;
    state.showAdvancedMode = document.getElementById('setup-advanced-mode').checked;
    
    const myTeamOnlyEl = document.getElementById('setup-myteam-only-stats');
    state.myTeamOnlyStats = myTeamOnlyEl ? myTeamOnlyEl.checked : false;
    
    resetMatchState();

    // Auto-load preset data from master if team names match existing presets
    // This guarantees that any changes made in the team master are automatically loaded for the new match.
    const presets = JSON.parse(localStorage.getItem(PRESET_TEAMS_KEY) || '[]');
    let loadedA = false;
    let loadedB = false;

    const normalizeName = (name) => name ? name.trim().toLowerCase() : "";

    if (state.teamA) {
        const normA = normalizeName(state.teamA);
        const matchA = presets.find(p => normalizeName(p.name) === normA);
        if (matchA) {
            loadPresetToTeam('A', matchA.name);
            loadedA = true;
        }
    }
    if (state.teamB) {
        const normB = normalizeName(state.teamB);
        const matchB = presets.find(p => normalizeName(p.name) === normB);
        if (matchB) {
            loadPresetToTeam('B', matchB.name);
            loadedB = true;
        }
    }

    // Restore preserved lineups, liberos, and members ONLY IF we didn't auto-load them
    // (This preserves temporary modifications made in the Match Setup config modal if no preset matches)
    if (!loadedA) {
        if (savedLineupA.length) state.lineupA = savedLineupA;
        if (savedLiberosA.length && savedLiberosA.some(l => l !== null)) {
            state.liberosA = savedLiberosA;
        } else if (savedMembersA) {
            const presetLiberos = savedMembersA.filter(m => m.isLibero).map(m => m.id);
            state.liberosA = [presetLiberos[0] || null, presetLiberos[1] || null];
        }
        if (savedMembersA) state.membersA = savedMembersA;
    }
    if (!loadedB) {
        if (savedLineupB.length) state.lineupB = savedLineupB;
        if (savedLiberosB.length && savedLiberosB.some(l => l !== null)) {
            state.liberosB = savedLiberosB;
        } else if (savedMembersB) {
            const presetLiberos = savedMembersB.filter(m => m.isLibero).map(m => m.id);
            state.liberosB = [presetLiberos[0] || null, presetLiberos[1] || null];
        }
        if (savedMembersB) state.membersB = savedMembersB;
    }

    // レシーブスタート（相手サーブ）の場合にローテーションを1つ戻す自動調整
    if (state.servingTeam === 'A') {
        if (state.lineupB && state.lineupB.length === 6) {
            const last = state.lineupB.pop();
            state.lineupB.unshift(last);
        }
    } else if (state.servingTeam === 'B') {
        if (state.lineupA && state.lineupA.length === 6) {
            const last = state.lineupA.pop();
            state.lineupA.unshift(last);
        }
    }

    state.matchStartTime = Date.now();
    saveState();
    updateUI();
    isMenuHubActive = false;
    toggleMatchSetup();
    if (typeof keepScreenOn === 'function') keepScreenOn();
    showToast("試合開始！");

    if (typeof checkAutoLiberoSubstitutions === 'function') {
        await checkAutoLiberoSubstitutions('A', true);
        await checkAutoLiberoSubstitutions('B', true);
    }
}

function getContrastColor(hex) {
    if (!hex) return '#ffffff';
    hex = hex.replace('#', '');
    if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000000' : '#ffffff';
}
