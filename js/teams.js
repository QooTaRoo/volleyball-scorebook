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
    const p = presets.find(item => item.name === presetName);
    if (p && Array.isArray(p.members)) {
        const members = p.members.map((pm, i) => ({
            id: `${teamCode}${i+1}`,
            number: pm.number,
            name: pm.name
        }));
        
        while (members.length < 6) {
            const nextNum = members.length + 1;
            members.push({ id: `${teamCode}${nextNum}`, number: nextNum, name: `${nextNum}` });
        }
        
        if (teamCode === 'A') {
            state.membersA = members;
            state.lineupA = members.slice(0, 6).map(m => m.id);
            state.isMyTeamA = !!p.isMyTeam;
        } else {
            state.membersB = members;
            state.lineupB = members.slice(0, 6).map(m => m.id);
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
        masterEditMembers = Array.from({length: 12}, (_, i) => ({ id: `M${i+1}`, number: i + 1, name: `${i+1}` }));
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
                masterEditMembers.push({ id: `M${nextNum}`, number: nextNum, name: `${nextNum}` });
            }
        }
    }
    renderMasterMemberRows();
}

function renderMasterMemberRows() {
    const list = document.getElementById('master-member-list');
    list.innerHTML = masterEditMembers.map((m, idx) => {
        const isStarter = idx < 6;
        const starterBadge = isStarter 
            ? `<span class="text-[8px] bg-yellow-500/20 text-yellow-400 font-bold px-1.5 py-0.5 rounded border border-yellow-500/25">スタメン</span>` 
            : `<span class="text-[8px] bg-zinc-800/40 text-zinc-500 font-bold px-1.5 py-0.5 rounded border border-zinc-800">控え</span>`;
            
        return `
            <div class="flex gap-2 items-center bg-zinc-900/40 p-1.5 rounded-lg border border-white/5">
                <span class="text-xs text-zinc-500 font-bold w-4 text-center">${idx + 1}</span>
                ${starterBadge}
                <input type="number" value="${m.number}" onchange="masterEditMembers[${idx}].number = parseInt(this.value) || 0" class="w-10 bg-zinc-800 border-none p-1 text-white text-center rounded text-xs font-bold" placeholder="番号">
                <input type="text" value="${m.name}" onchange="masterEditMembers[${idx}].name = this.value" class="flex-1 bg-zinc-800 border-none p-1 text-white rounded text-xs" placeholder="名前">
                
                <!-- Reorder buttons -->
                <div class="flex flex-col">
                    <button onclick="moveMasterMember(${idx}, -1)" ${idx === 0 ? 'disabled' : ''} class="text-zinc-500 hover:text-zinc-300 disabled:opacity-30 disabled:pointer-events-none p-0.5">
                        <i data-lucide="chevron-up" class="w-3.5 h-3.5"></i>
                    </button>
                    <button onclick="moveMasterMember(${idx}, 1)" ${idx === masterEditMembers.length - 1 ? 'disabled' : ''} class="text-zinc-500 hover:text-zinc-300 disabled:opacity-30 disabled:pointer-events-none p-0.5">
                        <i data-lucide="chevron-down" class="w-3.5 h-3.5"></i>
                    </button>
                </div>
                
                <button onclick="deleteMasterMember(${idx})" class="p-1 text-zinc-500 hover:text-red-500 transition-colors flex items-center justify-center" title="削除">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
            </div>
        `;
    }).join('');
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function moveMasterMember(idx, dir) {
    const targetIdx = idx + dir;
    if (targetIdx < 0 || targetIdx >= masterEditMembers.length) return;
    
    // Swap players in the array
    const temp = masterEditMembers[idx];
    masterEditMembers[idx] = masterEditMembers[targetIdx];
    masterEditMembers[targetIdx] = temp;
    
    renderMasterMemberRows();
}

function addMasterMemberRow() {
    const nextNum = masterEditMembers.length > 0 ? Math.max(...masterEditMembers.map(m => m.number)) + 1 : 1;
    masterEditMembers.push({
        id: `M_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        number: nextNum,
        name: `${nextNum}`
    });
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
