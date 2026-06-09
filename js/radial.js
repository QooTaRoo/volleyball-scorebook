// --- Radial Menu & Advanced Input ---

let radialState = {
    active: false,
    stage: 1, // 1: Action, 2: Player
    team: null,
    startX: 0,
    startY: 0,
    startTime: 0,
    stage2StartTime: 0, // Delay for stage 2 interaction
    currentOption: null,
    currentPlayerId: null,
    playerCoords: {},
    timer: null,
    stillnessTimer: null,
    lastX: 0,
    lastY: 0,
    isClosing: false
};

const RADIAL_THRESHOLD = 30; 
const RADIAL_HOLD_TIME = 200; 
const STAGE_TRANSITION_DELAY = 200; // Requirement 2: Delay between stages

function initRadialEvents() {
    const areaA = document.getElementById('score-a');
    const areaB = document.getElementById('score-b');

    [areaA, areaB].forEach(area => {
        const team = area.id === 'score-a' ? 'A' : 'B';
        area.addEventListener('contextmenu', (e) => e.preventDefault());

        area.addEventListener('pointerdown', (e) => {
            if (isAnyModalOpen() || radialState.isClosing) return;
            // Prevent accidental triggers on buttons
            if (e.target !== area && !area.classList.contains('score-display') && e.target.closest('button, .pointer-events-auto')) return;

            resetRadialState();
            radialState.team = team;
            radialState.startX = e.clientX;
            radialState.startY = e.clientY;
            radialState.startTime = Date.now();

            if (state.showAdvancedMode) {
                if (state.advancedInputMethod === 'radial') {
                    showRadialMenu(e.clientX, e.clientY);
                } else {
                    const targetTeam = radialState.team;
                    resetRadialState();
                    radialState.team = null; // Prevent pointerup/endInteraction from adding a simple point
                    openDetailedStatsModal(targetTeam);
                }
            }

            // Create visual ripple feedback
            const ripple = document.createElement('div');
            ripple.className = 'ripple';
            const rect = area.getBoundingClientRect();
            ripple.style.left = `${e.clientX - rect.left}px`;
            ripple.style.top = `${e.clientY - rect.top}px`;
            area.appendChild(ripple);
            setTimeout(() => { if (ripple.parentNode) ripple.remove(); }, 500);
        });
    });

    window.addEventListener('pointermove', (e) => {
        if (!radialState.active || radialState.isClosing) {
            if (radialState.timer && Math.hypot(e.clientX - radialState.startX, e.clientY - radialState.startY) > 15) {
                clearTimeout(radialState.timer);
                radialState.timer = null;
            }
            return;
        }
        updateRadialSelection(e.clientX, e.clientY);
    });

    const endInteraction = (e) => {
        if (radialState.timer) {
            clearTimeout(radialState.timer);
            radialState.timer = null;
        }

        if (radialState.team) {
            const elapsed = Date.now() - radialState.startTime;
            const dist = Math.hypot(e.clientX - radialState.startX, e.clientY - radialState.startY);

            if (radialState.active && !radialState.isClosing) {
                const pattern = radialState.currentOption;
                const playerId = radialState.currentPlayerId;
                
                // Final confirm distance check
                if (dist > 180) {
                    showToast("キャンセルしました");
                    hideRadialMenu();
                } else if (pattern) {
                    addPoint(radialState.team, pattern, playerId);
                    hideRadialMenu();
                } else {
                    hideRadialMenu();
                }
            } else if (!radialState.active && elapsed < 500 && dist < 20) {
                // Simple tap for unknown point
                addPoint(radialState.team, 'unknown');
            }
        }
        
        radialState.active = false;
        radialState.team = null;
    };

    window.addEventListener('pointerup', endInteraction);
    window.addEventListener('pointercancel', () => {
        hideRadialMenu();
        resetRadialState();
    });
}

function resetRadialState() {
    if (radialState.timer) clearTimeout(radialState.timer);
    if (radialState.stillnessTimer) clearTimeout(radialState.stillnessTimer);
    radialState.active = false;
    radialState.stage = 1;
    radialState.currentOption = null;
    radialState.currentPlayerId = null;
    radialState.isClosing = false;
}

function showRadialMenu(x, y) {
    radialState.active = true;
    radialState.stage = 1;
    radialState.isClosing = false;
    
    const menu = document.getElementById('radial-menu');
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
    menu.style.transform = 'translate(-50%, -50%) scale(1)';
    menu.style.opacity = '1';
    
    document.getElementById('radial-stage-action').style.opacity = '1';
    document.getElementById('radial-stage-player').style.opacity = '0';
    document.getElementById('radial-guidance').textContent = "種類を選択";

    vibrate(10);
}

function hideRadialMenu() {
    if (radialState.isClosing) return;
    radialState.isClosing = true;
    
    const menu = document.getElementById('radial-menu');
    menu.style.transform = 'translate(-50%, -50%) scale(0.5)';
    menu.style.opacity = '0';
    
    // Clear highlights
    document.querySelectorAll('.radial-option, .radial-player-opt').forEach(opt => {
        opt.style.backgroundColor = '';
        opt.style.transform = opt.style.transform.replace(/ scale\(1\.\d\)/g, '');
    });

    // Timeout to allow transition and prevent immediate re-trigger
    setTimeout(() => {
        radialState.isClosing = false;
        radialState.active = false;
    }, 200);
}

function updateRadialSelection(x, y) {
    if (radialState.isClosing) return;

    const dx = x - radialState.startX;
    const dy = y - radialState.startY;
    const dist = Math.hypot(dx, dy);
    const indicator = document.getElementById('radial-selection-indicator');

    if (dist < 20) {
        indicator.style.opacity = '0';
        return;
    }
    indicator.style.opacity = '1';
    indicator.style.transform = `translate(${dx}px, ${dy}px)`;

    if (radialState.stage === 1) {
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;
        let option = null;
        if (angle > -135 && angle <= -45) option = 'spike';
        else if (angle > -45 && angle <= 45) option = 'ace';
        else if (angle > 45 && angle <= 135) option = 'block';
        else option = 'error';

        if (radialState.currentOption !== option) {
            radialState.currentOption = option;
            highlightOption(option);
            // オプションが切り替わったときも静止タイマーをリセット
            resetStillnessTimer();
        }

        // 静止判定のための距離チェック
        const moveDist = Math.hypot(x - radialState.lastX, y - radialState.lastY);
        if (moveDist > 5) {
            radialState.lastX = x;
            radialState.lastY = y;
            resetStillnessTimer();
        }
        
        // 強制的にスワイプアウト（140px以上）でも遷移
        if (dist > 140) {
            enterStage2(option);
        }
    } else {
        // Stage 2: Player Selection
        // Requirement 2: Prevent accidental selection during transition
        if (Date.now() - radialState.stage2StartTime < STAGE_TRANSITION_DELAY) return;

        if (dist < 30) {
            radialState.currentPlayerId = null;
            highlightPlayer(null);
            return;
        }

        const teamToPick = radialState.currentOption === 'error' ? (radialState.team === 'A' ? 'B' : 'A') : radialState.team;
        const lineup = teamToPick === 'A' ? state.lineupA : state.lineupB;
        
        let minScore = Infinity;
        let bestPos = null;

        for (let p in radialState.playerCoords) {
            const c = radialState.playerCoords[p];
            const d = Math.hypot(dx - c.x, dy - c.y);
            if (d < minScore) {
                minScore = d;
                bestPos = parseInt(p);
            }
        }

        if (bestPos && minScore < 60) {
            const playerId = lineup[bestPos - 1];
            if (radialState.currentPlayerId !== playerId) {
                radialState.currentPlayerId = playerId;
                highlightPlayer(bestPos);
                vibrate(5);
            }
        }
    }

    // Outer Cancel Feedback
    const menu = document.getElementById('radial-menu');
    if (dist > 180) {
        menu.style.opacity = '0.3';
        menu.style.transform = 'translate(-50%, -50%) scale(0.95)';
    } else {
        menu.style.opacity = '1';
        menu.style.transform = 'translate(-50%, -50%) scale(1)';
    }
}

function highlightOption(type) {
    document.querySelectorAll('.radial-option').forEach(opt => {
        const isMatch = opt.id === `radial-opt-${type}`;
        opt.style.backgroundColor = isMatch ? (type === 'error' ? '#ef4444' : '#10b981') : '';
        opt.style.transform = opt.style.transform.replace(' scale(1.1)', '') + (isMatch ? ' scale(1.1)' : '');
    });
}

function enterStage2(option) {
    if (radialState.stage === 2) return;
    
    const teamToPick = option === 'error' ? (radialState.team === 'A' ? 'B' : 'A') : radialState.team;
    
    const hasMyTeamInPlay = !!state.isMyTeamA || !!state.isMyTeamB;
    const isTargetMyTeam = (teamToPick === 'A' && state.isMyTeamA) || (teamToPick === 'B' && state.isMyTeamB);
    
    if (state.myTeamOnlyStats && hasMyTeamInPlay && !isTargetMyTeam) {
        addPoint(radialState.team, option, null);
        hideRadialMenu();
        resetRadialState();
        return;
    }

    radialState.stage = 2;
    radialState.stage2StartTime = Date.now(); // Start delay timer
    radialState.currentPlayerId = null;
    vibrate([10, 30]);

    document.getElementById('radial-stage-action').style.opacity = '0';
    document.getElementById('radial-stage-player').style.opacity = '1';
    
    // Player Setup
    const list = document.getElementById('radial-player-list');
    list.innerHTML = '';
    
    document.getElementById('radial-guidance').textContent = teamToPick === 'A' ? state.teamA : state.teamB;

    const lineup = teamToPick === 'A' ? state.lineupA : state.lineupB;
    const members = teamToPick === 'A' ? state.membersA : state.membersB;

    const isLandscape = document.body.classList.contains('is-landscape');
    const isTeamAFirst = !state.isCourtSwapped;
    const isTargetFirst = (teamToPick === 'A' ? isTeamAFirst : !isTeamAFirst);

    const gap = 75;
    radialState.playerCoords = {};

    [1, 2, 3, 4, 5, 6].forEach(p => {
        let x = 0, y = 0;
        if (isLandscape) {
            const col = (p === 2 || p === 3 || p === 4) ? (isTargetFirst ? 1 : -1) : (isTargetFirst ? -1 : 1);
            let row = (p === 2 || p === 1) ? 1 : (p === 3 || p === 6) ? 0 : -1;
            if (!isTargetFirst) row *= -1;
            x = col * gap; y = row * gap;
        } else {
            const row = (p === 2 || p === 3 || p === 4) ? (isTargetFirst ? 1 : -1) : (isTargetFirst ? -1 : 1);
            let col = (p === 2 || p === 1) ? 1 : (p === 3 || p === 6) ? 0 : -1;
            if (isTargetFirst) col *= -1;
            x = col * gap; y = row * gap;
        }
        radialState.playerCoords[p] = { x, y };
        
        const playerId = lineup[p - 1];
        const player = members.find(m => m.id === playerId);
        let displayStr = player ? player.number : p;
        if (player && player.name && player.name !== String(player.number)) {
            displayStr = player.name.substring(0, 4);
        }

        const liberos = teamToPick === 'A' ? (state.liberosA || []) : (state.liberosB || []);
        const isLibero = liberos.includes(playerId) || (player && !!player.isLibero);
        const badgeHtml = isLibero ? `<span class="absolute top-0.5 right-1 bg-purple-500 text-[6px] text-white font-black px-1 rounded-sm shadow-md animate-pulse">L</span>` : '';

        const opt = document.createElement('div');
        opt.id = `radial-player-opt-${p}`;
        opt.className = 'radial-player-opt absolute flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-zinc-800 border border-white/20 text-white font-black text-xs shadow-lg transition-all overflow-hidden';
        opt.style.left = '50%'; opt.style.top = '50%';
        opt.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
        opt.innerHTML = `<span class="leading-none text-[11px]">${displayStr}</span><span class="absolute bottom-0.5 text-[6px] opacity-40 font-normal">P${p}</span>${badgeHtml}`;
        list.appendChild(opt);
    });
}

function highlightPlayer(posNum) {
    document.querySelectorAll('.radial-player-opt').forEach(opt => {
        const isMatch = opt.id === `radial-player-opt-${posNum}`;
        opt.style.backgroundColor = isMatch ? '#facc15' : '';
        opt.style.color = isMatch ? '#000' : '';
        opt.style.transform = opt.style.transform.replace(' scale(1.2)', '') + (isMatch ? ' scale(1.2)' : '');
    });
}
function resetStillnessTimer() {
    if (radialState.stillnessTimer) clearTimeout(radialState.stillnessTimer);
    if (radialState.active && radialState.stage === 1 && radialState.currentOption) {
        radialState.stillnessTimer = setTimeout(() => {
            if (radialState.active && radialState.stage === 1) {
                enterStage2(radialState.currentOption);
            }
        }, 500); // 0.5秒静止で選手選択へ
    }
}

// --- Detailed Stats Dialog Modal logic ---

let dsState = {
    team: null,        // 'A' or 'B' (scoring team)
    pattern: 'spike',  // 'spike', 'block', 'ace', 'error'
    playerId: null,    // selected player ID
    displayTeam: null  // 'A' or 'B' (the team currently being displayed on the court)
};

function openDetailedStatsModal(team) {
    dsState.team = team;
    dsState.pattern = 'spike';
    dsState.playerId = null;
    dsState.displayTeam = team;

    // Set title
    const teamName = team === 'A' ? state.teamA : state.teamB;
    const titleEl = document.getElementById('detailed-stats-team-label');
    if (titleEl) {
        titleEl.textContent = `詳細スタッツ入力 (${teamName}の得点)`;
        titleEl.style.color = team === 'A' ? state.colorA : state.colorB;
    }

    // Show modal
    const modal = document.getElementById('detailed-stats-modal');
    if (modal) {
        modal.classList.remove('hidden');
    }

    // Render options and layout
    updateDsPatternUI();
    renderDsCourt();
    
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function closeDetailedStatsModal() {
    const modal = document.getElementById('detailed-stats-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

function selectDsPattern(pattern) {
    dsState.pattern = pattern;
    
    // If pattern is 'error', we display the opponent team members. Otherwise we display the scoring team members.
    const teamToPick = pattern === 'error' ? (dsState.team === 'A' ? 'B' : 'A') : dsState.team;
    dsState.displayTeam = teamToPick;
    
    // Reset player selection since the roster changed
    dsState.playerId = null;
    
    updateDsPatternUI();
    renderDsCourt();
}

function updateDsPatternUI() {
    const patterns = ['spike', 'block', 'ace', 'error'];
    patterns.forEach(p => {
        const btn = document.getElementById(`ds-pattern-${p}`);
        if (!btn) return;
        
        const isMatch = dsState.pattern === p;
        if (isMatch) {
            btn.classList.add('bg-yellow-500', 'text-black', 'border-yellow-400');
            btn.classList.remove('bg-zinc-800', 'text-white', 'border-white/5');
            if (p === 'error') {
                btn.classList.remove('bg-yellow-500', 'text-black', 'border-yellow-400');
                btn.classList.add('bg-red-500', 'text-black', 'border-red-400');
            }
        } else {
            btn.classList.remove('bg-yellow-500', 'text-black', 'border-yellow-400', 'bg-red-500', 'border-red-400');
            btn.classList.add('bg-zinc-800', 'text-white', 'border-white/5');
        }
    });
}

function selectDsPlayerByPos(posNum) {
    const lineup = dsState.displayTeam === 'A' ? state.lineupA : state.lineupB;
    const selectedPlayerId = lineup[posNum - 1];
    
    // Toggle selection
    if (dsState.playerId === selectedPlayerId) {
        dsState.playerId = null; // deselect
    } else {
        dsState.playerId = selectedPlayerId;
    }
    
    highlightDsCourtPlayers();
}

function highlightDsCourtPlayers() {
    const lineup = dsState.displayTeam === 'A' ? state.lineupA : state.lineupB;
    [1, 2, 3, 4, 5, 6].forEach(p => {
        const el = document.getElementById(`ds-pos-${p}`);
        if (!el) return;
        
        const playerId = lineup[p - 1];
        const isMatch = dsState.playerId === playerId;
        
        if (isMatch) {
            el.classList.add('ring-4', 'ring-yellow-400', 'bg-yellow-500/20', 'border-yellow-400/50');
            el.classList.remove('bg-white/10', 'border-white/20');
        } else {
            el.classList.remove('ring-4', 'ring-yellow-400', 'bg-yellow-500/20', 'border-yellow-400/50');
            
            // Check if player is Libero
            const members = dsState.displayTeam === 'A' ? state.membersA : state.membersB;
            const player = members.find(m => m.id === playerId);
            const liberos = dsState.displayTeam === 'A' ? (state.liberosA || []) : (state.liberosB || []);
            const isLibero = liberos.includes(playerId) || (player && !!player.isLibero);
            
            if (isLibero) {
                el.classList.add('bg-purple-900/30', 'border-purple-500/50');
                el.classList.remove('bg-white/10', 'border-white/20');
            } else {
                el.classList.remove('bg-purple-900/30', 'border-purple-500/50');
                el.classList.add('bg-white/10', 'border-white/20');
            }
        }
    });
}

function renderDsCourt() {
    const team = dsState.displayTeam;
    const lineup = team === 'A' ? state.lineupA : state.lineupB;
    const members = team === 'A' ? state.membersA : state.membersB;
    const liberos = team === 'A' ? (state.liberosA || []) : (state.liberosB || []);

    const courtLabel = document.getElementById('detailed-stats-court-label');
    if (courtLabel) {
        const teamName = team === 'A' ? state.teamA : state.teamB;
        courtLabel.textContent = `スタッツ対象選手 (${teamName})`;
    }

    [1, 2, 3, 4, 5, 6].forEach(p => {
        const el = document.getElementById(`ds-pos-${p}`);
        if (!el) return;
        
        const numSpan = el.querySelector('.player-num');
        const nameSpan = el.querySelector('.player-name');
        
        const playerId = lineup[p - 1];
        const player = members.find(m => m.id === playerId);
        
        if (numSpan) numSpan.textContent = player ? player.number : '-';
        if (nameSpan) {
            const name = player ? player.name : '';
            nameSpan.textContent = (name && name !== String(player?.number)) ? name : '';
        }
        
        // Remove existing libero badges
        let badge = el.querySelector('.libero-badge');
        if (badge) badge.remove();
        
        const isLibero = liberos.includes(playerId) || (player && !!player.isLibero);
        if (isLibero) {
            badge = document.createElement('span');
            badge.className = 'libero-badge absolute top-1 right-1 bg-purple-500 text-[6px] text-white font-black px-1 rounded-sm shadow-md pointer-events-none select-none animate-pulse';
            badge.textContent = 'L';
            el.appendChild(badge);
        }
    });

    highlightDsCourtPlayers();

    // Symmetrical Layout calculation
    const isLandscape = window.innerWidth > window.innerHeight;
    const isTeamAFirst = !state.isCourtSwapped;
    const isDisplayTeamFirst = (team === 'A' ? isTeamAFirst : !isTeamAFirst);

    const leftCol = document.getElementById('detailed-stats-left-col');
    const courtContainer = document.getElementById('detailed-stats-court-container');
    const layout = document.getElementById('detailed-stats-layout');
    
    const courtGrid = document.getElementById('detailed-stats-court-grid');
    const frontRow = document.getElementById('detailed-stats-front-row');
    const backRow = document.getElementById('detailed-stats-back-row');
    const netLine = document.getElementById('detailed-stats-net-line');

    if (courtGrid && frontRow && backRow && netLine) {
        if (isLandscape) {
            // Horizontal layout
            courtGrid.style.flexDirection = 'row';
            netLine.style.width = '12px';
            netLine.style.height = 'auto';
            netLine.style.margin = '0';
            frontRow.style.flexDirection = 'column';
            backRow.style.flexDirection = 'column';
            
            if (isDisplayTeamFirst) {
                // Team is on the left. Net is on the right. Buttons are on the left.
                netLine.style.order = '4';
                frontRow.style.order = '3';
                backRow.style.order = '2';
                
                if (leftCol && courtContainer) {
                    leftCol.style.order = '1';
                    courtContainer.style.order = '2';
                }
            } else {
                // Team is on the right. Net is on the left. Buttons are on the right.
                netLine.style.order = '1';
                frontRow.style.order = '2';
                backRow.style.order = '3';
                
                if (leftCol && courtContainer) {
                    leftCol.style.order = '2';
                    courtContainer.style.order = '1';
                }
            }
        } else {
            // Vertical layout
            courtGrid.style.flexDirection = 'column';
            netLine.style.width = 'auto';
            netLine.style.height = '12px';
            netLine.style.margin = '0';
            frontRow.style.flexDirection = 'row';
            backRow.style.flexDirection = 'row';

            if (isDisplayTeamFirst) {
                // Team is at the top. Net is at the bottom. Buttons are at the top.
                netLine.style.order = '4';
                frontRow.style.order = '3';
                backRow.style.order = '2';

                if (leftCol && courtContainer) {
                    leftCol.style.order = '1';
                    courtContainer.style.order = '2';
                }
            } else {
                // Team is at the bottom. Net is at the top. Buttons are at the bottom.
                netLine.style.order = '1';
                frontRow.style.order = '2';
                backRow.style.order = '3';

                if (leftCol && courtContainer) {
                    leftCol.style.order = '2';
                    courtContainer.style.order = '1';
                }
            }
        }
    }
}

function confirmDetailedStats() {
    if (!dsState.pattern) {
        showToast("得点原因を選択してください");
        return;
    }
    
    // Add point!
    addPoint(dsState.team, dsState.pattern, dsState.playerId);
    closeDetailedStatsModal();
    showToast("詳細スタッツを記録しました");
}

function simpleDsScore() {
    addPoint(dsState.team, 'unknown', null);
    closeDetailedStatsModal();
    showToast("得点のみを記録しました");
}

// Bind to window to allow inline onclick handlers in HTML
window.openDetailedStatsModal = openDetailedStatsModal;
window.closeDetailedStatsModal = closeDetailedStatsModal;
window.selectDsPattern = selectDsPattern;
window.selectDsPlayerByPos = selectDsPlayerByPos;
window.confirmDetailedStats = confirmDetailedStats;
window.simpleDsScore = simpleDsScore;

