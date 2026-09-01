// --- QR Code Score Sharing & Scanning Engine ---

let currentShareUrl = '';
let currentShareMatch = null;
let scannerStream = null;
let scannerAnimFrame = null;
let currentCameraFacing = 'environment';
let pendingImportMatch = null;

// --- Data Packing & Compression ---

function packMatchData(match) {
    if (!match) return '';
    
    // Create ultra-compact data structure (< 350 characters after LZ-String compression)
    const compact = {
        d: match.date || new Date().toLocaleString(),
        a: match.teamA || 'TEAM A',
        b: match.teamB || 'TEAM B',
        ca: match.colorA || '#eab308',
        cb: match.colorB || '#ffffff',
        sa: match.setsA || 0,
        sb: match.setsB || 0,
        ms: match.maxSets || 3,
        dur: match.durationMinutes || 0,
        srv: match.initialServingTeam || 'A',
        sh: (match.setHistory || []).map(s => ({
            s: s.set,
            a: s.scoreA,
            b: s.scoreB,
            l: (s.log || []).map(act => {
                if (act.type === 'timeout') return 'T' + (act.team || 'A');
                const scTeam = act.scoringTeam || act.team || 'A';
                const pat = act.pattern ? ':' + act.pattern[0] : '';
                const ply = (act.player !== null && act.player !== undefined && act.player !== '') ? ':' + act.player : '';
                return scTeam + pat + ply;
            }).join(',')
        })),
        ma: (match.membersA || []).map(x => [x.number || 0, x.name || '']),
        mb: (match.membersB || []).map(x => [x.number || 0, x.name || ''])
    };

    const jsonStr = JSON.stringify(compact);
    if (typeof LZString !== 'undefined') {
        return LZString.compressToEncodedURIComponent(jsonStr);
    }
    return encodeURIComponent(jsonStr);
}

function unpackMatchData(rawStr) {
    if (!rawStr || typeof rawStr !== 'string') return null;
    let str = rawStr.trim();

    if (str.includes('%23') || str.includes('%3D')) {
        try { str = decodeURIComponent(str); } catch (e) {}
    }

    // Extract payload from URL hash or query param if present
    if (str.includes('#match=')) {
        str = str.split('#match=')[1].split('&')[0];
    } else if (str.includes('?match=')) {
        str = str.split('?match=')[1].split('&')[0];
    } else if (str.includes('#m=')) {
        str = str.split('#m=')[1].split('&')[0];
    } else if (str.includes('?m=')) {
        str = str.split('?m=')[1].split('&')[0];
    }

    let jsonStr = '';
    const lz = typeof LZString !== 'undefined' ? LZString : (typeof window !== 'undefined' ? window.LZString : null);
    if (lz && typeof lz.decompressFromEncodedURIComponent === 'function') {
        try {
            const decomp = lz.decompressFromEncodedURIComponent(str);
            if (decomp) jsonStr = decomp;
        } catch (e) {
            console.warn("LZString decompress error:", e);
        }
    }

    if (!jsonStr) {
        try {
            jsonStr = decodeURIComponent(str);
        } catch (e) {
            jsonStr = str;
        }
    }

    let parsed = null;
    try {
        parsed = JSON.parse(jsonStr);
    } catch (e) {
        try {
            parsed = JSON.parse(decodeURIComponent(jsonStr));
        } catch (e2) {
            console.error("Failed to parse unpacked JSON:", e);
        }
    }

    if (!parsed) return null;

    // 1. Compact format unpacking
    if (parsed.a && parsed.b) {
        const setHistory = (parsed.sh || []).map(s => {
            let log = [];
            if (typeof s.l === 'string' && s.l.length > 0) {
                let aScore = 0;
                let bScore = 0;
                let aTO = 0;
                let bTO = 0;
                const tokens = s.l.split(',');
                tokens.forEach(tok => {
                    if (tok.startsWith('T')) {
                        const team = tok[1] || 'A';
                        if (team === 'A') aTO++; else bTO++;
                        log.push({ type: 'timeout', team, val: team === 'A' ? aTO : bTO, set: s.s });
                    } else {
                        const parts = tok.split(':');
                        const scTeam = parts[0] || 'A';
                        const patternCode = parts[1] || '';
                        const player = parts[2] ? parseInt(parts[2]) : null;
                        if (scTeam === 'A') aScore++; else bScore++;
                        
                        const patternMap = { 's': 'spike', 'b': 'block', 'a': 'ace', 'e': 'error', 'u': 'unknown' };
                        const pattern = patternMap[patternCode] || patternCode || 'unknown';
                        
                        log.push({
                            type: 'point',
                            scoringTeam: scTeam,
                            team: scTeam,
                            val: scTeam === 'A' ? aScore : bScore,
                            pattern: pattern,
                            player: player,
                            set: s.s
                        });
                    }
                });
            } else if (Array.isArray(s.log)) {
                log = s.log;
            }
            return {
                set: s.s,
                scoreA: s.a !== undefined ? s.a : 0,
                scoreB: s.b !== undefined ? s.b : 0,
                log: log
            };
        });

        return {
            date: parsed.d || new Date().toLocaleString(),
            teamA: parsed.a,
            teamB: parsed.b,
            colorA: parsed.ca || '#eab308',
            colorB: parsed.cb || '#ffffff',
            setsA: parsed.sa || 0,
            setsB: parsed.sb || 0,
            maxSets: parsed.ms || 3,
            durationMinutes: parsed.dur || 0,
            initialServingTeam: parsed.srv || 'A',
            setHistory: setHistory,
            membersA: (parsed.ma || []).map((m, idx) => ({ id: `A${idx+1}`, number: m[0], name: m[1] })),
            membersB: (parsed.mb || []).map((m, idx) => ({ id: `B${idx+1}`, number: m[0], name: m[1] }))
        };
    }

    // 2. Standard JSON payload
    if (parsed.d && parsed.t === 'match') {
        return parsed.d;
    }
    if (parsed.teamA && parsed.teamB) {
        return parsed;
    }
    if (parsed.teamA || parsed.date || parsed.setHistory) {
        return parsed;
    }

    return null;
}

// --- QR Sharing (Generate & Show) ---

function shareMatchViaQR(matchData, isLiveMatch = false) {
    let match = matchData;
    if (isLiveMatch || !match) {
        // Construct snapshot from active state
        match = {
            date: new Date().toLocaleString(),
            teamA: state.teamA || "TEAM A",
            teamB: state.teamB || "TEAM B",
            colorA: state.colorA || "#eab308",
            colorB: state.colorB || "#ffffff",
            setsA: state.setsA || 0,
            setsB: state.setsB || 0,
            maxSets: state.maxSets || 3,
            durationMinutes: state.matchStartTime ? Math.floor((Date.now() - state.matchStartTime) / 60000) : 0,
            setHistory: state.matchComplete ? [...state.setHistory] : [...state.setHistory, {
                set: state.currentSet,
                scoreA: state.scoreA,
                scoreB: state.scoreB,
                log: state.actionLog.filter(l => l.set === state.currentSet)
            }],
            membersA: JSON.parse(JSON.stringify(state.membersA || [])),
            membersB: JSON.parse(JSON.stringify(state.membersB || [])),
            initialServingTeam: state.initialServingTeam || 'A'
        };
    }

    currentShareMatch = match;
    const encoded = packMatchData(match);
    if (!encoded) {
        showCustomAlert("試合データの圧縮に失敗しました。");
        return;
    }

    const baseUrl = window.location.href.split('#')[0].split('?')[0];
    currentShareUrl = `${baseUrl}#match=${encoded}`;

    // Update Modal Info
    const titleEl = document.getElementById('qr-share-title');
    const subtitleEl = document.getElementById('qr-share-subtitle');
    const setSummaryEl = document.getElementById('qr-share-set-summary');

    if (titleEl) {
        titleEl.innerHTML = `
            <span style="color: ${match.colorA || '#eab308'}">${match.teamA}</span>
            <span class="text-white mx-2">${match.setsA} - ${match.setsB}</span>
            <span style="color: ${match.colorB || '#ffffff'}">${match.teamB}</span>
        `;
    }
    if (subtitleEl) {
        subtitleEl.textContent = `⏱️ ${match.date} (${match.durationMinutes || 0}分) - ${match.maxSets}セットマッチ`;
    }

    if (setSummaryEl) {
        if (match.setHistory && match.setHistory.length > 0) {
            setSummaryEl.innerHTML = match.setHistory.map(s => `
                <span class="px-2 py-0.5 rounded bg-zinc-800 border border-white/5 font-mono text-[10px] text-zinc-300">
                    SET${s.set}: ${s.scoreA}-${s.scoreB}
                </span>
            `).join('');
            setSummaryEl.classList.remove('hidden');
        } else {
            setSummaryEl.classList.add('hidden');
        }
    }

    // Render Canvas QR
    const canvas = document.getElementById('qr-share-canvas');
    if (canvas) {
        if (typeof QRCode !== 'undefined' && typeof QRCode.toCanvas === 'function') {
            QRCode.toCanvas(canvas, currentShareUrl, {
                width: 240,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#ffffff'
                },
                errorCorrectionLevel: 'L'
            }, (err) => {
                if (err) {
                    console.error("QRCode render error:", err);
                    QRCode.toCanvas(canvas, currentShareUrl, { width: 240, margin: 1, errorCorrectionLevel: 'L' });
                }
            });
        } else {
            console.error("QRCode library not loaded");
            showCustomAlert("QRコードライブラリの読み込みに失敗しました。インターネット接続をご確認の上、ページを再読み込みしてください。");
        }
    }

    const modal = document.getElementById('qr-share-modal');
    if (modal) {
        modal.classList.remove('hidden');
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
}

function closeQRShareModal() {
    const modal = document.getElementById('qr-share-modal');
    if (modal) modal.classList.add('hidden');
}

function copyShareUrl() {
    if (!currentShareUrl) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(currentShareUrl).then(() => {
            showToast("共有URLをクリップボードにコピーしました");
        }).catch(() => {
            fallbackCopy(currentShareUrl);
        });
    } else {
        fallbackCopy(currentShareUrl);
    }
}

function fallbackCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    try {
        document.execCommand('copy');
        showToast("共有URLをコピーしました");
    } catch (e) {
        showCustomAlert("コピーに失敗しました。手動でコピーしてください。");
    }
    document.body.removeChild(textarea);
}

function downloadQRImage() {
    const canvas = document.getElementById('qr-share-canvas');
    if (!canvas) return;
    try {
        const url = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        const filename = `vb_qr_${(currentShareMatch?.teamA || 'teamA')}_vs_${(currentShareMatch?.teamB || 'teamB')}.png`.replace(/[\/:\s]/g, '_');
        a.href = url;
        a.download = filename;
        a.click();
        showToast("QR画像を保存しました");
    } catch (e) {
        showCustomAlert("QR画像の保存に失敗しました: " + e.message);
    }
}

async function webShareQR() {
    if (!currentShareUrl || !currentShareMatch) return;
    const title = `${currentShareMatch.teamA} vs ${currentShareMatch.teamB} (${currentShareMatch.setsA}-${currentShareMatch.setsB})`;
    const text = `バレーボール試合スコア記録 (${currentShareMatch.date})`;
    if (navigator.canShare && navigator.canShare({ url: currentShareUrl })) {
        try {
            await navigator.share({ title, text, url: currentShareUrl });
        } catch (err) {
            if (err.name !== 'AbortError') showCustomAlert("共有に失敗しました: " + err.message);
        }
    } else {
        copyShareUrl();
    }
}

// --- QR Scanning (Camera, File & Text) ---

function openQRScannerModal() {
    const modal = document.getElementById('qr-scanner-modal');
    if (!modal) return;
    modal.classList.remove('hidden');
    if (typeof lucide !== 'undefined') lucide.createIcons();
    startCameraScanner();
}

function closeQRScannerModal() {
    stopCameraScanner();
    const modal = document.getElementById('qr-scanner-modal');
    if (modal) modal.classList.add('hidden');
}

async function startCameraScanner() {
    stopCameraScanner();
    const video = document.getElementById('qr-video-feed');
    const errorMsg = document.getElementById('qr-scanner-error');
    if (errorMsg) errorMsg.classList.add('hidden');

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        if (errorMsg) {
            errorMsg.textContent = "お使いのブラウザはカメラアクセスに対応していません。画像ファイル選択またはURL貼り付けをご利用ください。";
            errorMsg.classList.remove('hidden');
        }
        return;
    }

    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: currentCameraFacing,
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        });
        scannerStream = stream;
        if (video) {
            video.srcObject = stream;
            video.setAttribute('playsinline', 'true');
            video.play();
            requestAnimationFrame(scanVideoFrame);
        }
    } catch (err) {
        console.warn("Camera start error:", err);
        if (currentCameraFacing === 'environment') {
            try {
                const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true });
                scannerStream = fallbackStream;
                if (video) {
                    video.srcObject = fallbackStream;
                    video.setAttribute('playsinline', 'true');
                    video.play();
                    requestAnimationFrame(scanVideoFrame);
                    return;
                }
            } catch (e2) {
                console.error("Camera fallback failed:", e2);
            }
        }
        if (errorMsg) {
            errorMsg.textContent = "カメラの起動に失敗しました。カメラの利用権限を許可するか、下の「画像ファイルから読取」をご利用ください。";
            errorMsg.classList.remove('hidden');
        }
    }
}

function stopCameraScanner() {
    if (scannerAnimFrame) {
        cancelAnimationFrame(scannerAnimFrame);
        scannerAnimFrame = null;
    }
    if (scannerStream) {
        scannerStream.getTracks().forEach(track => track.stop());
        scannerStream = null;
    }
    const video = document.getElementById('qr-video-feed');
    if (video) video.srcObject = null;
}

function switchScannerCamera() {
    currentCameraFacing = currentCameraFacing === 'environment' ? 'user' : 'environment';
    startCameraScanner();
}

function scanVideoFrame() {
    const video = document.getElementById('qr-video-feed');
    if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) {
        scannerAnimFrame = requestAnimationFrame(scanVideoFrame);
        return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let qrFound = null;

    if (typeof jsQR !== 'undefined') {
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert"
        });
        if (code && code.data) {
            qrFound = code.data;
        }
    }

    if (qrFound) {
        vibrate(80);
        stopCameraScanner();
        handleScannedData(qrFound);
        return;
    }

    scannerAnimFrame = requestAnimationFrame(scanVideoFrame);
}

function handleQRFileInput(e) {
    const file = e.target.files[0];
    if (!file) return;
    scanQRFromImageFile(file);
    e.target.value = '';
}

function scanQRFromImageFile(file) {
    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

            let code = null;
            if (typeof jsQR !== 'undefined') {
                code = jsQR(imageData.data, imageData.width, imageData.height);
            }

            if (code && code.data) {
                vibrate(80);
                stopCameraScanner();
                handleScannedData(code.data);
            } else {
                showCustomAlert("選択された画像からQRコードを検出できませんでした。\n画像の向きや明るさを確認してください。");
            }
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

function handleManualQRPaste() {
    const input = document.getElementById('qr-paste-input');
    if (!input || !input.value.trim()) {
        showCustomAlert("共有URLまたはコードを入力してください。");
        return;
    }
    const val = input.value.trim();
    stopCameraScanner();
    handleScannedData(val);
}

// --- Import Confirmation & Application ---

function handleScannedData(rawString) {
    const match = unpackMatchData(rawString);
    if (!match || !match.teamA || !match.teamB) {
        showCustomAlert("有効な試合データが見つかりませんでした。\nQRコードが正しく読み取れているかご確認ください。");
        startCameraScanner();
        return;
    }

    closeQRScannerModal();
    openQRImportModal(match);
}

function openQRImportModal(match) {
    pendingImportMatch = match;
    const modal = document.getElementById('qr-import-modal');
    if (!modal) return;

    const headerEl = document.getElementById('qr-import-match-header');
    const detailEl = document.getElementById('qr-import-match-detail');
    const setsEl = document.getElementById('qr-import-sets-breakdown');

    if (headerEl) {
        headerEl.innerHTML = `
            <div class="flex items-center justify-between px-3 py-2 bg-zinc-950/80 rounded-xl border border-white/10">
                <div class="flex flex-col items-start">
                    <span class="text-base font-black truncate max-w-[120px]" style="color: ${match.colorA || '#eab308'}">${match.teamA}</span>
                    <span class="text-2xl font-black text-white">${match.setsA}</span>
                </div>
                <div class="text-xs font-bold text-zinc-500 italic">VS</div>
                <div class="flex flex-col items-end">
                    <span class="text-base font-black truncate max-w-[120px]" style="color: ${match.colorB || '#ffffff'}">${match.teamB}</span>
                    <span class="text-2xl font-black text-white">${match.setsB}</span>
                </div>
            </div>
        `;
    }

    if (detailEl) {
        const totalPoints = (match.setHistory || []).reduce((sum, s) => sum + (s.scoreA || 0) + (s.scoreB || 0), 0);
        detailEl.textContent = `📅 ${match.date} | ⏱️ ${match.durationMinutes || 0}分 | ${match.maxSets}セット制 | 総得点: ${totalPoints}点`;
    }

    if (setsEl) {
        if (match.setHistory && match.setHistory.length > 0) {
            setsEl.innerHTML = match.setHistory.map(s => `
                <div class="flex items-center justify-between py-1.5 px-3 bg-zinc-800/40 rounded-lg text-xs">
                    <span class="font-bold text-zinc-400">第${s.set}セット</span>
                    <span class="font-mono font-bold text-white">${s.scoreA} - ${s.scoreB}</span>
                </div>
            `).join('');
            setsEl.classList.remove('hidden');
        } else {
            setsEl.classList.add('hidden');
        }
    }

    modal.classList.remove('hidden');
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function closeQRImportModal() {
    pendingImportMatch = null;
    const modal = document.getElementById('qr-import-modal');
    if (modal) modal.classList.add('hidden');
}

function importMatchToHistory() {
    if (!pendingImportMatch) return;
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');

    const existingIdx = history.findIndex(m => 
        m.date === pendingImportMatch.date && 
        m.teamA === pendingImportMatch.teamA && 
        m.teamB === pendingImportMatch.teamB
    );

    if (existingIdx >= 0) {
        history[existingIdx] = pendingImportMatch;
    } else {
        history.unshift(pendingImportMatch);
    }

    history.sort((a, b) => new Date(b.date) - new Date(a.date));
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));

    closeQRImportModal();
    showToast("試合データを履歴に保存しました！");

    if (typeof renderHistory === 'function') {
        renderHistory();
    }
    const historyModal = document.getElementById('history-modal');
    if (historyModal) {
        historyModal.classList.remove('hidden');
    }
}

async function loadMatchAsActive() {
    if (!pendingImportMatch) return;
    const confirmed = await showCustomConfirm("現在の試合スコアを上書きして、この試合を進行中データとして読み込みますか？");
    if (!confirmed) return;

    const m = pendingImportMatch;
    state.teamA = m.teamA || "TEAM A";
    state.teamB = m.teamB || "TEAM B";
    state.colorA = m.colorA || "#eab308";
    state.colorB = m.colorB || "#ffffff";
    state.setsA = m.setsA || 0;
    state.setsB = m.setsB || 0;
    state.maxSets = m.maxSets || 3;
    state.membersA = m.membersA || state.membersA;
    state.membersB = m.membersB || state.membersB;
    state.initialServingTeam = m.initialServingTeam || 'A';
    state.setHistory = m.setHistory || [];

    if (state.setHistory.length > 0) {
        const lastSet = state.setHistory[state.setHistory.length - 1];
        state.currentSet = lastSet.set;
        state.scoreA = lastSet.scoreA || 0;
        state.scoreB = lastSet.scoreB || 0;
        state.actionLog = lastSet.log || [];
    } else {
        state.currentSet = 1;
        state.scoreA = 0;
        state.scoreB = 0;
        state.actionLog = [];
    }

    state.matchComplete = false;
    saveState();
    updateUI();

    closeQRImportModal();
    showToast("試合データをアクティブな試合として読み込みました！");
}

// --- Auto-detect QR match data from URL Hash on page load & hashchange ---

function initQRShare() {
    function checkHash() {
        const hash = window.location.hash || '';
        if (hash.includes('match=') || hash.includes('#m=')) {
            setTimeout(() => {
                const match = unpackMatchData(hash);
                if (match) {
                    openQRImportModal(match);
                    if (window.history && window.history.replaceState) {
                        window.history.replaceState(null, '', window.location.pathname + window.location.search);
                    }
                }
            }, 300);
        }
    }
    checkHash();
    window.addEventListener('hashchange', checkHash);
}
