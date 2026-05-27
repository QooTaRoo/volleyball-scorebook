import { describe, expect, it, vi, beforeEach } from 'vitest';

describe('Volleyball Scorebook - Court & Player Management (court.js)', () => {
  beforeEach(() => {
    // Reset and mock necessary UI triggers
    window.showToast = vi.fn();
  });

  describe('performSwap()', () => {
    it('should swap two player IDs in the lineup and record in state', () => {
      window.currentCourtTeam = 'A';
      const initialLineup = [...window.state.lineupA]; // ["A1", "A2", "A3", "A4", "A5", "A6"]
      
      // Swap position index 0 and 1 (A1 and A2)
      window.performSwap(0, 1);

      expect(window.state.lineupA[0]).toBe(initialLineup[1]);
      expect(window.state.lineupA[1]).toBe(initialLineup[0]);

      // Check action logged
      const lastAction = window.state.actionLog[window.state.actionLog.length - 1];
      expect(lastAction.type).toBe('swap_players');
      expect(lastAction.team).toBe('A');
      expect(lastAction.idx1).toBe(0);
      expect(lastAction.idx2).toBe(1);

      expect(window.showToast).toHaveBeenCalledWith("ポジションを入れ替えました");
    });
  });

  describe('selectCourtLibero()', () => {
    it('should register up to 2 Libero players for a team and prevent duplicates', () => {
      window.currentCourtTeam = 'A';
      window.state.liberosA = [];

      // Register player A7 as Libero 1
      window.selectCourtLibero(1, 'A7');
      expect(window.state.liberosA[0]).toBe('A7');
      expect(window.state.liberosA[1]).toBeUndefined();

      // Register player A8 as Libero 2
      window.selectCourtLibero(2, 'A8');
      expect(window.state.liberosA[0]).toBe('A7');
      expect(window.state.liberosA[1]).toBe('A8');

      // Attempt to register A8 as Libero 1 (should automatically clear Libero 2)
      window.selectCourtLibero(1, 'A8');
      expect(window.state.liberosA[0]).toBe('A8');
      expect(window.state.liberosA[1]).toBeNull();

      expect(window.showToast).toHaveBeenCalledWith("リベロ 1 を登録しました");
    });
  });

  describe('substitute()', () => {
    it('should substitute an active player with a bench player and record in state', () => {
      window.currentCourtTeam = 'A';
      window.currentSubPosIdx = 2; // Position idx 2 ("A3")
      
      const initialLineup = [...window.state.lineupA];
      
      // Substitute with a bench player ID, say "A7" (default members are A1 to A14, active lineup has A1-A6)
      const benchPlayerId = "A7";
      window.substitute(benchPlayerId);

      // Verify that active player is updated
      expect(window.state.lineupA[2]).toBe(benchPlayerId);
      expect(window.state.lineupA[2]).not.toBe(initialLineup[2]);

      // Check action logged
      const lastAction = window.state.actionLog[window.state.actionLog.length - 1];
      expect(lastAction.type).toBe('substitution');
      expect(lastAction.team).toBe('A');
      expect(lastAction.posIdx).toBe(2);
      expect(lastAction.outPlayerId).toBe(initialLineup[2]);
      expect(lastAction.inPlayerId).toBe(benchPlayerId);
      expect(lastAction.isLibero).toBe(false); // standard substitution

      expect(window.showToast).toHaveBeenCalledWith("選手交代しました");
    });

    it('should tag isLibero: true if a registered libero is substituted on court', () => {
      window.currentCourtTeam = 'A';
      window.currentSubPosIdx = 2; // Position idx 2 ("A3")
      
      const initialLineup = [...window.state.lineupA];
      
      // Register "A7" as Libero 1
      window.state.liberosA = ['A7', null];
      
      // Substitute in the libero
      window.substitute('A7');

      const lastAction = window.state.actionLog[window.state.actionLog.length - 1];
      expect(lastAction.type).toBe('substitution');
      expect(lastAction.isLibero).toBe(true); // marked as libero replacement!
    });

    it('should correctly substitute players in preset mode when masterEditMembers is sorted', () => {
      window.currentCourtTeam = 'preset';
      
      // 1. masterEditMembers を初期化する（12名、最初の6名がスタメン、背番号順）
      window.masterEditMembers = Array.from({length: 12}, (_, i) => ({ 
          id: `M${i+1}`, 
          number: i + 1, 
          name: `Player ${i+1}`, 
          isStarter: i < 6, 
          starterPos: i < 6 ? i + 1 : undefined,
          isLibero: false 
      }));

      // mock DOM element for renderCourt to work
      document.body.innerHTML = `
        <input id="master-team-name" value="Preset Team">
        <input id="master-team-color" value="#3b82f6">
        <div id="court-team-label"></div>
        <select id="court-libero-select-1"></select>
        <select id="court-libero-select-2"></select>
        <div id="pos-1"><span class="player-num"></span><span class="player-name"></span></div>
        <div id="pos-2"><span class="player-num"></span><span class="player-name"></span></div>
        <div id="pos-3"><span class="player-num"></span><span class="player-name"></span></div>
        <div id="pos-4"><span class="player-num"></span><span class="player-name"></span></div>
        <div id="pos-5"><span class="player-num"></span><span class="player-name"></span></div>
        <div id="pos-6"><span class="player-num"></span><span class="player-name"></span></div>
        <div id="court-grid-container"></div>
        <div id="court-front-row"></div>
        <div id="court-back-row"></div>
        <div id="court-net-line"></div>
        <div id="court-rotation-controls"></div>
        <div id="master-member-list"></div>
        <div id="sub-modal" class="hidden"><div id="bench-list"></div></div>
      `;

      // 2. renderCourt を呼んでコートを表示（これにより M3 (idx=2) の starterPos は 3 に確定される）
      window.renderCourt('preset');

      // 3. pos-3 (idx=2) をクリック
      window.currentSubPosIdx = 2; // pos-3

      // 4. ベンチ選手 M10 と交代する
      window.substitute('M10');

      // 5. 期待値の検証
      // M3 はスタメンから外れ、starterPos は undefined になるはず
      const m3 = window.masterEditMembers.find(m => m.id === 'M3');
      expect(m3.isStarter).toBe(false);
      expect(m3.starterPos).toBeUndefined();

      // M10 はスタメンになり、starterPos は 3 になるはず
      const m10 = window.masterEditMembers.find(m => m.id === 'M10');
      expect(m10.isStarter).toBe(true);
      expect(m10.starterPos).toBe(3);
    });

    it('should correctly substitute players in preset mode when masterEditMembers is sorted by number and positions are custom', () => {
      window.currentCourtTeam = 'preset';
      
      // masterEditMembers を初期化する（背番号をシャッフルした状態で登録）
      window.masterEditMembers = [
        { id: 'M1', number: 12, name: 'P12', isStarter: true, starterPos: 1 },
        { id: 'M2', number: 2, name: 'P2', isStarter: true, starterPos: 2 },
        { id: 'M3', number: 99, name: 'P99', isStarter: true, starterPos: 3 },
        { id: 'M4', number: 5, name: 'P5', isStarter: true, starterPos: 4 },
        { id: 'M5', number: 1, name: 'P1', isStarter: true, starterPos: 5 },
        { id: 'M6', number: 7, name: 'P7', isStarter: true, starterPos: 6 },
        { id: 'M7', number: 20, name: 'P20', isStarter: false },
        { id: 'M8', number: 8, name: 'P8', isStarter: false }
      ];

      // loadMasterTeamForEdit の挙動を再現するため、背番号順にソートする
      window.masterEditMembers.sort((a, b) => a.number - b.number);

      // mock DOM
      document.body.innerHTML = `
        <input id="master-team-name" value="Preset Team">
        <input id="master-team-color" value="#3b82f6">
        <div id="court-team-label"></div>
        <select id="court-libero-select-1"></select>
        <select id="court-libero-select-2"></select>
        <div id="pos-1"><span class="player-num"></span><span class="player-name"></span></div>
        <div id="pos-2"><span class="player-num"></span><span class="player-name"></span></div>
        <div id="pos-3"><span class="player-num"></span><span class="player-name"></span></div>
        <div id="pos-4"><span class="player-num"></span><span class="player-name"></span></div>
        <div id="pos-5"><span class="player-num"></span><span class="player-name"></span></div>
        <div id="pos-6"><span class="player-num"></span><span class="player-name"></span></div>
        <div id="court-grid-container"></div>
        <div id="court-front-row"></div>
        <div id="court-back-row"></div>
        <div id="court-net-line"></div>
        <div id="court-rotation-controls"></div>
        <div id="master-member-list"></div>
        <div id="sub-modal" class="hidden"><div id="bench-list"></div></div>
      `;

      // renderCourt を呼ぶ（コート表示）
      window.renderCourt('preset');

      // 前衛中央 (pos-3, lineup インデックス 2) の選手を交代する
      window.currentSubPosIdx = 2; // pos-3

      // ベンチ選手 P20 (id="M7") と交代する
      window.substitute('M7');

      // 期待値の検証
      // P99 (M3) はスタメンから外れ、starterPos は undefined になるはず
      const m3 = window.masterEditMembers.find(m => m.id === 'M3');
      expect(m3.isStarter).toBe(false);
      expect(m3.starterPos).toBeUndefined();

      // P20 (M7) はスタメンになり、starterPos は 3 になるはず
      const m7 = window.masterEditMembers.find(m => m.id === 'M7');
      expect(m7.isStarter).toBe(true);
      expect(m7.starterPos).toBe(3);
    });

    it('should correctly substitute players in preset mode after performing a swap', () => {
      window.currentCourtTeam = 'preset';
      
      // 1. masterEditMembers を初期化（背番号順）
      window.masterEditMembers = Array.from({length: 12}, (_, i) => ({ 
          id: `M${i+1}`, 
          number: i + 1, 
          name: `Player ${i+1}`, 
          isStarter: i < 6, 
          starterPos: i < 6 ? i + 1 : undefined,
          isLibero: false 
      }));

      // mock DOM
      document.body.innerHTML = `
        <input id="master-team-name" value="Preset Team">
        <input id="master-team-color" value="#3b82f6">
        <div id="court-team-label"></div>
        <select id="court-libero-select-1"></select>
        <select id="court-libero-select-2"></select>
        <div id="pos-1"><span class="player-num"></span><span class="player-name"></span></div>
        <div id="pos-2"><span class="player-num"></span><span class="player-name"></span></div>
        <div id="pos-3"><span class="player-num"></span><span class="player-name"></span></div>
        <div id="pos-4"><span class="player-num"></span><span class="player-name"></span></div>
        <div id="pos-5"><span class="player-num"></span><span class="player-name"></span></div>
        <div id="pos-6"><span class="player-num"></span><span class="player-name"></span></div>
        <div id="court-grid-container"></div>
        <div id="court-front-row"></div>
        <div id="court-back-row"></div>
        <div id="court-net-line"></div>
        <div id="court-rotation-controls"></div>
        <div id="master-member-list"></div>
        <div id="sub-modal" class="hidden"><div id="bench-list"></div></div>
      `;

      // 2. コートを表示
      window.renderCourt('preset');

      // 3. ポジションの SWAP を行う（例：pos-3 (idx=2, M3) と pos-4 (idx=3, M4) を入れ替える）
      window.performSwap(2, 3);

      // 4. 前衛中央 (pos-3, lineup インデックス 2) の選手を交代する
      window.currentSubPosIdx = 2; // pos-3

      // ベンチ選手 M10 と交代する
      window.substitute('M10');

      // 期待値の検証：
      // コートの pos-3 に表示されていた M4 (id="M4") がスタメンから外れなければならない！！！
      const m4 = window.masterEditMembers.find(m => m.id === 'M4');
      expect(m4.isStarter).toBe(false);
      expect(m4.starterPos).toBeUndefined();

      // M10 はスタメンになり、starterPos は 3 になるはず
      const m10 = window.masterEditMembers.find(m => m.id === 'M10');
      expect(m10.isStarter).toBe(true);
      expect(m10.starterPos).toBe(3);
    });
  });

  describe('handleCourtPosClick() Interaction flow', () => {
    it('should select a position on first click, and perform swap on second click', () => {
      window.currentCourtTeam = 'A';
      window.swapSelectionIdx = null;

      const initialLineup = [...window.state.lineupA];

      // First click on position 1 (idx 0)
      window.handleCourtPosClick(1);
      expect(window.swapSelectionIdx).toBe(0);

      // Second click on position 2 (idx 1) should trigger swap
      window.handleCourtPosClick(2);
      
      expect(window.swapSelectionIdx).toBeNull(); // Reset swap select index
      expect(window.state.lineupA[0]).toBe(initialLineup[1]);
      expect(window.state.lineupA[1]).toBe(initialLineup[0]);
    });

    it('should deselect a position if clicked twice in a row', () => {
      window.currentCourtTeam = 'A';
      window.swapSelectionIdx = null;

      // First click on position 1
      window.handleCourtPosClick(1);
      expect(window.swapSelectionIdx).toBe(0);

      // Second click on the same position 1 should deselect
      window.handleCourtPosClick(1);
      expect(window.swapSelectionIdx).toBeNull();
    });
  });

  describe('openSubModal()', () => {
    it('should correctly populate lineup and members for preset team', () => {
      window.currentCourtTeam = 'preset';
      
      // Setup masterEditMembers with 8 players (6 starters, 2 bench)
      window.masterEditMembers = [
        { id: 'M1', number: 1, name: 'M-Player 1', isStarter: true },
        { id: 'M2', number: 2, name: 'M-Player 2', isStarter: true },
        { id: 'M3', number: 3, name: 'M-Player 3', isStarter: true },
        { id: 'M4', number: 4, name: 'M-Player 4', isStarter: true },
        { id: 'M5', number: 5, name: 'M-Player 5', isStarter: true },
        { id: 'M6', number: 6, name: 'M-Player 6', isStarter: true },
        { id: 'M7', number: 7, name: 'M-Player 7', isStarter: false },
        { id: 'M8', number: 8, name: 'M-Player 8', isStarter: false }
      ];

      // Setup a dummy active match state (e.g. state.membersB / state.lineupB should NOT be used)
      window.state.membersB = [
        { id: 'B1', number: 10, name: 'B-Player 10' }
      ];
      window.state.lineupB = ['B1'];

      // Call openSubModal for position idx 2 (which is M3)
      window.openSubModal(2);

      const benchListEl = document.getElementById('bench-list');
      expect(benchListEl).not.toBeNull();
      
      // Should display masterEditMembers bench players (M7, M8)
      expect(benchListEl.innerHTML).toContain('M-Player 7');
      expect(benchListEl.innerHTML).toContain('M-Player 8');
      
      // Should NOT contain B-Player 10 from Team B
      expect(benchListEl.innerHTML).not.toContain('B-Player 10');
      
      // Should contain on-court players for swapping (excluding the selected M3)
      expect(benchListEl.innerHTML).toContain('M-Player 1');
      expect(benchListEl.innerHTML).toContain('M-Player 2');
      expect(benchListEl.innerHTML).not.toContain('M-Player 3'); // Clicked player cannot swap with themselves
    });

    it('should exclude the active player from bench selection in Team A mode', () => {
      window.currentCourtTeam = 'A';
      
      // Set lineupA and membersA
      window.state.lineupA = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6'];
      window.state.membersA = [
        { id: 'A1', number: 1, name: 'A-Player 1' },
        { id: 'A2', number: 2, name: 'A-Player 2' },
        { id: 'A3', number: 3, name: 'A-Player 3' },
        { id: 'A4', number: 4, name: 'A-Player 4' },
        { id: 'A5', number: 5, name: 'A-Player 5' },
        { id: 'A6', number: 6, name: 'A-Player 6' },
        { id: 'A7', number: 7, name: 'A-Player 7' } // Bench player
      ];

      // Call openSubModal for pos idx 0 (which is A1)
      window.openSubModal(0);

      const benchListEl = document.getElementById('bench-list');
      // The bench list should show A7 (bench)
      expect(benchListEl.innerHTML).toContain('A-Player 7');
      // The bench list should NOT show A1 as a bench option (no "IN ➔" button for A1)
      expect(benchListEl.innerHTML).not.toContain('A-Player 1<span class="text-blue-400 text-xs font-bold">IN');
    });
  });
});

