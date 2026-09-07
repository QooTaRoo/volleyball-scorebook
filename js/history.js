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
                val: scTeam === 'A' ? aScore : bScore,
                action: action
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

    let htmlA = `<div class="flex items-center h-10 overflow-visible" style="min-width: max-content;">`;
    let htmlB = `<div class="flex items-center h-10 mt-1.5 overflow-visible" style="min-width: max-content;">`;

    columns.forEach(col => {
        if (col.type === 'point') {
            const actIdx = state.actionLog.indexOf(col.action);
            const isClickable = !state.matchComplete && actIdx >= 0;
            const cursorClass = isClickable ? 'cursor-pointer hover:scale-110 active:scale-95 transition-transform' : '';
            const onclickAttr = isClickable ? `onclick="event.stopPropagation(); openEditActionModal(this);" data-action-idx="${actIdx}"` : '';

            if (col.team === 'A') {
                htmlA += `<div ${onclickAttr} class="w-7 h-7 flex items-center justify-center mx-0.5 rounded color-box text-sm font-bold shadow-sm shrink-0 leading-none ${cursorClass}" style="background: ${colorA}; color: #000;">${col.val}</div>`;
                htmlB += `<div class="w-7 h-7 mx-0.5 shrink-0"></div>`;
            } else {
                htmlA += `<div class="w-7 h-7 mx-0.5 shrink-0"></div>`;
                htmlB += `<div ${onclickAttr} class="w-7 h-7 flex items-center justify-center mx-0.5 rounded color-box text-sm font-bold shadow-sm shrink-0 leading-none ${cursorClass}" style="background: ${colorB}; color: #000;">${col.val}</div>`;
            }
        } else if (col.type === 'timeout') {
            if (col.team === 'A') {
                htmlA += `<div class="w-7 h-7 flex items-center justify-center mx-0.5 color-box t-box text-[10px] font-black italic rounded shrink-0 leading-none" style="background: ${colorA}; border: 1.5px solid #000; color: #000;">T${col.val}</div>`;
                htmlB += `<div class="w-7 h-7 mx-0.5 shrink-0"></div>`;
            } else {
                htmlA += `<div class="w-7 h-7 mx-0.5 shrink-0"></div>`;
                htmlB += `<div class="w-7 h-7 flex items-center justify-center mx-0.5 color-box t-box text-[10px] font-black italic rounded shrink-0 leading-none" style="background: ${colorB}; border: 1.5px solid #000; color: #000;">T${col.val}</div>`;
            }
        }
    });

    htmlA += `</div>`;
    htmlB += `</div>`;

    container.innerHTML = `
        <div class="flex items-start">
            <div class="shrink-0 flex flex-col mr-3 z-10 select-none">
                <div class="w-12 h-10 flex items-center justify-center font-black text-xl rounded color-box shadow-lg border border-white/10 shrink-0 leading-none" style="background: ${colorA}; color: #000;">${finalA}</div>
                <div class="w-12 h-10 flex items-center justify-center font-black text-xl rounded color-box shadow-lg border border-white/10 shrink-0 leading-none mt-1.5" style="background: ${colorB}; color: #000;">${finalB}</div>
            </div>
            <div class="flex-1 min-w-0 overflow-x-auto pb-4 timeline-container overflow-y-visible">
                ${htmlA}
                ${htmlB}
            </div>
        </div>
    `;
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
    header.className = "flex items-center justify-between gap-4 mb-6 text-xl font-bold bg-[#1a1a1a] sticky top-0 py-3 z-10 border-b border-zinc-800 px-2 overflow-visible";
    header.innerHTML = `
        <div class="flex-1 text-left min-w-0 overflow-visible">
            <span class="text-lg font-black leading-snug break-words" style="color: ${state.colorA}">${state.teamA}</span>
        </div>
        <div class="flex items-center gap-3 shrink-0 overflow-visible">
            <span class="bg-zinc-800 px-3.5 py-1 rounded-xl text-2xl font-black text-white shadow-inner leading-normal">${state.setsA}</span>
            <span class="text-zinc-400 font-bold text-xs italic">vs</span>
            <span class="bg-zinc-800 px-3.5 py-1 rounded-xl text-2xl font-black text-white shadow-inner leading-normal">${state.setsB}</span>
        </div>
        <div class="flex-1 text-right min-w-0 overflow-visible">
            <span class="text-lg font-black leading-snug break-words" style="color: ${state.colorB}">${state.teamB}</span>
        </div>
    `;
    content.appendChild(header);

    allSets.forEach(setData => {
        const isCurrent = setData.set === state.currentSet && !state.matchComplete;
        const sh = document.createElement('div');
        sh.className = "text-xs font-bold text-zinc-400 uppercase tracking-wider mt-4 flex items-center gap-2";
        sh.innerHTML = `<span class="w-1.5 h-1.5 bg-zinc-500 rounded-full"></span> 第${setData.set}セット`;
        content.appendChild(sh);
        content.appendChild(renderTimeline(setData.log, state.teamA, state.teamB, state.colorA, state.colorB, isCurrent ? state.scoreA : setData.scoreA, isCurrent ? state.scoreB : setData.scoreB, isCurrent));
    });

    toggleTimeline();
}

let collapsedDateGroups = new Set();

function getGroupKeyAndDisplayName(dateStr) {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
        const y = d.getFullYear();
        const m = d.getMonth() + 1;
        const date = d.getDate();
        const days = ['日', '月', '火', '水', '木', '金', '土'];
        const dayOfWeek = days[d.getDay()];
        const key = `${y}-${String(m).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
        const display = `${y}年${m}月${date}日(${dayOfWeek})`;
        return { key, display };
    }
    const match = dateStr.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (match) {
        const y = match[1];
        const m = parseInt(match[2]);
        const date = parseInt(match[3]);
        const testD = new Date(y, m - 1, date);
        if (!isNaN(testD.getTime())) {
            const days = ['日', '月', '火', '水', '木', '金', '土'];
            const dayOfWeek = days[testD.getDay()];
            const key = `${y}-${String(m).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
            const display = `${y}年${m}月${date}日(${dayOfWeek})`;
            return { key, display };
        }
        const key = `${y}-${String(m).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
        const display = `${y}年${m}月${date}日`;
        return { key, display };
    }
    const fallbackKey = dateStr.split(' ')[0] || dateStr;
    return { key: fallbackKey, display: fallbackKey };
}

function toggleDateGroup(dateKey) {
    if (collapsedDateGroups.has(dateKey)) {
        collapsedDateGroups.delete(dateKey);
    } else {
        collapsedDateGroups.add(dateKey);
    }
    const container = document.getElementById(`date-group-content-${dateKey}`);
    const caret = document.getElementById(`date-group-caret-${dateKey}`);
    if (container && caret) {
        const isCollapsed = collapsedDateGroups.has(dateKey);
        if (isCollapsed) {
            container.classList.add('hidden');
            caret.classList.add('-rotate-90');
        } else {
            container.classList.remove('hidden');
            caret.classList.remove('-rotate-90');
        }
    }
}

function renderHistory() {
    const list = document.getElementById('history-list');
    list.innerHTML = "";
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');

    if (history.length === 0) {
        list.innerHTML = "<div class='text-zinc-450 py-10 text-center text-sm font-medium'>試合履歴がありません。</div>";
        return;
    }

    const groups = {};
    history.forEach((m, idx) => {
        const { key, display } = getGroupKeyAndDisplayName(m.date);
        if (!groups[key]) {
            groups[key] = {
                display: display,
                matches: []
            };
        }
        groups[key].matches.push({ match: m, originalIndex: idx });
    });

    const sortedKeys = Object.keys(groups).sort((a, b) => b.localeCompare(a));

    sortedKeys.forEach(dateKey => {
        const group = groups[dateKey];
        const isCollapsed = collapsedDateGroups.has(dateKey);
        
        const groupEl = document.createElement('div');
        groupEl.className = "mb-6 date-group";
        
        // Header
        const headerEl = document.createElement('button');
        headerEl.className = "w-full flex items-center justify-between bg-zinc-900/80 border border-zinc-800/80 hover:bg-zinc-850 px-4 py-3 rounded-2xl transition-all duration-200 select-none shadow-lg mb-3";
        headerEl.onclick = () => toggleDateGroup(dateKey);
        
        const badgeText = `${group.matches.length}試合`;
        const caretClass = isCollapsed ? "-rotate-90" : "";
        
        headerEl.innerHTML = `
            <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-xl bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20 text-yellow-500 shadow-inner">
                    <i data-lucide="calendar" class="w-4 h-4"></i>
                </div>
                <span class="text-sm font-black text-zinc-200 tracking-wide">${group.display}</span>
                <span class="text-xs bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-2 py-0.5 rounded-lg font-bold tracking-wide shadow-inner">${badgeText}</span>
            </div>
            <i data-lucide="chevron-down" id="date-group-caret-${dateKey}" class="w-4 h-4 text-zinc-400 transition-transform duration-300 transform ${caretClass}"></i>
        `;
        groupEl.appendChild(headerEl);
        
        // Content container
        const contentEl = document.createElement('div');
        contentEl.id = `date-group-content-${dateKey}`;
        contentEl.className = `space-y-4 pl-1 border-l border-zinc-800/40 transition-all ${isCollapsed ? 'hidden' : ''}`;
        
        group.matches.forEach(({ match: m, originalIndex: idx }) => {
            const item = document.createElement('div');
            item.className = "bg-zinc-900/60 border border-zinc-800/60 p-4 rounded-2xl shadow-xl hover:border-zinc-700/60 transition-all text-left";
            item.id = `history-item-${idx}`;
            
            const cA = m.colorA || '#eab308';
            const cB = m.colorB || '#ffffff';
            
            let timeStr = "";
            const timeParts = m.date.split(' ');
            if (timeParts.length > 1) {
                const t = timeParts[1].split(':');
                if (t.length >= 2) {
                    timeStr = `${t[0]}:${t[1]}`;
                } else {
                    timeStr = timeParts[1];
                }
            } else {
                const matchTime = m.date.match(/(\d{1,2}):(\d{2})/);
                if (matchTime) {
                    timeStr = matchTime[0];
                }
            }
            
            item.innerHTML = `
                <div class="flex justify-between items-center text-xs text-zinc-400 font-bold mb-3 uppercase tracking-wide">
                    <span class="flex items-center gap-1.5">
                        <i data-lucide="clock" class="w-3.5 h-3.5 text-zinc-400"></i> ${timeStr ? timeStr + ' - ' : ''}${m.durationMinutes || 0}分
                    </span>
                    <div class="flex items-center gap-3">
                        <span class="flex items-center gap-1.5"><i data-lucide="layers" class="w-3.5 h-3.5 text-zinc-400"></i> ${m.maxSets}セット</span>
                        <button onclick="deleteHistoryItem(${idx})" class="text-zinc-400 hover:text-red-400 transition-colors p-1" title="履歴を削除" data-html2canvas-ignore>
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>
                <div class="flex justify-between items-center mb-5 px-3 overflow-visible">
                    <div class="flex-1 flex flex-col items-start min-w-0 overflow-visible">
                        <div class="text-lg font-black leading-snug break-words max-w-full" style="color: ${cA}">${m.teamA}</div>
                        <div class="text-3xl font-black text-white leading-normal pt-1 pb-1">${m.setsA}</div>
                    </div>
                    <div class="px-4 text-xs font-bold text-zinc-500 italic shrink-0">VS</div>
                    <div class="flex-1 flex flex-col items-end min-w-0 text-right overflow-visible">
                        <div class="text-lg font-black leading-snug break-words max-w-full" style="color: ${cB}">${m.teamB}</div>
                        <div class="text-3xl font-black text-white leading-normal pt-1 pb-1">${m.setsB}</div>
                    </div>
                </div>
                <div id="history-timeline-${idx}" class="hidden mt-4 border-t border-zinc-800/85 pt-4 bg-[#1a1a1a] px-3 pb-6 rounded-xl text-left overflow-visible"></div>
                <div class="flex gap-2 mt-2" data-html2canvas-ignore>
                    <button onclick="toggleHistoryTimeline(${idx})" class="flex-1 bg-zinc-800/80 hover:bg-zinc-700 py-2.5 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 border border-white/5 text-zinc-200">
                        <i data-lucide="activity" class="w-3.5 h-3.5"></i> 詳細
                    </button>
                    <button onclick="openAnalysis(${idx})" class="flex-1 bg-zinc-800/80 hover:bg-zinc-700 py-2.5 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 border border-white/5 text-zinc-200">
                        <i data-lucide="trending-up" class="w-3.5 h-3.5"></i> 分析
                    </button>
                    <button onclick="shareHistoryItemViaQR(${idx})" class="bg-yellow-500 hover:bg-yellow-400 text-black px-3 py-2 text-xs font-black rounded-lg flex items-center gap-1.5 shadow-md transition-transform active:scale-95" title="QRコードで共有">
                        <i data-lucide="qr-code" class="w-3.5 h-3.5"></i> QR共有
                    </button>
                    <button onclick="shareContainerAsImage('history-item-${idx}', 'history.png')" id="share-btn-${idx}" class="hidden bg-blue-600 hover:bg-blue-500 px-3 py-2 text-xs font-bold rounded-lg flex items-center gap-1.5 text-white shadow-md" title="画像で共有">
                        <i data-lucide="share-2" class="w-3.5 h-3.5"></i> 画像
                    </button>
                </div>
            `;
            
            contentEl.appendChild(item);
            
            const tlContainer = item.querySelector(`#history-timeline-${idx}`);
            m.setHistory.forEach(setData => {
                const h = document.createElement('div');
                h.className = "text-xs font-bold text-zinc-400 mt-3 mb-1 uppercase tracking-wider";
                h.textContent = `SET ${setData.set}`;
                tlContainer.appendChild(h);
                tlContainer.appendChild(renderTimeline(setData.log, m.teamA, m.teamB, cA, cB, setData.scoreA, setData.scoreB, false));
            });
        });
        
        groupEl.appendChild(contentEl);
        list.appendChild(groupEl);
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
        const statusColor = isLastSet ? 'text-emerald-500 font-bold' : 'text-zinc-400';
        return `
            <div class="flex items-center justify-center gap-3 w-full">
                <span class="text-xs text-zinc-400 font-black w-10 text-right tracking-wider">SET ${s.set}</span>
                <div class="flex items-center justify-center gap-2 px-4 py-1.5 rounded-xl ${isLastSet ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-zinc-800/50 text-zinc-200 border border-white/5'} text-base sm:text-lg font-black min-w-[90px] shadow-inner">
                    <span>${s.scoreA}</span><span class="text-zinc-400 px-0.5">-</span><span>${s.scoreB}</span>
                </div>
                <div class="w-10 italic text-xs ${statusColor} tracking-widest">${statusText}</div>
            </div>
        `;
    }).join('');

    header.innerHTML = `
        <div class="bg-zinc-900/50 p-6 rounded-3xl border border-zinc-850 shadow-2xl overflow-hidden relative">
            <div class="flex items-stretch justify-between gap-2">
                <div class="flex-1 flex flex-col items-center justify-center py-2">
                    <div class="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">Sets</div>
                    <div class="text-6xl font-black mb-2" style="color: ${m.colorA}">${m.setsA}</div>
                    <div class="text-sm font-bold text-center px-1" style="color: ${m.colorA}">${m.teamA}</div>
                </div>
                <div class="flex-[1.2] flex flex-col items-center justify-center gap-2 border-x border-zinc-850 px-2">${setScoresHtml}</div>
                <div class="flex-1 flex flex-col items-center justify-center py-2">
                    <div class="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">Sets</div>
                    <div class="text-6xl font-black mb-2" style="color: ${m.colorB}">${m.setsB}</div>
                    <div class="text-sm font-bold text-center px-1" style="color: ${m.colorB}">${m.teamB}</div>
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
                <div class="flex justify-between text-xs sm:text-sm font-bold text-zinc-300 uppercase">
                    <span class="flex items-center gap-1.5"><i data-lucide="${cat.icon}" class="w-4 h-4 text-zinc-400"></i> ${cat.label}</span>
                    <div class="flex gap-4 font-black"><span style="color: ${m.colorA}">${valA}</span><span style="color: ${m.colorB}">${valB}</span></div>
                </div>
                <div class="h-2.5 w-full bg-zinc-800/80 border border-white/5 rounded-full flex overflow-hidden">
                    <div class="h-full transition-all duration-1000" style="width: ${(valA/max)*100}%; background: ${m.colorA}; opacity: 0.9"></div>
                    <div class="h-full transition-all duration-1000" style="width: ${(valB/max)*100}%; background: ${m.colorB}; opacity: 0.9; margin-left: auto"></div>
                </div>
            </div>
        `;
    });

    // Render Rotation Stats
    const rotData = analyzeRotations(m);
    const rotStatsEl = document.getElementById('analysis-rotation-stats');
    if (rotStatsEl) {
        rotStatsEl.innerHTML = '';
        
        ['A', 'B'].forEach(t => {
            const teamName = t === 'A' ? m.teamA : m.teamB;
            const color = t === 'A' ? m.colorA : m.colorB;
            const stats = t === 'A' ? rotData.statsA : rotData.statsB;
            const starters = t === 'A' ? rotData.startingPlayersA : rotData.startingPlayersB;
            const members = t === 'A' ? (m.membersA || []) : (m.membersB || []);
            
            const container = document.createElement('div');
            container.className = "bg-zinc-900/30 p-4 rounded-xl border border-white/5 shadow-md";
            container.innerHTML = `<h4 class="text-sm font-bold mb-4 border-b border-zinc-800 pb-2 uppercase tracking-wide" style="color: ${color}">${teamName}</h4>`;
            
            const list = document.createElement('div');
            list.className = "space-y-4";
            
            stats.forEach((s, idx) => {
                const starterId = starters[idx];
                const player = members.find(mem => mem.id === starterId);
                const displayNum = player ? player.number : (idx + 1);
                const label = `ローテ ${idx + 1} (#${displayNum})`;
                
                const soRate = s.receiveRallies > 0 ? Math.round((s.sideoutPoints / s.receiveRallies) * 100) : 0;
                const brRate = s.serveRallies > 0 ? Math.round((s.breakPoints / s.serveRallies) * 100) : 0;
                
                list.innerHTML += `
                    <div class="flex flex-col gap-1.5 border-b border-zinc-800/80 pb-3 last:border-0 last:pb-0">
                        <div class="flex justify-between text-[11px] sm:text-xs font-bold text-zinc-200">
                            <span class="flex items-center gap-1"><i data-lucide="rotate-cw" class="w-3 h-3 text-zinc-450"></i> ${label}</span>
                            <div class="flex gap-3">
                                <span class="text-emerald-400 font-black">SO: ${soRate}% <span class="text-[10px] text-zinc-400 font-medium">(${s.sideoutPoints}/${s.receiveRallies})</span></span>
                                <span class="text-blue-400 font-black">BR: ${brRate}% <span class="text-[10px] text-zinc-400 font-medium">(${s.breakPoints}/${s.serveRallies})</span></span>
                            </div>
                        </div>
                        <div class="grid grid-cols-2 gap-3 mt-1">
                            <div class="space-y-1">
                                <div class="flex justify-between text-[10px] text-zinc-400 font-bold uppercase tracking-tight"><span>サイドアウト (Receive)</span></div>
                                <div class="h-2 w-full bg-zinc-800/80 border border-white/5 rounded-full overflow-hidden flex">
                                    <div class="h-full bg-emerald-500 transition-all duration-1000" style="width: ${soRate}%; opacity: 0.9"></div>
                                </div>
                            </div>
                            <div class="space-y-1">
                                <div class="flex justify-between text-[10px] text-zinc-400 font-bold uppercase tracking-tight"><span>ブレイク (Serve)</span></div>
                                <div class="h-2 w-full bg-zinc-800/80 border border-white/5 rounded-full overflow-hidden flex">
                                    <div class="h-full bg-blue-500 transition-all duration-1000" style="width: ${brRate}%; opacity: 0.9"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            });
            
            container.appendChild(list);
            rotStatsEl.appendChild(container);
        });
    }

    playerStats.innerHTML = '';
    ['A', 'B'].forEach(t => {
        const teamName = t === 'A' ? m.teamA : m.teamB;
        const color = t === 'A' ? m.colorA : m.colorB;
        const pData = stats[t].players;
        const sortedIds = Object.keys(pData).sort((a,b) => (pData[b].spike + pData[b].block + pData[b].ace) - (pData[a].spike + pData[a].block + pData[a].ace));
        const container = document.createElement('div');
        container.className = "bg-zinc-900/30 p-4 rounded-xl border border-white/5 shadow-md";
        container.innerHTML = `<h4 class="text-sm font-bold mb-4 border-b border-zinc-800 pb-2 uppercase tracking-wide" style="color: ${color}">${teamName}</h4>`;
        if (sortedIds.length === 0) container.innerHTML += `<div class="text-xs text-zinc-500 italic">データなし</div>`;
        else {
            const table = document.createElement('div');
            table.className = "space-y-3";
            sortedIds.forEach(pId => {
                const p = pData[pId];
                const total = p.spike + p.block + p.ace;
                const members = t === 'A' ? (m.membersA || []) : (m.membersB || []);
                const player = members.find(mem => mem.id === pId);
                const displayNum = player ? player.number : pId.replace(/[AB]/, '');
                const displayName = player ? (player.name === String(player.number) ? '' : player.name.substring(0, 6)) : '';
                table.innerHTML += `
                    <div class="group flex flex-col gap-1.5 p-2 hover:bg-white/5 rounded-xl transition-all cursor-pointer border border-transparent hover:border-white/5" onclick="const d = this.querySelector('.player-detail'); d.classList.toggle('hidden'); if(typeof lucide!=='undefined')lucide.createIcons();">
                        <div class="flex items-center gap-3">
                            <div class="w-9 h-9 rounded-lg bg-zinc-800/80 flex flex-col items-center justify-center text-xs font-bold text-zinc-350 border border-zinc-700 shadow-inner">
                                <span class="leading-none text-white text-xs font-extrabold">${displayNum}</span>
                                ${displayName ? `<span class="text-[9px] opacity-90 text-zinc-300 font-medium truncate w-full text-center px-0.5">${displayName}</span>` : ''}
                            </div>
                            <div class="flex-1">
                                <div class="flex justify-between text-xs mb-1 font-bold uppercase tracking-tight"><span class="text-zinc-200">Total: ${total}</span><span class="text-red-400 font-bold">Err: ${p.error}</span></div>
                                <div class="flex h-2 rounded-full overflow-hidden bg-zinc-800/80">
                                    <div style="width: ${(p.spike/Math.max(total,1))*100}%; background: #10b981"></div>
                                    <div style="width: ${(p.block/Math.max(total,1))*100}%; background: #3b82f6"></div>
                                    <div style="width: ${(p.ace/Math.max(total,1))*100}%; background: #eab308"></div>
                                </div>
                            </div>
                        </div>
                        <div class="player-detail hidden pl-12 pr-2 py-3 grid grid-cols-4 gap-2 border border-white/5 mt-2 bg-zinc-950/80 rounded-lg">
                            <div class="flex flex-col"><span class="text-emerald-400/85 text-[10px] sm:text-xs uppercase tracking-wider mb-1 font-bold">Spike</span><span class="text-emerald-400 text-base sm:text-lg font-black">${p.spike}</span></div>
                            <div class="flex flex-col"><span class="text-blue-400/85 text-[10px] sm:text-xs uppercase tracking-wider mb-1 font-bold">Block</span><span class="text-blue-400 text-base sm:text-lg font-black">${p.block}</span></div>
                            <div class="flex flex-col"><span class="text-yellow-400/85 text-[10px] sm:text-xs uppercase tracking-wider mb-1 font-bold">Ace</span><span class="text-yellow-400 text-base sm:text-lg font-black">${p.ace}</span></div>
                            <div class="flex flex-col"><span class="text-red-400/85 text-[10px] sm:text-xs uppercase tracking-wider mb-1 font-bold">Error</span><span class="text-red-400 text-base sm:text-lg font-black">${p.error}</span></div>
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
    try {
        const confirmed = await showCustomConfirm("この試合履歴を削除しますか？\n(この操作は取り消せません)");
        if (!confirmed) return;
        
        const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
        const matchToDelete = history[idx];
        if (matchToDelete) {
            history.splice(idx, 1);
            localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
        }
        
        renderHistory();
        showToast("試合履歴を削除しました");
    } catch (err) {
        console.error("Error during deleteHistoryItem:", err);
        showToast("履歴の削除中にエラーが発生しました");
    }
}

function shareHistoryItemViaQR(idx) {
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    const match = history[idx];
    if (!match) {
        showCustomAlert("試合データが見つかりません。");
        return;
    }
    if (typeof shareMatchViaQR === 'function') {
        shareMatchViaQR(match, false);
    }
}

let currentEditingActionIdx = null;
let selectedEditTeam = 'A';

function openEditActionModal(element) {
    const idx = parseInt(element.getAttribute('data-action-idx'));
    if (isNaN(idx) || idx < 0 || idx >= state.actionLog.length) return;
    
    currentEditingActionIdx = idx;
    const action = state.actionLog[idx];
    
    const modal = document.getElementById('edit-action-modal');
    if (!modal) return;
    
    const btnA = document.getElementById('edit-action-team-a');
    const btnB = document.getElementById('edit-action-team-b');
    if (btnA && btnB) {
        btnA.textContent = state.teamA;
        btnB.textContent = state.teamB;
        btnA.style.borderColor = state.colorA;
        btnB.style.borderColor = state.colorB;
    }
    
    const scoringTeam = action.scoringTeam || (action.pattern === 'error' ? (action.team === 'A' ? 'B' : 'A') : action.team);
    setEditActionTeam(scoringTeam);
    
    const patternSel = document.getElementById('edit-action-pattern');
    if (patternSel) {
        patternSel.value = action.pattern || 'unknown';
    }
    
    populateEditActionPlayers(scoringTeam, action.pattern || 'unknown', action.playerId);
    applyMyTeamEditRestriction(scoringTeam, action.pattern || 'unknown');

    modal.classList.remove('hidden');
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function closeEditActionModal() {
    const modal = document.getElementById('edit-action-modal');
    if (modal) modal.classList.add('hidden');
    currentEditingActionIdx = null;
}

function setEditActionTeam(team) {
    selectedEditTeam = team;
    const btnA = document.getElementById('edit-action-team-a');
    const btnB = document.getElementById('edit-action-team-b');
    if (!btnA || !btnB) return;
    
    if (team === 'A') {
        btnA.className = "flex-1 py-2.5 rounded-lg font-bold transition-all text-xs text-center bg-zinc-700 text-white border-2 border-yellow-500 shadow-lg";
        btnB.className = "flex-1 py-2.5 rounded-lg font-bold transition-all text-xs text-center text-zinc-400 bg-zinc-800 border border-transparent";
    } else {
        btnB.className = "flex-1 py-2.5 rounded-lg font-bold transition-all text-xs text-center bg-zinc-700 text-white border-2 border-yellow-500 shadow-lg";
        btnA.className = "flex-1 py-2.5 rounded-lg font-bold transition-all text-xs text-center text-zinc-400 bg-zinc-800 border border-transparent";
    }
    
    const patternSel = document.getElementById('edit-action-pattern');
    const pattern = patternSel ? patternSel.value : 'unknown';
    populateEditActionPlayers(team, pattern, null);
    applyMyTeamEditRestriction(team, pattern);
}

function onEditPatternChange(pattern) {
    populateEditActionPlayers(selectedEditTeam, pattern, null);
    applyMyTeamEditRestriction(selectedEditTeam, pattern);
}

function applyMyTeamEditRestriction(scoringTeam, pattern) {
    const hasMyTeamInPlay = !!state.isMyTeamA || !!state.isMyTeamB;
    const actorTeam = (pattern === 'error') ? (scoringTeam === 'A' ? 'B' : 'A') : scoringTeam;
    const isActorMyTeam = (actorTeam === 'A' && state.isMyTeamA) || (actorTeam === 'B' && state.isMyTeamB);
    
    const playerContainer = document.getElementById('edit-action-player-container');
    if (!playerContainer) return;
    
    if (state.myTeamOnlyStats && hasMyTeamInPlay && !isActorMyTeam) {
        playerContainer.classList.add('hidden');
    } else {
        playerContainer.classList.remove('hidden');
    }
}

function populateEditActionPlayers(scoringTeam, pattern, selectedPlayerId) {
    const sel = document.getElementById('edit-action-player');
    if (!sel) return;
    sel.innerHTML = '<option value="">選手選択なし</option>';
    
    const teamToPick = (pattern === 'error') ? (scoringTeam === 'A' ? 'B' : 'A') : scoringTeam;
    const members = teamToPick === 'A' ? state.membersA : state.membersB;
    
    members.forEach(m => {
        const selectedAttr = m.id === selectedPlayerId ? 'selected' : '';
        const nameStr = m.name === String(m.number) ? `番号 ${m.number}` : `番号 ${m.number} - ${m.name}`;
        sel.innerHTML += `<option value="${m.id}" ${selectedAttr}>${nameStr}</option>`;
    });
}

function saveEditedAction() {
    if (currentEditingActionIdx === null) return;
    
    const action = state.actionLog[currentEditingActionIdx];
    const patternSel = document.getElementById('edit-action-pattern');
    const playerSel = document.getElementById('edit-action-player');
    
    const pattern = patternSel ? patternSel.value : 'unknown';
    const playerContainer = document.getElementById('edit-action-player-container');
    const playerId = (playerSel && playerContainer && !playerContainer.classList.contains('hidden')) ? (playerSel.value || null) : null;
    
    action.scoringTeam = selectedEditTeam;
    action.pattern = pattern;
    action.playerId = playerId;
    
    recalculateStateFromLog();
    
    closeEditActionModal();
    
    const timelineModal = document.getElementById('timeline-modal');
    if (timelineModal && !timelineModal.classList.contains('hidden')) {
        // Toggle timeline twice to refresh
        document.getElementById('timeline-modal').classList.add('hidden');
        showCurrentTimeline();
    }
    
    showToast("得点入力を修正し、再計算しました");
}

function recalculateStateFromLog() {
    const log = JSON.parse(JSON.stringify(state.actionLog));
    
    state.scoreA = 0;
    state.scoreB = 0;
    state.setsA = 0;
    state.setsB = 0;
    state.toA = 0;
    state.toB = 0;
    state.currentSet = 1;
    state.matchComplete = false;
    state.setHistory = [];
    state.rotationLog = [];
    state.isCourtSwapped = false;
    
    state.lineupA = state.membersA.filter(m => m.isStarter).map(m => m.id);
    if (state.lineupA.length !== 6) {
        state.lineupA = state.membersA.slice(0, 6).map(m => m.id);
    }
    state.lineupB = state.membersB.filter(m => m.isStarter).map(m => m.id);
    if (state.lineupB.length !== 6) {
        state.lineupB = state.membersB.slice(0, 6).map(m => m.id);
    }
    
    while (state.lineupA.length < 6) {
        const nextNum = state.lineupA.length + 1;
        const newId = `A${nextNum}`;
        if (!state.membersA.find(m => m.id === newId)) {
            state.membersA.push({ id: newId, number: nextNum, name: `${nextNum}` });
        }
        state.lineupA.push(newId);
    }
    while (state.lineupB.length < 6) {
        const nextNum = state.lineupB.length + 1;
        const newId = `B${nextNum}`;
        if (!state.membersB.find(m => m.id === newId)) {
            state.membersB.push({ id: newId, number: nextNum, name: `${nextNum}` });
        }
        state.lineupB.push(newId);
    }
    
    state.servingTeam = state.initialServingTeam || 'A';

    // 得点再計算時にも、レシーブスタート（相手サーブ）の場合にローテーションを1つ戻す自動調整を適用
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
    
    log.forEach(action => {
        if (action.type === 'point') {
            const scoringTeam = action.scoringTeam || (action.pattern === 'error' ? (action.team === 'A' ? 'B' : 'A') : action.team);
            const rotationOccurred = state.servingTeam !== scoringTeam;
            
            if (rotationOccurred) {
                state.servingTeam = scoringTeam;
                
                const lineup = scoringTeam === 'A' ? state.lineupA : state.lineupB;
                const first = lineup.shift();
                lineup.push(first);
                
                state.rotationLog.push({
                    set: state.currentSet,
                    team: scoringTeam,
                    lineup: [...lineup],
                    scoreA: state.scoreA,
                    scoreB: state.scoreB
                });
            }
            
            action.scoreA = state.scoreA;
            action.scoreB = state.scoreB;
            action.servingTeam = rotationOccurred ? (scoringTeam === 'A' ? 'B' : 'A') : state.servingTeam;
            action.rotationOccurred = rotationOccurred;
            action.team = (action.pattern === 'error') ? (scoringTeam === 'A' ? 'B' : 'A') : scoringTeam;
            action.scoringTeam = scoringTeam;
            action.set = state.currentSet;
            
            if (scoringTeam === 'A') state.scoreA++;
            else state.scoreB++;
            
        } else if (action.type === 'timeout') {
            action.scoreA = state.scoreA;
            action.scoreB = state.scoreB;
            action.set = state.currentSet;
            if (action.team === 'A') state.toA++;
            else state.toB++;
            
        } else if (action.type === 'swap_courts') {
            action.isCourtSwapped = state.isCourtSwapped;
            state.isCourtSwapped = !state.isCourtSwapped;
            action.set = state.currentSet;
            
        } else if (action.type === 'swap_players') {
            const lineup = action.team === 'A' ? state.lineupA : state.lineupB;
            const temp = lineup[action.idx1];
            lineup[action.idx1] = lineup[action.idx2];
            lineup[action.idx2] = temp;
            action.set = state.currentSet;
            
        } else if (action.type === 'substitution') {
            const lineup = action.team === 'A' ? state.lineupA : state.lineupB;
            lineup[action.posIdx] = action.inPlayerId;
            action.set = state.currentSet;
            
        } else if (action.type === 'manual_rotation') {
            const lineup = action.team === 'A' ? state.lineupA : state.lineupB;
            if (action.direction === 'forward') {
                const first = lineup.shift();
                lineup.push(first);
            } else {
                const last = lineup.pop();
                lineup.unshift(last);
            }
            action.set = state.currentSet;
            
        } else if (action.type === 'set_finish') {
            action.scoreA = state.scoreA;
            action.scoreB = state.scoreB;
            action.toA = state.toA;
            action.toB = state.toB;
            action.currentSet = state.currentSet;
            action.setsA = state.setsA;
            action.setsB = state.setsB;
            action.isCourtSwapped = state.isCourtSwapped;
            
            state.setHistory.push({
                set: state.currentSet,
                winner: action.winner,
                scoreA: state.scoreA,
                scoreB: state.scoreB,
                log: []
            });
            
            if (action.winner === 'A') state.setsA++;
            else state.setsB++;
            
            state.currentSet++;
            state.scoreA = 0;
            state.scoreB = 0;
            state.toA = 0;
            state.toB = 0;
            state.isCourtSwapped = !state.isCourtSwapped;
        }
    });
    
    state.actionLog = log;
    
    state.setHistory.forEach(s => {
        s.log = state.actionLog.filter(l => l.set === s.set);
    });
    
    const matchWinnerNeeded = Math.ceil(state.maxSets / 2);
    if (state.setsA === matchWinnerNeeded || state.setsB === matchWinnerNeeded) {
        state.matchComplete = true;
    } else if (state.maxSets === 2 && state.currentSet > 2) {
        state.matchComplete = true;
    }
    
    saveState();
    updateUI();
}

function analyzeRotations(m) {
    // 1. Determine the starting lineup of Team A and Team B for each set.
    // We will simulate the chronological flow of actions across the entire match to track lineups and rotations.
    
    // Initial lineups from members or fallback defaults (スターター星マークを考慮)
    let lineupA = (m.membersA || []).filter(mem => mem.isStarter).map(mem => mem.id);
    if (lineupA.length !== 6) lineupA = (m.membersA || []).slice(0, 6).map(mem => mem.id);
    
    let lineupB = (m.membersB || []).filter(mem => mem.isStarter).map(mem => mem.id);
    if (lineupB.length !== 6) lineupB = (m.membersB || []).slice(0, 6).map(mem => mem.id);
    
    while (lineupA.length < 6) lineupA.push(`A${lineupA.length + 1}`);
    while (lineupB.length < 6) lineupB.push(`B${lineupB.length + 1}`);
    
    // 第1セット開始時にレシーブスタート（相手サーブ）の場合にローテーションを1つ戻す自動調整
    const initialServing = m.initialServingTeam || 'A';
    if (initialServing === 'A') {
        if (lineupB.length === 6) {
            const last = lineupB.pop();
            lineupB.unshift(last);
        }
    } else {
        if (lineupA.length === 6) {
            const last = lineupA.pop();
            lineupA.unshift(last);
        }
    }
    
    // Starting lineup slots (1 to 6) representing the original positions of the starting lineup in each set.
    let slotsA = [1, 2, 3, 4, 5, 6];
    let slotsB = [1, 2, 3, 4, 5, 6];
    
    // Set 1 initial serve order mapping
    // We will save set-specific lineups at the start of each set
    const setStartLineups = {};
    setStartLineups[1] = {
        lineupA: [...lineupA],
        lineupB: [...lineupB],
        slotsA: [...slotsA],
        slotsB: [...slotsB],
        servingTeam: initialServing
    };
    
    let servingTeam = m.initialServingTeam || 'A';
    let currentSet = 1;
    
    // Flatten and sort all action logs chronologically across all sets
    const allActions = [];
    m.setHistory.forEach(s => {
        if (s.log) {
            s.log.forEach(action => {
                allActions.push({ ...action, set: s.set });
            });
        }
    });
    // Ensure chronological sorting
    allActions.sort((a, b) => a.timestamp - b.timestamp);
    
    // Replay all events to find the starting lineups and rotations for every set
    allActions.forEach(action => {
        if (action.set !== currentSet) {
            // Set boundary crossed
            currentSet = action.set;
            // Record starting lineup for this new set
            setStartLineups[currentSet] = {
                lineupA: [...lineupA],
                lineupB: [...lineupB],
                slotsA: [1, 2, 3, 4, 5, 6], // Reset starting slots for the new set!
                slotsB: [1, 2, 3, 4, 5, 6],
                servingTeam: servingTeam
            };
            slotsA = [1, 2, 3, 4, 5, 6];
            slotsB = [1, 2, 3, 4, 5, 6];
        }
        
        if (action.type === 'substitution') {
            const lineup = action.team === 'A' ? lineupA : lineupB;
            lineup[action.posIdx] = action.inPlayerId;
        } else if (action.type === 'manual_rotation') {
            const lineup = action.team === 'A' ? lineupA : lineupB;
            const slots = action.team === 'A' ? slotsA : slotsB;
            if (action.direction === 'forward') {
                const first = lineup.shift();
                lineup.push(first);
                const firstSlot = slots.shift();
                slots.push(firstSlot);
            } else {
                const last = lineup.pop();
                lineup.unshift(last);
                const lastSlot = slots.pop();
                slots.unshift(lastSlot);
            }
        } else if (action.type === 'swap_players') {
            const lineup = action.team === 'A' ? lineupA : lineupB;
            const slots = action.team === 'A' ? slotsA : slotsB;
            
            const tempPlayer = lineup[action.idx1];
            lineup[action.idx1] = lineup[action.idx2];
            lineup[action.idx2] = tempPlayer;
            
            const tempSlot = slots[action.idx1];
            slots[action.idx1] = slots[action.idx2];
            slots[action.idx2] = tempSlot;
        } else if (action.type === 'point') {
            const scoringTeam = action.scoringTeam || (action.pattern === 'error' ? (action.team === 'A' ? 'B' : 'A') : action.team);
            const rotationOccurred = servingTeam !== scoringTeam;
            if (rotationOccurred) {
                servingTeam = scoringTeam;
                if (scoringTeam === 'A') {
                    const first = lineupA.shift();
                    lineupA.push(first);
                    const firstSlot = slotsA.shift();
                    slotsA.push(firstSlot);
                } else {
                    const first = lineupB.shift();
                    lineupB.push(first);
                    const firstSlot = slotsB.shift();
                    slotsB.push(firstSlot);
                }
            }
        }
    });
    
    // Now that we have the starting lineup and serving team for each set, we can simulate each set INDEPENDENTLY
    // to calculate the exact Side-out and Break stats!
    
    const rotationStatsA = Array.from({length: 6}, () => ({ serveRallies: 0, breakPoints: 0, receiveRallies: 0, sideoutPoints: 0 }));
    const rotationStatsB = Array.from({length: 6}, () => ({ serveRallies: 0, breakPoints: 0, receiveRallies: 0, sideoutPoints: 0 }));
    
    m.setHistory.forEach(s => {
        const start = setStartLineups[s.set];
        if (!start) return;
        
        let localLineupA = [...start.lineupA];
        let localLineupB = [...start.lineupB];
        let localSlotsA = [...start.slotsA];
        let localSlotsB = [...start.slotsB];
        let localServingTeam = start.servingTeam;
        
        // Find first point to sync servingTeam if initial serve was ambiguous
        const firstPoint = (s.log || []).find(a => a.type === 'point');
        if (firstPoint) {
            localServingTeam = firstPoint.rotationOccurred ? (firstPoint.scoringTeam === 'A' ? 'B' : 'A') : firstPoint.servingTeam;
        }
        
        const setLog = s.log || [];
        setLog.forEach(action => {
            if (action.type === 'substitution') {
                const lineup = action.team === 'A' ? localLineupA : localLineupB;
                lineup[action.posIdx] = action.inPlayerId;
            } else if (action.type === 'manual_rotation') {
                const lineup = action.team === 'A' ? localLineupA : localLineupB;
                const slots = action.team === 'A' ? localSlotsA : localSlotsB;
                if (action.direction === 'forward') {
                    const first = lineup.shift();
                    lineup.push(first);
                    const firstSlot = slots.shift();
                    slots.push(firstSlot);
                } else {
                    const last = lineup.pop();
                    lineup.unshift(last);
                    const lastSlot = slots.pop();
                    slots.unshift(lastSlot);
                }
            } else if (action.type === 'swap_players') {
                const lineup = action.team === 'A' ? localLineupA : localLineupB;
                const slots = action.team === 'A' ? localSlotsA : localSlotsB;
                
                const tempPlayer = lineup[action.idx1];
                lineup[action.idx1] = lineup[action.idx2];
                lineup[action.idx2] = tempPlayer;
                
                const tempSlot = slots[action.idx1];
                slots[action.idx1] = slots[action.idx2];
                slots[action.idx2] = tempSlot;
            } else if (action.type === 'point') {
                const scoringTeam = action.scoringTeam || (action.pattern === 'error' ? (action.team === 'A' ? 'B' : 'A') : action.team);
                const server = localServingTeam;
                const slotA = localSlotsA[0];
                const slotB = localSlotsB[0];
                
                // Record stats using current server and slot positions at the start of the rally
                if (server === 'A') {
                    // Team A served
                    rotationStatsA[slotA - 1].serveRallies++;
                    rotationStatsB[slotB - 1].receiveRallies++;
                    
                    if (scoringTeam === 'A') {
                        rotationStatsA[slotA - 1].breakPoints++;
                    } else {
                        rotationStatsB[slotB - 1].sideoutPoints++;
                    }
                } else {
                    // Team B served
                    rotationStatsB[slotB - 1].serveRallies++;
                    rotationStatsA[slotA - 1].receiveRallies++;
                    
                    if (scoringTeam === 'B') {
                        rotationStatsB[slotB - 1].breakPoints++;
                    } else {
                        rotationStatsA[slotA - 1].sideoutPoints++;
                    }
                }
                
                // Rotate and update server AFTER the point is recorded
                const rotationOccurred = server !== scoringTeam;
                if (rotationOccurred) {
                    localServingTeam = scoringTeam;
                    if (scoringTeam === 'A') {
                        const first = localLineupA.shift();
                        localLineupA.push(first);
                        const firstSlot = localSlotsA.shift();
                        localSlotsA.push(firstSlot);
                    } else {
                        const first = localLineupB.shift();
                        localLineupB.push(first);
                        const firstSlot = localSlotsB.shift();
                        localSlotsB.push(firstSlot);
                    }
                }
            }
        });
    });
    
    // Resolve the player identity of each starting slot (from members)
    const startingPlayersA = (m.membersA || []).slice(0, 6);
    const startingPlayersB = (m.membersB || []).slice(0, 6);
    
    return {
        statsA: rotationStatsA,
        statsB: rotationStatsB,
        startingPlayersA,
        startingPlayersB
    };
}

