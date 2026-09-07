import { describe, expect, it, vi, beforeEach } from 'vitest';

describe('Volleyball Scorebook - History Logic (history.js)', () => {
  beforeEach(() => {
    // Custom window alerts and confirms
    window.showCustomAlert = vi.fn().mockResolvedValue(undefined);
    window.showCustomConfirm = vi.fn().mockResolvedValue(true);
  });

  describe('getGroupKeyAndDisplayName()', () => {
    it('should format valid date strings into key and display name correctly', () => {
      const { key, display } = window.getGroupKeyAndDisplayName('2026/05/25 13:19:56');
      expect(key).toBe('2026-05-25');
      expect(display).toBe('2026年5月25日(月)');
    });

    it('should fallback gracefully for weird or legacy date strings', () => {
      const { key, display } = window.getGroupKeyAndDisplayName('UnknownDate');
      expect(key).toBe('UnknownDate');
      expect(display).toBe('UnknownDate');
    });
  });

  describe('renderHistory() grouping', () => {
    it('should group multiple matches by date and render headers with accordion contents', () => {
      const mockHistory = [
        {
          date: '2026/05/25 10:00:00',
          teamA: 'TEAM A',
          teamB: 'TEAM B',
          setsA: 2,
          setsB: 1,
          durationMinutes: 45,
          maxSets: 3,
          colorA: '#eab308',
          colorB: '#ffffff',
          setHistory: []
        },
        {
          date: '2026/05/25 14:00:00',
          teamA: 'TEAM C',
          teamB: 'TEAM D',
          setsA: 0,
          setsB: 2,
          durationMinutes: 30,
          maxSets: 3,
          colorA: '#eab308',
          colorB: '#ffffff',
          setHistory: []
        },
        {
          date: '2026/05/24 18:30:00',
          teamA: 'TEAM A',
          teamB: 'TEAM C',
          setsA: 2,
          setsB: 0,
          durationMinutes: 40,
          maxSets: 3,
          colorA: '#eab308',
          colorB: '#ffffff',
          setHistory: []
        }
      ];

      localStorage.setItem('volleyball_match_history', JSON.stringify(mockHistory));
      
      // Render
      window.renderHistory();

      // Check group elements in JSDOM
      const dateGroups = document.querySelectorAll('.date-group');
      expect(dateGroups.length).toBe(2); // Two days: 2026-05-25 and 2026-05-24

      // Verify the first group header (2026-05-25) has "2試合" badge and correct text
      const headerText1 = dateGroups[0].querySelector('button').textContent;
      expect(headerText1).toContain('2026年5月25日');
      expect(headerText1).toContain('2試合');

      // Verify the second group header (2026-05-24) has "1試合" badge
      const headerText2 = dateGroups[1].querySelector('button').textContent;
      expect(headerText2).toContain('2026年5月24日');
      expect(headerText2).toContain('1試合');

      // Check accordion container IDs exist and content matches matches count
      const content1 = dateGroups[0].querySelector('#date-group-content-2026-05-25');
      const content2 = dateGroups[1].querySelector('#date-group-content-2026-05-24');
      expect(content1).not.toBeNull();
      expect(content2).not.toBeNull();

      expect(content1.children.length).toBe(2);
      expect(content2.children.length).toBe(1);
    });
  });

  describe('toggleDateGroup()', () => {
    it('should toggle hidden class on date group content when header clicked', () => {
      const mockHistory = [
        {
          date: '2026/05/25 10:00:00',
          teamA: 'TEAM A',
          teamB: 'TEAM B',
          setsA: 2,
          setsB: 1,
          durationMinutes: 45,
          maxSets: 3,
          colorA: '#eab308',
          colorB: '#ffffff',
          setHistory: []
        }
      ];
      localStorage.setItem('volleyball_match_history', JSON.stringify(mockHistory));
      window.renderHistory();

      const content = document.getElementById('date-group-content-2026-05-25');
      const caret = document.getElementById('date-group-caret-2026-05-25');
      expect(content.classList.contains('hidden')).toBe(false);

      // Toggle to collapse
      window.toggleDateGroup('2026-05-25');
      expect(content.classList.contains('hidden')).toBe(true);
      expect(caret.classList.contains('-rotate-90')).toBe(true);

      // Toggle again to expand
      window.toggleDateGroup('2026-05-25');
      expect(content.classList.contains('hidden')).toBe(false);
      expect(caret.classList.contains('-rotate-90')).toBe(false);
    });
  });

  describe('renderTimeline() layout', () => {
    it('should render fixed total scores on the left and scrollable points on the right', () => {
      const setLog = [
        { type: 'point', scoringTeam: 'A', team: 'A' },
        { type: 'point', scoringTeam: 'B', team: 'B' },
        { type: 'timeout', team: 'A' }
      ];
      window.state = {
        actionLog: [...setLog],
        matchComplete: false
      };

      const el = window.renderTimeline(setLog, 'TEAM A', 'TEAM B', '#eab308', '#ffffff', 1, 1, false);
      expect(el).not.toBeNull();

      // Check left fixed column with total score boxes
      const leftCol = el.querySelector('.shrink-0.flex.flex-col');
      expect(leftCol).not.toBeNull();
      expect(leftCol.textContent).toContain('1'); // Score A and B

      // Check right horizontally scrollable container
      const scrollContainer = el.querySelector('.timeline-container');
      expect(scrollContainer).not.toBeNull();
      expect(scrollContainer.classList.contains('overflow-x-auto')).toBe(true);

      // Verify point boxes are inside the scrollable container
      const pointBoxes = scrollContainer.querySelectorAll('.color-box');
      expect(pointBoxes.length).toBeGreaterThan(0);
    });
  });

  describe('shareContainerAsImage() title formatting', () => {
    it('should share match score as title via navigator.share', async () => {
      window.state = {
        teamA: 'チームA',
        teamB: 'チームB',
        setsA: 2,
        setsB: 1
      };
      global.html2canvas = vi.fn().mockResolvedValue({
        toBlob: (cb) => cb(new Blob(['test'], { type: 'image/png' }))
      });

      const shareMock = vi.fn().mockResolvedValue(undefined);
      global.navigator.canShare = vi.fn().mockReturnValue(true);
      global.navigator.share = shareMock;

      // Dummy DOM container
      const dummyDiv = document.createElement('div');
      dummyDiv.id = 'timeline-content';
      document.body.appendChild(dummyDiv);

      await window.shareContainerAsImage('timeline-content', 'timeline.png');

      expect(shareMock).toHaveBeenCalledWith(expect.objectContaining({
        title: 'チームA 2 - 1 チームB',
        text: 'チームA 2 - 1 チームB'
      }));

      dummyDiv.remove();
    });
  });
});
