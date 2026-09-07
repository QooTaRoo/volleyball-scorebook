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

async function shareContainerAsImage(containerId, filename = 'share.png', customTitle = null) {
    if (typeof html2canvas === 'undefined') {
        showCustomAlert("画像化ライブラリの読み込みに失敗しました。");
        return;
    }

    const container = document.getElementById(containerId);
    if (!container) return;

    // --- 寸法計測（同期処理：ブラウザは再描画しない） ---
    const timelineContainers = container.querySelectorAll('.timeline-container');
    let maxWidth = container.offsetWidth;

    // 一時的にスタイル変更して正しい寸法を取得
    const tcOriginals = [];
    timelineContainers.forEach((tc) => {
        tcOriginals.push({
            overflowX: tc.style.overflowX, overflowY: tc.style.overflowY,
            width: tc.style.width, paddingBottom: tc.style.paddingBottom
        });
        tc.style.overflowX = 'visible';
        tc.style.overflowY = 'visible';
        tc.style.width = 'max-content';
        tc.style.paddingBottom = '24px';
        const rowWidth = tc.parentElement?.classList?.contains('flex') ? (tc.scrollWidth + 80) : tc.scrollWidth;
        if (rowWidth > maxWidth) maxWidth = rowWidth;
    });

    const origW = container.style.width, origH = container.style.height;
    const origOY = container.style.overflowY, origOX = container.style.overflowX;
    const origPB = container.style.paddingBottom, origBS = container.style.boxSizing;

    container.style.width = (maxWidth + 48) + 'px';
    container.style.height = 'max-content';
    container.style.overflowY = 'visible';
    container.style.overflowX = 'visible';
    container.style.paddingBottom = '36px';
    container.style.boxSizing = 'border-box';

    // scrollWidth/Height の読み取りで同期レイアウト強制（再描画は発生しない）
    const captureW = container.scrollWidth;
    const captureH = container.scrollHeight;

    // 即座に復元（ここまで同期なのでブラウザは一度も画面を再描画しない）
    container.style.width = origW;
    container.style.height = origH;
    container.style.overflowY = origOY;
    container.style.overflowX = origOX;
    container.style.paddingBottom = origPB;
    container.style.boxSizing = origBS;
    timelineContainers.forEach((tc, i) => {
        tc.style.overflowX = tcOriginals[i].overflowX;
        tc.style.overflowY = tcOriginals[i].overflowY;
        tc.style.width = tcOriginals[i].width;
        tc.style.paddingBottom = tcOriginals[i].paddingBottom;
    });

    // --- キャプチャ（クローンDOM上のみでスタイル展開） ---
    try {
        const canvas = await html2canvas(container, {
            backgroundColor: '#1a1a1a',
            scale: 2,
            width: captureW,
            height: captureH,
            windowWidth: captureW + 100,
            windowHeight: captureH + 100,
            scrollY: 0,
            scrollX: 0,
            useCORS: true,
            logging: false,
            onclone: (clonedDoc) => {
                // クローンのコンテナとタイムラインを展開（実画面には影響しない）
                const cc = clonedDoc.getElementById(containerId);
                if (cc) {
                    cc.style.width = (maxWidth + 48) + 'px';
                    cc.style.height = 'max-content';
                    cc.style.overflowY = 'visible';
                    cc.style.overflowX = 'visible';
                    cc.style.paddingBottom = '36px';
                    cc.style.boxSizing = 'border-box';
                    cc.querySelectorAll('.timeline-container').forEach(tc => {
                        tc.style.overflowX = 'visible';
                        tc.style.overflowY = 'visible';
                        tc.style.width = 'max-content';
                        tc.style.paddingBottom = '24px';
                    });
                }

                // Lucide SVGアイコンをテキスト絵文字に置換
                const iconMap = {
                    'clock': '🕐', 'layers': '📚', 'calendar': '📅',
                    'activity': '📊', 'trending-up': '📈', 'share-2': '🔗',
                    'qr-code': '📱', 'trash-2': '🗑', 'chevron-down': '▼',
                    'star': '⭐', 'shield': '🛡', 'arrow-left-right': '⇄', 'rotate-cw': '↻',
                };
                clonedDoc.querySelectorAll('svg[data-lucide], i[data-lucide]').forEach(icon => {
                    const name = icon.getAttribute('data-lucide');
                    const emoji = iconMap[name] || '';
                    const iconW = icon.classList.contains('w-4') ? 16 : 14;
                    const iconH = icon.classList.contains('h-4') ? 16 : 14;
                    const span = clonedDoc.createElement('span');
                    span.textContent = emoji;
                    span.style.cssText = `
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        width: ${iconW}px;
                        height: ${iconH}px;
                        font-size: ${iconW - 4}px;
                        line-height: 1;
                        flex-shrink: 0;
                        vertical-align: middle;
                        margin-top: 4px;
                    `;
                    icon.replaceWith(span);
                });

                // color-boxのテキスト中央描画（Canvas 2D API）
                clonedDoc.querySelectorAll('.color-box').forEach(el => {
                    const isBig = el.classList.contains('w-12') || el.classList.contains('h-10');
                    const isTimeout = el.classList.contains('t-box');
                    const text = el.textContent.trim();
                    const w = isBig ? 48 : 28;
                    const h = isBig ? 40 : 28;
                    const isMr = el.classList.contains('mr-4');
                    const fs = isBig ? 20 : (isTimeout ? 10 : 14);
                    const bg = el.style.background || el.style.backgroundColor || '#ccc';
                    const clr = el.style.color || '#000';

                    const cvs = document.createElement('canvas');
                    const scale = 2;
                    cvs.width = w * scale;
                    cvs.height = h * scale;
                    cvs.style.width = w + 'px';
                    cvs.style.height = h + 'px';
                    cvs.style.display = 'block';

                    const ctx = cvs.getContext('2d');
                    ctx.fillStyle = bg;
                    if (isTimeout) {
                        ctx.beginPath();
                        ctx.arc(cvs.width / 2, cvs.height / 2, Math.min(cvs.width, cvs.height) / 2, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.strokeStyle = '#000';
                        ctx.lineWidth = 3;
                        ctx.stroke();
                    } else {
                        const r = 8;
                        ctx.beginPath();
                        ctx.roundRect(0, 0, cvs.width, cvs.height, r);
                        ctx.fill();
                    }
                    ctx.fillStyle = clr;
                    ctx.font = `800 ${fs * scale}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(text, cvs.width / 2, cvs.height / 2 - (fs * scale * 0.002));

                    el.className = '';
                    el.style.cssText = `
                        width: ${w}px;
                        height: ${h}px;
                        margin: ${isMr ? '0 16px 0 0' : (isBig ? '0' : '0 2px')};
                        padding: 0;
                        overflow: hidden;
                        flex-shrink: 0;
                        background: transparent;
                        border: none;
                        border-radius: 0;
                    `;
                    el.innerHTML = '';
                    el.appendChild(cvs);
                });
            }
        });
        canvas.toBlob(async (blob) => {
            if (!blob) {
                showCustomAlert("画像の生成に失敗しました。");
                return;
            }
            const file = new File([blob], filename, { type: 'image/png' });
            
            // シェア用タイトル（チームA 得点 - 得点 チームB）の決定
            let shareTitle = customTitle;
            if (!shareTitle) {
                if (containerId.startsWith('history-item-')) {
                    const idxStr = containerId.replace('history-item-', '');
                    const idx = parseInt(idxStr, 10);
                    const historyList = (typeof history !== 'undefined' && Array.isArray(history)) ? history : JSON.parse(localStorage.getItem('volleyball_match_history') || '[]');
                    const m = historyList[idx];
                    if (m) {
                        shareTitle = `${m.teamA} ${m.setsA} - ${m.setsB} ${m.teamB}`;
                    }
                } else if (containerId === 'analysis-content') {
                    if (typeof currentAnalysisIndex !== 'undefined' && currentAnalysisIndex >= 0) {
                        const historyList = (typeof history !== 'undefined' && Array.isArray(history)) ? history : JSON.parse(localStorage.getItem('volleyball_match_history') || '[]');
                        const m = historyList[currentAnalysisIndex];
                        if (m) shareTitle = `${m.teamA} ${m.setsA} - ${m.setsB} ${m.teamB}`;
                    }
                }
                if (!shareTitle && typeof state !== 'undefined' && state) {
                    const nameA = state.teamA || 'チームA';
                    const nameB = state.teamB || 'チームB';
                    shareTitle = `${nameA} ${state.setsA} - ${state.setsB} ${nameB}`;
                }
            }
            if (!shareTitle) shareTitle = 'バレーボール スコア';

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                try {
                    await navigator.share({ title: shareTitle, text: shareTitle, files: [file] });
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
