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
});
