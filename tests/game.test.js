import { describe, expect, it, vi, beforeEach } from 'vitest';

const tick = () => new Promise(resolve => setTimeout(resolve, 0));

describe('Volleyball Scorebook - Game Logic (game.js)', () => {
  beforeEach(() => {
    // Custom window alerts and confirms
    window.showCustomAlert = vi.fn().mockResolvedValue(undefined);
    window.showCustomConfirm = vi.fn().mockResolvedValue(true);
    window.startTimeoutTimer = vi.fn();
    window.stopTimeoutTimer = vi.fn();
  });

  describe('addPoint() and Basic Scoring', () => {
    it('should increment scores correctly and save state', () => {
      expect(window.state.scoreA).toBe(0);
      expect(window.state.scoreB).toBe(0);

      window.addPoint('A');
      expect(window.state.scoreA).toBe(1);
      expect(window.state.scoreB).toBe(0);

      window.addPoint('B');
      expect(window.state.scoreA).toBe(1);
      expect(window.state.scoreB).toBe(1);

      // Verify immediate persistence
      const saved = JSON.parse(localStorage.getItem('volleyball_score_state'));
      expect(saved.scoreA).toBe(1);
      expect(saved.scoreB).toBe(1);
    });

    it('should not add points if match is complete', () => {
      window.state.matchComplete = true;
      window.addPoint('A');
      expect(window.state.scoreA).toBe(0);
    });
  });

  describe('Serving and Rotation Rules', () => {
    it('should NOT rotate Team A if Team A scores when already serving', () => {
      window.state.servingTeam = 'A';
      const initialLineup = [...window.state.lineupA];

      window.addPoint('A');
      
      expect(window.state.servingTeam).toBe('A');
      expect(window.state.lineupA).toEqual(initialLineup);
    });

    it('should rotate Team B if Team B scores when Team A was serving', () => {
      window.state.servingTeam = 'A';
      const initialLineupB = [...window.state.lineupB];

      window.addPoint('B');
      
      expect(window.state.servingTeam).toBe('B');
      // In volleyball rotation: [1, 2, 3, 4, 5, 6] rotates to [2, 3, 4, 5, 6, 1]
      // Let's verify shift: rotateTeam shifts the first element to the end.
      const expectedLineupB = [...initialLineupB];
      const first = expectedLineupB.shift();
      expectedLineupB.push(first);
      
      expect(window.state.lineupB).toEqual(expectedLineupB);
    });
  });

  describe('Set Ends and Deuce Rules (3-Set Match)', () => {
    beforeEach(() => {
      window.state.maxSets = 3;
      window.state.targetPoints = 25;
      window.state.currentSet = 1;
      window.state.setsA = 0;
      window.state.setsB = 0;
      window.state.matchStartTime = Date.now();
    });

    it('should end the set when reaching 25 with a 2-point lead', async () => {
      window.state.scoreA = 24;
      window.state.scoreB = 20;

      window.addPoint('A');
      await tick(); // Wait for async finishSet logic to complete

      // Set should end immediately, transitioning to Set 2, resetting scores
      expect(window.state.setsA).toBe(1);
      expect(window.state.currentSet).toBe(2);
      expect(window.state.scoreA).toBe(0);
      expect(window.state.scoreB).toBe(0);
      expect(window.showCustomAlert).toHaveBeenCalledWith(expect.stringContaining('第1セット終了！ 勝者: TEAM A'));
    });

    it('should enter deuce and continue if there is only 1-point difference at target score', async () => {
      window.state.scoreA = 24;
      window.state.scoreB = 24;

      window.addPoint('A');
      await tick();

      // Score is 25-24. Set should not end.
      expect(window.state.setsA).toBe(0);
      expect(window.state.currentSet).toBe(1);
      expect(window.state.scoreA).toBe(25);
      expect(window.state.scoreB).toBe(24);

      // Now score becomes 26-24. A wins with a 2-point difference.
      window.addPoint('A');
      await tick();
      
      expect(window.state.setsA).toBe(1);
      expect(window.state.currentSet).toBe(2);
    });
  });

  describe('Final Set Score Rules', () => {
    it('should apply 15 points target in the final set of a 3-set match', async () => {
      window.state.maxSets = 3;
      window.state.currentSet = 3; // Final Set
      window.state.finalSetTarget = 15;
      window.state.setsA = 1;
      window.state.setsB = 1;
      window.state.scoreA = 14;
      window.state.scoreB = 14;

      // Deuce check on 15 points target
      window.addPoint('A');
      await tick();
      expect(window.state.scoreA).toBe(15);
      expect(window.state.setsA).toBe(1); // Set not won yet (15-14)

      window.addPoint('A');
      await tick();
      // Now 16-14, Match should end!
      expect(window.showCustomAlert).toHaveBeenCalledWith(expect.stringContaining('試合終了！ 勝者: TEAM A'));
    });
  });

  describe('2-Set Match Aggregate Points Winner Rule', () => {
    beforeEach(() => {
      window.state.maxSets = 2;
      window.state.currentSet = 1;
      window.state.targetPoints = 25;
      window.state.matchStartTime = Date.now();
    });

    it('should determine match winner by total aggregate score after set 2', async () => {
      // Set 1 finish: A wins 25 - 15
      window.state.scoreA = 24;
      window.state.scoreB = 15;
      window.addPoint('A');
      await tick();
      
      expect(window.state.currentSet).toBe(2);
      expect(window.state.setHistory.length).toBe(1);
      expect(window.state.setHistory[0].scoreA).toBe(25);
      expect(window.state.setHistory[0].scoreB).toBe(15);

      // Set 2: B wins 25 - 20 (Team B wins set 2, but Team A aggregate: 45 vs Team B aggregate: 40)
      window.state.scoreA = 20;
      window.state.scoreB = 24;
      window.addPoint('B');
      await tick();

      // The match should end and A should be the aggregate winner
      expect(window.showCustomAlert).toHaveBeenCalledWith(expect.stringContaining('試合終了！ 勝者: TEAM A'));
      expect(window.showCustomAlert).toHaveBeenCalledWith(expect.stringContaining('合計得点 45 - 40'));
    });
  });

  describe('Undo function', () => {
    it('should revert a regular point addition', () => {
      window.state.servingTeam = 'A';
      window.addPoint('A');
      expect(window.state.scoreA).toBe(1);

      window.undo();
      expect(window.state.scoreA).toBe(0);
    });

    it('should revert serving team and lineup rotation on serve-break point', () => {
      window.state.servingTeam = 'A';
      const initialLineupB = [...window.state.lineupB];

      window.addPoint('B');
      expect(window.state.servingTeam).toBe('B');
      expect(window.state.lineupB).not.toEqual(initialLineupB);

      window.undo();
      expect(window.state.servingTeam).toBe('A');
      expect(window.state.lineupB).toEqual(initialLineupB);
    });

    it('should revert set finish and return to previous set and scores', async () => {
      window.state.maxSets = 3;
      window.state.currentSet = 1;
      window.state.scoreA = 24;
      window.state.scoreB = 20;
      window.state.setsA = 0;

      window.addPoint('A'); // Set 1 finished (at score 25-20), current set becomes 2
      await tick();
      
      expect(window.state.currentSet).toBe(2);
      expect(window.state.setsA).toBe(1);

      // First undo: Undo the set-finish event. This moves back to Set 1 and restores the ending score (25-20).
      window.undo(); 
      expect(window.state.currentSet).toBe(1);
      expect(window.state.scoreA).toBe(25);
      expect(window.state.scoreB).toBe(20);
      expect(window.state.setsA).toBe(0);
      expect(window.state.setHistory.length).toBe(0);

      // Second undo: Undo the final point scored. This restores the score back to (24-20).
      window.undo();
      expect(window.state.scoreA).toBe(24);
      expect(window.state.scoreB).toBe(20);
    });
  });

  describe('Timeouts', () => {
    it('should increment timeout counts on confirmation and pop up timer', async () => {
      window.state.toA = 0;
      window.state.teamA = 'TOKYO';
      
      await window.requestTimeout('A');
      
      expect(window.state.toA).toBe(1);
      expect(window.startTimeoutTimer).toHaveBeenCalledWith('A');
    });

    it('should warn when exceeding max timeouts but allow extra on approval', async () => {
      window.state.toA = 2;
      window.state.maxTimeouts = 2;
      window.state.teamA = 'TOKYO'; // Ensure teamA matches our expected string

      await window.requestTimeout('A');
      expect(window.showCustomConfirm).toHaveBeenCalledWith(expect.stringContaining('TOKYO は既に2回タイムアウトを取っています'));
      expect(window.state.toA).toBe(3);
    });
  });
});
