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
    it('should toggle isStarter property of the clicked player and keep libero status', () => {
      window.masterEditMembers[6].isLibero = true; // M7 is libero

      window.toggleMasterStarter(6);
      expect(window.masterEditMembers[6].isStarter).toBe(true);
      expect(window.masterEditMembers[6].isLibero).toBe(true); // Libero preserved!
    });
  });

  describe('toggleMasterLibero()', () => {
    it('should toggle isLibero property and keep isStarter status', () => {
      // Toggle Starter 1 (index 0, player M1) to Libero
      window.toggleMasterLibero(0);
      expect(window.masterEditMembers[0].isLibero).toBe(true);
      expect(window.masterEditMembers[0].isStarter).toBe(true); // Starter preserved!

      // Toggle off
      window.toggleMasterLibero(0);
      expect(window.masterEditMembers[0].isLibero).toBe(false);
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

  describe('Automatic Member Sorting', () => {
    it('should sort members by number when loadMasterTeamForEdit is called', () => {
      const presetTeam = {
        name: "UnsortedTeam",
        members: [
          { id: 'M1', number: 12, name: 'P12', isStarter: true },
          { id: 'M2', number: 2, name: 'P2', isStarter: true },
          { id: 'M3', number: 99, name: 'P99', isStarter: true },
          { id: 'M4', number: 5, name: 'P5', isStarter: true },
          { id: 'M5', number: 1, name: 'P1', isStarter: true },
          { id: 'M6', number: 7, name: 'P7', isStarter: true },
        ]
      };
      localStorage.setItem('vb_preset_teams', JSON.stringify([presetTeam]));

      window.loadMasterTeamForEdit('UnsortedTeam');

      // Check that masterEditMembers is sorted by number ascending
      const numbers = window.masterEditMembers.map(m => m.number);
      expect(numbers).toEqual([1, 2, 5, 7, 12, 99]);
    });

    it('should sort members and re-render when a member number is updated via updateMasterMemberNumber', () => {
      window.masterEditMembers = [
        { id: 'M1', number: 1, name: 'P1' },
        { id: 'M2', number: 5, name: 'P5' },
        { id: 'M3', number: 10, name: 'P10' },
      ];
      const spyRender = vi.spyOn(window, 'renderMasterMemberRows');

      // Update P1 (index 0) number to 99
      window.updateMasterMemberNumber(0, '99');

      // Check updated number and that list is sorted
      const numbers = window.masterEditMembers.map(m => m.number);
      expect(numbers).toEqual([5, 10, 99]);
      expect(spyRender).toHaveBeenCalled();
    });

    it('should sort members when a new member is added via addMasterMemberRow', () => {
      window.masterEditMembers = [
        { id: 'M1', number: 10, name: 'P10' },
        { id: 'M2', number: 5, name: 'P5' },
      ];
      // Note: addMasterMemberRow sorts. We should initialize it sorted just to be clean
      window.masterEditMembers.sort((a, b) => a.number - b.number);

      window.addMasterMemberRow();

      // The new number should be Math.max(5, 10) + 1 = 11, and it should remain sorted
      const numbers = window.masterEditMembers.map(m => m.number);
      expect(numbers).toEqual([5, 10, 11]);
    });

    it('should sort unsorted legacy preset teams by number when loadPresetToTeam is called', () => {
      const presetTeam = {
        name: "LegacyUnsorted",
        members: [
          { number: 99, name: "P99", isStarter: true },
          { number: 2, name: "P2", isStarter: true },
          { number: 1, name: "P1", isStarter: true },
          { number: 4, name: "P4", isStarter: true },
          { number: 3, name: "P3", isStarter: true },
          { number: 5, name: "P5", isStarter: true },
        ]
      };
      localStorage.setItem('vb_preset_teams', JSON.stringify([presetTeam]));

      window.loadPresetToTeam('A', 'LegacyUnsorted');

      const numbers = window.state.membersA.map(m => m.number);
      expect(numbers).toEqual([1, 2, 3, 4, 5, 99]);
    });
  });
});

