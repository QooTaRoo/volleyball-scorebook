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
    isClosing: false // Prevent spamming
};

const RADIAL_THRESHOLD = 30; 
const RADIAL_HOLD_TIME = 200; 
const STAGE_TRANSITION_DELAY = 200; // Requirement 2: Delay between stages

function initRadialEvents() {
    const areaA = document.getElementById('area-a');
    const areaB = document.getElementById('area-b');

    [areaA, areaB].forEach(area => {
        const team = area.id === 'area-a' ? 'A' : 'B';
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
                radialState.timer = setTimeout(() => {
                    showRadialMenu(e.clientX, e.clientY);
                }, RADIAL_HOLD_TIME);
            }
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
        }
        
        // 110px以上（メニュー枠外方向）へスワイプしたら、現在の選択肢で確定して選手選択へ
        if (dist > 110) {
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
    radialState.stage = 2;
    radialState.stage2StartTime = Date.now(); // Start delay timer
    radialState.currentPlayerId = null;
    vibrate([10, 30]);

    document.getElementById('radial-stage-action').style.opacity = '0';
    document.getElementById('radial-stage-player').style.opacity = '1';
    
    // Player Setup
    const list = document.getElementById('radial-player-list');
    list.innerHTML = '';
    
    const teamToPick = option === 'error' ? (radialState.team === 'A' ? 'B' : 'A') : radialState.team;
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

        const opt = document.createElement('div');
        opt.id = `radial-player-opt-${p}`;
        opt.className = 'radial-player-opt absolute flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-zinc-800 border border-white/20 text-white font-black text-xs shadow-lg transition-all overflow-hidden';
        opt.style.left = '50%'; opt.style.top = '50%';
        opt.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
        opt.innerHTML = `<span class="leading-none text-[11px]">${displayStr}</span><span class="absolute bottom-0.5 text-[6px] opacity-40 font-normal">P${p}</span>`;
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
