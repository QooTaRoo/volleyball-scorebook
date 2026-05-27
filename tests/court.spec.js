const { test, expect } = require('@playwright/test');

test.describe('Court starting lineup & click interaction E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to page
    await page.goto('/index.html');
    // Wait for the app to initialize
    await page.waitForSelector('#main-menu');
  });

  test('z-index click interception test (Start new match and Cancel)', async ({ page }) => {
    // Verify we can click "新規試合開始" without z-index intercepting it
    const newMatchBtn = page.locator('button:has-text("新規試合開始")');
    await expect(newMatchBtn).toBeVisible();
    await newMatchBtn.click();

    // Verify match setup modal is shown
    const setupModal = page.locator('#match-setup-modal');
    await expect(setupModal).toBeVisible();

    // Click "戻る" button inside modal and verify z-index doesn't intercept it
    const backBtn = page.locator('#match-setup-modal button:has-text("戻る")');
    await expect(backBtn).toBeVisible();
    await backBtn.click();

    // Modal should close and return to main menu
    await expect(setupModal).toBeHidden();
  });

  test('Preset team court editor - Substitute, swap, and validate active player exclusion', async ({ page }) => {
    // 1. Open App Settings
    const settingsBtn = page.locator('button:has-text("アプリ設定")');
    await expect(settingsBtn).toBeVisible();
    await settingsBtn.click();

    // 2. Open Team & Member management
    const teamMgmtBtn = page.locator('button:has-text("チーム・メンバーの管理")');
    await expect(teamMgmtBtn).toBeVisible();
    await teamMgmtBtn.click();

    // 3. Open Court starter setting modal
    const courtSettingBtn = page.locator('button:has-text("コートでスタメン設定")');
    await expect(courtSettingBtn).toBeVisible();
    await courtSettingBtn.click();

    // Verify Court modal is open and displays "新規チーム" (default name)
    const courtModal = page.locator('#court-modal');
    await expect(courtModal).toBeVisible();
    await expect(page.locator('#court-team-label')).toHaveText('新規チーム');

    // 4. Verify initial starting lineup numbers in court elements:
    // pos-1: 1, pos-2: 2, pos-3: 3, pos-4: 4, pos-5: 5, pos-6: 6
    await expect(page.locator('#pos-1 .player-num')).toHaveText('1');
    await expect(page.locator('#pos-2 .player-num')).toHaveText('2');
    await expect(page.locator('#pos-3 .player-num')).toHaveText('3');

    // 5. Test active player exclusion: Click pos-3 (Player 3) to open substitution modal
    await page.locator('#pos-3').click();

    // Substitution modal should open
    const subModal = page.locator('#sub-modal');
    await expect(subModal).toBeVisible();

    // Check bench selection list:
    // It should display player 7 (bench player)
    const benchPlayer7 = page.locator('#bench-list button:has-text("7")');
    await expect(benchPlayer7).toBeVisible();

    // It should NOT display player 3 (the player being substituted) as a bench option to substitute with
    // Wait, the selector for player 3 in "控え選手と交代" section should be hidden/non-existent
    const benchPlayer3 = page.locator('#bench-list button:has-text("3")');
    // Ensure that player 3 IN button doesn't exist in the bench list section
    const benchListHtml = await page.locator('#bench-list').innerHTML();
    expect(benchListHtml).not.toContain('A-Player 3'); // If it existed from incorrect Team B fallback
    // Since player 3 is already a starter, they shouldn't appear in the bench list (only M7-M12 should be on the bench)
    // Let's verify that player 3's number "3" button with blue text "IN" does not exist
    const benchPlayer3Count = await page.locator('#bench-list button:has(span:text("3"))').count();
    expect(benchPlayer3Count).toBe(0);

    // 6. Perform substitution: Substitute Player 3 with Player 7
    await page.locator('#bench-list button:has-text("7")').click();

    // Sub modal should close and pos-3 should now display Player 7!
    await expect(subModal).toBeHidden();
    await expect(page.locator('#pos-3 .player-num')).toHaveText('7');

    // 7. Perform swap: Swap pos-3 (now Player 7) and pos-2 (Player 2)
    // Click pos-3 (Player 7) first to open the sub modal
    await page.locator('#pos-3').click();
    await expect(subModal).toBeVisible();

    // In the sub modal, click the SWAP button for Player 2
    const swapPlayer2 = page.locator('#bench-list button:has-text("SWAP"):has-text("2")');
    await expect(swapPlayer2).toBeVisible();
    await swapPlayer2.click();

    // Sub modal should close and the swap should be completed
    await expect(subModal).toBeHidden();

    // Pos-3 should now have Player 2, and Pos-2 should now have Player 7!
    await expect(page.locator('#pos-3 .player-num')).toHaveText('2');
    await expect(page.locator('#pos-2 .player-num')).toHaveText('7');

    // 8. Close Court Modal
    await page.locator('#court-modal button:has-text("閉じる")').click();
    await expect(courtModal).toBeHidden();
  });

  test('Preserve registered libero on starting a new match', async ({ page }) => {
    // 1. Setup a master team preset in LocalStorage with a Libero player
    await page.evaluate(() => {
      const presetTeam = {
        id: 'p_test_123',
        name: 'Libero Team',
        color: '#ff0000',
        isMyTeam: true,
        members: [
          { id: 'M1', number: 1, name: 'P1', isStarter: true },
          { id: 'M2', number: 2, name: 'P2', isStarter: true },
          { id: 'M3', number: 3, name: 'P3', isStarter: true },
          { id: 'M4', number: 4, name: 'P4', isStarter: true },
          { id: 'M5', number: 5, name: 'P5', isStarter: true },
          { id: 'M6', number: 6, name: 'P6', isStarter: true },
          { id: 'M7', number: 7, name: 'P7-Libero', isStarter: false, isLibero: true }
        ]
      };
      localStorage.setItem('vb_preset_teams', JSON.stringify([presetTeam]));
    });

    // Reload the page to ensure the LocalStorage state is loaded
    await page.reload();

    // 2. Open "新規試合開始" (Start new match) dialog
    const newMatchBtn = page.locator('button:has-text("新規試合開始")');
    await newMatchBtn.click();

    // Verify Match Setup modal is open
    const setupModal = page.locator('#match-setup-modal');
    await expect(setupModal).toBeVisible();

    // 3. Open Team A settings inside Match Setup
    await page.locator('#setup-name-a').click();

    // Select the "Libero Team" preset in dropdown
    const presetSelect = page.locator('#config-preset-select');
    await expect(presetSelect).toBeVisible();
    await presetSelect.selectOption('Libero Team');

    // Click "適用" to confirm team configuration
    await page.locator('button:has-text("適用")').click();

    // 4. Click "試合開始 ➔" button inside match-setup-modal
    const startMatchBtn = page.locator('#match-setup-modal button:has-text("試合開始")');
    await expect(startMatchBtn).toBeVisible();
    await startMatchBtn.click();

    // Setup modal should close and match starts
    await expect(setupModal).toBeHidden();

    // 5. Open the court overlay to verify that the libero was successfully preserved!
    const courtOverlayBtn = page.locator('#area-a button').first();
    await expect(courtOverlayBtn).toBeVisible();
    await courtOverlayBtn.click();

    // Court modal should open
    const courtModal = page.locator('#court-modal');
    await expect(courtModal).toBeVisible();

    // Verify that the Libero select dropdown has player M7 (mapped to A7) selected!
    const liberoSelect = page.locator('#court-libero-select-1');
    await expect(liberoSelect).toHaveValue('A7');
    
    // Clean up
    await page.locator('#court-modal button:has-text("閉じる")').click();
  });

  test('Display L badge on court when Libero is in the starting lineup', async ({ page }) => {
    // 1. Setup a master team preset in LocalStorage with Player 1 as both a starter and a Libero
    await page.evaluate(() => {
      const presetTeam = {
        id: 'p_test_456',
        name: 'Starter Libero Team',
        color: '#00ff00',
        isMyTeam: true,
        members: [
          { id: 'M1', number: 1, name: 'P1-LibStarter', isStarter: true, isLibero: true },
          { id: 'M2', number: 2, name: 'P2', isStarter: true, isLibero: false },
          { id: 'M3', number: 3, name: 'P3', isStarter: true, isLibero: false },
          { id: 'M4', number: 4, name: 'P4', isStarter: true, isLibero: false },
          { id: 'M5', number: 5, name: 'P5', isStarter: true, isLibero: false },
          { id: 'M6', number: 6, name: 'P6', isStarter: true, isLibero: false }
        ]
      };
      localStorage.setItem('vb_preset_teams', JSON.stringify([presetTeam]));
    });

    // Reload the page to ensure the LocalStorage state is loaded
    await page.reload();

    // 2. Open settings and team management
    await page.locator('button:has-text("アプリ設定")').click();
    await page.locator('button:has-text("チーム・メンバーの管理")').click();

    // 3. Load the "Starter Libero Team" preset
    const presetSelect = page.locator('#master-team-select');
    await presetSelect.selectOption('Starter Libero Team');

    // 4. Open Court starter setting modal
    await page.locator('button:has-text("コートでスタメン設定")').click();

    // Verify Court modal is open
    const courtModal = page.locator('#court-modal');
    await expect(courtModal).toBeVisible();

    // Player 1 at position 1 should display '1' and have the 'L' badge!
    await expect(page.locator('#pos-1 .player-num')).toHaveText('1');
    const lBadge = page.locator('#pos-1 .libero-badge');
    await expect(lBadge).toBeVisible();
    await expect(lBadge).toHaveText('L');

    // Clean up
    await page.locator('#court-modal button:has-text("閉じる")').click();
  });

  test('Auto-load registered libero on starting a new match without manual re-selection', async ({ page }) => {
    // 1. Setup a master team preset (TestTeam with No.7 as libero) and state.teamA = "TestTeam" (without liberos loaded yet)
    await page.evaluate(() => {
      const presetTeam = {
        id: 'p_test_789',
        name: 'TestTeam',
        color: '#ff0000',
        isMyTeam: true,
        members: Array.from({ length: 12 }, (_, i) => ({
          id: `M${i+1}`,
          number: i + 1,
          name: `Player ${i+1}`,
          isStarter: i < 6,
          isLibero: i === 6 // No.7 is Libero
        }))
      };
      localStorage.setItem('vb_preset_teams', JSON.stringify([presetTeam]));

      // Active state before the match: teamA is "TestTeam", but state.liberosA is empty
      // mimics the state where the match was reset but not re-applied
      const activeState = {
        teamA: 'TestTeam',
        teamB: 'TEAM B',
        colorA: '#ff0000',
        colorB: '#ffffff',
        scoreA: 0,
        scoreB: 0,
        setsA: 0,
        setsB: 0,
        toA: 0,
        toB: 0,
        currentSet: 1,
        maxSets: 3,
        targetPoints: 25,
        finalSetTarget: 15,
        showAdvancedMode: false,
        myTeamOnlyStats: false,
        isMyTeamA: true,
        isMyTeamB: false,
        membersA: Array.from({length: 12}, (_, i) => ({ id: `A${i+1}`, number: i + 1, name: `${i+1}`, isStarter: i < 6, isLibero: false })),
        membersB: Array.from({length: 12}, (_, i) => ({ id: `B${i+1}`, number: i + 1, name: `${i+1}`, isStarter: i < 6, isLibero: false })),
        lineupA: ["A1", "A2", "A3", "A4", "A5", "A6"],
        lineupB: ["B1", "B2", "B3", "B4", "B5", "B6"],
        liberosA: [], // Empty!
        liberosB: [],
        servingTeam: 'A'
      };
      localStorage.setItem('volleyball_score_state', JSON.stringify(activeState));
    });

    // Reload the page
    await page.reload();

    // 2. Open setup modal by starting a new match (directly from main menu, no need to click Settings)
    await page.locator('button:has-text("新規試合開始")').click();

    // Confirm custom dialog if visible
    const confirmModal = page.locator('#custom-confirm-modal');
    if (await confirmModal.isVisible()) {
      await page.locator('#custom-confirm-yes').click();
    }

    // Match Setup modal should show up with "TestTeam" already filled
    const setupModal = page.locator('#match-setup-modal');
    await expect(setupModal).toBeVisible();
    await expect(page.locator('#setup-name-a')).toHaveText('TestTeam');

    // 3. DO NOT select/apply the team. Just click "試合開始 ➔" immediately!
    const startMatchBtn = page.locator('#match-setup-modal button:has-text("試合開始")');
    await startMatchBtn.click();
    await expect(setupModal).toBeHidden();

    // 4. Open the court overlay to verify that the libero was automatically loaded from the preset
    const courtOverlayBtn = page.locator('#area-a button').first();
    await expect(courtOverlayBtn).toBeVisible();
    await courtOverlayBtn.click();

    const courtModal = page.locator('#court-modal');
    await expect(courtModal).toBeVisible();

    // Dropdown should now automatically have 'A7' selected (No.7 Libero loaded)
    const liberoSelect = page.locator('#court-libero-select-1');
    await expect(liberoSelect).toHaveValue('A7');

    // Clean up
    await page.locator('#court-modal button:has-text("閉じる")').click();
  });
});
