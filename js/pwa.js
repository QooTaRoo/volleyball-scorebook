// --- PWA, Timer & Sharing ---

let timerInterval = null;
function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(updateTimer, 1000);
}

function updateTimer() {
    if (!state.matchStartTime) return;
    const diff = Math.floor((Date.now() - state.matchStartTime) / 1000);
    const m = Math.floor(diff / 60);
    const s = diff % 60;
    const el = document.getElementById('match-timer');
    if (el) el.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// Timeout Timer
let timeoutTimerInterval = null;
let timeoutRemainingSeconds = 0;

function startTimeoutTimer(team) {
    const duration = state.timeoutDuration || 30;
    timeoutRemainingSeconds = duration;
    
    const modal = document.getElementById('timeout-timer-modal');
    const teamLabel = document.getElementById('timeout-timer-team');
    const secLabel = document.getElementById('timeout-timer-sec');
    const progress = document.getElementById('timeout-timer-progress');
    
    const teamName = team === 'A' ? state.teamA : state.teamB;
    const teamColor = team === 'A' ? state.colorA : state.colorB;
    
    if (teamLabel) {
        teamLabel.textContent = `${teamName} タイムアウト`;
        teamLabel.style.color = teamColor || "#ffffff";
    }
    if (secLabel) secLabel.textContent = timeoutRemainingSeconds;
    if (progress) {
        progress.style.transitionDuration = '0s';
        progress.style.width = '100%';
        setTimeout(() => { progress.style.transitionDuration = '1s'; }, 50);
    }
    
    if (modal) modal.classList.remove('hidden');
    if (timeoutTimerInterval) clearInterval(timeoutTimerInterval);
    
    timeoutTimerInterval = setInterval(() => {
        timeoutRemainingSeconds--;
        if (secLabel) secLabel.textContent = timeoutRemainingSeconds;
        if (progress) {
            const pct = (timeoutRemainingSeconds / duration) * 100;
            progress.style.width = `${pct}%`;
        }
        if (timeoutRemainingSeconds <= 0) {
            vibrate(1000);
            stopTimeoutTimer();
            showToast("タイムアウト終了");
        }
    }, 1000);
}

function stopTimeoutTimer() {
    if (timeoutTimerInterval) {
        clearInterval(timeoutTimerInterval);
        timeoutTimerInterval = null;
    }
    const modal = document.getElementById('timeout-timer-modal');
    if (modal) modal.classList.add('hidden');
}

function registerPWA() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').catch(console.error);
    }
}

async function shareContainerAsImage(containerId, filename = 'share.png') {
    if (typeof html2canvas === 'undefined') {
        alert("画像化ライブラリの読み込みに失敗しました。");
        return;
    }

    const container = document.getElementById(containerId);
    if (!container) return;

    const timelineContainers = container.querySelectorAll('.timeline-container');
    const originalStyles = [];
    let maxWidth = container.offsetWidth;

    timelineContainers.forEach((tc) => {
        originalStyles.push({ el: tc, overflowX: tc.style.overflowX, width: tc.style.width });
        tc.style.overflowX = 'visible'; tc.style.width = 'max-content';
        if (tc.scrollWidth > maxWidth) maxWidth = tc.scrollWidth;
    });

    const origStyle = { width: container.style.width, overflowY: container.style.overflowY, overflowX: container.style.overflowX, height: container.style.height };
    container.style.width = maxWidth + 40 + 'px'; container.style.height = 'max-content';
    container.style.overflowY = 'visible'; container.style.overflowX = 'visible';

    try {
        await new Promise(r => setTimeout(r, 100));
        const canvas = await html2canvas(container, { backgroundColor: '#1a1a1a', scale: 2, windowWidth: maxWidth + 40 });
        canvas.toBlob(async (blob) => {
            const file = new File([blob], filename, { type: 'image/png' });
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                try { await navigator.share({ title: 'バレーボール スコア', files: [file] }); } catch (err) { if (err.name !== 'AbortError') alert("共有に失敗しました: " + err.message); }
            } else {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
            }
        });
    } catch (err) {
        alert("画像生成失敗: " + err.message);
    } finally {
        container.style.width = origStyle.width; container.style.height = origStyle.height;
        container.style.overflowY = origStyle.overflowY; container.style.overflowX = origStyle.overflowX;
        originalStyles.forEach(orig => { orig.el.style.overflowX = orig.overflowX; orig.el.style.width = orig.width; });
    }
}
// Screen Wake Lock
let wakeLock = null;
async function keepScreenOn() {
    if ('wakeLock' in navigator) {
        try {
            wakeLock = await navigator.wakeLock.request('screen');
        } catch (err) {
            console.warn(`Wake Lock error: ${err.name}, ${err.message}`);
        }
    }
}

// Re-acquire wake lock when page becomes visible
document.addEventListener('visibilitychange', async () => {
    if (wakeLock !== null && document.visibilityState === 'visible') {
        keepScreenOn();
    }
});
