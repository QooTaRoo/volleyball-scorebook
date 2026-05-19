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
        const members = Array.from({length: 14}, (_, i) => {
            const pm = p.members[i];
            return { id: `${teamCode}${i+1}`, number: pm ? pm.number : (i + 1), name: pm ? pm.name : `${i+1}` };
        });
        if (teamCode === 'A') { state.membersA = members; state.lineupA = ["A1", "A2", "A3", "A4", "A5", "A6"]; }
        else { state.membersB = members; state.lineupB = ["B1", "B2", "B3", "B4", "B5", "B6"]; }
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
    if (!presetName) {
        document.getElementById('master-team-name').value = "";
        document.getElementById('master-team-color').value = "#3b82f6";
        masterEditMembers = Array.from({length: 14}, (_, i) => ({ id: `M${i+1}`, number: i + 1, name: `${i+1}` }));
    } else {
        const presets = JSON.parse(localStorage.getItem(PRESET_TEAMS_KEY) || '[]');
        const p = presets.find(item => item.name === presetName);
        if (p) {
            document.getElementById('master-team-name').value = p.name;
            document.getElementById('master-team-color').value = p.color || "#3b82f6";
            let arr = JSON.parse(JSON.stringify(p.members || []));
            while (arr.length < 14) arr.push({ id: `M${arr.length+1}`, number: arr.length + 1, name: `${arr.length + 1}` });
            masterEditMembers = arr.slice(0, 14);
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
            <input type="text" value="${m.name}" onchange="masterEditMembers[${idx}].name = this.value" class="flex-1 bg-zinc-800 border-none p-1.5 text-white rounded text-xs" placeholder="名前 (未入力可)">
        </div>
    `).join('');
}

function saveMasterTeam() {
    const nameVal = document.getElementById('master-team-name').value.trim();
    if (!nameVal) { showCustomAlert("チーム名を入力してください。"); return; }
    const colorVal = document.getElementById('master-team-color').value;

    let presets = JSON.parse(localStorage.getItem(PRESET_TEAMS_KEY) || '[]');
    const newPreset = {
        id: masterEditOriginalName ? (presets.find(p => p.name === masterEditOriginalName)?.id || `p_${Date.now()}`) : `p_${Date.now()}`,
        name: nameVal, color: colorVal, members: JSON.parse(JSON.stringify(masterEditMembers))
    };

    const existingIdx = presets.findIndex(p => p.name === nameVal);
    if (masterEditOriginalName && masterEditOriginalName !== nameVal) {
        const oldIdx = presets.findIndex(p => p.name === masterEditOriginalName);
        if (oldIdx >= 0) presets[oldIdx] = newPreset; else presets.push(newPreset);
    } else if (existingIdx >= 0) presets[existingIdx] = newPreset;
    else presets.push(newPreset);

    localStorage.setItem(PRESET_TEAMS_KEY, JSON.stringify(presets));
    showToast(`チームマスター「${nameVal}」を保存しました`);
    
    // Sync if currently active
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

    showToast(`チーム「${masterEditOriginalName}」を削除しました`);
    toggleMembers();
}
