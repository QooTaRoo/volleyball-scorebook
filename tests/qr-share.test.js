import { describe, expect, it, vi, beforeEach } from 'vitest';

const tick = () => new Promise(resolve => setTimeout(resolve, 0));

describe('Volleyball Scorebook - QR Code Share & Import (qr-share.js)', () => {
  beforeEach(() => {
    window.showCustomConfirm = vi.fn().mockResolvedValue(true);
    window.showCustomAlert = vi.fn().mockResolvedValue(undefined);
    window.showToast = vi.fn();
    window.renderHistory = vi.fn();
  });

  describe('packMatchData & unpackMatchData', () => {
    it('should correctly pack and unpack full match data', () => {
      const mockMatch = {
        date: '2026/09/01 14:08',
        teamA: '大安東',
        teamB: '埼玉栄',
        colorA: '#f97316',
        colorB: '#ffffff',
        setsA: 2,
        setsB: 0,
        maxSets: 3,
        durationMinutes: 51,
        initialServingTeam: 'A',
        setHistory: [
          { set: 1, scoreA: 25, scoreB: 20, log: [{ type: 'point', team: 'A', val: 1 }] },
          { set: 2, scoreA: 25, scoreB: 20, log: [{ type: 'point', team: 'B', val: 1 }] }
        ],
        membersA: [{ id: 'A1', number: 1, name: 'エース' }],
        membersB: [{ id: 'B1', number: 1, name: 'キャプテン' }]
      };

      const packed = window.packMatchData(mockMatch);
      expect(typeof packed).toBe('string');
      expect(packed.length).toBeGreaterThan(0);

      const unpacked = window.unpackMatchData(packed);
      expect(unpacked).toBeDefined();
      expect(unpacked.teamA).toBe('大安東');
      expect(unpacked.teamB).toBe('埼玉栄');
      expect(unpacked.setsA).toBe(2);
      expect(unpacked.setsB).toBe(0);
      expect(unpacked.setHistory.length).toBe(2);
      expect(unpacked.membersA[0].name).toBe('エース');
    });

    it('should extract and unpack payload embedded in a URL hash', () => {
      const mockMatch = {
        date: '2026/09/01 15:00',
        teamA: 'Team Alpha',
        teamB: 'Team Beta',
        setsA: 1,
        setsB: 0
      };

      const packed = window.packMatchData(mockMatch);
      const fullUrl = `https://scorebook.app/index.html#match=${packed}`;

      const unpacked = window.unpackMatchData(fullUrl);
      expect(unpacked).toBeDefined();
      expect(unpacked.teamA).toBe('Team Alpha');
      expect(unpacked.teamB).toBe('Team Beta');
    });

    it('should return null for invalid or corrupted strings', () => {
      expect(window.unpackMatchData(null)).toBeNull();
      expect(window.unpackMatchData('')).toBeNull();
      expect(window.unpackMatchData('invalid_non_json_string')).toBeNull();
    });
  });

  describe('shareMatchViaQR() & shareHistoryItemViaQR()', () => {
    it('should open qr-share-modal with match information and render QR code', () => {
      const mockMatch = {
        date: '2026/09/01 14:08',
        teamA: '大安東',
        teamB: '埼玉栄',
        setsA: 2,
        setsB: 0,
        maxSets: 3,
        durationMinutes: 51,
        setHistory: [{ set: 1, scoreA: 25, scoreB: 20 }, { set: 2, scoreA: 25, scoreB: 20 }]
      };

      window.shareMatchViaQR(mockMatch, false);

      const modal = document.getElementById('qr-share-modal');
      expect(modal.classList.contains('hidden')).toBe(false);

      const titleEl = document.getElementById('qr-share-title');
      expect(titleEl.innerHTML).toContain('大安東');
      expect(titleEl.innerHTML).toContain('埼玉栄');
      expect(titleEl.innerHTML).toContain('2 - 0');

      expect(window.QRCode.toCanvas).toHaveBeenCalled();
    });

    it('should share specific history item by index', () => {
      const history = [
        { date: '2026/09/01 10:00', teamA: 'Alpha', teamB: 'Beta', setsA: 2, setsB: 1 },
        { date: '2026/09/01 14:00', teamA: 'Gamma', teamB: 'Delta', setsA: 0, setsB: 2 }
      ];
      localStorage.setItem('volleyball_match_history', JSON.stringify(history));

      window.shareHistoryItemViaQR(1);

      const modal = document.getElementById('qr-share-modal');
      expect(modal.classList.contains('hidden')).toBe(false);

      const titleEl = document.getElementById('qr-share-title');
      expect(titleEl.innerHTML).toContain('Gamma');
      expect(titleEl.innerHTML).toContain('Delta');
    });
  });

  describe('Importing match data via QR modal', () => {
    it('importMatchToHistory should save scanned match to match history without duplicating', () => {
      const initialHistory = [
        { date: '2026/08/20 10:00', teamA: 'PastTeam1', teamB: 'PastTeam2', setsA: 2, setsB: 0 }
      ];
      localStorage.setItem('volleyball_match_history', JSON.stringify(initialHistory));

      const newMatch = {
        date: '2026/09/01 14:08',
        teamA: '大安東',
        teamB: '埼玉栄',
        setsA: 2,
        setsB: 0
      };

      window.handleScannedData(window.packMatchData(newMatch));

      const importModal = document.getElementById('qr-import-modal');
      expect(importModal.classList.contains('hidden')).toBe(false);

      window.importMatchToHistory();

      const savedHistory = JSON.parse(localStorage.getItem('volleyball_match_history'));
      expect(savedHistory.length).toBe(2);
      expect(savedHistory[0].teamA).toBe('大安東');
      expect(window.showToast).toHaveBeenCalledWith("試合データを履歴に保存しました！");
    });

    it('loadMatchAsActive should prompt confirm and load match into active game state', async () => {
      const scannedMatch = {
        date: '2026/09/01 14:08',
        teamA: '大安東',
        teamB: '埼玉栄',
        colorA: '#f97316',
        colorB: '#ffffff',
        setsA: 1,
        setsB: 0,
        maxSets: 3,
        setHistory: [
          { set: 1, scoreA: 25, scoreB: 20, log: [] },
          { set: 2, scoreA: 14, scoreB: 10, log: [] }
        ]
      };

      window.handleScannedData(window.packMatchData(scannedMatch));

      await window.loadMatchAsActive();
      await tick();

      expect(window.state.teamA).toBe('大安東');
      expect(window.state.teamB).toBe('埼玉栄');
      expect(window.state.setsA).toBe(1);
      expect(window.state.currentSet).toBe(2);
      expect(window.state.scoreA).toBe(14);
      expect(window.state.scoreB).toBe(10);
      expect(window.showToast).toHaveBeenCalledWith("試合データをアクティブな試合として読み込みました！");
    });
  });
});
