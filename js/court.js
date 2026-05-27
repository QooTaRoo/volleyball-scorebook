// --- Court & Player Management ---

let currentCourtTeam = null;
let currentSubPosIdx = null;
let swapSelectionIdx = null; // Requirement 3: Swap logic

function selectCourtLibero(index, playerId) {
    if (!currentCourtTeam) return;
    const team = currentCourtTeam;
    
    if (team === 'preset') {
        const liberos = masterEditMembers.filter(m => m.isLibero).map(m => m.id);
        const idx = index - 1;
        const valToClear = liberos[idx];
        
        if (valToClear) {
            const p = masterEditMembers.find(m => m.id === valToClear);
            if (p) p.isLibero = false;
        }
        
        if (playerId) {
            const pOther = masterEditMembers.find(m => m.isLibero && m.id === playerId);
            if (pOther) pOther.isLibero = false;
            
            const p = masterEditMembers.find(m => m.id === playerId);
            if (p) {
                p.isLibero = true;
                p.isStarter = false; // Cannot be a starter if libero
            }
            showToast(`リベロ ${index} を登録しました`);
        } else {
            showToast(`リベロ ${index} を解除しました`);
        }
        
        renderCourt(team);
        renderMasterMemberRows();
        return;
    }
    
    if (team === 'A') {
        if (!Array.isArray(state.liberosA)) state.liberosA = [];
    } else {
        if (!Array.isArray(state.liberosB)) state.liberosB = [];
    }
    
    const liberos = team === 'A' ? state.liberosA : state.liberosB;
    const idx = index - 1;
    
    if (playerId) {
        const otherIdx = idx === 0 ? 1 : 0;
        if (liberos[otherIdx] === playerId) {
            liberos[otherIdx] = null;
        }
        liberos[idx] = playerId;
        showToast(`リベロ ${index} を登録しました`);
    } else {
        liberos[idx] = null;
        showToast(`リベロ ${index} を解除しました`);
    }
    
    saveState();
    renderCourt(team);
    updateUI();
}
window.selectCourtLibero = selectCourtLibero;

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
    const isPreset = team === 'preset';
    const teamName = isPreset 
        ? (document.getElementById('master-team-name').value.trim() || "新規チーム") 
        : (team === 'A' ? state.teamA : state.teamB);
    const lineup = isPreset 
        ? masterEditMembers.filter(m => m.isStarter).map(m => m.id) 
        : (team === 'A' ? state.lineupA : state.lineupB);
    const members = isPreset ? masterEditMembers : (team === 'A' ? state.membersA : state.membersB);

    const labelEl = document.getElementById('court-team-label');
    if (labelEl) {
        labelEl.textContent = teamName;
        if (isPreset) {
            labelEl.style.color = document.getElementById('master-team-color').value || "#3b82f6";
        } else {
            labelEl.style.color = team === 'A' ? state.colorA : state.colorB;
        }
    }

    // Populate Libero dropdowns
    const select1 = document.getElementById('court-libero-select-1');
    const select2 = document.getElementById('court-libero-select-2');
    if (select1 && select2) {
        const liberos = isPreset 
            ? masterEditMembers.filter(m => m.isLibero).map(m => m.id)
            : (team === 'A' ? (state.liberosA || []) : (state.liberosB || []));
        const val1 = liberos[0] || "";
        const val2 = liberos[1] || "";
        
        let html1 = '<option value="">（未登録）</option>';
        let html2 = '<option value="">（未登録）</option>';
        
        members.forEach(m => {
            html1 += `<option value="${m.id}" ${m.id === val1 ? 'selected' : ''}>No.${m.number} ${m.name}</option>`;
            html2 += `<option value="${m.id}" ${m.id === val2 ? 'selected' : ''}>No.${m.number} ${m.name}</option>`;
        });
        
        select1.innerHTML = html1;
        select2.innerHTML = html2;
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

        // Highlight if Libero
        const liberos = isPreset 
            ? masterEditMembers.filter(m => m.isLibero).map(m => m.id)
            : (team === 'A' ? (state.liberosA || []) : (state.liberosB || []));
        const isLibero = liberos.includes(playerId) || (player && !!player.isLibero);
        let badge = el.querySelector('.libero-badge');
        
        if (isLibero) {
            el.classList.add('relative', 'bg-purple-900/30', 'border-purple-500/50', 'shadow-[0_0_8px_rgba(168,85,247,0.3)]');
            el.classList.remove('bg-white/10', 'border-white/20');
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'libero-badge absolute top-1 right-1.5 bg-purple-500 text-[8px] text-white font-black px-1.5 py-0.5 rounded-sm shadow-md pointer-events-none select-none animate-pulse';
                badge.textContent = 'L';
                el.appendChild(badge);
            }
        } else {
            el.classList.remove('relative', 'bg-purple-900/30', 'border-purple-500/50', 'shadow-[0_0_8px_rgba(168,85,247,0.3)]');
            el.classList.add('bg-white/10', 'border-white/20');
            if (badge) {
                badge.remove();
            }
        }
    });

    // Mirror logic for net orientation: Always fixed to the top!
    const container = document.getElementById('court-grid-container');
    const frontRow = document.getElementById('court-front-row');
    const backRow = document.getElementById('court-back-row');
    const netLine = document.getElementById('court-net-line');

    if (container && frontRow && backRow && netLine) {
        container.style.flexDirection = 'column';
        netLine.style.width = 'auto'; 
        netLine.style.height = '16px'; 
        netLine.style.margin = '0';
        netLine.className = "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.4)] transition-all shrink-0 relative flex items-center justify-center rounded-sm border-t border-b border-amber-500/30";
        netLine.innerHTML = '<span class="absolute text-[8px] text-zinc-950 font-black uppercase select-none tracking-widest">NET</span>';
        
        netLine.style.order = '1';
        frontRow.style.order = '2';
        backRow.style.order = '3';
        frontRow.style.flexDirection = 'row';
        backRow.style.flexDirection = 'row';
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
    const lineup = team === 'preset'
        ? masterEditMembers.filter(m => m.isStarter).map(m => m.id)
        : (team === 'A' ? state.lineupA : state.lineupB);
    const members = team === 'preset'
        ? masterEditMembers
        : (team === 'A' ? state.membersA : state.membersB);
    
    const bench = members
        .filter(m => !lineup.includes(m.id))
        .sort((a, b) => (Number(a.number) || 0) - (Number(b.number) || 0));
    const list = document.getElementById('bench-list');
    
    let html = '';
    
    // Add "Other on-court players" for swapping option in modal too
    const otherCourtPlayers = lineup
        .map((id, i) => {
            const m = members.find(mem => mem.id === id);
            return { id, idx: i, number: m ? (Number(m.number) || 0) : 0 };
        })
        .filter(p => p.idx !== posIdx)
        .sort((a, b) => a.number - b.number);
    
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
        html += bench.map(m => {
            const liberos = team === 'preset'
                ? masterEditMembers.filter(p => p.isLibero).map(p => p.id)
                : (team === 'A' ? (state.liberosA || []) : (state.liberosB || []));
            const isPlayerLibero = liberos.includes(m.id);
            const badgeHtml = isPlayerLibero ? `<span class="bg-purple-600/90 text-[9px] text-white font-black px-1.5 py-0.5 rounded-sm shadow ml-2 shrink-0">LIBERO</span>` : '';
            return `
                <button onclick="substitute('${m.id}')" class="w-full bg-zinc-800 hover:bg-zinc-700 text-white p-3 rounded flex justify-between items-center transition-colors mb-2">
                    <span class="font-bold text-lg w-10">${m.number}</span>
                    <span class="flex-1 text-left truncate mx-2 text-sm flex items-center">${m.name}${badgeHtml}</span>
                    <span class="text-blue-400 text-xs font-bold">IN ➔</span>
                </button>
            `;
        }).join('');
    }
    
    list.innerHTML = html;
    document.getElementById('sub-modal').classList.remove('hidden');
}

function performSwap(idx1, idx2) {
    const team = currentCourtTeam;
    if (team === 'preset') {
        const starters = masterEditMembers.filter(m => m.isStarter);
        const player1Id = starters[idx1].id;
        const player2Id = starters[idx2].id;
        
        const mIdx1 = masterEditMembers.findIndex(m => m.id === player1Id);
        const mIdx2 = masterEditMembers.findIndex(m => m.id === player2Id);
        
        if (mIdx1 >= 0 && mIdx2 >= 0) {
            const temp = masterEditMembers[mIdx1];
            masterEditMembers[mIdx1] = masterEditMembers[mIdx2];
            masterEditMembers[mIdx2] = temp;
        }
        
        renderCourt(team);
        renderMasterMemberRows();
        showToast("ポジションを入れ替えました");
        swapSelectionIdx = null;
        return;
    }

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
    
    if (team === 'preset') {
        const starters = masterEditMembers.filter(m => m.isStarter);
        const oldPlayerId = starters[currentSubPosIdx].id;
        
        const mStarterIdx = masterEditMembers.findIndex(m => m.id === oldPlayerId);
        const mBenchIdx = masterEditMembers.findIndex(m => m.id === benchPlayerId);
        
        if (mStarterIdx >= 0 && mBenchIdx >= 0) {
            const temp = masterEditMembers[mStarterIdx];
            masterEditMembers[mStarterIdx] = masterEditMembers[mBenchIdx];
            masterEditMembers[mBenchIdx] = temp;
            
            masterEditMembers[mStarterIdx].isStarter = true;
            
            masterEditMembers[mBenchIdx].isStarter = false;
        }
        
        renderCourt(team);
        renderMasterMemberRows();
        closeSubModal();
        showToast("ポジションを変更しました");
        swapSelectionIdx = null;
        return;
    }

    const lineup = team === 'A' ? state.lineupA : state.lineupB;
    const oldPlayerId = lineup[currentSubPosIdx];
    
    const liberos = team === 'A' ? (state.liberosA || []) : (state.liberosB || []);
    const isLiberoReplacement = liberos.includes(oldPlayerId) || liberos.includes(benchPlayerId);
    
    lineup[currentSubPosIdx] = benchPlayerId;
    state.actionLog.push({
        type: 'substitution',
        team: team,
        posIdx: currentSubPosIdx,
        outPlayerId: oldPlayerId,
        inPlayerId: benchPlayerId,
        isLibero: isLiberoReplacement,
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

window.handleCourtPosClick = handleCourtPosClick;
window.performSwap = performSwap;
window.substitute = substitute;
window.closeSubModal = closeSubModal;
window.toggleCourtOverlay = toggleCourtOverlay;
