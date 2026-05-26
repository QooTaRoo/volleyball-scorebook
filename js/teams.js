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
    list.innerHTML = masterEditMembers.map((m, idx) => `
        <div class="flex gap-2 items-center">
            <span class="text-xs text-zinc-600 font-bold w-5 text-right">${idx + 1}.</span>
            <input type="number" value="${m.number}" onchange="masterEditMembers[${idx}].number = parseInt(this.value) || 0" class="w-14 bg-zinc-800 border-none p-1.5 text-white text-center rounded text-xs font-bold" placeholder="番号">
            <input type="text" value="${m.name}" onchange="masterEditMembers[${idx}].name = this.value" class="flex-1 bg-zinc-800 border-none p-1.5 text-white rounded text-xs" placeholder="名前">
            <button onclick="deleteMasterMember(${idx})" class="p-1 text-zinc-500 hover:text-red-500 transition-colors" title="削除">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
        </div>
    `).join('');
    if (typeof lucide !== 'undefined') lucide.createIcons();
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
