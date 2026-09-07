// --- Automatic Libero Substitution Engine ---

/**
 * Checks and performs automatic Libero-MB substitutions based on the current rotation and server state.
 * @param {string} team - 'A' or 'B'
 * @param {boolean} isMatchStart - Whether this check is running at the start of a match/set
 */
async function checkAutoLiberoSubstitutions(team, isMatchStart = false) {
    if (typeof state === 'undefined' || !state) return;
    const lineup = team === 'A' ? state.lineupA : state.lineupB;
    const members = team === 'A' ? state.membersA : state.membersB;
    const liberos = team === 'A' ? (state.liberosA || []) : (state.liberosB || []);
    
    // Retrieve registered and non-empty Liberos
    const validLiberos = liberos.filter(id => id);
    if (validLiberos.length === 0) return;
    
    // Find currently on-court Libero, or fallback to L1 (default)
    let activeLiberoId = validLiberos.find(id => lineup.includes(id));
    if (!activeLiberoId) {
        activeLiberoId = validLiberos[0];
    }
    
    if (!activeLiberoId) return;

    // Get IDs of players marked as Libero target (e.g. MBs)
    const targetPlayers = (members || []).filter(m => m.isLiberoTarget).map(m => m.id);
    if (targetPlayers.length === 0) return;

    const isLiberoOnCourt = lineup.includes(activeLiberoId);

    // --- TRIGGER 1: Libero rotates to front row (Positions 2, 3, 4 -> Indices 1, 2, 3) ---
    // Libero cannot play in the front row. Force sub original MB back to court.
    if (isLiberoOnCourt) {
        const liberoIdx = lineup.indexOf(activeLiberoId);
        if (liberoIdx === 1 || liberoIdx === 2 || liberoIdx === 3) {
            // Find a benched MB player to bring back
            const benchedTargetPlayer = targetPlayers.find(id => !lineup.includes(id));
            if (benchedTargetPlayer) {
                lineup[liberoIdx] = benchedTargetPlayer;
                
                state.actionLog.push({
                    type: 'substitution',
                    team: team,
                    posIdx: liberoIdx,
                    outPlayerId: activeLiberoId,
                    inPlayerId: benchedTargetPlayer,
                    isLibero: true,
                    isAuto: true,
                    set: state.currentSet,
                    timestamp: Date.now()
                });
                
                const mbPlayer = members.find(m => m.id === benchedTargetPlayer);
                showToast(`リベロOUT (No.${mbPlayer ? mbPlayer.number : ''})`);
                saveState();
                updateUI();
                if (typeof renderCourt === 'function' && typeof currentCourtTeam !== 'undefined' && currentCourtTeam === team) {
                    renderCourt(team);
                }
            }
        }
    }

    // --- TRIGGER 2: MB player rotates to back row (Positions 1, 5, 6 -> Indices 0, 4, 5) ---
    // If Libero is not on court, sub Libero in.
    if (!isLiberoOnCourt) {
        const isMyServe = state.servingTeam === team;
        
        // If my team is serving, keep the player at Index 0 (Position 1) on court to serve.
        // Otherwise, allow substitution at Index 0.
        const rearIndices = isMyServe ? [4, 5] : [0, 4, 5];
        
        for (let idx of rearIndices) {
            const playerId = lineup[idx];
            if (targetPlayers.includes(playerId)) {
                // Determine target Libero for this specific MB
                const mbPlayer = members.find(m => m.id === playerId);
                const assignedNum = (mbPlayer && mbPlayer.assignedLibero) ? mbPlayer.assignedLibero : 1;
                // Get the libero ID corresponding to the assigned number (L1 = index 0, L2 = index 1)
                const targetLiberoId = liberos[assignedNum - 1] || liberos[0];
                if (!targetLiberoId) continue;

                // If it is the match start, ask the user via a confirmation dialog first
                if (isMatchStart && typeof showCustomConfirm === 'function') {
                    const liberoPlayer = members.find(m => m.id === targetLiberoId);
                    const msg = `【試合開始】No.${mbPlayer ? mbPlayer.number : ''} ${mbPlayer ? mbPlayer.name : ''} の代わりにリベロ（No.${liberoPlayer ? liberoPlayer.number : ''}）を投入しますか？`;
                    
                    const confirmed = await showCustomConfirm(msg);
                    if (!confirmed) {
                        continue; // User clicked Cancel: Skip this player
                    }
                }

                // Auto sub Libero in
                lineup[idx] = targetLiberoId;
                
                state.actionLog.push({
                    type: 'substitution',
                    team: team,
                    posIdx: idx,
                    outPlayerId: playerId,
                    inPlayerId: targetLiberoId,
                    isLibero: true,
                    isAuto: true,
                    set: state.currentSet,
                    timestamp: Date.now()
                });
                
                showToast(`リベロIN (No.${mbPlayer ? mbPlayer.number : ''})`);
                saveState();
                updateUI();
                if (typeof renderCourt === 'function' && typeof currentCourtTeam !== 'undefined' && currentCourtTeam === team) {
                    renderCourt(team);
                }
                break; // Limit to one sub per check
            }
        }
    }
}

window.checkAutoLiberoSubstitutions = checkAutoLiberoSubstitutions;
