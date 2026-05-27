import { describe, expect, it, vi, beforeEach } from 'vitest';

describe('Volleyball Scorebook - Teams Preset, Starters & Libero Configuration (teams.js)', () => {
  beforeEach(() => {
    // Initialize mock state members
    window.masterEditMembers = [
      { id: 'M1', number: 1, name: 'P1', isStarter: true, isLibero: false },
      { id: 'M2', number: 2, name: 'P2', isStarter: true, isLibero: false },
      { id: 'M3', number: 3, name: 'P3', isStarter: true, isLibero: false },
      { id: 'M4', number: 4, name: 'P4', isStarter: true, isLibero: false },
      { id: 'M5', number: 5, name: 'P5', isStarter: true, isLibero: false },
      { id: 'M6', number: 6, name: 'P6', isStarter: true, isLibero: false },
      { id: 'M7', number: 7, name: 'P7', isStarter: false, isLibero: false },
      { id: 'M8', number: 8, name: 'P8', isStarter: false, isLibero: false },
    ];
    window.showToast = vi.fn();
    window.renderMasterMemberRows = vi.fn();
    window.state = {
      teamA: "TEAM A",
      teamB: "TEAM B",
      membersA: [],
      membersB: [],
      lineupA: [],
      lineupB: [],
      liberosA: [],
      liberosB: [],
    };
  });

  describe('toggleMasterStarter()', () => {
    it('should toggle isStarter property of the clicked player and turn off libero if starter', () => {
      window.masterEditMembers[6].isLibero = true; // M7 is libero

      window.toggleMasterStarter(6);
      expect(window.masterEditMembers[6].isStarter).toBe(true);
      expect(window.masterEditMembers[6].isLibero).toBe(false); // Libero cleared!
    });
  });

  describe('toggleMasterLibero()', () => {
    it('should toggle isLibero property and turn off isStarter', () => {
      // Toggle Bench 1 (index 6, player M7) to Libero
      window.toggleMasterLibero(6);
      expect(window.masterEditMembers[6].isLibero).toBe(true);
      expect(window.masterEditMembers[6].isStarter).toBe(false);

      // Toggle off
      window.toggleMasterLibero(6);
      expect(window.masterEditMembers[6].isLibero).toBe(false);
    });

    it('should restrict team to maximum of 2 Liberos', () => {
      // Register M7 and M8 as liberos
      window.masterEditMembers[6].isLibero = true;
      window.masterEditMembers[7].isLibero = true;

      // Attempt to register M6 (index 5) as a 3rd libero
      window.toggleMasterLibero(5);

      expect(window.masterEditMembers[5].isLibero).toBe(false); // Blocked!
      expect(window.showToast).toHaveBeenCalledWith("リベロは最大2人まで登録可能です。");
    });
  });

  describe('loadPresetToTeam()', () => {
    it('should load preset members, starters, and liberos into active game state', () => {
      const presetTeam = {
        name: "TestPreset",
        isMyTeam: true,
        members: [
          { number: 10, name: "T1", isStarter: true, isLibero: false },
          { number: 11, name: "T2", isStarter: true, isLibero: false },
          { number: 12, name: "T3", isStarter: true, isLibero: false },
          { number: 13, name: "T4", isStarter: true, isLibero: false },
          { number: 14, name: "T5", isStarter: true, isLibero: false },
          { number: 15, name: "T6", isStarter: false, isLibero: true }, // Libero 1
          { number: 16, name: "T7", isStarter: false, isLibero: true }, // Libero 2
          { number: 17, name: "T8", isStarter: true, isLibero: false }, // Starter 6
        ]
      };

      // Mock PRESET_TEAMS_KEY storage load
      localStorage.setItem('vb_preset_teams', JSON.stringify([presetTeam]));

      window.loadPresetToTeam('A', 'TestPreset');

      // Assert members loaded
      expect(window.state.membersA.length).toBe(8);
      
      // Assert 6 starters loaded into lineup
      expect(window.state.lineupA.length).toBe(6);
      const starters = window.state.membersA.filter(m => m.isStarter);
      expect(starters.length).toBe(6);

      // Assert liberos loaded into state.liberosA
      expect(window.state.liberosA[0]).toBe('A6'); // T6's generated ID
      expect(window.state.liberosA[1]).toBe('A7'); // T7's generated ID
    });
  });
});
