// --- History, Analysis & Timeline ---

function renderTimeline(setLog, teamA, teamB, colorA, colorB, currentScoreA, currentScoreB, setInProgress) {
    const container = document.createElement('div');
    container.className = "py-4 border-b border-zinc-800/50 mb-4";

    let aScore = 0;
    let bScore = 0;
    let aTO = 0;
    let bTO = 0;
    
    const columns = [];
    
    setLog.forEach(action => {
        if (action.type === 'point') {
            const scTeam = action.scoringTeam || (action.pattern === 'error' ? (action.team === 'A' ? 'B' : 'A') : action.team);
            if (scTeam === 'A') aScore++;
            else bScore++;
            columns.push({
                type: 'point',
                team: scTeam,
                val: scTeam === 'A' ? aScore : bScore
            });
        } else if (action.type === 'timeout') {
            if (action.team === 'A') aTO++;
            else bTO++;
            columns.push({
                type: 'timeout',
                team: action.team,
                val: action.team === 'A' ? aTO : bTO
            });
        }
    });

    const finalA = setInProgress ? currentScoreA : aScore;
    const finalB = setInProgress ? currentScoreB : bScore;

    let htmlA = `<div class="flex items-center" style="min-width: max-content;">`;
    let htmlB = `<div class="flex items-center mt-1.5" style="min-width: max-content;">`;

    htmlA += `<div class="w-12 h-10 flex items-center justify-center font-bold text-xl rounded mr-4 color-box shadow-lg border border-white/10" style="background: ${colorA}; color: #000;">${finalA}</div>`;
    htmlB += `<div class="w-12 h-10 flex items-center justify-center font-bold text-xl rounded mr-4 color-box shadow-lg border border-white/10" style="background: ${colorB}; color: #000;">${finalB}</div>`;

    columns.forEach(col => {
        if (col.type === 'point') {
            if (col.team === 'A') {
                htmlA += `<div class="w-7 h-7 flex items-center justify-center mx-0.5 rounded color-box text-sm font-bold shadow-sm" style="background: ${colorA}; color: #000;">${col.val}</div>`;
                htmlB += `<div class="w-7 h-7 mx-0.5"></div>`;
            } else {
                htmlA += `<div class="w-7 h-7 mx-0.5"></div>`;
                htmlB += `<div class="w-7 h-7 flex items-center justify-center mx-0.5 rounded color-box text-sm font-bold shadow-sm" style="background: ${colorB}; color: #000;">${col.val}</div>`;
            }
        } else if (col.type === 'timeout') {
            if (col.team === 'A') {
                htmlA += `<div class="w-7 h-7 flex items-center justify-center mx-0.5 color-box t-box text-[10px] font-black italic rounded" style="background: ${colorA}; border: 1.5px solid #000; color: #000;">T${col.val}</div>`;
                htmlB += `<div class="w-7 h-7 mx-0.5"></div>`;
            } else {
                htmlA += `<div class="w-7 h-7 mx-0.5"></div>`;
                htmlB += `<div class="w-7 h-7 flex items-center justify-center mx-0.5 color-box t-box text-[10px] font-black italic rounded" style="background: ${colorB}; border: 1.5px solid #000; color: #000;">T${col.val}</div>`;
            }
        }
    });

    htmlA += `</div>`; htmlB += `</div>`;
    container.innerHTML = `<div class="overflow-x-auto pb-2 timeline-container">${htmlA}${htmlB}</div>`;
    return container;
}

function showCurrentTimeline() {
    const content = document.getElementById('timeline-content');
    content.innerHTML = "";
    
    const allSets = [...state.setHistory];
    if (!state.matchComplete) {
        allSets.push({
            set: state.currentSet, scoreA: state.scoreA, scoreB: state.scoreB,
            log: state.actionLog.filter(l => l.set === state.currentSet)
        });
    }

    const header = document.createElement('div');
    header.className = "flex items-center justify-center gap-4 mb-8 text-xl font-bold bg-[#1a1a1a] sticky top-0 py-4 z-10 border-b border-zinc-800";
    header.innerHTML = `
        <span style="color: ${state.colorA}">${state.teamA}</span>
        <span class="bg-zinc-800 px-3 py-1 rounded text-white shadow-inner">${state.setsA}</span>
        <span class="text-zinc-600 font-normal">vs</span>
        <span class="bg-zinc-800 px-3 py-1 rounded text-white shadow-inner">${state.setsB}</span>
        <span style="color: ${state.colorB}">${state.teamB}</span>
    `;
    content.appendChild(header);

    allSets.forEach(setData => {
        const isCurrent = setData.set === state.currentSet && !state.matchComplete;
        const sh = document.createElement('div');
        sh.className = "text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-4 flex items-center gap-2";
        sh.innerHTML = `<span class="w-1 h-1 bg-zinc-700 rounded-full"></span> 第${setData.set}セット`;
        content.appendChild(sh);
        content.appendChild(renderTimeline(setData.log, state.teamA, state.teamB, state.colorA, state.colorB, isCurrent ? state.scoreA : setData.scoreA, isCurrent ? state.scoreB : setData.scoreB, isCurrent));
    });

    toggleTimeline();
}

function renderHistory() {
    const list = document.getElementById('history-list');
    list.innerHTML = "";
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');

    if (history.length === 0) {
        list.innerHTML = "<div class='text-zinc-600 py-10 text-center text-xs'>試合履歴がありません。</div>";
        return;
    }

    history.forEach((m, idx) => {
        const item = document.createElement('div');
        item.className = "bg-zinc-900 border border-zinc-800 p-4 mb-4 rounded-xl shadow-xl";
        item.id = `history-item-${idx}`;
        const cA = m.colorA || '#eab308';
        const cB = m.colorB || '#ffffff';
        item.innerHTML = `
            <div class="flex justify-between items-center text-[10px] text-zinc-500 font-bold mb-3 uppercase tracking-widest">
                <span>${m.date}</span>
                <div class="flex items-center gap-3">
                    <span class="flex items-center gap-1"><i data-lucide="clock" class="w-3 h-3"></i> ${m.durationMinutes || 0}分</span>
                    <span class="flex items-center gap-1"><i data-lucide="layers" class="w-3 h-3"></i> ${m.maxSets}セット</span>
                    <button onclick="deleteHistoryItem(${idx})" class="text-zinc-500 hover:text-red-500 transition-colors p-1" title="履歴を削除">
                        <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                    </button>
                </div>
            </div>
            <div class="flex justify-between items-center mb-5 px-2">
                <div class="flex-1 flex flex-col items-start overflow-hidden">
                    <div class="text-lg font-black truncate w-full" style="color: ${cA}">${m.teamA}</div>
                    <div class="text-3xl font-black text-white">${m.setsA}</div>
                </div>
                <div class="px-4 text-[10px] font-black text-zinc-700 italic">VS</div>
                <div class="flex-1 flex flex-col items-end overflow-hidden text-right">
                    <div class="text-lg font-black truncate w-full" style="color: ${cB}">${m.teamB}</div>
                    <div class="text-3xl font-black text-white">${m.setsB}</div>
                </div>
            </div>
            <div id="history-timeline-${idx}" class="hidden mt-4 border-t border-zinc-800 pt-4 bg-[#1a1a1a] px-2 pb-2 rounded-lg"></div>
            <div class="flex gap-2 mt-2" data-html2canvas-ignore>
                <button onclick="toggleHistoryTimeline(${idx})" class="flex-1 bg-zinc-800 hover:bg-zinc-700 py-2.5 text-[10px] font-black rounded-lg transition-colors flex items-center justify-center gap-1">
                    <i data-lucide="activity" class="w-3 h-3"></i> 詳細
                </button>
                <button onclick="openAnalysis(${idx})" class="flex-1 bg-zinc-800 hover:bg-zinc-700 py-2.5 text-[10px] font-black rounded-lg transition-colors flex items-center justify-center gap-1">
                    <i data-lucide="trending-up" class="w-3 h-3"></i> 分析
                </button>
                <button onclick="shareContainerAsImage('history-item-${idx}', 'history.png')" id="share-btn-${idx}" class="hidden bg-blue-600 hover:bg-blue-500 px-4 py-2 text-[10px] font-black rounded-lg flex items-center gap-1">
                    <i data-lucide="share-2" class="w-3 h-3"></i> 共有
                </button>
            </div>
        `;
        list.appendChild(item);
        
        const tlContainer = item.querySelector(`#history-timeline-${idx}`);
        m.setHistory.forEach(setData => {
            const h = document.createElement('div');
            h.className = "text-[9px] font-black text-zinc-500 mt-3 mb-1 uppercase";
            h.textContent = `SET ${setData.set}`;
            tlContainer.appendChild(h);
            tlContainer.appendChild(renderTimeline(setData.log, m.teamA, m.teamB, cA, cB, setData.scoreA, setData.scoreB, false));
        });
    });
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function toggleHistoryTimeline(idx) {
    const tl = document.getElementById(`history-timeline-${idx}`);
    const btn = document.getElementById(`share-btn-${idx}`);
    tl.classList.toggle('hidden');
    btn.classList.toggle('hidden');
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function openAnalysis(idx = -1) {
    let match;
    if (idx === -1) {
        match = {
            teamA: state.teamA, teamB: state.teamB, setsA: state.setsA, setsB: state.setsB,
            colorA: state.colorA, colorB: state.colorB, membersA: state.membersA, membersB: state.membersB,
            isLiveMatch: !state.matchComplete,
            setHistory: state.matchComplete ? [...state.setHistory] : [...state.setHistory, {
                set: state.currentSet, scoreA: state.scoreA, scoreB: state.scoreB,
                log: state.actionLog.filter(l => l.set === state.currentSet)
            }]
        };
    } else {
        match = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]')[idx];
    }
    if (!match) return;
    renderAnalysisContent(match);
    toggleAnalysis();
}

function renderAnalysisContent(m) {
    const header = document.getElementById('analysis-header');
    const teamStats = document.getElementById('analysis-team-stats');
    const playerStats = document.getElementById('analysis-player-stats');

    const setScoresHtml = m.setHistory.map(s => {
        const isLastSet = m.isLiveMatch && s.set === state.currentSet;
        const statusText = isLastSet ? 'LIVE' : 'FINAL';
        const statusColor = isLastSet ? 'text-emerald-500' : 'text-zinc-500';
        return `
            <div class="flex items-center justify-center gap-3 w-full">
                <span class="text-[10px] text-zinc-500 font-black w-10 text-right tracking-wider">SET ${s.set}</span>
                <div class="flex items-center justify-center gap-2 px-4 py-1.5 rounded-xl ${isLastSet ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-zinc-800/50 text-zinc-200 border border-white/5'} text-base sm:text-lg font-black min-w-[90px] shadow-inner">
                    <span>${s.scoreA}</span><span class="text-zinc-600 px-0.5">-</span><span>${s.scoreB}</span>
                </div>
                <div class="w-10 italic text-[9px] ${statusColor} font-bold tracking-widest">${statusText}</div>
            </div>
        `;
    }).join('');

    header.innerHTML = `
        <div class="bg-zinc-900/50 p-6 rounded-3xl border border-white/5 shadow-2xl overflow-hidden relative">
            <div class="flex items-stretch justify-between gap-2">
                <div class="flex-1 flex flex-col items-center justify-center py-2">
                    <div class="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Sets</div>
                    <div class="text-6xl font-black mb-2" style="color: ${m.colorA}">${m.setsA}</div>
                    <div class="text-xs font-bold text-center px-1" style="color: ${m.colorA}">${m.teamA}</div>
                </div>
                <div class="flex-[1.2] flex flex-col items-center justify-center gap-2 border-x border-white/5 px-2">${setScoresHtml}</div>
                <div class="flex-1 flex flex-col items-center justify-center py-2">
                    <div class="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Sets</div>
                    <div class="text-6xl font-black mb-2" style="color: ${m.colorB}">${m.setsB}</div>
                    <div class="text-xs font-bold text-center px-1" style="color: ${m.colorB}">${m.teamB}</div>
                </div>
            </div>
        </div>
    `;

    const stats = { A: { spike: 0, block: 0, ace: 0, error: 0, total: 0, players: {} }, B: { spike: 0, block: 0, ace: 0, error: 0, total: 0, players: {} } };

    m.setHistory.forEach(set => {
        set.log.forEach(action => {
            if (action.type !== 'point') return;
            const actingTeam = action.team; 
            const pattern = action.pattern || 'unknown';
            const pId = action.playerId;

            if (stats[actingTeam]) {
                if (pattern !== 'unknown') {
                    stats[actingTeam][pattern]++;
                    if (pattern !== 'error') stats[actingTeam].total++;
                }
                if (pId) {
                    if (!stats[actingTeam].players[pId]) stats[actingTeam].players[pId] = { spike: 0, block: 0, ace: 0, error: 0 };
                    if (pattern !== 'unknown') stats[actingTeam].players[pId][pattern]++;
                }
            }
        });
    });

    teamStats.innerHTML = '';
    [
        { id: 'spike', label: 'スパイク得点', icon: 'swords' },
        { id: 'block', label: 'ブロック得点', icon: 'shield' },
        { id: 'ace', label: 'サービスエース', icon: 'zap' },
        { id: 'error', label: '相手のミス', icon: 'x-circle' }
    ].forEach(cat => {
        let valA = (cat.id === 'error') ? stats.B.error : stats.A[cat.id];
        let valB = (cat.id === 'error') ? stats.A.error : stats.B[cat.id];
        const max = Math.max(valA + valB, 1);
        teamStats.innerHTML += `
            <div class="space-y-2">
                <div class="flex justify-between text-[10px] font-bold text-zinc-500 uppercase">
                    <span class="flex items-center gap-1"><i data-lucide="${cat.icon}" class="w-3 h-3"></i> ${cat.label}</span>
                    <div class="flex gap-4"><span style="color: ${m.colorA}">${valA}</span><span style="color: ${m.colorB}">${valB}</span></div>
                </div>
                <div class="h-2 w-full bg-zinc-800 rounded-full flex overflow-hidden">
                    <div class="h-full transition-all duration-1000" style="width: ${(valA/max)*100}%; background: ${m.colorA}; opacity: 0.8"></div>
                    <div class="h-full transition-all duration-1000" style="width: ${(valB/max)*100}%; background: ${m.colorB}; opacity: 0.8; margin-left: auto"></div>
                </div>
            </div>
        `;
    });

    playerStats.innerHTML = '';
    ['A', 'B'].forEach(t => {
        const teamName = t === 'A' ? m.teamA : m.teamB;
        const color = t === 'A' ? m.colorA : m.colorB;
        const pData = stats[t].players;
        const sortedIds = Object.keys(pData).sort((a,b) => (pData[b].spike + pData[b].block + pData[b].ace) - (pData[a].spike + pData[a].block + pData[a].ace));
        const container = document.createElement('div');
        container.className = "bg-zinc-900/30 p-4 rounded-xl border border-white/5";
        container.innerHTML = `<h4 class="text-[11px] font-black mb-4 border-b border-zinc-800 pb-2 uppercase tracking-widest" style="color: ${color}">${teamName}</h4>`;
        if (sortedIds.length === 0) container.innerHTML += `<div class="text-[10px] text-zinc-600 italic">データなし</div>`;
        else {
            const table = document.createElement('div');
            table.className = "space-y-3";
            sortedIds.forEach(pId => {
                const p = pData[pId];
                const total = p.spike + p.block + p.ace;
                const members = t === 'A' ? (m.membersA || []) : (m.membersB || []);
                const player = members.find(mem => mem.id === pId);
                const displayNum = player ? player.number : pId.replace(/[AB]/, '');
                const displayName = player ? (player.name === String(player.number) ? '' : player.name.substring(0,6)) : '';
                table.innerHTML += `
                    <div class="group flex flex-col gap-1 p-2 hover:bg-white/5 rounded-xl transition-all cursor-pointer border border-transparent hover:border-white/5" onclick="const d = this.querySelector('.player-detail'); d.classList.toggle('hidden'); if(typeof lucide!=='undefined')lucide.createIcons();">
                        <div class="flex items-center gap-3">
                            <div class="w-9 h-9 rounded-lg bg-zinc-800 flex flex-col items-center justify-center text-[11px] font-black text-zinc-400 border border-white/5 shadow-inner">
                                <span class="leading-none text-white">${displayNum}</span>
                                ${displayName ? `<span class="text-[7px] opacity-60 truncate w-full text-center px-0.5">${displayName}</span>` : ''}
                            </div>
                            <div class="flex-1">
                                <div class="flex justify-between text-[9px] mb-1 font-black uppercase tracking-tighter"><span class="text-zinc-300">Total: ${total}</span><span class="text-red-500/70">Err: ${p.error}</span></div>
                                <div class="flex h-1.5 rounded-full overflow-hidden bg-zinc-800">
                                    <div style="width: ${(p.spike/Math.max(total,1))*100}%; background: #10b981"></div>
                                    <div style="width: ${(p.block/Math.max(total,1))*100}%; background: #3b82f6"></div>
                                    <div style="width: ${(p.ace/Math.max(total,1))*100}%; background: #eab308"></div>
                                </div>
                            </div>
                        </div>
                        <div class="player-detail hidden pl-12 pr-2 py-3 grid grid-cols-4 gap-2 text-[9px] font-black border-t border-white/5 mt-2 bg-black/20 rounded-b-lg">
                            <div class="flex flex-col"><span class="text-zinc-600 text-[6px] uppercase tracking-tighter mb-1">Spike</span><span class="text-emerald-400 text-xs">${p.spike}</span></div>
                            <div class="flex flex-col"><span class="text-zinc-600 text-[6px] uppercase tracking-tighter mb-1">Block</span><span class="text-blue-400 text-xs">${p.block}</span></div>
                            <div class="flex flex-col"><span class="text-zinc-600 text-[6px] uppercase tracking-tighter mb-1">Ace</span><span class="text-yellow-400 text-xs">${p.ace}</span></div>
                            <div class="flex flex-col"><span class="text-zinc-600 text-[6px] uppercase tracking-tighter mb-1">Error</span><span class="text-red-400 text-xs">${p.error}</span></div>
                        </div>
                    </div>
                `;
            });
            container.appendChild(table);
        }
        playerStats.appendChild(container);
    });
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

async function clearAllHistory() {
    const confirmed = await showCustomConfirm("すべての試合履歴を削除しますか？\n(この操作は取り消せません)");
    if (!confirmed) return;
    
    localStorage.removeItem(HISTORY_KEY);
    renderHistory();
    showToast("すべての試合履歴を削除しました");
}

async function deleteHistoryItem(idx) {
    const confirmed = await showCustomConfirm("この試合履歴を削除しますか？\n(この操作は取り消せません)");
    if (!confirmed) return;
    
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    history.splice(idx, 1);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    renderHistory();
    showToast("試合履歴を削除しました");
}

