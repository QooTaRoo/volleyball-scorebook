// --- PWA, Timer & Sharing ---

let timerInterval = null;
function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(updateTimer, 1000);
}

function updateTimer() {
    const el = document.getElementById('match-timer');
    if (!state.matchStartTime) {
        if (el) el.textContent = "00:00";
        return;
    }
    const diff = Math.floor((Date.now() - state.matchStartTime) / 1000);
    const m = Math.floor(diff / 60);
    const s = diff % 60;
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
        showCustomAlert("画像化ライブラリの読み込みに失敗しました。");
        return;
    }

    const container = document.getElementById(containerId);
    if (!container) return;

    const timelineContainers = container.querySelectorAll('.timeline-container');
    const originalStyles = [];
    let maxWidth = container.offsetWidth;

    timelineContainers.forEach((tc) => {
        originalStyles.push({ 
            el: tc, 
            overflowX: tc.style.overflowX, 
            overflowY: tc.style.overflowY,
            width: tc.style.width,
            paddingBottom: tc.style.paddingBottom
        });
        tc.style.overflowX = 'visible'; 
        tc.style.overflowY = 'visible';
        tc.style.width = 'max-content';
        tc.style.paddingBottom = '24px';
        if (tc.scrollWidth > maxWidth) maxWidth = tc.scrollWidth;
    });

    const origStyle = { 
        width: container.style.width, 
        overflowY: container.style.overflowY, 
        overflowX: container.style.overflowX, 
        height: container.style.height,
        paddingBottom: container.style.paddingBottom,
        boxSizing: container.style.boxSizing
    };
    
    container.style.width = (maxWidth + 48) + 'px'; 
    container.style.height = 'max-content';
    container.style.overflowY = 'visible'; 
    container.style.overflowX = 'visible';
    container.style.paddingBottom = '36px';
    container.style.boxSizing = 'border-box';

    try {
        await new Promise(r => setTimeout(r, 150));
        const canvas = await html2canvas(container, { 
            backgroundColor: '#1a1a1a', 
            scale: 2, 
            width: container.scrollWidth,
            height: container.scrollHeight,
            windowWidth: container.scrollWidth + 100,
            windowHeight: container.scrollHeight + 100,
            scrollY: 0,
            scrollX: 0,
            useCORS: true,
            logging: false,
            onclone: (clonedDoc) => {
                clonedDoc.querySelectorAll('.color-box').forEach(el => {
                    el.style.display = 'inline-block';
                    el.style.textAlign = 'center';
                    el.style.padding = '0';
                    el.style.verticalAlign = 'middle';
                    el.style.boxSizing = 'border-box';
                    
                    if (el.classList.contains('w-12') || el.classList.contains('h-10')) {
                        el.style.lineHeight = '40px';
                        el.style.height = '40px';
                        el.style.width = '48px';
                    } else {
                        el.style.lineHeight = '28px';
                        el.style.height = '28px';
                        el.style.width = '28px';
                    }
                });
                clonedDoc.querySelectorAll('.box-digit').forEach(el => {
                    el.style.display = 'inline';
                    el.style.position = 'static';
                    el.style.lineHeight = 'inherit';
                });
            }
        });
        canvas.toBlob(async (blob) => {
            if (!blob) {
                showCustomAlert("画像の生成に失敗しました。");
                return;
            }
            const file = new File([blob], filename, { type: 'image/png' });
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                try { 
                    await navigator.share({ title: 'バレーボール スコア', files: [file] }); 
                } catch (err) { 
                    if (err.name !== 'AbortError') showCustomAlert("共有に失敗しました: " + err.message); 
                }
            } else {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a'); 
                a.href = url; 
                a.download = filename; 
                a.click(); 
                URL.revokeObjectURL(url);
            }
        });
    } catch (err) {
        showCustomAlert("画像生成失敗: " + err.message);
    } finally {
        container.style.width = origStyle.width; 
        container.style.height = origStyle.height;
        container.style.overflowY = origStyle.overflowY; 
        container.style.overflowX = origStyle.overflowX;
        container.style.paddingBottom = origStyle.paddingBottom;
        container.style.boxSizing = origStyle.boxSizing;
        originalStyles.forEach(orig => { 
            orig.el.style.overflowX = orig.overflowX; 
            orig.el.style.overflowY = orig.overflowY;
            orig.el.style.width = orig.width; 
            orig.el.style.paddingBottom = orig.paddingBottom;
        });
    }
}
// Screen Wake Lock
let wakeLock = null;
async function keepScreenOn() {
    if (!('wakeLock' in navigator)) return;
    try {
        wakeLock = await navigator.wakeLock.request('screen');
        wakeLock.addEventListener('release', () => { wakeLock = null; });
    } catch (err) {
        console.warn(`Wake Lock error: ${err.message}`);
    }
}

document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState === 'visible') {
        keepScreenOn();
    }
});
