// --- Constants ---
const STORAGE_KEY = 'volleyball_score_state';
const HISTORY_KEY = 'volleyball_match_history';
const PRESET_TEAMS_KEY = 'vb_preset_teams';

// --- State ---
let state = {
    teamA: "TEAM A",
    teamB: "TEAM B",
    colorA: "#eab308",
    colorB: "#ffffff",
    scoreA: 0,
    scoreB: 0,
    setsA: 0,
    setsB: 0,
    toA: 0,
    toB: 0,
    currentSet: 1,
    maxSets: 3,
    targetPoints: 25,
    finalSetTarget: 15,
    showAdvancedMode: false,
    maxTimeouts: 2,
    isCourtSwapped: false,
    actionLog: [],
    matchComplete: false,
    setHistory: [],
    matchStartTime: Date.now(),
    timeoutDuration: 30,
    membersA: Array.from({length: 14}, (_, i) => ({ id: `A${i+1}`, number: i + 1, name: `${i+1}` })),
    membersB: Array.from({length: 14}, (_, i) => ({ id: `B${i+1}`, number: i + 1, name: `${i+1}` })),
    lineupA: ["A1", "A2", "A3", "A4", "A5", "A6"],
    lineupB: ["B1", "B2", "B3", "B4", "B5", "B6"],
    liberoA: null,
    liberoB: null,
    servingTeam: 'A',
    rotationLog: []
};

function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function vibrate(ms) {
    if (navigator.vibrate) navigator.vibrate(ms);
}

function isAnyModalOpen() {
    return Array.from(document.querySelectorAll('[id$="-modal"]')).some(m => !m.classList.contains('hidden'));
}

// Global reference for Wake Lock
let wakeLock = null;

async function keepScreenOn() {
    if ('wakeLock' in navigator) {
        try {
            wakeLock = await navigator.wakeLock.request('screen');
            wakeLock.addEventListener('release', () => {
                console.log('Wake Lock was released');
            });
        } catch (err) {
            console.error(`${err.name}, ${err.message}`);
        }
    }
}

// Wake Lock Re-acquisition on Visibility Change (Requirement 3)
document.addEventListener('visibilitychange', async () => {
    if (wakeLock !== null && document.visibilityState === 'visible') {
        keepScreenOn();
    }
});
