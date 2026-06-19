import { expect, test } from '@playwright/test';

test.describe('Phase 2 empty-state fixtures', () => {
  test('dashboard handles no upcoming workouts and no recent activities', async ({
    page,
  }) => {
    await page.goto('/dashboard?fixture=dashboard_empty');

    await expect(
      page.getByRole('heading', { level: 1, name: 'Dashboard' }),
    ).toBeVisible();
    await expect(page.getByText('No upcoming workouts')).toBeVisible();
    await expect(page.getByText('No recent activities')).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Active goal' }),
    ).toBeVisible();
  });

  test('performance handles missing swim race predictors', async ({ page }) => {
    await page.goto('/performance?fixture=performance_missing_swim_predictors');

    await expect(
      page.getByRole('heading', { level: 1, name: 'Performance' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { level: 2, name: 'Swimming' }),
    ).toBeVisible();
    await expect(
      page.getByText('No race predictor data available for Swimming.'),
    ).toBeVisible();
    await expect(page.getByText('40km TT')).toBeVisible();
    await expect(page.getByText('5K')).toBeVisible();
  });

  test('training plan handles an empty week plan', async ({ page }) => {
    await page.goto('/training-plan?fixture=training_plan_empty');

    await expect(
      page.getByRole('heading', { level: 1, name: 'Build Week 3' }),
    ).toBeVisible();
    await expect(page.getByText('No planned workouts')).toBeVisible();
  });

  test('settings handles missing optional threshold baselines', async ({
    page,
  }) => {
    await page.goto('/settings?fixture=athlete_missing_thresholds');

    await expect(
      page.getByRole('heading', { level: 1, name: 'Settings' }),
    ).toBeVisible();
    await expect(
      page.getByText('No threshold baselines available yet.'),
    ).toBeVisible();
    await expect(page.getByText('Bike FTP')).toHaveCount(0);
    await expect(page.getByText('Max HR')).toHaveCount(0);
    await expect(page.getByText('Run threshold')).toHaveCount(0);
    await expect(page.getByText('Swim threshold')).toHaveCount(0);
  });

  test('AI Coach handles missing optional threshold baselines', async ({
    page,
  }) => {
    await page.goto('/ai-coach?fixture=athlete_missing_thresholds');

    await expect(
      page.getByRole('heading', { level: 1, name: 'AI Coach' }),
    ).toBeVisible();
    await expect(page.getByText('Athlete', { exact: true })).toBeVisible();
    await expect(
      page.getByText('No threshold baselines available yet.'),
    ).toBeVisible();
    await expect(page.getByText('Ricardo')).toBeVisible();
  });

  test('import handles empty import history', async ({ page }) => {
    await page.goto('/import?fixture=import_empty_history');

    await expect(
      page.getByRole('heading', { level: 1, name: 'Import' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Drop activity files here' }),
    ).toBeVisible();
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
    await expect(page.getByText('No recent imports')).toBeVisible();
  });
});
