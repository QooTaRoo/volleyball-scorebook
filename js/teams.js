// --- Team & Master Management ---

let currentConfigTeam = 'A';
let masterEditOriginalName = "";
let masterEditMembers = [];

function openTeamConfigModal(team) {
    currentConfigTeam = team;
    document.getElementById('team-config-title').textContent = team === 'A' ? "チームA 設定" : "チームB 設定";
    
    const presets = JSON.parse(localStorage.getItem(PRESET_TEAMS_KEY) || '[]');
    const sel = document.getElementById('config-preset-select');
    sel.innerHTML = `<option value="">選択しない（一時的な新規入力）</option>` + 
        presets.map(p => `<option value="${p.name}">${p.name}</option>`).join('');

    const curName = team === 'A' ? state.teamA : state.teamB;
    const curColor = team === 'A' ? state.colorA : state.colorB;
    
    document.getElementById('config-team-name').value = curName || "";
    document.getElementById('config-team-color').value = curColor || "#ffffff";
    
    sel.value = presets.some(p => p.name === curName) ? curName : "";
    document.getElementById('team-config-modal').classList.remove('hidden');
}

function closeTeamConfigModal() {
    document.getElementById('team-config-modal').classList.add('hidden');
}

function onConfigPresetChange(val) {
    if (!val) return;
    const presets = JSON.parse(localStorage.getItem(PRESET_TEAMS_KEY) || '[]');
    const p = presets.find(item => item.name === val);
    if (p) {
        document.getElementById('config-team-name').value = p.name;
        if (p.color) document.getElementById('config-team-color').value = p.color;
    }
}

function applyTeamConfig() {
    const t = currentConfigTeam;
    const nameVal = document.getElementById('config-team-name').value.trim() || (t === 'A' ? "TEAM A" : "TEAM B");
    const colorVal = document.getElementById('config-team-color').value;
    const presetVal = document.getElementById('config-preset-select').value;

    if (t === 'A') {
        state.teamA = nameVal; state.colorA = colorVal;
        if (presetVal) loadPresetToTeam('A', presetVal);
    } else {
        state.teamB = nameVal; state.colorB = colorVal;
        if (presetVal) loadPresetToTeam('B', presetVal);
    }

    saveState();
    updateUI();
    closeTeamConfigModal();
    showToast(`${nameVal} を適用しました`);
}

function loadPresetToTeam(teamCode, presetName) {
    const presets = JSON.parse(localStorage.getItem(PRESET_TEAMS_KEY) || '[]');
    const p = presets.find(item => item.name.trim().toLowerCase() === presetName.trim().toLowerCase());
    if (p && Array.isArray(p.members)) {
        // 既存のプリセットスターターに starterPos が設定されていない場合、現在の配列順（カスタムコート配置順）のまま割り当てる
        const hasPresetStarterPos = p.members.some(m => m.isStarter && m.starterPos !== undefined);
        if (!hasPresetStarterPos) {
            const presetStarters = p.members.filter(m => m.isStarter);
            presetStarters.forEach((s, idx) => {
                s.starterPos = idx + 1;
            });
        }

        const sortedPresetMembers = [...p.members].sort((a, b) => a.number - b.number);
        const members = sortedPresetMembers.map((pm, i) => ({
            id: `${teamCode}${i+1}`,
            number: pm.number,
            name: pm.name,
            isStarter: !!pm.isStarter,
            isLibero: !!pm.isLibero,
            isLiberoTarget: !!pm.isLiberoTarget,
            starterPos: pm.starterPos,
            liberoPos: pm.liberoPos,
            assignedLibero: pm.assignedLibero
        }));
        
        while (members.length < 6) {
            const nextNum = members.length + 1;
            members.push({ id: `${teamCode}${nextNum}`, number: nextNum, name: `${nextNum}`, isStarter: false, isLibero: false, isLiberoTarget: false });
        }
        
        // Retrieve pre-configured Liberoes from preset
        const lib1 = members.find(m => m.isLibero && m.liberoPos === 1)?.id;
        const lib2 = members.find(m => m.isLibero && m.liberoPos === 2)?.id;
        let activeLiberos = [lib1 || null, lib2 || null];
        if (!lib1 && !lib2) {
            // Fallback for older presets
            const fallbackLiberos = members.filter(m => m.isLibero).map(m => m.id);
            activeLiberos = [fallbackLiberos[0] || null, fallbackLiberos[1] || null];
        }
        
        const starters = members.filter(m => m.isStarter);
        starters.sort((a, b) => {
            const posA = a.starterPos !== undefined ? a.starterPos : (a.number || 0);
            const posB = b.starterPos !== undefined ? b.starterPos : (b.number || 0);
            return posA - posB;
        });
        
        const lineupIds = starters.length === 6 
            ? starters.map(m => m.id)
            : members.slice(0, 6).map(m => m.id);
        
        if (teamCode === 'A') {
            state.membersA = members;
            state.lineupA = lineupIds;
            state.liberosA = activeLiberos;
            state.isMyTeamA = !!p.isMyTeam;
        } else {
            state.membersB = members;
            state.lineupB = lineupIds;
            state.liberosB = activeLiberos;
            state.isMyTeamB = !!p.isMyTeam;
        }
    }
}

function openMasterTeamModal() {
    const presets = JSON.parse(localStorage.getItem(PRESET_TEAMS_KEY) || '[]');
    const sel = document.getElementById('master-team-select');
    sel.innerHTML = `<option value="">-- 新規チームを作成 --</option>` + 
        presets.map(p => `<option value="${p.name}">${p.name}</option>`).join('');
    sel.value = "";
    loadMasterTeamForEdit("");
    document.getElementById('member-modal').classList.remove('hidden');
}

function loadMasterTeamForEdit(presetName) {
    masterEditOriginalName = presetName;
    const myTeamEl = document.getElementById('master-team-myteam');
    if (!presetName) {
        document.getElementById('master-team-name').value = "";
        document.getElementById('master-team-color').value = "#3b82f6";
        if (myTeamEl) myTeamEl.checked = false;
        masterEditMembers = Array.from({length: 12}, (_, i) => ({ 
            id: `M${i+1}`, 
            number: i + 1, 
            name: `${i+1}`, 
            isStarter: i < 6, 
            starterPos: i < 6 ? i + 1 : undefined,
            isLibero: false,
            liberoPos: undefined
        }));
    } else {
        const presets = JSON.parse(localStorage.getItem(PRESET_TEAMS_KEY) || '[]');
        const p = presets.find(item => item.name === presetName);
        if (p) {
            document.getElementById('master-team-name').value = p.name;
            document.getElementById('master-team-color').value = p.color || "#3b82f6";
            if (myTeamEl) myTeamEl.checked = !!p.isMyTeam;
            masterEditMembers = JSON.parse(JSON.stringify(p.members || []));
            while (masterEditMembers.length < 6) {
                const nextNum = masterEditMembers.length + 1;
                masterEditMembers.push({ id: `M${nextNum}`, number: nextNum, name: `${nextNum}`, isStarter: false, isLibero: false, isLiberoTarget: false });
            }
            
            // Backwards compatibility: if no starters are marked, default the first 6
            const hasAnyStarters = masterEditMembers.some(m => m.isStarter);
            masterEditMembers.forEach((m, i) => {
                if (typeof m.isStarter === 'undefined') {
                    m.isStarter = !hasAnyStarters && i < 6;
                }
                if (typeof m.isLibero === 'undefined') {
                    m.isLibero = false;
                }
                if (typeof m.isLiberoTarget === 'undefined') {
                    m.isLiberoTarget = false;
                }
            });

            // 既存データ（下位互換性確保）：スターター全員に starterPos を自動で順番に付与する
            const starters = masterEditMembers.filter(m => m.isStarter);
            const hasStarterPos = starters.some(s => s.starterPos !== undefined);
            if (hasStarterPos) {
                // すでに位置が確定している場合は starterPos 順に並び替え
                starters.sort((a, b) => (a.starterPos || 0) - (b.starterPos || 0));
            }
            // 既存の並び順（配列内の順番 ＝ カスタム配置順）のまま starterPos を 1〜6 で確定する！
            starters.forEach((s, idx) => {
                s.starterPos = idx + 1;
            });
        }
    }
    masterEditMembers.sort((a, b) => a.number - b.number);
    renderMasterMemberRows();
}

function toggleMasterStarter(idx) {
    if (masterEditMembers[idx]) {
        masterEditMembers[idx].isStarter = !masterEditMembers[idx].isStarter;
        if (masterEditMembers[idx].isStarter) {
            // 空いている1〜6のポジションを探して割り当て
            const usedPos = masterEditMembers.filter(m => m.isStarter && m.starterPos).map(m => m.starterPos);
            let assigned = false;
            for (let p = 1; p <= 6; p++) {
                if (!usedPos.includes(p)) {
                    masterEditMembers[idx].starterPos = p;
                    assigned = true;
                    break;
                }
            }
            if (!assigned) {
                masterEditMembers[idx].starterPos = 6;
            }
            masterEditMembers[idx].isLibero = false; // スタメンになる場合はリベロは解除
        } else {
            masterEditMembers[idx].starterPos = undefined;
        }
    }
    renderMasterMemberRows();
}
window.toggleMasterStarter = toggleMasterStarter;

function toggleMasterLibero(idx) {
    if (masterEditMembers[idx]) {
        const isCurrentlyLibero = !!masterEditMembers[idx].isLibero;
        if (!isCurrentlyLibero) {
            const liberoCount = masterEditMembers.filter(m => m.isLibero).length;
            if (liberoCount >= 2) {
                showToast("リベロは最大2人まで登録可能です。");
                return;
            }
            const usedPos = masterEditMembers.filter(m => m.isLibero && m.liberoPos).map(m => m.liberoPos);
            let assignedPos = 1;
            if (usedPos.includes(1)) {
                assignedPos = 2;
            }
            masterEditMembers[idx].isLibero = true;
            masterEditMembers[idx].liberoPos = assignedPos;
            masterEditMembers[idx].isLiberoTarget = false; // リベロなら自動交代対象から外す
        } else {
            masterEditMembers[idx].isLibero = false;
            masterEditMembers[idx].liberoPos = undefined;
        }
    }
    renderMasterMemberRows();
}
window.toggleMasterLibero = toggleMasterLibero;

function toggleMasterLiberoTarget(idx) {
    if (masterEditMembers[idx]) {
        const isTarget = !!masterEditMembers[idx].isLiberoTarget;
        const assigned = masterEditMembers[idx].assignedLibero || 1;
        
        if (!isTarget) {
            // OFF -> L1
            masterEditMembers[idx].isLiberoTarget = true;
            masterEditMembers[idx].assignedLibero = 1;
            masterEditMembers[idx].isLibero = false; // 自動交代対象ならリベロから外す
        } else if (assigned === 1) {
            // L1 -> L2
            masterEditMembers[idx].isLiberoTarget = true;
            masterEditMembers[idx].assignedLibero = 2;
        } else {
            // L2 -> OFF
            masterEditMembers[idx].isLiberoTarget = false;
            masterEditMembers[idx].assignedLibero = undefined;
        }
    }
    renderMasterMemberRows();
}
window.toggleMasterLiberoTarget = toggleMasterLiberoTarget;

function openPresetCourtSetting() {
    const starters = masterEditMembers.filter(m => m.isStarter);
    if (starters.length !== 6) {
        masterEditMembers.forEach((m, idx) => {
            m.isStarter = idx < 6;
        });
        renderMasterMemberRows();
        showToast("スタメン配置用に上位6名を点灯しました。");
    }
    toggleCourtOverlay('preset');
}
window.openPresetCourtSetting = openPresetCourtSetting;

function updateMasterMemberNumber(idx, val) {
    if (masterEditMembers[idx]) {
        masterEditMembers[idx].number = parseInt(val) || 0;
        masterEditMembers.sort((a, b) => a.number - b.number);
        renderMasterMemberRows();
    }
}
window.updateMasterMemberNumber = updateMasterMemberNumber;

function updateMasterMemberName(idx, val) {
    if (masterEditMembers[idx]) {
        masterEditMembers[idx].name = val;
    }
}
window.updateMasterMemberName = updateMasterMemberName;

function renderMasterMemberRows() {
    const list = document.getElementById('master-member-list');
    list.innerHTML = masterEditMembers.map((m, idx) => {
        const isStarter = !!m.isStarter;
        const isLibero = !!m.isLibero;
        const isLiberoTarget = !!m.isLiberoTarget;
        
        const starterBadge = isStarter 
            ? `<button onclick="toggleMasterStarter(${idx})" class="p-1 hover:scale-125 transition-transform flex items-center justify-center shrink-0" title="スタメン解除"><i data-lucide="star" class="w-4 h-4 fill-yellow-400 text-yellow-400"></i></button>` 
            : `<button onclick="toggleMasterStarter(${idx})" class="p-1 text-zinc-600 hover:scale-125 hover:text-yellow-400 transition-all flex items-center justify-center shrink-0" title="スタメン登録"><i data-lucide="star" class="w-4 h-4 text-zinc-600"></i></button>`;
            
        const liberoBadge = isLibero 
            ? `<button onclick="toggleMasterLibero(${idx})" class="p-1 hover:scale-125 transition-transform flex items-center justify-center shrink-0" title="リベロ解除"><i data-lucide="shield" class="w-4 h-4 fill-purple-500 text-purple-500"></i></button>` 
            : `<button onclick="toggleMasterLibero(${idx})" class="p-1 text-zinc-600 hover:scale-125 hover:text-purple-400 transition-all flex items-center justify-center shrink-0" title="リベロ登録"><i data-lucide="shield" class="w-4 h-4 text-zinc-600"></i></button>`;
            
        let liberoTargetBadge = '';
        if (!isLiberoTarget) {
            liberoTargetBadge = `
                <button onclick="toggleMasterLiberoTarget(${idx})" class="h-7 px-1.5 py-0.5 text-zinc-600 hover:text-emerald-400 hover:scale-110 transition-all flex items-center justify-center shrink-0 border border-transparent rounded gap-0.5 text-[9px] font-bold" style="width: 38px;" title="自動交代設定 (現在: OFF)">
                    <i data-lucide="arrow-left-right" class="w-3.5 h-3.5"></i>
                </button>
            `;
        } else {
            const assigned = m.assignedLibero || 1;
            liberoTargetBadge = `
                <button onclick="toggleMasterLiberoTarget(${idx})" class="h-7 px-1.5 py-0.5 text-emerald-400 hover:scale-110 active:scale-95 transition-all flex items-center justify-center shrink-0 border border-emerald-500/20 bg-emerald-500/10 rounded gap-0.5 text-[9px] font-black" style="width: 38px;" title="自動交代設定 (現在: リベロ ${assigned})">
                    <i data-lucide="arrow-left-right" class="w-3.5 h-3.5"></i>L${assigned}
                </button>
            `;
        }
            
        return `
            <div class="flex gap-2 items-center bg-zinc-900/40 p-1.5 rounded-lg border border-white/5">
                <span class="text-xs text-zinc-500 font-bold w-4 text-center">${idx + 1}</span>
                ${starterBadge}
                ${liberoBadge}
                ${liberoTargetBadge}
                <input type="number" value="${m.number}" onchange="updateMasterMemberNumber(${idx}, this.value)" class="w-10 bg-zinc-800 border-none p-1 text-white text-center rounded text-xs font-bold" placeholder="番号">
                <input type="text" value="${m.name}" onchange="updateMasterMemberName(${idx}, this.value)" class="flex-1 bg-zinc-800 border-none p-1 text-white rounded text-xs" placeholder="名前">
                
                <button onclick="deleteMasterMember(${idx})" class="p-1 text-zinc-500 hover:text-red-500 transition-colors flex items-center justify-center" title="削除">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
            </div>
        `;
    }).join('');
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function addMasterMemberRow() {
    const nextNum = masterEditMembers.length > 0 ? Math.max(...masterEditMembers.map(m => m.number)) + 1 : 1;
    masterEditMembers.push({
        id: `M_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        number: nextNum,
        name: `${nextNum}`,
        isStarter: false,
        isLibero: false,
        isLiberoTarget: false,
        liberoPos: undefined
    });
    masterEditMembers.sort((a, b) => a.number - b.number);
    renderMasterMemberRows();
}

function deleteMasterMember(idx) {
    if (masterEditMembers.length <= 6) {
        showToast("コート上の選手が必要なため、メンバーは最低6人必要です。");
        return;
    }
    masterEditMembers.splice(idx, 1);
    renderMasterMemberRows();
}

function saveMasterTeam() {
    const nameVal = document.getElementById('master-team-name').value.trim();
    if (!nameVal) { showCustomAlert("チーム名を入力してください。"); return; }
    
    const starterCount = masterEditMembers.filter(m => m.isStarter).length;
    if (starterCount !== 6) {
        showCustomAlert(`スタメン（星マーク）はちょうど6人選択してください。（現在は ${starterCount} 人選択されています）`);
        return;
    }

    const colorVal = document.getElementById('master-team-color').value;
    const myTeamEl = document.getElementById('master-team-myteam');
    const isMyTeamVal = myTeamEl ? myTeamEl.checked : false;

    let presets = JSON.parse(localStorage.getItem(PRESET_TEAMS_KEY) || '[]');
    
    if (isMyTeamVal) {
        presets.forEach(p => {
            if (p.name !== masterEditOriginalName && p.name !== nameVal) {
                p.isMyTeam = false;
            }
        });
    }

    const newPreset = {
        id: masterEditOriginalName ? (presets.find(p => p.name === masterEditOriginalName)?.id || `p_${Date.now()}`) : `p_${Date.now()}`,
        name: nameVal, color: colorVal, isMyTeam: isMyTeamVal, members: JSON.parse(JSON.stringify(masterEditMembers)),
        updatedAt: Date.now()
    };

    const existingIdx = presets.findIndex(p => p.name === nameVal);
    if (masterEditOriginalName && masterEditOriginalName !== nameVal) {
        const oldIdx = presets.findIndex(p => p.name === masterEditOriginalName);
        if (oldIdx >= 0) presets[oldIdx] = newPreset; else presets.push(newPreset);
    } else if (existingIdx >= 0) presets[existingIdx] = newPreset;
    else presets.push(newPreset);

    localStorage.setItem(PRESET_TEAMS_KEY, JSON.stringify(presets));
    if (typeof pushTeamToCloud === 'function') pushTeamToCloud(newPreset);
    showToast(`チームマスター「${nameVal}」を保存しました`);
    
    if (state.teamA === masterEditOriginalName || state.teamA === nameVal) {
        state.teamA = nameVal; state.colorA = colorVal;
        loadPresetToTeam('A', nameVal);
    }
    if (state.teamB === masterEditOriginalName || state.teamB === nameVal) {
        state.teamB = nameVal; state.colorB = colorVal;
        loadPresetToTeam('B', nameVal);
    }
    
    saveState();
    updateUI();
    toggleMembers();
}

async function deleteMasterTeam() {
    if (!masterEditOriginalName) return;
    
    const confirmed = await showCustomConfirm(`チーム「${masterEditOriginalName}」をマスターから削除しますか？`);
    if (!confirmed) return;

    let teams = JSON.parse(localStorage.getItem(PRESET_TEAMS_KEY) || '[]');
    teams = teams.filter(t => t.name !== masterEditOriginalName);
    localStorage.setItem(PRESET_TEAMS_KEY, JSON.stringify(teams));
    if (typeof deleteTeamOnCloud === 'function') deleteTeamOnCloud(masterEditOriginalName);

    showToast(`チーム「${masterEditOriginalName}」を削除しました`);
    toggleMembers();
}
