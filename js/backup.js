// --- Data Backup & Migration (Import/Export) ---

function downloadJSON(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

function exportTeams() {
    try {
        const teams = JSON.parse(localStorage.getItem(PRESET_TEAMS_KEY) || '[]');
        if (teams.length === 0) { alert("エクスポートするチームデータがありません。"); return; }
        
        const data = {
            type: "teams",
            version: "1.0",
            exportDate: new Date().toISOString(),
            teams: teams
        };
        downloadJSON(data, `vb_teams_backup_${new Date().toISOString().split('T')[0]}.json`);
        showToast("チーム設定をエクスポートしました");
    } catch (err) {
        alert("チームのエクスポートに失敗しました: " + err.message);
    }
}

function exportHistory() {
    try {
        const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
        if (history.length === 0) { alert("エクスポートする試合履歴がありません。"); return; }

        const data = {
            type: "history",
            version: "1.0",
            exportDate: new Date().toISOString(),
            history: history
        };
        downloadJSON(data, `vb_history_backup_${new Date().toISOString().split('T')[0]}.json`);
        showToast("試合履歴をエクスポートしました");
    } catch (err) {
        alert("履歴のエクスポートに失敗しました: " + err.message);
    }
}

function importTeams() {
    handleFileUpload((data) => {
        if (!data.teams) throw new Error("チームデータが含まれていません");
        if (!confirm("チーム設定をインポートしますか？\n(同名のチームは上書きされます)")) return;

        let localTeams = JSON.parse(localStorage.getItem(PRESET_TEAMS_KEY) || '[]');
        data.teams.forEach(remoteTeam => {
            const idx = localTeams.findIndex(t => t.name === remoteTeam.name);
            if (idx >= 0) localTeams[idx] = remoteTeam;
            else localTeams.push(remoteTeam);
        });
        localStorage.setItem(PRESET_TEAMS_KEY, JSON.stringify(localTeams));
        showToast("チーム設定をインポートしました");
    });
}

function importHistory() {
    handleFileUpload((data) => {
        if (!data.history) throw new Error("試合履歴が含まれていません");
        if (!confirm("試合履歴をインポートしますか？\n(重複しないデータのみ追加されます)")) return;

        let localHistory = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
        data.history.forEach(remoteMatch => {
            const isDuplicate = localHistory.some(m => m.date === remoteMatch.date && m.teamA === remoteMatch.teamA && m.teamB === remoteMatch.teamB);
            if (!isDuplicate) {
                localHistory.push(remoteMatch);
            }
        });
        localHistory.sort((a, b) => new Date(b.date) - new Date(a.date));
        localStorage.setItem(HISTORY_KEY, JSON.stringify(localHistory));
        
        showToast("試合履歴をインポートしました");
        if (!document.getElementById('history-modal').classList.contains('hidden')) renderHistory();
    });
}

function handleFileUpload(callback) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                callback(data);
            } catch (err) {
                alert("ファイルの読み込みに失敗しました: " + err.message);
            }
        };
        reader.readAsText(file);
    };
    input.click();
}
