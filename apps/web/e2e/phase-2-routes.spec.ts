import { expect, test } from '@playwright/test';

test.describe('Phase 2 top-level routes', () => {
  test('dashboard renders current week context and active goal', async ({ page }) => {
    await page.goto('/dashboard');

    await expect(
      page.getByRole('heading', { level: 1, name: 'Dashboard' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Weekly summary' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Active goal' }),
    ).toBeVisible();
    await expect(page.getByText('Olympic triathlon build')).toBeVisible();
    await expect(page.getByText('1 secondary')).toBeVisible();
    await expect(page.getByText('1 watchlist')).toBeVisible();
  });

  test('training plan renders week plan and opens a workout detail', async ({ page }) => {
    await page.goto('/training-plan');

    await expect(
      page.getByRole('heading', { level: 1, name: 'Build Week 3' }),
    ).toBeVisible();
    await expect(page.getByText('Sessions')).toBeVisible();
    await expect(page.getByText('Bike threshold over-unders')).toBeVisible();

    await page.getByRole('button', { name: /Bike threshold over-unders/i }).click();

    await expect(page).toHaveURL(/\/workouts\/workout-bike-threshold-2026-06-16$/);
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: 'Bike threshold over-unders',
      }),
    ).toBeVisible();
  });

  test('AI Coach renders week plan and single workout tabs with goal context', async ({
    page,
  }) => {
    await page.goto('/ai-coach');

    await expect(
      page.getByRole('heading', { level: 1, name: 'AI Coach' }),
    ).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Week Plan' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Single Workout' })).toBeVisible();
    await expect(page.getByText('Main goal')).toBeVisible();
    await expect(page.getByText('Secondary goals')).toBeVisible();
    await expect(page.getByText('Watchlist')).toBeVisible();
  });

  test('settings renders athlete context, goals and zones', async ({ page }) => {
    await page.goto('/settings');

    await expect(
      page.getByRole('heading', { level: 1, name: 'Settings' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', {
        name: 'Profile and performance baselines',
      }),
    ).toBeVisible();
    await expect(page.getByText('Active goals')).toBeVisible();
    await expect(
      page.getByText('Training availability', { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Intensity model' }),
    ).toBeVisible();
  });

  test('import renders disabled upload, source strategy and pipeline', async ({
    page,
  }) => {
    await page.goto('/import');

    await expect(
      page.getByRole('heading', { level: 1, name: 'Import' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Drop activity files here' }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Upload disabled' }),
    ).toBeDisabled();
    await expect(
      page.getByRole('heading', {
        name: 'External sources normalize into one Activity model',
      }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', {
        name: 'Garmin is important, but replaceable',
      }),
    ).toBeVisible();
  });

  test('performance renders sport benchmark sections', async ({ page }) => {
    await page.goto('/performance');

    await expect(
      page.getByRole('heading', { level: 1, name: 'Performance' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { level: 2, name: 'Running' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { level: 2, name: 'Roadbike' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { level: 2, name: 'Swimming' }),
    ).toBeVisible();
    await expect(page.getByText('VO2 max', { exact: true })).toHaveCount(2);
    await expect(
      page.getByText('Threshold HR', { exact: true }),
    ).toHaveCount(3);
    await expect(
      page.getByText('Race predictors', { exact: true }),
    ).toHaveCount(3);
  });

  test('primary navigation can reach performance', async ({ page }) => {
    await page.goto('/dashboard');

    await page
      .getByRole('navigation', { name: 'Prototype screens' })
      .getByRole('button', { name: 'Performance' })
      .click();

    await expect(page).toHaveURL(/\/performance$/);
    await expect(
      page.getByRole('heading', { level: 1, name: 'Performance' }),
    ).toBeVisible();
  });

  test('compact navigation keeps performance reachable at tablet width', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1100, height: 800 });
    await page.goto('/dashboard');

    await page.evaluate(() => window.scrollTo(0, 240));

    await expect(page.locator('.app-shell__header')).toHaveClass(/is-scrolled/);

    await page
      .getByRole('navigation', { name: 'Prototype screens' })
      .getByRole('button', { name: 'Performance' })
      .click();

    await expect(page).toHaveURL(/\/performance$/);
    await expect(
      page.getByRole('heading', { level: 1, name: 'Performance' }),
    ).toBeVisible();
  });

  test('settings edits feed the AI Coach session context', async ({ page }) => {
    await page.goto('/settings');

    await page
      .locator('.settings-sports button')
      .filter({ hasText: 'Strength' })
      .click();
    await page
      .getByRole('button', {
        name: /Remove Consistent open-water swim rhythm from active goals/i,
      })
      .click();

    await page
      .getByRole('navigation', { name: 'Prototype screens' })
      .getByRole('button', { name: 'AI Coach' })
      .click();

    await expect(
      page.getByRole('heading', { level: 1, name: 'AI Coach' }),
    ).toBeVisible();
    await expect(page.locator('.ai-context-sports')).not.toContainText(
      'Strength',
    );
    await expect(page.getByText('Watchlist', { exact: true })).toHaveCount(0);
  });

  test('settings custom dropdowns close on Escape and restore trigger focus', async ({
    page,
  }) => {
    await page.goto('/settings');

    const priorityTrigger = page
      .locator('.settings-goal-priority__trigger')
      .first();

    await priorityTrigger.click();
    await expect(priorityTrigger).toHaveClass(/is-open/);

    await page.keyboard.press('Escape');

    await expect(priorityTrigger).not.toHaveClass(/is-open/);
    await expect(priorityTrigger).toBeFocused();
  });
});
