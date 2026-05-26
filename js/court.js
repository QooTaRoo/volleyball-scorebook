// --- Court & Player Management ---

let currentCourtTeam = null;
let currentSubPosIdx = null;
let swapSelectionIdx = null; // Requirement 3: Swap logic

function toggleCourtOverlay(team) {
    const modal = document.getElementById('court-modal');
    if (team) {
        currentCourtTeam = team;
        swapSelectionIdx = null;
        renderCourt(team);
        modal.classList.remove('hidden');
    } else {
        currentCourtTeam = null;
        modal.classList.add('hidden');
    }
}

function renderCourt(team) {
    const teamName = team === 'A' ? state.teamA : state.teamB;
    const lineup = team === 'A' ? state.lineupA : state.lineupB;
    const members = team === 'A' ? state.membersA : state.membersB;

    const labelEl = document.getElementById('court-team-label');
    if (labelEl) {
        labelEl.textContent = teamName;
        labelEl.style.color = team === 'A' ? state.colorA : state.colorB;
    }

    lineup.forEach((playerId, idx) => {
        const posNum = idx + 1;
        const el = document.getElementById(`pos-${posNum}`);
        if (!el) return;
        
        const numSpan = el.querySelector('.player-num');
        const nameSpan = el.querySelector('.player-name');
        
        const player = members.find(m => m.id === playerId);
        if (numSpan) numSpan.textContent = player ? player.number : '-';
        if (nameSpan) {
            const name = player ? player.name : '';
            nameSpan.textContent = (name && name !== String(player?.number)) ? name : '';
        }

        // Highlight if selected for swap
        el.classList.toggle('ring-4', swapSelectionIdx === idx);
        el.classList.toggle('ring-yellow-400', swapSelectionIdx === idx);
    });

    // Mirror logic for net orientation
    const container = document.getElementById('court-grid-container');
    const frontRow = document.getElementById('court-front-row');
    const backRow = document.getElementById('court-back-row');
    const netLine = document.getElementById('court-net-line');

    if (container && frontRow && backRow && netLine) {
        const isLandscape = document.body.classList.contains('is-landscape');
        const isFirstHalf = state.isCourtSwapped ? (team === 'B') : (team === 'A');

        if (isLandscape) {
            container.style.flexDirection = 'row';
            netLine.style.width = '16px'; netLine.style.height = 'auto'; netLine.style.margin = '0';
            netLine.className = "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.4)] transition-all shrink-0 relative flex items-center justify-center rounded-sm border-l border-r border-amber-500/30";
            netLine.innerHTML = '<span class="absolute text-[8px] text-zinc-950 font-black uppercase select-none tracking-widest rotate-90">NET</span>';
            if (isFirstHalf) {
                backRow.style.order = '1'; frontRow.style.order = '2'; netLine.style.order = '3';
                frontRow.style.flexDirection = 'column'; backRow.style.flexDirection = 'column';
            } else {
                netLine.style.order = '1'; frontRow.style.order = '2'; backRow.style.order = '3';
                frontRow.style.flexDirection = 'column-reverse'; backRow.style.flexDirection = 'column-reverse';
            }
        } else {
            container.style.flexDirection = 'column';
            netLine.style.width = 'auto'; netLine.style.height = '16px'; netLine.style.margin = '0';
            netLine.className = "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.4)] transition-all shrink-0 relative flex items-center justify-center rounded-sm border-t border-b border-amber-500/30";
            netLine.innerHTML = '<span class="absolute text-[8px] text-zinc-950 font-black uppercase select-none tracking-widest">NET</span>';
            if (isFirstHalf) {
                backRow.style.order = '1'; frontRow.style.order = '2'; netLine.style.order = '3';
                frontRow.style.flexDirection = 'row-reverse'; backRow.style.flexDirection = 'row-reverse';
            } else {
                netLine.style.order = '1'; frontRow.style.order = '2'; backRow.style.order = '3';
                frontRow.style.flexDirection = 'row'; backRow.style.flexDirection = 'row';
            }
        }
    }
}

function handleCourtPosClick(posNum) {
    const idx = posNum - 1;
    if (swapSelectionIdx === null) {
        // First click: Select for swap or open sub menu
        swapSelectionIdx = idx;
        renderCourt(currentCourtTeam);
        
        // Show guidance or wait for second click
        showToast("別の位置をタップで入れ替え、または控えから選択");
        
        // Open sub modal (Bench list)
        openSubModal(idx);
    } else if (swapSelectionIdx === idx) {
        // Clicked same player: Deselect
        swapSelectionIdx = null;
        renderCourt(currentCourtTeam);
        closeSubModal();
    } else {
        // Second click on different court player: SWAP
        performSwap(swapSelectionIdx, idx);
        swapSelectionIdx = null;
        closeSubModal();
    }
}

function openSubModal(posIdx) {
    currentSubPosIdx = posIdx;
    const team = currentCourtTeam;
    const lineup = team === 'A' ? state.lineupA : state.lineupB;
    const members = team === 'A' ? state.membersA : state.membersB;
    
    const bench = members.filter(m => !lineup.includes(m.id));
    const list = document.getElementById('bench-list');
    
    let html = '';
    
    // Add "Other on-court players" for swapping option in modal too
    const otherCourtPlayers = lineup.map((id, i) => ({id, idx: i})).filter(p => p.idx !== posIdx);
    
    if (otherCourtPlayers.length > 0) {
        html += `<div class="text-[10px] text-zinc-500 font-bold mb-2 uppercase tracking-widest">コート内の選手と入れ替え</div>`;
        otherCourtPlayers.forEach(p => {
            const m = members.find(mem => mem.id === p.id);
            html += `
                <button onclick="performSwap(${posIdx}, ${p.idx}); closeSubModal();" class="w-full bg-zinc-800/40 hover:bg-zinc-700 text-white p-2 rounded flex justify-between items-center mb-1 border border-white/5">
                    <span class="font-bold text-sm w-8">${m ? m.number : '?'}</span>
                    <span class="flex-1 text-left truncate mx-2 text-xs">${m ? m.name : 'Unknown'}</span>
                    <span class="text-yellow-500 text-[10px] font-bold">SWAP</span>
                </button>
            `;
        });
        html += `<div class="h-4"></div>`;
    }

    html += `<div class="text-[10px] text-zinc-500 font-bold mb-2 uppercase tracking-widest">控え選手と交代</div>`;
    if (bench.length === 0) {
        html += `<div class="text-zinc-500 text-center py-4 text-xs">控え選手がいません</div>`;
    } else {
        html += bench.map(m => `
            <button onclick="substitute('${m.id}')" class="w-full bg-zinc-800 hover:bg-zinc-700 text-white p-3 rounded flex justify-between items-center transition-colors mb-2">
                <span class="font-bold text-lg w-10">${m.number}</span>
                <span class="flex-1 text-left truncate mx-2 text-sm">${m.name}</span>
                <span class="text-blue-400 text-xs font-bold">IN ➔</span>
            </button>
        `).join('');
    }
    
    list.innerHTML = html;
    document.getElementById('sub-modal').classList.remove('hidden');
}

function performSwap(idx1, idx2) {
    const team = currentCourtTeam;
    const lineup = team === 'A' ? state.lineupA : state.lineupB;
    
    const temp = lineup[idx1];
    lineup[idx1] = lineup[idx2];
    lineup[idx2] = temp;
    
    state.actionLog.push({
        type: 'swap_players',
        team: team,
        idx1: idx1,
        idx2: idx2,
        set: state.currentSet,
        timestamp: Date.now()
    });
    
    saveState();
    updateUI();
    renderCourt(team);
    showToast("ポジションを入れ替えました");
    swapSelectionIdx = null;
}

function substitute(benchPlayerId) {
    if (currentSubPosIdx === null || !currentCourtTeam) return;
    const team = currentCourtTeam;
    const lineup = team === 'A' ? state.lineupA : state.lineupB;
    const oldPlayerId = lineup[currentSubPosIdx];
    
    lineup[currentSubPosIdx] = benchPlayerId;
    state.actionLog.push({
        type: 'substitution',
        team: team,
        posIdx: currentSubPosIdx,
        outPlayerId: oldPlayerId,
        inPlayerId: benchPlayerId,
        set: state.currentSet,
        timestamp: Date.now()
    });
    
    saveState();
    updateUI();
    renderCourt(team);
    closeSubModal();
    showToast("選手交代しました");
    swapSelectionIdx = null;
}

function closeSubModal() {
    document.getElementById('sub-modal').classList.add('hidden');
    currentSubPosIdx = null;
    swapSelectionIdx = null;
    if (currentCourtTeam) renderCourt(currentCourtTeam);
}
