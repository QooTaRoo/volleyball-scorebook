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

      expect(window.showToast).toHaveBeenCalledWith("選手交代しました");
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
});
