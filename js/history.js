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
            const isOpp = typeof isOpponentActionPattern === 'function' ? isOpponentActionPattern(action.pattern) : (action.pattern === 'error');
            const scTeam = action.scoringTeam || (isOpp ? (action.team === 'A' ? 'B' : 'A') : action.team);
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
            const isClickable = actIdx >= 0;
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
    header.className = "flex items-center justify-between gap-4 mb-6 text-xl font-bold bg-[#1a1a1a] sticky top-0 py-3 z-30 border-b border-zinc-800 px-2 overflow-visible";
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

    const hint = document.createElement('div');
    hint.className = "text-[11px] text-zinc-400 bg-zinc-900/80 px-3 py-2 rounded-xl border border-white/5 mb-4 flex items-center gap-2";
    hint.innerHTML = `<i data-lucide="info" class="w-4 h-4 text-yellow-500 shrink-0"></i><span>各得点マス（数字）をタップすると、得点原因や選手を編集できます</span>`;
    content.appendChild(hint);

    allSets.forEach(setData => {
        const isCurrent = setData.set === state.currentSet && !state.matchComplete;
        const sh = document.createElement('div');
        sh.className = "text-xs font-bold text-zinc-400 uppercase tracking-wider mt-4 flex items-center gap-2";
        sh.innerHTML = `<span class="w-1.5 h-1.5 bg-zinc-500 rounded-full"></span> 第${setData.set}セット`;
        content.appendChild(sh);
        content.appendChild(renderTimeline(setData.log, state.teamA, state.teamB, state.colorA, state.colorB, isCurrent ? state.scoreA : setData.scoreA, isCurrent ? state.scoreB : setData.scoreB, isCurrent));
    });

    toggleTimeline();
    if (typeof lucide !== 'undefined') lucide.createIcons();
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
                <div class="flex gap-1.5 sm:gap-2 mt-2" data-html2canvas-ignore>
                    <button onclick="toggleHistoryTimeline(${idx})" class="flex-1 bg-zinc-800/80 hover:bg-zinc-700 py-2.5 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1 border border-white/5 text-zinc-200">
                        <i data-lucide="activity" class="w-3.5 h-3.5"></i> 詳細
                    </button>
                    <button onclick="openAnalysis(${idx})" class="flex-1 bg-zinc-800/80 hover:bg-zinc-700 py-2.5 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1 border border-white/5 text-zinc-200">
                        <i data-lucide="trending-up" class="w-3.5 h-3.5"></i> 分析
                    </button>
                    <button onclick="editMatchFromHistory(${idx})" class="flex-1 bg-zinc-800/80 hover:bg-zinc-700 py-2.5 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1 border border-white/5 text-zinc-200" title="この試合のスコアを編集">
                        <i data-lucide="edit-3" class="w-3.5 h-3.5 text-yellow-400"></i> 編集
                    </button>
                    <button onclick="shareHistoryItemViaQR(${idx})" class="bg-yellow-500 hover:bg-yellow-400 text-black px-2.5 py-2 text-xs font-black rounded-lg flex items-center gap-1 shadow-md transition-transform active:scale-95" title="QRコードで共有">
                        <i data-lucide="qr-code" class="w-3.5 h-3.5"></i> QR
                    </button>
                    <button onclick="shareContainerAsImage('history-item-${idx}', 'history.png')" id="share-btn-${idx}" class="hidden bg-blue-600 hover:bg-blue-500 px-2.5 py-2 text-xs font-bold rounded-lg flex items-center gap-1 text-white shadow-md" title="画像で共有">
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
    window.currentAnalysisMatch = m;
    const header = document.getElementById('analysis-header');
    const teamStats = document.getElementById('analysis-team-stats');
    const playerStats = document.getElementById('analysis-player-stats');

    const setScoresHtml = m.setHistory.map(s => {
        const isLastSet = m.isLiveMatch && s.set === state.currentSet;
        const statusBadge = isLastSet 
            ? `<span class="text-[10px] tracking-wider px-1.5 py-0.5 rounded border text-emerald-400 bg-emerald-500/10 border-emerald-500/25 font-bold animate-pulse">LIVE</span>` 
            : '';
        return `
            <div class="flex items-center justify-between px-3 py-1.5 sm:py-2 rounded-xl bg-zinc-950/50 border border-white/5 shadow-inner">
                <span class="text-xs text-zinc-400 font-black tracking-wider w-14">SET ${s.set}</span>
                <div class="flex items-center gap-2.5 font-black text-base sm:text-lg">
                    <span style="color: ${m.colorA}">${s.scoreA}</span>
                    <span class="text-zinc-600 font-bold">-</span>
                    <span style="color: ${m.colorB}">${s.scoreB}</span>
                </div>
                <div class="w-14 flex justify-end">
                    ${statusBadge}
                </div>
            </div>
        `;
    }).join('');

    header.innerHTML = `
        <div class="bg-zinc-900/60 p-4 sm:p-6 rounded-3xl border border-zinc-800 shadow-2xl overflow-hidden relative backdrop-blur-sm">
            <!-- Scoreboard Top Row -->
            <div class="flex items-center justify-between gap-3 mb-4">
                <!-- Team A -->
                <div class="flex-1 flex flex-col items-center text-center min-w-0">
                    <div class="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-0.5">Sets</div>
                    <div class="text-5xl sm:text-6xl font-black mb-1.5 drop-shadow leading-none" style="color: ${m.colorA}">${m.setsA}</div>
                    <div class="w-full text-xs sm:text-base font-black truncate px-1" style="color: ${m.colorA}" title="${m.teamA}">${m.teamA}</div>
                </div>

                <!-- Center VS -->
                <div class="shrink-0 flex flex-col items-center justify-center">
                    <span class="text-[10px] sm:text-xs font-black text-zinc-400 bg-zinc-800/80 border border-white/10 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full shadow-inner tracking-widest">VS</span>
                </div>

                <!-- Team B -->
                <div class="flex-1 flex flex-col items-center text-center min-w-0">
                    <div class="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-0.5">Sets</div>
                    <div class="text-5xl sm:text-6xl font-black mb-1.5 drop-shadow leading-none" style="color: ${m.colorB}">${m.setsB}</div>
                    <div class="w-full text-xs sm:text-base font-black truncate px-1" style="color: ${m.colorB}" title="${m.teamB}">${m.teamB}</div>
                </div>
            </div>

            <!-- Set breakdown -->
            <div class="border-t border-zinc-800/80 pt-3 space-y-1.5">
                ${setScoresHtml}
            </div>
        </div>
    `;

    const createEmptyStats = () => ({
        spike: 0, block: 0, ace: 0,
        attack_error: 0, blocked: 0, reception_error: 0, serve_error: 0, error: 0,
        total: 0, players: {}
    });
    const stats = { A: createEmptyStats(), B: createEmptyStats() };

    m.setHistory.forEach(set => {
        (set.log || []).forEach(action => {
            if (action.type !== 'point') return;
            const isOpp = typeof isOpponentActionPattern === 'function' ? isOpponentActionPattern(action.pattern) : (action.pattern === 'error');
            const scTeam = action.scoringTeam || (isOpp ? (action.team === 'A' ? 'B' : 'A') : action.team);
            const actingTeam = action.team || (isOpp ? (scTeam === 'A' ? 'B' : 'A') : scTeam); 
            const pattern = action.pattern || 'unknown';
            const pId = action.playerId;

            if (stats[actingTeam]) {
                if (pattern !== 'unknown') {
                    if (stats[actingTeam][pattern] !== undefined) {
                        stats[actingTeam][pattern]++;
                    } else {
                        stats[actingTeam].error++;
                    }
                    if (!isOpp) stats[actingTeam].total++;
                }
                if (pId) {
                    if (!stats[actingTeam].players[pId]) {
                        stats[actingTeam].players[pId] = {
                            spike: 0, block: 0, ace: 0,
                            attack_error: 0, blocked: 0, reception_error: 0, serve_error: 0, error: 0
                        };
                    }
                    if (pattern !== 'unknown') {
                        if (stats[actingTeam].players[pId][pattern] !== undefined) {
                            stats[actingTeam].players[pId][pattern]++;
                        } else {
                            stats[actingTeam].players[pId].error++;
                        }
                    }
                }
            }
        });
    });

    const getOpponentErrors = (oppTeamKey) => {
        const s = stats[oppTeamKey];
        return (s.attack_error || 0) + (s.blocked || 0) + (s.reception_error || 0) + (s.serve_error || 0) + (s.error || 0);
    };

    teamStats.innerHTML = '';
    [
        { id: 'spike', label: 'スパイク得点', icon: 'swords' },
        { id: 'block', label: 'ブロック得点', icon: 'shield' },
        { id: 'ace', label: 'サービスエース', icon: 'zap' },
        { id: 'opp_error', label: '相手ミスによる得点', icon: 'x-circle' }
    ].forEach(cat => {
        let valA = (cat.id === 'opp_error') ? getOpponentErrors('B') : stats.A[cat.id];
        let valB = (cat.id === 'opp_error') ? getOpponentErrors('A') : stats.B[cat.id];
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

    // Render detailed attack & error breakdown cards
    const attackAttemptsA = stats.A.spike + stats.A.attack_error + stats.A.blocked;
    const attackAttemptsB = stats.B.spike + stats.B.attack_error + stats.B.blocked;
    const effA = attackAttemptsA > 0 ? Math.round(((stats.A.spike - stats.A.attack_error - stats.A.blocked) / attackAttemptsA) * 100) : 0;
    const effB = attackAttemptsB > 0 ? Math.round(((stats.B.spike - stats.B.attack_error - stats.B.blocked) / attackAttemptsB) * 100) : 0;

    teamStats.innerHTML += `
        <div class="mt-6 pt-5 border-t border-zinc-800/80 space-y-4">
            <div class="text-xs font-black text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <i data-lucide="crosshair" class="w-4 h-4 text-emerald-400"></i> アタック結果・効果率
            </div>
            <div class="grid grid-cols-2 gap-3">
                <div class="bg-zinc-900/60 p-3 rounded-xl border border-white/5 space-y-1.5">
                    <div class="flex justify-between items-center text-xs font-bold" style="color: ${m.colorA}">
                        <span>${m.teamA}</span>
                        <span class="text-emerald-400 font-black">効果率: ${effA}%</span>
                    </div>
                    <div class="text-[11px] text-zinc-300 flex justify-between">
                        <span>決定: <b class="text-emerald-400">${stats.A.spike}</b></span>
                        <span>被B: <b class="text-rose-400">${stats.A.blocked}</b></span>
                        <span>ミス: <b class="text-rose-400">${stats.A.attack_error}</b></span>
                    </div>
                </div>
                <div class="bg-zinc-900/60 p-3 rounded-xl border border-white/5 space-y-1.5">
                    <div class="flex justify-between items-center text-xs font-bold" style="color: ${m.colorB}">
                        <span>${m.teamB}</span>
                        <span class="text-emerald-400 font-black">効果率: ${effB}%</span>
                    </div>
                    <div class="text-[11px] text-zinc-300 flex justify-between">
                        <span>決定: <b class="text-emerald-400">${stats.B.spike}</b></span>
                        <span>被B: <b class="text-rose-400">${stats.B.blocked}</b></span>
                        <span>ミス: <b class="text-rose-400">${stats.B.attack_error}</b></span>
                    </div>
                </div>
            </div>

            <div class="text-xs font-black text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 pt-2">
                <i data-lucide="shield-alert" class="w-4 h-4 text-rose-400"></i> レセプション・サーブ失点
            </div>
            <div class="grid grid-cols-2 gap-3 text-[11px]">
                <div class="bg-zinc-900/60 p-3 rounded-xl border border-white/5 space-y-1">
                    <div class="font-bold text-xs" style="color: ${m.colorA}">${m.teamA}</div>
                    <div class="text-zinc-300 flex justify-between"><span>レセプションミス:</span><b class="text-rose-400">${stats.A.reception_error}</b></div>
                    <div class="text-zinc-300 flex justify-between"><span>サーブミス:</span><b class="text-rose-400">${stats.A.serve_error}</b></div>
                </div>
                <div class="bg-zinc-900/60 p-3 rounded-xl border border-white/5 space-y-1">
                    <div class="font-bold text-xs" style="color: ${m.colorB}">${m.teamB}</div>
                    <div class="text-zinc-300 flex justify-between"><span>レセプションミス:</span><b class="text-rose-400">${stats.B.reception_error}</b></div>
                    <div class="text-zinc-300 flex justify-between"><span>サーブミス:</span><b class="text-rose-400">${stats.B.serve_error}</b></div>
                </div>
            </div>
        </div>
    `;

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
                const totalErrors = (p.attack_error || 0) + (p.blocked || 0) + (p.reception_error || 0) + (p.serve_error || 0) + (p.error || 0);
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
                                <div class="flex justify-between text-xs mb-1 font-bold uppercase tracking-tight">
                                    <span class="text-zinc-200">Total: ${total}</span>
                                    <span class="text-rose-400 font-bold">失点/ミス: ${totalErrors}</span>
                                </div>
                                <div class="flex h-2 rounded-full overflow-hidden bg-zinc-800/80">
                                    <div style="width: ${(p.spike/Math.max(total,1))*100}%; background: #10b981"></div>
                                    <div style="width: ${(p.block/Math.max(total,1))*100}%; background: #3b82f6"></div>
                                    <div style="width: ${(p.ace/Math.max(total,1))*100}%; background: #eab308"></div>
                                </div>
                            </div>
                        </div>
                        <div class="player-detail hidden pl-3 sm:pl-12 pr-2 py-3 grid grid-cols-3 sm:grid-cols-4 gap-2 border border-white/5 mt-2 bg-zinc-950/80 rounded-lg">
                            <div class="flex flex-col"><span class="text-emerald-400/85 text-[10px] uppercase tracking-wider font-bold">Spike</span><span class="text-emerald-400 text-sm sm:text-base font-black">${p.spike}</span></div>
                            <div class="flex flex-col"><span class="text-rose-400/85 text-[10px] uppercase tracking-wider font-bold">Atkミス/被B</span><span class="text-rose-400 text-sm sm:text-base font-black">${p.attack_error || 0} / ${p.blocked || 0}</span></div>
                            <div class="flex flex-col"><span class="text-blue-400/85 text-[10px] uppercase tracking-wider font-bold">Block</span><span class="text-blue-400 text-sm sm:text-base font-black">${p.block}</span></div>
                            <div class="flex flex-col"><span class="text-yellow-400/85 text-[10px] uppercase tracking-wider font-bold">Ace</span><span class="text-yellow-400 text-sm sm:text-base font-black">${p.ace}</span></div>
                            <div class="flex flex-col"><span class="text-rose-400/85 text-[10px] uppercase tracking-wider font-bold">Recミス</span><span class="text-rose-400 text-sm sm:text-base font-black">${p.reception_error || 0}</span></div>
                            <div class="flex flex-col"><span class="text-rose-400/85 text-[10px] uppercase tracking-wider font-bold">サーブミス</span><span class="text-rose-400 text-sm sm:text-base font-black">${p.serve_error || 0}</span></div>
                            <div class="flex flex-col"><span class="text-zinc-400/85 text-[10px] uppercase tracking-wider font-bold">その他ミス</span><span class="text-zinc-400 text-sm sm:text-base font-black">${p.error || 0}</span></div>
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
    
    const isOpp = typeof isOpponentActionPattern === 'function' ? isOpponentActionPattern(action.pattern) : (action.pattern === 'error');
    const scoringTeam = action.scoringTeam || (isOpp ? (action.team === 'A' ? 'B' : 'A') : action.team);
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
    const isOpp = typeof isOpponentActionPattern === 'function' ? isOpponentActionPattern(pattern) : (pattern === 'error');
    const actorTeam = isOpp ? (scoringTeam === 'A' ? 'B' : 'A') : scoringTeam;
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
    const label = document.getElementById('edit-action-player-label');
    if (!sel) return;
    sel.innerHTML = '<option value="">選手選択なし</option>';
    
    const isOpp = typeof isOpponentActionPattern === 'function' ? isOpponentActionPattern(pattern) : (pattern === 'error');
    const teamToPick = isOpp ? (scoringTeam === 'A' ? 'B' : 'A') : scoringTeam;
    const teamName = teamToPick === 'A' ? state.teamA : state.teamB;
    const members = teamToPick === 'A' ? state.membersA : state.membersB;
    
    if (label) {
        label.textContent = isOpp ? `ミス・失点選手 (${teamName})` : `得点選手 (${teamName})`;
    }
    
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
    updateHistoryIfEditing();
    
    closeEditActionModal();
    
    const timelineModal = document.getElementById('timeline-modal');
    if (timelineModal && !timelineModal.classList.contains('hidden')) {
        // Toggle timeline twice to refresh
        document.getElementById('timeline-modal').classList.add('hidden');
        showCurrentTimeline();
    }
    
    showToast("得点入力を修正し、再計算しました");
}

function updateHistoryIfEditing() {
    if (!state.editingHistoryDate) return;
    try {
        const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
        const idx = history.findIndex(m => m.date === state.editingHistoryDate);
        if (idx >= 0) {
            history[idx].teamA = state.teamA;
            history[idx].teamB = state.teamB;
            history[idx].setsA = state.setsA;
            history[idx].setsB = state.setsB;
            history[idx].setHistory = JSON.parse(JSON.stringify(state.setHistory || []));
            history[idx].actionLog = JSON.parse(JSON.stringify(state.actionLog || []));
            history[idx].membersA = JSON.parse(JSON.stringify(state.membersA || []));
            history[idx].membersB = JSON.parse(JSON.stringify(state.membersB || []));
            localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
            if (typeof renderHistory === 'function') {
                renderHistory();
            }
        }
    } catch (err) {
        console.error("Error during updateHistoryIfEditing:", err);
    }
}

function restoreActionLogFromMatch(m) {
    if (m.actionLog && Array.isArray(m.actionLog) && m.actionLog.length > 0) {
        return JSON.parse(JSON.stringify(m.actionLog));
    }
    const restored = [];
    if (m.setHistory && m.setHistory.length > 0) {
        const membersA = m.membersA || state.membersA || [];
        const membersB = m.membersB || state.membersB || [];
        
        m.setHistory.forEach((s, sIdx) => {
            if (s.log && Array.isArray(s.log)) {
                s.log.forEach(item => {
                    const cloned = { ...item, set: s.set };
                    // If playerId is missing but player (number) exists, resolve to playerId
                    if (!cloned.playerId && (cloned.player !== null && cloned.player !== undefined)) {
                        const actorTeam = cloned.team || cloned.scoringTeam || 'A';
                        const teamMembers = actorTeam === 'A' ? membersA : membersB;
                        const found = teamMembers.find(mem => mem.number === cloned.player);
                        if (found) cloned.playerId = found.id;
                    }
                    restored.push(cloned);
                });
            }
            const isSetFinished = (s.scoreA > 0 || s.scoreB > 0);
            const isLastSet = (sIdx === m.setHistory.length - 1);
            if (isSetFinished && (!isLastSet || m.setsA > 0 || m.setsB > 0)) {
                restored.push({
                    type: 'set_finish',
                    winner: s.winner || (s.scoreA > s.scoreB ? 'A' : 'B'),
                    scoreA: s.scoreA,
                    scoreB: s.scoreB,
                    currentSet: s.set
                });
            }
        });
    }
    return restored;
}

async function editMatchFromHistory(idx) {
    try {
        const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
        const m = history[idx];
        if (!m) {
            showCustomAlert("試合データが見つかりません。");
            return;
        }

        const confirmed = await showCustomConfirm("この試合のスコアを編集しますか？\n（現在のコート画面に試合データを読み込みます）");
        if (!confirmed) return;

        state.teamA = m.teamA || "TEAM A";
        state.teamB = m.teamB || "TEAM B";
        state.colorA = m.colorA || "#eab308";
        state.colorB = m.colorB || "#ffffff";
        state.setsA = m.setsA || 0;
        state.setsB = m.setsB || 0;
        state.maxSets = m.maxSets || 3;
        state.membersA = JSON.parse(JSON.stringify(m.membersA || state.membersA || []));
        state.membersB = JSON.parse(JSON.stringify(m.membersB || state.membersB || []));
        state.initialServingTeam = m.initialServingTeam || 'A';
        state.setHistory = JSON.parse(JSON.stringify(m.setHistory || []));
        state.editingHistoryDate = m.date;

        state.actionLog = restoreActionLogFromMatch(m);

        recalculateStateFromLog();

        // 履歴モーダルやメインメニュー等を閉じる
        const historyModal = document.getElementById('history-modal');
        if (historyModal) historyModal.classList.add('hidden');
        const mainMenuModal = document.getElementById('main-menu-modal');
        if (mainMenuModal) mainMenuModal.classList.add('hidden');

        // タイムラインを開いて即座に各得点マスを編集できるようにする
        showCurrentTimeline();

        showToast("試合データを読み込みました。得点マスをタップして編集できます。");
    } catch (err) {
        console.error("Error during editMatchFromHistory:", err);
        showCustomAlert("試合データの読み込み中にエラーが発生しました。");
    }
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
            const isOpp = typeof isOpponentActionPattern === 'function' ? isOpponentActionPattern(action.pattern) : (action.pattern === 'error');
            const scoringTeam = action.scoringTeam || (isOpp ? (action.team === 'A' ? 'B' : 'A') : action.team);
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
            action.team = isOpp ? (scoringTeam === 'A' ? 'B' : 'A') : scoringTeam;
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
            
            const setWinner = (state.scoreA !== state.scoreB) ? (state.scoreA > state.scoreB ? 'A' : 'B') : (action.winner || 'A');
            action.winner = setWinner;
            
            state.setHistory.push({
                set: state.currentSet,
                winner: setWinner,
                scoreA: state.scoreA,
                scoreB: state.scoreB,
                log: []
            });
            
            if (setWinner === 'A') state.setsA++;
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
            const isOpp = typeof isOpponentActionPattern === 'function' ? isOpponentActionPattern(action.pattern) : (action.pattern === 'error');
            const scoringTeam = action.scoringTeam || (isOpp ? (action.team === 'A' ? 'B' : 'A') : action.team);
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
                const isOpp = typeof isOpponentActionPattern === 'function' ? isOpponentActionPattern(action.pattern) : (action.pattern === 'error');
                const scoringTeam = action.scoringTeam || (isOpp ? (action.team === 'A' ? 'B' : 'A') : action.team);
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

function generateAIPrompt(m, targetTeamKey = 'A') {
    if (!m) return '';

    const myTeamKey = targetTeamKey;
    const oppTeamKey = targetTeamKey === 'A' ? 'B' : 'A';
    const myTeamName = myTeamKey === 'A' ? m.teamA : m.teamB;
    const oppTeamName = oppTeamKey === 'A' ? m.teamA : m.teamB;
    const mySets = myTeamKey === 'A' ? (m.setsA || 0) : (m.setsB || 0);
    const oppSets = oppTeamKey === 'A' ? (m.setsA || 0) : (m.setsB || 0);
    const myMembers = myTeamKey === 'A' ? (m.membersA || []) : (m.membersB || []);
    const oppMembers = oppTeamKey === 'A' ? (m.membersA || []) : (m.membersB || []);

    // Calculate score breakdown
    const createEmptyStats = () => ({
        spike: 0, block: 0, ace: 0,
        attack_error: 0, blocked: 0, reception_error: 0, serve_error: 0, error: 0,
        unknown: 0, totalPoints: 0, players: {}
    });
    const stats = { A: createEmptyStats(), B: createEmptyStats() };

    (m.setHistory || []).forEach(set => {
        (set.log || []).forEach(action => {
            if (action.type !== 'point') return;
            const isOpp = typeof isOpponentActionPattern === 'function' ? isOpponentActionPattern(action.pattern) : (action.pattern === 'error');
            const scTeam = action.scoringTeam || (isOpp ? (action.team === 'A' ? 'B' : 'A') : action.team);
            const actingTeam = action.team || (isOpp ? (scTeam === 'A' ? 'B' : 'A') : scTeam); 
            const pattern = action.pattern || 'unknown';
            const pId = action.playerId;

            if (stats[scTeam]) {
                stats[scTeam].totalPoints++;
            }

            if (pattern === 'unknown') {
                if (stats[scTeam]) stats[scTeam].unknown++;
            } else if (stats[actingTeam]) {
                if (stats[actingTeam][pattern] !== undefined) {
                    stats[actingTeam][pattern]++;
                } else {
                    stats[actingTeam].error++;
                }
                if (pId) {
                    if (!stats[actingTeam].players[pId]) {
                        stats[actingTeam].players[pId] = {
                            spike: 0, block: 0, ace: 0,
                            attack_error: 0, blocked: 0, reception_error: 0, serve_error: 0, error: 0
                        };
                    }
                    if (stats[actingTeam].players[pId][pattern] !== undefined) {
                        stats[actingTeam].players[pId][pattern]++;
                    } else {
                        stats[actingTeam].players[pId].error++;
                    }
                }
            }
        });
    });

    const myS = stats[myTeamKey];
    const oppS = stats[oppTeamKey];

    const mySpike = myS.spike;
    const myBlock = myS.block;
    const myAce = myS.ace;
    const myDirectPoints = mySpike + myBlock + myAce;
    const myUnknown = myS.unknown;
    const myTotalPoints = myS.totalPoints;

    const myAtkErr = myS.attack_error;
    const myBlocked = myS.blocked;
    const myRecErr = myS.reception_error;
    const myServeErr = myS.serve_error;
    const myOtherErr = myS.error;
    const myTotalErrors = myAtkErr + myBlocked + myRecErr + myServeErr + myOtherErr;

    const oppAtkErr = oppS.attack_error;
    const oppBlocked = oppS.blocked;
    const oppRecErr = oppS.reception_error;
    const oppServeErr = oppS.serve_error;
    const oppOtherErr = oppS.error;
    const oppTotalErrors = oppAtkErr + oppBlocked + oppRecErr + oppServeErr + oppOtherErr;

    const oppSpike = oppS.spike;
    const oppBlock = oppS.block;
    const oppAce = oppS.ace;
    const oppTotalPoints = oppS.totalPoints;

    // Check if detailed stats are present
    const hasDetailedStats = (myDirectPoints + myTotalErrors + oppSpike + oppBlock + oppAce + oppTotalErrors) > 0;

    // Attack effectiveness calculation
    const myAtkAttempts = mySpike + myAtkErr + myBlocked;
    const myAtkEff = myAtkAttempts > 0 ? Math.round(((mySpike - myAtkErr - myBlocked) / myAtkAttempts) * 100) : 0;

    // Set Scores
    const setScoreLines = (m.setHistory || []).map(s => {
        const isLive = m.isLiveMatch && typeof state !== 'undefined' && s.set === state.currentSet;
        const tag = isLive ? ' [進行中]' : '';
        const myScore = myTeamKey === 'A' ? s.scoreA : s.scoreB;
        const oppScore = oppTeamKey === 'A' ? s.scoreA : s.scoreB;
        const resultTag = myScore > oppScore ? '○ 勝利' : (myScore < oppScore ? '● 敗北' : '△ 引分');
        return `  - 第${s.set}セット: ${myTeamName} ${myScore} - ${oppScore} ${oppTeamName} (${resultTag})${tag}`;
    }).join('\n') || '  (スコア記録なし)';

    // Rotation stats (自チームのローテ分析を重点化)
    const rotData = typeof analyzeRotations === 'function' ? analyzeRotations(m) : { statsA: [], statsB: [], startingPlayersA: [], startingPlayersB: [] };
    const myRotStats = myTeamKey === 'A' ? rotData.statsA : rotData.statsB;
    const myStarters = myTeamKey === 'A' ? rotData.startingPlayersA : rotData.startingPlayersB;

    let myRotLines = '  (データなし)';
    if (myRotStats && myRotStats.length > 0) {
        myRotLines = myRotStats.map((s, idx) => {
            const starterItem = (myStarters || [])[idx];
            const starterId = starterItem && typeof starterItem === 'object' ? starterItem.id : starterItem;
            const player = (myMembers || []).find(mem => mem.id === starterId) || (starterItem && typeof starterItem === 'object' ? starterItem : null);
            const num = player ? `#${player.number}` : `#${idx + 1}`;
            const name = player && player.name && player.name !== String(player.number) ? ` (${player.name})` : '';
            const soRate = s.receiveRallies > 0 ? Math.round((s.sideoutPoints / s.receiveRallies) * 100) : 0;
            const brRate = s.serveRallies > 0 ? Math.round((s.breakPoints / s.serveRallies) * 100) : 0;
            
            let note = '';
            if (s.receiveRallies >= 2 && soRate < 50) note = ' [★SO苦戦・失点リスク]';
            else if (s.serveRallies >= 2 && brRate >= 40) note = ' [◎連続ブレイク得点源]';

            return `- ローテ${idx + 1} [サーバー:${num}${name}]: SO率 ${soRate}% (${s.sideoutPoints}/${s.receiveRallies}), BR率 ${brRate}% (${s.breakPoints}/${s.serveRallies})${note}`;
        }).join('\n');
    }

    // Player stats (自チーム選手のみ)
    const formatPlayerLines = (pData, members) => {
        const sortedIds = Object.keys(pData || {}).sort((a,b) => (pData[b].spike + pData[b].block + pData[b].ace) - (pData[a].spike + pData[a].block + pData[a].ace));
        if (sortedIds.length === 0) return '  (詳細個人スタッツ未記録)';
        return sortedIds.map(pId => {
            const p = pData[pId];
            const total = p.spike + p.block + p.ace;
            const player = (members || []).find(mem => mem.id === pId);
            const num = player ? `#${player.number}` : pId.replace(/[AB]/, '');
            const name = player && player.name && player.name !== String(player.number) ? ` ${player.name}` : '';
            
            const errParts = [];
            if (p.attack_error) errParts.push(`Atkミス:${p.attack_error}`);
            if (p.blocked) errParts.push(`被ブロック:${p.blocked}`);
            if (p.reception_error) errParts.push(`Recミス:${p.reception_error}`);
            if (p.serve_error) errParts.push(`サーブミス:${p.serve_error}`);
            if (p.error) errParts.push(`他ミス:${p.error}`);
            const errStr = errParts.length > 0 ? ` [失点要因: ${errParts.join(', ')}]` : '';

            return `  - ${num}${name}: 計${total}点 (スパイク:${p.spike}, ブロック:${p.block}, エース:${p.ace})${errStr}`;
        }).join('\n');
    };
    const playerLines = formatPlayerLines(stats[myTeamKey].players, myMembers);

    // Timeline per set (自チーム視点)
    const formatSetTimeline = (setObj) => {
        const log = setObj.log || [];
        if (log.length === 0) return '  (詳細ログなし)';

        let currentScoreA = 0;
        let currentScoreB = 0;
        const lines = [];

        log.forEach(action => {
            if (action.type === 'point') {
                const isOpp = typeof isOpponentActionPattern === 'function' ? isOpponentActionPattern(action.pattern) : (action.pattern === 'error');
                const scTeam = action.scoringTeam || (isOpp ? (action.team === 'A' ? 'B' : 'A') : action.team);
                if (action.scoreA !== undefined && action.scoreB !== undefined) {
                    currentScoreA = action.scoreA;
                    currentScoreB = action.scoreB;
                } else {
                    if (scTeam === 'A') currentScoreA++; else currentScoreB++;
                }

                const myScoreNow = myTeamKey === 'A' ? currentScoreA : currentScoreB;
                const oppScoreNow = oppTeamKey === 'A' ? currentScoreA : currentScoreB;

                const isMyPoint = (scTeam === myTeamKey);
                let label = '';

                if (isOpp) {
                    const patName = typeof ACTION_PATTERN_NAMES !== 'undefined' && ACTION_PATTERN_NAMES[action.pattern] ? ACTION_PATTERN_NAMES[action.pattern] : action.pattern;
                    if (isMyPoint) {
                        label = `【${myTeamName}得点】相手の${patName}`;
                    } else {
                        const members = myMembers;
                        const p = members.find(mem => mem.id === action.playerId);
                        const pNum = p ? `#${p.number}` : (action.playerId ? action.playerId.replace(/[AB]/, '#') : '');
                        const pName = p && p.name && p.name !== String(p.number) ? ` ${p.name}` : '';
                        label = `【${oppTeamName}得点】${myTeamName} ${pNum}${pName} ${patName}失点`.trim();
                    }
                } else {
                    const members = scTeam === 'A' ? (m.membersA || []) : (m.membersB || []);
                    const p = members.find(mem => mem.id === action.playerId);
                    const pNum = p ? `#${p.number}` : (action.playerId ? action.playerId.replace(/[AB]/, '#') : '');
                    const pName = p && p.name && p.name !== String(p.number) ? ` ${p.name}` : '';
                    const patternLabel = action.pattern === 'spike' ? 'スパイク' : action.pattern === 'block' ? 'ブロック' : action.pattern === 'ace' ? 'サービスエース' : (action.pattern === 'unknown' ? '得点' : (action.pattern || ''));
                    
                    if (isMyPoint) {
                        label = `【${myTeamName}得点】${pNum}${pName} ${patternLabel}`.trim();
                    } else {
                        label = `【${oppTeamName}得点】${patternLabel}失点`;
                    }
                }

                const tag = action.rotationOccurred ? ' [SO]' : ' [BR]';
                lines.push(`  - [自 ${myScoreNow} - ${oppScoreNow} 相] ${label}${tag}`);
            } else if (action.type === 'timeout') {
                const isMyTO = (action.team === myTeamKey);
                const toTeamName = isMyTO ? myTeamName : oppTeamName;
                const myScoreNow = myTeamKey === 'A' ? (action.scoreA || currentScoreA) : (action.scoreB || currentScoreB);
                const oppScoreNow = oppTeamKey === 'A' ? (action.scoreA || currentScoreA) : (action.scoreB || currentScoreB);
                lines.push(`  - [自 ${myScoreNow} - ${oppScoreNow} 相] ★ ${toTeamName} タイムアウト`);
            } else if (action.type === 'substitution' && !action.isLibero) {
                const isMySub = (action.team === myTeamKey);
                if (isMySub) {
                    const inP = myMembers.find(mem => mem.id === action.inPlayerId);
                    const outP = myMembers.find(mem => mem.id === action.outPlayerId);
                    const inStr = inP ? `#${inP.number}${inP.name && inP.name !== String(inP.number) ? ' ' + inP.name : ''}` : action.inPlayerId;
                    const outStr = outP ? `#${outP.number}${outP.name && outP.name !== String(outP.number) ? ' ' + outP.name : ''}` : action.outPlayerId;
                    const myScoreNow = myTeamKey === 'A' ? currentScoreA : currentScoreB;
                    const oppScoreNow = oppTeamKey === 'A' ? currentScoreA : currentScoreB;
                    lines.push(`  - [自 ${myScoreNow} - ${oppScoreNow} 相] ⇄ 【${myTeamName}交代】In: ${inStr} / Out: ${outStr}`);
                }
            }
        });

        return lines.join('\n');
    };

    const timelineSections = (m.setHistory || []).map(s => {
        return `### 第${s.set}セット スコア・ラリー推移\n${formatSetTimeline(s)}`;
    }).join('\n\n') || '  (タイムライン記録なし)';

    const matchDate = m.date ? new Date(m.date).toLocaleString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '記録なし';
    const matchFmt = m.matchFormat ? (m.matchFormat === '2sets' ? '2セットマッチ' : m.matchFormat === '5sets' ? '5セットマッチ' : '3セットマッチ') : 'セットマッチ';
    const matchStatus = m.isLiveMatch ? '（現在進行中の試合）' : '（試合終了）';

    // Detailed score section depending on whether details were recorded
    let scoreSection = '';
    if (!hasDetailedStats) {
        scoreSection = `## 2. 得点・失点状況
- 自チーム（${myTeamName}）の総得点: ${myTotalPoints}点
- 対戦相手（${oppTeamName}）の総得点: ${oppTotalPoints}点
- ※**【記録状況に関する重要注意】**:
  本試合は「得点スコアとローテーションのみの簡易記録（ライブ中の迅速記録）」となっており、スパイク/ブロック/ミス等のプレー詳細種別は未入力です（データ破損や異常ではありません）。
  「得点・失点スタッツが0点」という指摘は不要です。**「各セットの点差推移」「ローテーション別のサイドアウト率(SO率)・ブレイク率(BR率)」「タイムアウト前後の流れ」「ラリー推移での連続失点局面」**を徹底的に読み解いて専属コーチングを行ってください。`;
    } else {
        scoreSection = `## 2. 自チーム（${myTeamName}）の得点・攻撃スタッツ
- 総得点: ${myTotalPoints}点 (詳細記録: ${myDirectPoints + oppTotalErrors}点, 簡易得点: ${myUnknown}点)
- スパイク決定数: ${mySpike}点
- ブロック得点: ${myBlock}点
- サービスエース: ${myAce}点
- 自力得点合計: ${myDirectPoints}点
- 相手ミスによる得点合計: ${oppTotalErrors}点
- **アタック効果指標**:
  - スパイク決定: ${mySpike}本 / アタックミス: ${myAtkErr}本 / 被ブロック: ${myBlocked}本
  - 実質アタック効果率目安: ${myAtkEff}% (決定 - ミス - 被B / アタック決着数)

## 3. 自チーム（${myTeamName}）の失点要因内訳
- 総失点: ${oppTotalPoints}点
- **相手攻撃による失点**:
  - 被スパイク: ${oppSpike}点 / 相手ブロック被弾: ${oppBlock}点 / 相手エース被弾: ${oppAce}点
- **自チームのミス・崩れによる失点**:
  - アタックミス (アウト・ネット等): ${myAtkErr}点
  - 被ブロック (相手ブロックにシャットアウト): ${myBlocked}点
  - レセプションミス (サーブレシーブ返球失敗・被エース): ${myRecErr}点
  - サーブミス: ${myServeErr}点
  - その他ミス (反則等): ${myOtherErr}点
  - 自チームミス失点合計: ${myTotalErrors}点`;
    }

    return `# バレーボール試合分析・コーチング依頼（${myTeamName} 特化）

あなたは【${myTeamName}】の専属アナリスト兼ヘッドコーチです。
以下の試合スタッツデータおよびラリー推移タイムラインを深く読み解き、**【${myTeamName}】が次戦で勝つための課題の洗い出しと、明日からの実践的な指導・練習メニューのアドバイス**を日本語で詳しく分析してください。

---

## 1. 試合概要
- 分析対象（自チーム）: 【${myTeamName}】 (${mySets}セット取得)
- 対戦相手: 【${oppTeamName}】 (${oppSets}セット取得)
- 試合状況: ${matchStatus}
- 日時: ${matchDate} / 試合形式: ${matchFmt}
- 各セットスコア:
${setScoreLines}

${scoreSection}

## ${hasDetailedStats ? '4' : '3'}. 自チーム（${myTeamName}）のローテーション分析
※SO率(サイドアウト率)＝相手サーブ時に自チームが得点できた確率 (目安: 60〜70%以上で安定)
※BR率(ブレイク率)＝自チームサーブ時に連続得点できた確率 (目安: 35%以上で優秀)

${myRotLines}

## ${hasDetailedStats ? '5' : '4'}. 自チーム（${myTeamName}）の個人スタッツ
${playerLines}

## ${hasDetailedStats ? '6' : '5'}. ラリー推移・タイムライン（自チーム視点）
※[SO]＝相手サーブを切った得点 (Side-Out)、[BR]＝自チームサーブからの連続得点 (Break)
${timelineSections}

---

## 【専属コーチ・アナリストへの依頼項目】
1. **失点パターンの根本原因と苦手局面の特定**:
   - 相手に連続ブレイク（連続失点）を許したローテーションや時間帯、要因（サーブ対応/アタックミス/被ブロック/連携ミス等）の改善策。
2. **サイドアウト率(SO率)の改善とサーブカット隊形**:
   - サイドアウトが切れなかったローテ（前衛枚数やレセプションフォーメーション）の具体的な打開策と、セッター配球のアドバイス。
3. **ブレイク率(BR率)向上とサーブ戦術**:
   - 連続得点（ブレイク）が取れたローテの強みと、サーブからブロック＆ディグへの連動強化。
4. **采配・試合運び（タイムアウト・選手交代）の検証**:
   - タイムアウトや交代が流れを止められたかの検証と、より効果的なタイミング。
5. **明日から取り組むべき具体的・実践的な練習メニュー（ドリル）**:
   - 課題を克服するための実践的ドリル（苦手ローテからのサイドアウト練習、二段トス決定力強化、レセプションアタック練習など）を具体的に提案してください。

---

## 【出力に関する重要な指示】
- 各セクションは箇条書きと明瞭な見出しを活用し、**過度に長文になりすぎず要点を簡潔・凝縮して、最後まで途切れずに1つの完成したレポートとして出力してください**。
- 全体の分量は2,000〜3,000文字程度にバランス良くまとめてください。
`;

}

let currentAITargetTeam = 'A';

function openAITargetTeamModal(m) {
    const modal = document.getElementById('ai-target-team-modal');
    if (!modal) {
        executeShareAnalysisForAI('A');
        return;
    }

    const teamAName = m.teamA || 'TEAM A';
    const teamBName = m.teamB || 'TEAM B';

    const presets = JSON.parse(localStorage.getItem(PRESET_TEAMS_KEY) || '[]');
    const isMyA = (presets.some(p => p.name === teamAName && p.isMyTeam)) || (m.isMyTeamA) || (typeof state !== 'undefined' && state.teamA === teamAName && state.isMyTeamA);
    const isMyB = (presets.some(p => p.name === teamBName && p.isMyTeam)) || (m.isMyTeamB) || (typeof state !== 'undefined' && state.teamB === teamBName && state.isMyTeamB);

    const nameAEl = document.getElementById('ai-team-name-a');
    const nameBEl = document.getElementById('ai-team-name-b');
    const badgeAEl = document.getElementById('ai-team-badge-a');
    const badgeBEl = document.getElementById('ai-team-badge-b');

    if (nameAEl) nameAEl.textContent = `${teamAName} (${m.setsA || 0}セット)`;
    if (nameBEl) nameBEl.textContent = `${teamBName} (${m.setsB || 0}セット)`;

    if (badgeAEl) {
        badgeAEl.innerHTML = isMyA ? '<span class="text-yellow-400 font-bold">★ マイチーム</span>' : '<span class="text-zinc-500">チームA</span>';
    }
    if (badgeBEl) {
        badgeBEl.innerHTML = isMyB ? '<span class="text-yellow-400 font-bold">★ マイチーム</span>' : '<span class="text-zinc-500">チームB</span>';
    }

    // Default selection: My team takes precedence, else Team A
    if (isMyB && !isMyA) {
        currentAITargetTeam = 'B';
    } else {
        currentAITargetTeam = 'A';
    }
    updateAITeamSelectUI();

    // Check API Key status for button hint
    const hasKey = !!(localStorage.getItem(GEMINI_API_KEY_STORAGE) || '').trim();
    const directBtn = document.getElementById('ai-action-direct-btn');
    if (directBtn) {
        if (!hasKey) {
            directBtn.innerHTML = `<i data-lucide="zap" class="w-4 h-4 fill-black"></i> アプリ内で直接分析 <span class="text-[10px] font-bold opacity-80">(要APIキー)</span>`;
        } else {
            directBtn.innerHTML = `<i data-lucide="zap" class="w-4 h-4 fill-black"></i> アプリ内で直接分析 (Gemini)`;
        }
    }

    modal.classList.remove('hidden');
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function selectAITargetTeam(teamKey) {
    currentAITargetTeam = teamKey;
    updateAITeamSelectUI();
}

function updateAITeamSelectUI() {
    const btnA = document.getElementById('ai-select-team-a');
    const btnB = document.getElementById('ai-select-team-b');
    if (!btnA || !btnB) return;

    if (currentAITargetTeam === 'A') {
        btnA.className = "p-3 rounded-2xl flex flex-col items-center justify-center text-center transition-all bg-yellow-500/15 border-2 border-yellow-500 shadow-md text-left";
        btnB.className = "p-3 rounded-2xl flex flex-col items-center justify-center text-center transition-all bg-zinc-800/80 border border-zinc-700/80 hover:bg-zinc-750 text-left opacity-70";
    } else {
        btnB.className = "p-3 rounded-2xl flex flex-col items-center justify-center text-center transition-all bg-yellow-500/15 border-2 border-yellow-500 shadow-md text-left";
        btnA.className = "p-3 rounded-2xl flex flex-col items-center justify-center text-center transition-all bg-zinc-800/80 border border-zinc-700/80 hover:bg-zinc-750 text-left opacity-70";
    }
}

function closeAITargetTeamModal() {
    const modal = document.getElementById('ai-target-team-modal');
    if (modal) modal.classList.add('hidden');
}

function copyCurrentAIPrompt() {
    closeAITargetTeamModal();
    executeShareAnalysisForAI(currentAITargetTeam);
}

async function startDirectAIAnalysis() {
    const apiKey = (localStorage.getItem(GEMINI_API_KEY_STORAGE) || '').trim();
    if (!apiKey) {
        const confirmed = await showCustomConfirm("アプリ内での直接分析には Gemini APIキー が必要です。\n設定画面を開いて登録しますか？\n（Google AI Studioで無料枠のキーを取得できます）");
        if (confirmed) {
            closeAITargetTeamModal();
            openSettingsModalForApiKey();
        }
        return;
    }

    const m = window.currentAnalysisMatch;
    if (!m) return;

    closeAITargetTeamModal();
    openAIReportModal(m, currentAITargetTeam);
}

let activeAIAnalysisContext = null;

function openAIReportModal(m, targetTeamKey) {
    activeAIAnalysisContext = { match: m, targetTeamKey: targetTeamKey };

    const modal = document.getElementById('ai-report-modal');
    if (!modal) return;

    const targetTeamName = targetTeamKey === 'A' ? m.teamA : m.teamB;
    const label = document.getElementById('ai-report-target-team-label');
    if (label) label.textContent = `【${targetTeamName}】専属コーチングレポート`;

    const loadingEl = document.getElementById('ai-report-loading');
    const errorEl = document.getElementById('ai-report-error');
    const contentEl = document.getElementById('ai-report-content');

    if (loadingEl) loadingEl.classList.remove('hidden');
    if (errorEl) errorEl.classList.add('hidden');
    if (contentEl) {
        contentEl.classList.add('hidden');
        contentEl.innerHTML = '';
    }

    modal.classList.remove('hidden');
    if (typeof lucide !== 'undefined') lucide.createIcons();

    runGeminiAnalysis(m, targetTeamKey);
}

function closeAIReportModal() {
    const modal = document.getElementById('ai-report-modal');
    if (modal) modal.classList.add('hidden');
    activeAIAnalysisContext = null;
}

function retryCurrentAIAnalysis() {
    if (activeAIAnalysisContext) {
        openAIReportModal(activeAIAnalysisContext.match, activeAIAnalysisContext.targetTeamKey);
    }
}

async function runGeminiAnalysis(m, targetTeamKey) {
    const apiKey = (localStorage.getItem(GEMINI_API_KEY_STORAGE) || '').trim();
    const prompt = generateAIPrompt(m, targetTeamKey);

    const loadingEl = document.getElementById('ai-report-loading');
    const errorEl = document.getElementById('ai-report-error');
    const errorMsgEl = document.getElementById('ai-report-error-msg');
    const contentEl = document.getElementById('ai-report-content');

    try {
        const models = ['gemini-2.5-flash', 'gemini-1.5-flash'];
        let resultText = '';
        let lastErr = null;
        let wasMaxTokens = false;

        for (const model of models) {
            try {
                // Try with optimized thinking budget for 2.5-flash to prevent thought tokens eating the output limit
                const requestConfigs = [];
                if (model.includes('2.5')) {
                    requestConfigs.push({
                        temperature: 0.7,
                        maxOutputTokens: 8192,
                        thinkingConfig: { thinkingBudget: 0 }
                    });
                }
                requestConfigs.push({
                    temperature: 0.7,
                    maxOutputTokens: 8192
                });

                let responseData = null;
                for (const cfg of requestConfigs) {
                    try {
                        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                contents: [{
                                    parts: [{ text: prompt }]
                                }],
                                generationConfig: cfg
                            })
                        });

                        if (response.ok) {
                            responseData = await response.json();
                            break;
                        } else {
                            const errJson = await response.json().catch(() => ({}));
                            const msg = errJson.error ? errJson.error.message : `HTTP ${response.status}`;
                            console.warn(`Attempt with config failed on ${model}: ${msg}`);
                        }
                    } catch (e) {
                        console.warn(`Fetch error for ${model}:`, e);
                    }
                }

                if (responseData && responseData.candidates && responseData.candidates[0] && responseData.candidates[0].content && responseData.candidates[0].content.parts) {
                    resultText = responseData.candidates[0].content.parts.map(p => p.text).join('\n');
                    if (responseData.candidates[0].finishReason === 'MAX_TOKENS') {
                        wasMaxTokens = true;
                    }
                    break;
                }
            } catch (err) {
                lastErr = err;
                console.warn(`Gemini model ${model} failed, trying fallback:`, err);
            }
        }

        if (!resultText) {
            throw lastErr || new Error("AI分析リクエストに失敗しました。APIキーまたはネットワーク状況をご確認ください。");
        }

        if (wasMaxTokens) {
            resultText += '\n\n---\n> ⚠️ **※最大出力長に達したため、文章が途中で終了しています。**\n> 上部の「🔄 再生成」ボタンを押すと、再度レポートを生成できます。';
        }

        window.currentAIReportMarkdown = resultText;
        if (loadingEl) loadingEl.classList.add('hidden');

        // Render Markdown safely with marked.js
        let htmlContent = '';
        if (typeof marked !== 'undefined' && typeof marked.parse === 'function') {
            htmlContent = marked.parse(resultText);
        } else {
            // Fallback plain text with simple line breaks
            htmlContent = `<pre class="whitespace-pre-wrap">${resultText}</pre>`;
        }

        // Wrap tables in horizontal scroll containers to prevent mobile overflow
        htmlContent = htmlContent.replace(/<table>/g, '<div class="table-wrapper"><table>').replace(/<\/table>/g, '</table></div>');

        if (contentEl) {
            contentEl.innerHTML = htmlContent;
            contentEl.classList.remove('hidden');
        }

        if (typeof lucide !== 'undefined') lucide.createIcons();

    } catch (err) {
        console.error("AI Analysis error:", err);
        if (loadingEl) loadingEl.classList.add('hidden');
        if (errorEl) {
            if (errorMsgEl) {
                let userMsg = err.message || "エラーが発生しました";
                if (userMsg.includes("API_KEY_INVALID") || userMsg.includes("400") || userMsg.includes("403")) {
                    userMsg = "APIキーが無効または権限がありません。\nGoogle AI Studioの有効なAPIキーかご確認ください。";
                } else if (userMsg.includes("RESOURCE_EXHAUSTED") || userMsg.includes("429")) {
                    userMsg = "APIの無料利用枠の制限（レートリミット）に達しました。\n少し時間をおいてから再試行してください。";
                }
                errorMsgEl.textContent = userMsg;
            }
            errorEl.classList.remove('hidden');
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
    }
}

async function copyAIReportContent() {
    const text = window.currentAIReportMarkdown;
    if (!text) {
        showToast("レポート内容がありません");
        return;
    }

    try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text);
        } else {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.left = '-9999px';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
        }
        showToast("レポート本文をコピーしました！");
    } catch (e) {
        console.error("Copy failed:", e);
        showToast("コピーに失敗しました");
    }
}

async function shareAIReportContent() {
    const text = window.currentAIReportMarkdown;
    if (!text) return;
    const title = document.getElementById('ai-report-target-team-label')?.textContent || "AI分析レポート";

    if (navigator.share) {
        try {
            await navigator.share({
                title: title,
                text: text
            });
            return;
        } catch (err) {
            if (err.name === 'AbortError') return;
            console.warn("navigator.share failed, fallback to copy:", err);
        }
    }
    copyAIReportContent();
}

async function executeShareAnalysisForAI(targetTeamKey) {
    const m = window.currentAnalysisMatch;
    if (!m) return;

    const targetTeamName = targetTeamKey === 'A' ? m.teamA : m.teamB;
    const text = generateAIPrompt(m, targetTeamKey);
    const title = `${targetTeamName} 試合分析・コーチング依頼 (AI用)`;

    // Web Share API (native share sheet on mobile)
    if (navigator.share) {
        try {
            await navigator.share({
                title: title,
                text: text
            });
            return;
        } catch (err) {
            if (err.name === 'AbortError') return; // Cancelled by user
            console.warn("navigator.share failed, trying clipboard fallback:", err);
        }
    }

    // Fallback: clipboard copy
    try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text);
        } else {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.left = '-9999px';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
        }
        if (typeof showCustomAlert === 'function') {
            showCustomAlert(`【${targetTeamName}】向けのAI分析プロンプトをコピーしました！\n\nChatGPTやClaude等に貼り付けて送信してください。`, "OK");
        }
    } catch (e) {
        console.error("Copy failed:", e);
        if (typeof showCustomAlert === 'function') {
            showCustomAlert("共有・コピーに失敗しました。お使いの端末の権限をご確認ください。");
        }
    }
}

async function shareAnalysisForAI() {
    const m = window.currentAnalysisMatch;
    if (!m) {
        if (typeof showCustomAlert === 'function') {
            showCustomAlert("分析データが見つかりません。");
        }
        return;
    }
    openAITargetTeamModal(m);
}
const copyAnalysisForAI = shareAnalysisForAI;

window.openAITargetTeamModal = openAITargetTeamModal;
window.closeAITargetTeamModal = closeAITargetTeamModal;
window.selectAITargetTeam = selectAITargetTeam;
window.startDirectAIAnalysis = startDirectAIAnalysis;
window.copyCurrentAIPrompt = copyCurrentAIPrompt;
window.closeAIReportModal = closeAIReportModal;
window.copyAIReportContent = copyAIReportContent;
window.shareAIReportContent = shareAIReportContent;
window.retryCurrentAIAnalysis = retryCurrentAIAnalysis;
window.executeShareAnalysisForAI = executeShareAnalysisForAI;




