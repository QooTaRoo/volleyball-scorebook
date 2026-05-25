// --- Supabase Cloud Sync Engine ---

const SUPABASE_ENABLED_KEY = 'vb_supabase_enabled';
const SUPABASE_URL_KEY = 'vb_supabase_url';
const SUPABASE_ANON_KEY_KEY = 'vb_supabase_anon_key';

let supabaseInstance = null;

// Initialize Supabase Client
function getSupabaseClient() {
    if (supabaseInstance) return supabaseInstance;

    const enabled = localStorage.getItem(SUPABASE_ENABLED_KEY) === 'true';
    const url = localStorage.getItem(SUPABASE_URL_KEY);
    const key = localStorage.getItem(SUPABASE_ANON_KEY_KEY);

    if (enabled && url && key && typeof supabase !== 'undefined') {
        try {
            supabaseInstance = supabase.createClient(url, key);
            return supabaseInstance;
        } catch (err) {
            console.error("Supabase client creation error:", err);
            return null;
        }
    }
    return null;
}

// Generate unique ID for a match object
function getMatchId(match) {
    if (match.id) return match.id;
    // Fallback: create ID based on date and team names
    return `${match.date}_${match.teamA}_${match.teamB}`.replace(/[\/:\s]/g, '_');
}

// Initialize Sync UI and values on load
function initSync() {
    updateSyncUI();
    
    // Perform silent background sync on startup if enabled
    const client = getSupabaseClient();
    if (client) {
        syncAllData(true); // silent = true
    }
}

// Update settings UI states from localStorage
function updateSyncUI() {
    const toggle = document.getElementById('sync-enable-toggle');
    const urlInput = document.getElementById('supabase-url-input');
    const keyInput = document.getElementById('supabase-key-input');
    const badge = document.getElementById('sync-status-badge');

    if (!toggle) return;

    const enabled = localStorage.getItem(SUPABASE_ENABLED_KEY) === 'true';
    const url = localStorage.getItem(SUPABASE_URL_KEY) || '';
    const key = localStorage.getItem(SUPABASE_ANON_KEY_KEY) || '';

    toggle.checked = enabled;
    urlInput.value = url;
    keyInput.value = key;

    toggleSyncFields();
}

// Toggle field visibilities and update badge
function toggleSyncFields() {
    const toggle = document.getElementById('sync-enable-toggle');
    const container = document.getElementById('sync-fields-container');
    const badge = document.getElementById('sync-status-badge');

    if (!toggle || !container || !badge) return;

    const enabled = toggle.checked;
    localStorage.setItem(SUPABASE_ENABLED_KEY, enabled ? 'true' : 'false');

    if (enabled) {
        container.classList.remove('hidden');
        const url = localStorage.getItem(SUPABASE_URL_KEY);
        const key = localStorage.getItem(SUPABASE_ANON_KEY_KEY);
        if (url && key) {
            badge.textContent = "接続待機";
            badge.className = "text-[9px] font-bold px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400";
        } else {
            badge.textContent = "未設定";
            badge.className = "text-[9px] font-bold px-2 py-0.5 rounded bg-zinc-900 text-zinc-400";
        }
    } else {
        container.classList.add('hidden');
        badge.textContent = "無効";
        badge.className = "text-[9px] font-bold px-2 py-0.5 rounded bg-zinc-900 text-zinc-500";
        supabaseInstance = null;
    }
}

// Test connection and trigger first full sync
async function testAndSyncCloud() {
    const urlInput = document.getElementById('supabase-url-input');
    const keyInput = document.getElementById('supabase-key-input');
    const badge = document.getElementById('sync-status-badge');
    const btn = document.getElementById('supabase-test-btn');

    if (!urlInput || !keyInput || !badge || !btn) return;

    const url = urlInput.value.trim();
    const key = keyInput.value.trim();

    if (!url || !key) {
        showCustomAlert("Supabase URL と anon key を両方入力してください。");
        return;
    }

    // Update UI to connecting
    badge.textContent = "接続中...";
    badge.className = "text-[9px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-400";
    btn.disabled = true;
    const origBtnText = btn.innerHTML;
    btn.innerHTML = `<i data-lucide="loader" class="w-3 h-3 animate-spin"></i> 接続中...`;
    if (typeof lucide !== 'undefined') lucide.createIcons();

    try {
        if (typeof supabase === 'undefined') {
            throw new Error("Supabase SDKが読み込まれていません。ネットワーク接続を確認してください。");
        }

        // Test Client
        const testClient = supabase.createClient(url, key);
        
        // Run a simple query to verify matching table and credentials
        const { data, error } = await testClient.from('matches').select('id').limit(1);

        if (error) {
            throw new Error(`データベース接続エラー: ${error.message}\nテーブル作成SQLが正しく実行されているかご確認ください。`);
        }

        // Save keys on success
        localStorage.setItem(SUPABASE_URL_KEY, url);
        localStorage.setItem(SUPABASE_ANON_KEY_KEY, key);
        localStorage.setItem(SUPABASE_ENABLED_KEY, 'true');
        supabaseInstance = testClient;

        badge.textContent = "接続済み";
        badge.className = "text-[9px] font-bold px-2 py-0.5 rounded bg-green-500/20 text-green-400";
        
        showToast("接続に成功しました！初回同期を開始します。");

        // Run full sync
        await syncAllData(false);

    } catch (err) {
        console.error("Supabase connection failed:", err);
        badge.textContent = "エラー";
        badge.className = "text-[9px] font-bold px-2 py-0.5 rounded bg-red-500/20 text-red-400";
        showCustomAlert(err.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = origBtnText;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
}

// Bidirectional Sync Engine
async function syncAllData(silent = false) {
    const client = getSupabaseClient();
    if (!client) return;

    const badge = document.getElementById('sync-status-badge');
    if (badge) {
        badge.textContent = "同期中...";
        badge.className = "text-[9px] font-bold px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400";
    }

    try {
        // --- 1. SYNC MATCH HISTORY ---
        let localHistory = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
        
        // Inject IDs into local matches that don't have them yet
        let localChanged = false;
        localHistory.forEach(m => {
            if (!m.id) {
                m.id = getMatchId(m);
                localChanged = true;
            }
        });
        if (localChanged) {
            localStorage.setItem(HISTORY_KEY, JSON.stringify(localHistory));
        }

        // Fetch Cloud Matches
        const { data: cloudMatches, error: matchError } = await client.from('matches').select('*');
        if (matchError) throw matchError;

        // Merge matches
        let mergedHistory = [...localHistory];
        
        // Find items in Cloud but not Local
        cloudMatches.forEach(cloudItem => {
            const matchData = cloudItem.data;
            // Inject ID from DB row just in case
            matchData.id = cloudItem.id;
            
            const isLocalPresent = mergedHistory.some(m => m.id === cloudItem.id);
            if (!isLocalPresent) {
                mergedHistory.push(matchData);
            }
        });

        // Sort match history by date descending
        mergedHistory.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Save back to LocalStorage
        localStorage.setItem(HISTORY_KEY, JSON.stringify(mergedHistory));

        // Find items in Local but not Cloud to upload
        for (const localItem of mergedHistory) {
            const isCloudPresent = cloudMatches.some(m => m.id === localItem.id);
            if (!isCloudPresent) {
                await client.from('matches').upsert({ id: localItem.id, data: localItem });
            }
        }


        // --- 2. SYNC PRESET TEAMS ---
        let localTeams = JSON.parse(localStorage.getItem(PRESET_TEAMS_KEY) || '[]');
        
        // Fetch Cloud Teams
        const { data: cloudTeams, error: teamError } = await client.from('teams').select('*');
        if (teamError) throw teamError;

        // Merge teams
        let mergedTeams = [...localTeams];

        // Find items in Cloud but not Local
        cloudTeams.forEach(cloudItem => {
            const teamData = cloudItem.data;
            const isLocalPresent = mergedTeams.some(t => t.name === cloudItem.name);
            if (!isLocalPresent) {
                mergedTeams.push(teamData);
            }
        });

        // Save back to LocalStorage
        localStorage.setItem(PRESET_TEAMS_KEY, JSON.stringify(mergedTeams));

        // Find items in Local but not Cloud to upload
        for (const localTeam of mergedTeams) {
            const isCloudPresent = cloudTeams.some(t => t.name === localTeam.name);
            if (!isCloudPresent) {
                await client.from('teams').upsert({ name: localTeam.name, data: localTeam });
            }
        }

        // --- 3. RE-RENDER UI IF OPEN ---
        if (!silent) {
            showToast("クラウドとの同期が完了しました");
        }
        
        // Refresh UI views if they are currently visible
        if (typeof renderHistory === 'function' && document.getElementById('history-modal') && !document.getElementById('history-modal').classList.contains('hidden')) {
            renderHistory();
        }
        if (typeof renderMasterTeamsList === 'function') {
            renderMasterTeamsList();
        }

        if (badge) {
            badge.textContent = "同期完了";
            badge.className = "text-[9px] font-bold px-2 py-0.5 rounded bg-green-500/20 text-green-400";
        }

    } catch (err) {
        console.error("Background sync error:", err);
        if (badge) {
            badge.textContent = "同期エラー";
            badge.className = "text-[9px] font-bold px-2 py-0.5 rounded bg-red-500/20 text-red-400";
        }
        if (!silent) {
            showToast("同期に失敗しました: " + err.message);
        }
    }
}

// Background Cloud Upsert Helpers
async function pushMatchToCloud(match) {
    const client = getSupabaseClient();
    if (!client) return;

    if (!match.id) match.id = getMatchId(match);

    try {
        const { error } = await client.from('matches').upsert({ id: match.id, data: match });
        if (error) console.error("Cloud push match error:", error);
    } catch (err) {
        console.error("Cloud push match exception:", err);
    }
}

async function pushTeamToCloud(team) {
    const client = getSupabaseClient();
    if (!client) return;

    try {
        const { error } = await client.from('teams').upsert({ name: team.name, data: team });
        if (error) console.error("Cloud push team error:", error);
    } catch (err) {
        console.error("Cloud push team exception:", err);
    }
}

async function deleteMatchOnCloud(matchId) {
    const client = getSupabaseClient();
    if (!client) return;

    try {
        const { error } = await client.from('matches').delete().eq('id', matchId);
        if (error) console.error("Cloud delete match error:", error);
    } catch (err) {
        console.error("Cloud delete match exception:", err);
    }
}

async function deleteTeamOnCloud(teamName) {
    const client = getSupabaseClient();
    if (!client) return;

    try {
        const { error } = await client.from('teams').delete().eq('name', teamName);
        if (error) console.error("Cloud delete team error:", error);
    } catch (err) {
        console.error("Cloud delete team exception:", err);
    }
}

async function clearAllMatchesOnCloud() {
    const client = getSupabaseClient();
    if (!client) return;

    try {
        // Safe delete matching all non-empty strings (deletes everything)
        const { error } = await client.from('matches').delete().neq('id', 'placeholder_for_clear_all');
        if (error) console.error("Cloud clear matches error:", error);
    } catch (err) {
        console.error("Cloud clear matches exception:", err);
    }
}
