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

    it('should allow adding points when only the detailed stats modal is open, but block if other modals are open', () => {
      // Simulate detailed-stats-modal being open
      const modal = document.getElementById('detailed-stats-modal');
      modal.classList.remove('hidden');

      expect(window.isAnyModalOpen()).toBe(true);

      // Try to add a point (should succeed because detailed-stats-modal is bypassed)
      window.addPoint('A');
      expect(window.state.scoreA).toBe(1);

      // Open another modal (e.g. settings-modal)
      const settingsModal = document.getElementById('settings-modal');
      settingsModal.classList.remove('hidden');

      // Try to add a point (should be blocked now)
      window.addPoint('A');
      expect(window.state.scoreA).toBe(1); // Still 1

      // Cleanup
      modal.classList.add('hidden');
      settingsModal.classList.add('hidden');
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

    it('should revert set finish and return to previous set and scores in a single undo', async () => {
      window.state.maxSets = 3;
      window.state.currentSet = 1;
      window.state.scoreA = 24;
      window.state.scoreB = 20;
      window.state.setsA = 0;

      window.addPoint('A'); // Set 1 finished (at score 25-20), current set becomes 2
      await tick();
      
      expect(window.state.currentSet).toBe(2);
      expect(window.state.setsA).toBe(1);

      // Single undo: Undo the set-finish event and the winning point.
      // This moves back to Set 1 and restores the score back to (24-20).
      window.undo(); 
      expect(window.state.currentSet).toBe(1);
      expect(window.state.scoreA).toBe(24);
      expect(window.state.scoreB).toBe(20);
      expect(window.state.setsA).toBe(0);
      expect(window.state.setHistory.length).toBe(0);
    });

    it('should not allow adding more points once the set winning condition is met (match end cancelled)', async () => {
      // Mock match end confirmation to return false (cancel)
      window.showCustomConfirm = vi.fn().mockResolvedValue(false);

      window.state.maxSets = 3;
      window.state.currentSet = 2; // Set 2
      window.state.scoreA = 24;
      window.state.scoreB = 20;
      window.state.setsA = 1; // Team A already won 1 set, so winning this set will win the match

      // Team A scores winning point (25-20), triggers match finish confirmation
      window.addPoint('A');
      await tick();

      expect(window.state.scoreA).toBe(25);
      expect(window.state.scoreB).toBe(20);
      expect(window.state.setsA).toBe(2); // In-memory setsA is incremented
      expect(window.state.currentSet).toBe(2); // Since cancelled, currentSet is still 2

      // Try to add another point to Team A
      window.addPoint('A');
      expect(window.state.scoreA).toBe(25); // Score remains 25

      // Try to add a point to Team B
      window.addPoint('B');
      expect(window.state.scoreB).toBe(20); // Score remains 20
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

  describe('My Team Stats Limit and Recalculation Engine', () => {
    beforeEach(() => {
      window.state.maxSets = 3;
      window.state.targetPoints = 25;
      window.state.currentSet = 1;
      window.state.scoreA = 0;
      window.state.scoreB = 0;
      window.state.setsA = 0;
      window.state.setsB = 0;
      window.state.actionLog = [];
      window.state.setHistory = [];
      window.state.rotationLog = [];
      window.state.servingTeam = 'A';
      window.state.initialServingTeam = 'A';
      window.state.isMyTeamA = false;
      window.state.isMyTeamB = false;
      window.state.myTeamOnlyStats = false;
      window.state.membersA = Array.from({length: 6}, (_, i) => ({ id: `A${i+1}`, number: i + 1, name: `${i+1}` }));
      window.state.membersB = Array.from({length: 6}, (_, i) => ({ id: `B${i+1}`, number: i + 1, name: `${i+1}` }));
      window.state.lineupA = ["A1", "A2", "A3", "A4", "A5", "A6"];
      window.state.lineupB = ["B1", "B2", "B3", "B4", "B5", "B6"];
    });

    it('should skip detailed stats Stage 2 player selection when opponent team scores and myTeamOnlyStats is active', () => {
      window.state.isMyTeamA = true;
      window.state.myTeamOnlyStats = true;
      
      window.radialState = { active: true, stage: 1, team: 'B' };
      
      window.enterStage2('spike');
      
      expect(window.state.scoreB).toBe(1);
      expect(window.state.actionLog.length).toBe(1);
      expect(window.state.actionLog[0].team).toBe('B');
      expect(window.state.actionLog[0].pattern).toBe('spike');
      expect(window.state.actionLog[0].playerId).toBeNull();
    });

    it('should fully recalculate serve orders, scores, rotations, and set results from an edited log', async () => {
      window.state.servingTeam = 'A';
      window.state.initialServingTeam = 'A';
      
      window.addPoint('A');
      window.addPoint('B');
      window.addPoint('B');
      
      expect(window.state.scoreA).toBe(1);
      expect(window.state.scoreB).toBe(2);
      expect(window.state.servingTeam).toBe('B');
      
      const firstAction = window.state.actionLog[0];
      firstAction.scoringTeam = 'B';
      
      window.recalculateStateFromLog();
      
      expect(window.state.scoreA).toBe(0);
      expect(window.state.scoreB).toBe(3);
      expect(window.state.servingTeam).toBe('B');
    });
  });
});
