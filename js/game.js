// --- Game Logic ---

function addPoint(winningTeam, pattern = 'unknown', playerId = null) {
    if (state.matchComplete) return;
    if (isAnyModalOpen()) return;

    vibrate(50);
    
    const scoringTeam = winningTeam;
    const rotationOccurred = state.servingTeam !== scoringTeam;
    const actor = (pattern === 'error') ? (winningTeam === 'A' ? 'B' : 'A') : winningTeam;

    // Record action
    state.actionLog.push({
        type: 'point',
        team: actor,
        scoringTeam: scoringTeam,
        scoreA: state.scoreA,
        scoreB: state.scoreB,
        set: state.currentSet,
        servingTeam: state.servingTeam,
        rotationOccurred: rotationOccurred,
        pattern: pattern,
        playerId: playerId,
        timestamp: Date.now()
    });

    if (rotationOccurred) {
        state.servingTeam = scoringTeam;
        rotateTeam(scoringTeam);
    }

    if (scoringTeam === 'A') state.scoreA++;
    else state.scoreB++;

    // Ensure state is saved immediately to prevent data loss
    saveState();
    
    checkSetEnd();
    updateUI();
}

function rotateTeam(team) {
    const lineup = team === 'A' ? state.lineupA : state.lineupB;
    const first = lineup.shift();
    lineup.push(first);
    
    state.rotationLog.push({
        set: state.currentSet,
        team: team,
        lineup: [...lineup],
        scoreA: state.scoreA,
        scoreB: state.scoreB
    });
}

async function checkSetEnd() {
    if (state.matchComplete) return;

    let maxPoints = state.targetPoints;
    let requiredDifference = 2;
    if (state.maxSets >= 3 && state.currentSet === state.maxSets) {
        maxPoints = state.finalSetTarget;
    }

    if ((state.scoreA >= maxPoints || state.scoreB >= maxPoints) && Math.abs(state.scoreA - state.scoreB) >= requiredDifference) {
        if (state.scoreA > state.scoreB) {
            await finishSet('A');
        } else {
            await finishSet('B');
        }
    } else {
        // Point target logic for toast
        let targetA = maxPoints;
        let targetB = maxPoints;
        if (state.scoreA >= maxPoints - 1 && state.scoreA >= state.scoreB) targetA = state.scoreA + 1;
        if (state.scoreB >= maxPoints - 1 && state.scoreB >= state.scoreA) targetB = state.scoreB + 1;
        
        let isMatchPoint = false;
        let isSetPoint = false;
        
        if (state.scoreA === targetA - 1 || state.scoreB === targetB - 1) {
            isSetPoint = true;
            const matchWinnerNeeded = Math.ceil(state.maxSets / 2);
            if (state.scoreA === targetA - 1 && state.setsA === matchWinnerNeeded - 1) isMatchPoint = true;
            if (state.scoreB === targetB - 1 && state.setsB === matchWinnerNeeded - 1) isMatchPoint = true;
            
            // Special handling for 2-set match format
            if (state.maxSets === 2 && state.currentSet === 2) {
                isMatchPoint = true;
                isSetPoint = false;
            }
        }

        if (isMatchPoint) showToast("MATCH POINT");
        else if (isSetPoint) showToast("SET POINT");
    }
}

async function finishSet(winner) {
    state.actionLog.push({
        type: 'set_finish',
        winner: winner,
        scoreA: state.scoreA,
        scoreB: state.scoreB,
        toA: state.toA,
        toB: state.toB,
        currentSet: state.currentSet,
        setsA: state.setsA,
        setsB: state.setsB,
        isCourtSwapped: state.isCourtSwapped
    });

    state.setHistory.push({
        set: state.currentSet,
        winner: winner,
        scoreA: state.scoreA,
        scoreB: state.scoreB,
        log: [...state.actionLog.filter(l => l.set === state.currentSet)]
    });

    if (winner === 'A') state.setsA++;
    else state.setsB++;

    const matchWinnerNeeded = Math.ceil(state.maxSets / 2);
    
    // 2セットマッチ（得失点差）の特殊ロジック
    if (state.maxSets === 2) {
        if (state.currentSet === 2) {
            const totalA = state.setHistory.reduce((sum, s) => sum + s.scoreA, 0);
            const totalB = state.setHistory.reduce((sum, s) => sum + s.scoreB, 0);
            let matchWinner;
            if (totalA > totalB) matchWinner = state.teamA;
            else if (totalB > totalA) matchWinner = state.teamB;
            else matchWinner = "引き分け";
            
            await finishMatch(matchWinner, `合計得点 ${totalA} - ${totalB}`);
        } else {
            await showCustomAlert(`第1セット終了！ 次のセットを開始します。`);
            prepareNextSet();
        }
    } else if (state.setsA === matchWinnerNeeded || state.setsB === matchWinnerNeeded) {
        await finishMatch(winner === 'A' ? state.teamA : state.teamB);
    } else {
        await showCustomAlert(`第${state.currentSet}セット終了！ 勝者: ${winner === 'A' ? state.teamA : state.teamB}`);
        prepareNextSet();
    }
}

function prepareNextSet() {
    state.currentSet++;
    state.scoreA = 0;
    state.scoreB = 0;
    state.toA = 0;
    state.toB = 0;
    swapCourts(true);
    saveState();
    updateUI();
}

async function finishMatch(winnerName, scoreDetail = "") {
    // CRITICAL: Ensure last set is in setHistory (already handled by finishSet)
    
    const matchHistory = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    matchHistory.unshift({
        date: new Date().toLocaleString(),
        teamA: state.teamA,
        teamB: state.teamB,
        colorA: state.colorA,
        colorB: state.colorB,
        setsA: state.setsA,
        setsB: state.setsB,
        setHistory: JSON.parse(JSON.stringify(state.setHistory)),
        maxSets: state.maxSets,
        durationMinutes: Math.floor((Date.now() - state.matchStartTime) / 60000)
    });
    localStorage.setItem(HISTORY_KEY, JSON.stringify(matchHistory));

    let msg = "試合終了！";
    if (winnerName) msg += ` 勝者: ${winnerName}`;
    if (scoreDetail) msg += `\n${scoreDetail}`;
    
    await showCustomAlert(msg);

    // Reset for new match
    resetMatchState();
    saveState();
    updateUI();
    // Ensure only the main menu is shown
    if (typeof toggleMainMenu === 'function') {
        // Hide other major modals first
        const modalsToHide = ['match-setup-modal', 'settings-modal', 'history-modal', 'timeline-modal'];
        modalsToHide.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.add('hidden');
        });
        toggleMainMenu(true);
    }
}

function resetMatchState() {
    state.scoreA = 0;
    state.scoreB = 0;
    state.setsA = 0;
    state.setsB = 0;
    state.toA = 0;
    state.toB = 0;
    state.currentSet = 1;
    state.actionLog = [];
    state.setHistory = [];
    state.matchComplete = false;
    state.matchStartTime = null;
    state.rotationLog = [];
    
    // Lineup inheritance: usually new matches reset to default? 
    // But within a session, maybe keep? User said "セット間" (between sets).
    // Let's reset to basic for new match.
    state.lineupA = ["A1", "A2", "A3", "A4", "A5", "A6"];
    state.lineupB = ["B1", "B2", "B3", "B4", "B5", "B6"];
}

function undo() {
    if (state.actionLog.length === 0) return;
    vibrate(30);
    
    // Find last score-related action (Requirement 3: Limit scope to score)
    let lastIdx = -1;
    for (let i = state.actionLog.length - 1; i >= 0; i--) {
        if (['point', 'timeout', 'set_finish'].includes(state.actionLog[i].type)) {
            lastIdx = i;
            break;
        }
    }

    if (lastIdx === -1) return;

    const last = state.actionLog.splice(lastIdx, 1)[0];

    if (last.type === 'point') {
        state.scoreA = last.scoreA;
        state.scoreB = last.scoreB;
        state.servingTeam = last.servingTeam;
        
        if (last.rotationOccurred) {
            const lineup = last.scoringTeam === 'A' ? state.lineupA : state.lineupB;
            const end = lineup.pop();
            lineup.unshift(end);
            if (state.rotationLog.length > 0) state.rotationLog.pop();
        }
    } else if (last.type === 'timeout') {
        if (last.team === 'A') state.toA--;
        else state.toB--;
    } else if (last.type === 'set_finish') {
        state.scoreA = last.scoreA;
        state.scoreB = last.scoreB;
        state.toA = last.toA;
        state.toB = last.toB;
        state.currentSet = last.currentSet;
        state.setsA = last.setsA;
        state.setsB = last.setsB;
        state.isCourtSwapped = last.isCourtSwapped;
        state.setHistory.pop();
    }
    
    saveState();
    updateUI();
}

function swapCourts(isAuto = false) {
    if (!isAuto) {
        state.actionLog.push({
            type: 'swap_courts',
            isCourtSwapped: state.isCourtSwapped
        });
    }
    state.isCourtSwapped = !state.isCourtSwapped;
    saveState();
    updateUI();
}

async function requestTimeout(team) {
    if (state.matchComplete) return;
    const teamName = team === 'A' ? state.teamA : state.teamB;
    const currentTo = team === 'A' ? state.toA : state.toB;
    const max = state.maxTimeouts || 2;
    
    let msg = "";
    if (currentTo >= max) {
        msg = `${teamName} は既に${max}回タイムアウトを取っています。\n追加しますか？`;
    } else {
        msg = `${teamName} のタイムアウトを取りますか？`;
    }
    
    const confirmed = await showCustomConfirm(msg);
    if (!confirmed) return;

    vibrate(50);
    state.actionLog.push({
        type: 'timeout',
        team: team,
        scoreA: state.scoreA,
        scoreB: state.scoreB,
        set: state.currentSet
    });
    if (team === 'A') state.toA++;
    else state.toB++;
    
    saveState();
    updateUI();
    startTimeoutTimer(team);
}

function getCurrentTarget() {
    // 3セットマッチの第3セット、または5セットマッチの第5セットのみ「最終セット得点」を適用
    if (state.maxSets >= 3 && state.currentSet === state.maxSets) {
        return state.finalSetTarget;
    }
    return state.targetPoints;
}
