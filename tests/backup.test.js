import { describe, expect, it, vi, beforeEach } from 'vitest';

const tick = () => new Promise(resolve => setTimeout(resolve, 0));

describe('Volleyball Scorebook - Data Backup & Migration (backup.js)', () => {
  beforeEach(() => {
    // Mock browser download and confirm hooks
    window.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
    window.URL.revokeObjectURL = vi.fn();
    window.showCustomConfirm = vi.fn().mockResolvedValue(true);
    window.showCustomAlert = vi.fn().mockResolvedValue(undefined);
    window.showToast = vi.fn();
    
    // Stub anchor click
    const dummyAnchor = {
      click: vi.fn(),
      setAttribute: vi.fn(),
      style: {}
    };
    vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
      if (tagName === 'a') return dummyAnchor;
      return document.createElement.bind(document)(tagName);
    });
  });

  describe('exportTeams()', () => {
    it('should show alert if no preset teams found', () => {
      localStorage.setItem('vb_preset_teams', '[]');
      window.exportTeams();
      expect(window.showCustomAlert).toHaveBeenCalledWith("エクスポートするチームデータがありません。");
    });

    it('should trigger JSON file download with correct teams structure', () => {
      const mockTeams = [{ name: 'A-Preset', members: [] }];
      localStorage.setItem('vb_preset_teams', JSON.stringify(mockTeams));

      window.exportTeams();
      
      expect(window.URL.createObjectURL).toHaveBeenCalled();
      expect(window.showToast).toHaveBeenCalledWith("チーム設定をエクスポートしました");
    });
  });

  describe('exportHistory()', () => {
    it('should show alert if no history exists', () => {
      localStorage.setItem('volleyball_match_history', '[]');
      window.exportHistory();
      expect(window.showCustomAlert).toHaveBeenCalledWith("エクスポートする試合履歴がありません。");
    });

    it('should trigger JSON file download with correct history structure', () => {
      const mockHistory = [{ date: '2026/05/20 10:00:00', teamA: 'A', teamB: 'B' }];
      localStorage.setItem('volleyball_match_history', JSON.stringify(mockHistory));

      window.exportHistory();
      
      expect(window.URL.createObjectURL).toHaveBeenCalled();
      expect(window.showToast).toHaveBeenCalledWith("試合履歴をエクスポートしました");
    });
  });

  describe('importTeams()', () => {
    it('should parse and merge imported preset teams, overwriting same names', async () => {
      const existingTeams = [
        { name: 'Karasuno', color: '#ff5500', members: [] },
        { name: 'Nekoma', color: '#ff0000', members: [] }
      ];
      localStorage.setItem('vb_preset_teams', JSON.stringify(existingTeams));

      // Mock file upload trigger by invoking the callback immediately
      const importedData = {
        type: "teams",
        teams: [
          { name: 'Karasuno', color: '#ffffff', members: [{ name: 'Hinata' }] }, // overwrite color and members
          { name: 'Aoba Johsai', color: '#00ffff', members: [] } // add new team preset
        ]
      };
      
      vi.spyOn(window, 'handleFileUpload').mockImplementation((callback) => {
        callback(importedData);
      });

      window.importTeams();
      await tick(); // Wait for async merge callback to complete

      // Check results merged
      const mergedTeams = JSON.parse(localStorage.getItem('vb_preset_teams'));
      expect(mergedTeams.length).toBe(3); // Karasuno, Nekoma, Aoba Johsai
      
      const karasuno = mergedTeams.find(t => t.name === 'Karasuno');
      expect(karasuno.color).toBe('#ffffff'); // Overwritten
      expect(karasuno.members.length).toBe(1); // Overwritten

      const aoba = mergedTeams.find(t => t.name === 'Aoba Johsai');
      expect(aoba).toBeDefined();

      const nekoma = mergedTeams.find(t => t.name === 'Nekoma');
      expect(nekoma.color).toBe('#ff0000'); // Unchanged
    });
  });

  describe('importHistory()', () => {
    it('should parse and append new match history records, skipping duplicates', async () => {
      const existingHistory = [
        { date: '2026-05-20T10:00:00.000Z', teamA: 'Karasuno', teamB: 'Nekoma', setsA: 2, setsB: 1 }
      ];
      localStorage.setItem('volleyball_match_history', JSON.stringify(existingHistory));

      const importedData = {
        type: "history",
        history: [
          { date: '2026-05-20T10:00:00.000Z', teamA: 'Karasuno', teamB: 'Nekoma', setsA: 2, setsB: 1 }, // Duplicate, should be skipped
          { date: '2026-05-21T12:00:00.000Z', teamA: 'Aoba', teamB: 'Shiratorizawa', setsA: 0, setsB: 2 } // New, should be added
        ]
      };

      vi.spyOn(window, 'handleFileUpload').mockImplementation((callback) => {
        callback(importedData);
      });

      window.importHistory();
      await tick(); // Wait for async merge callback to complete

      // Check results
      const mergedHistory = JSON.parse(localStorage.getItem('volleyball_match_history'));
      expect(mergedHistory.length).toBe(2); // Initial 1 + New 1 (skipping duplicate)
      
      const newMatch = mergedHistory.find(m => m.teamA === 'Aoba');
      expect(newMatch).toBeDefined();
    });
  });
});
