// --- App Initialization & Global Handlers ---

function toggleServingTeam() {
    if (state.matchComplete) return;
    vibrate(30);
    state.servingTeam = state.servingTeam === 'A' ? 'B' : 'A';
    updateUI();
}

// Initialize App
function init() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        const loadedState = JSON.parse(saved);
        state = Object.assign(state, loadedState);
        updateUI();
    } else {
        if (typeof applySettings === 'function') applySettings(true);
    }
    
    if (typeof lucide !== 'undefined') lucide.createIcons();
    
    if (typeof registerPWA === 'function') registerPWA();
    if (typeof keepScreenOn === 'function') keepScreenOn();
    if (typeof startTimer === 'function') startTimer();
    if (typeof initRadialEvents === 'function') initRadialEvents();
    
    // Session Check: Show menu if match not started OR long time passed
    const lastAccess = localStorage.getItem('vb_last_access');
    const now = Date.now();
    const isTimeout = lastAccess && (now - parseInt(lastAccess) > 1000 * 60 * 60 * 12); // 12 hours
    localStorage.setItem('vb_last_access', now.toString());

    if (typeof toggleMainMenu === 'function') {
        if (!state.matchStartTime || isTimeout) {
            toggleMainMenu(true);
        }
    }
    
    // Handle window resize for orientation
    window.addEventListener('resize', updateUI);
}

// Start Initialization
document.addEventListener('DOMContentLoaded', init);
