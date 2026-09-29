// --- App Initialization & Global Handlers ---

function toggleServingTeam() {
    if (state.matchComplete) return;
    vibrate(30);
    state.servingTeam = state.servingTeam === 'A' ? 'B' : 'A';
    updateUI();
}

// Initialize App
function init() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const loadedState = JSON.parse(saved);
                state = Object.assign(state, loadedState);
            } catch (err) {
                console.error("Failed to parse saved state:", err);
            }
        }
        
        if (typeof updateUI === 'function') {
            try {
                updateUI();
            } catch (err) {
                console.error("Error during initial updateUI:", err);
            }
        } else if (typeof applySettings === 'function') {
            applySettings(true);
        }
    } catch (e) {
        console.error("Unexpected error loading state in init:", e);
    }
    
    if (typeof lucide !== 'undefined') {
        try { lucide.createIcons(); } catch (e) { console.error("Lucide icon error:", e); }
    }
    
    if (typeof registerPWA === 'function') registerPWA();
    if (typeof keepScreenOn === 'function') keepScreenOn();
    if (typeof startTimer === 'function') startTimer();
    if (typeof initRadialEvents === 'function') initRadialEvents();
    if (typeof initQRShare === 'function') initQRShare();
    
    // Session Check: Show menu if match not started OR long time passed
    try {
        const lastAccess = localStorage.getItem('vb_last_access');
        const now = Date.now();
        const isTimeout = lastAccess && (now - parseInt(lastAccess) > 1000 * 60 * 60 * 12); // 12 hours
        localStorage.setItem('vb_last_access', now.toString());

        if (typeof toggleMainMenu === 'function') {
            if (!state.matchStartTime || isTimeout) {
                toggleMainMenu(true);
            }
        }
    } catch (e) {
        console.error("Session check error:", e);
    }
    
    // Handle window resize for orientation
    window.addEventListener('resize', () => {
        if (typeof updateUI === 'function') updateUI();
    });
}

// Start Initialization
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
