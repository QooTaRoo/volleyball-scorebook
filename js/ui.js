// --- UI Management ---
let setupServingTeam = 'A';

function updateUI() {
    document.documentElement.style.setProperty('--color-a', state.colorA);
    document.documentElement.style.setProperty('--color-b', state.colorB);

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
    document.getElementById('score-a').textContent = String(state.scoreA).padStart(2, '0');
    document.getElementById('score-b').textContent = String(state.scoreB).padStart(2, '0');
    document.getElementById('sets-a').textContent = state.setsA;
    document.getElementById('sets-b').textContent = state.setsB;
    
    // Timeouts
    renderTimeouts('A');
    renderTimeouts('B');

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

function renderTimeouts(team) {
    const container = document.getElementById(team === 'A' ? 'to-indicator-a' : 'to-indicator-b');
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

function showToast(msg) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.style.opacity = "1";
    setTimeout(() => t.style.opacity = "0", 2000);
}

// Modal Toggles
function toggleSettings() { 
    const modal = document.getElementById('settings-modal');
    if (modal.classList.contains('hidden')) {
        document.getElementById('input-sets-format').value = state.maxSets;
        document.getElementById('input-target-points').value = state.targetPoints;
        document.getElementById('input-final-set-target').value = state.finalSetTarget;
        document.getElementById('input-max-timeouts').value = state.maxTimeouts;
        document.getElementById('input-advanced-mode').checked = !!state.showAdvancedMode;
        const durationEl = document.getElementById('input-timeout-duration');
        if (durationEl) durationEl.value = state.timeoutDuration || 30;
    }
    modal.classList.toggle('hidden'); 
}
function toggleResetMenu() { document.getElementById('reset-modal').classList.toggle('hidden'); }
function toggleTimeline() { document.getElementById('timeline-modal').classList.toggle('hidden'); }
function toggleHistory() { 
    document.getElementById('history-modal').classList.toggle('hidden'); 
    if (!document.getElementById('history-modal').classList.contains('hidden')) renderHistory();
}
function toggleMembers() { document.getElementById('member-modal').classList.toggle('hidden'); }
function toggleAnalysis() { document.getElementById('analysis-modal').classList.toggle('hidden'); }
function toggleMatchSetup() { 
    const modal = document.getElementById('match-setup-modal');
    if (modal.classList.contains('hidden')) {
        document.getElementById('setup-sets-format').value = state.maxSets;
        document.getElementById('setup-target-points').value = state.targetPoints;
        document.getElementById('setup-final-set-target').value = state.finalSetTarget;
        setSetupServe(state.servingTeam || 'A');
        updateMatchSetupVisibility();
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
    modal.classList.toggle('hidden'); 
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
    state.maxSets = parseInt(document.getElementById('input-sets-format').value);
    state.targetPoints = parseInt(document.getElementById('input-target-points').value);
    state.finalSetTarget = parseInt(document.getElementById('input-final-set-target').value);
    state.maxTimeouts = parseInt(document.getElementById('input-max-timeouts').value);
    state.showAdvancedMode = document.getElementById('input-advanced-mode').checked;
    const durationEl = document.getElementById('input-timeout-duration');
    if (durationEl) state.timeoutDuration = parseInt(durationEl.value) || 30;
    
    if (isInit) {
        resetMatchState();
    } else {
        toggleSettings();
    }
    saveState();
    updateUI();
}

function startNewMatch() {
    if (state.actionLog.length > 0) {
        if (!confirm("現在の試合記録を破棄して、新しい試合の準備をしますか？")) return;
    }
    toggleResetMenu();
    toggleMatchSetup();
}

function confirmStartMatch() {
    state.maxSets = parseInt(document.getElementById('setup-sets-format').value);
    state.targetPoints = parseInt(document.getElementById('setup-target-points').value);
    state.finalSetTarget = parseInt(document.getElementById('setup-final-set-target').value);
    state.servingTeam = setupServingTeam;
    
    resetMatchState();
    saveState();
    updateUI();
    toggleMatchSetup();
    showToast("試合開始！");
}
