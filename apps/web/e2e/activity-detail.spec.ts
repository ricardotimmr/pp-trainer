import { expect, test } from '@playwright/test';

test.describe('activity detail pages', () => {
  test('renders cycling analytics with chart streams, power file and splits', async ({
    page,
  }) => {
    await page.goto('/activities/activity-bike-endurance-2026-06-14');

    await expect(
      page.getByRole('heading', {
        level: 1,
        name: /endurance ride with short climbs/i,
      }),
    ).toBeVisible();
    await expect(page.getByRole('tab', { name: /heart rate/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /power/i })).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /power file/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /laps by block/i }),
    ).toBeVisible();
  });

  test('renders running analytics with pace, cadence and run mechanics', async ({
    page,
  }) => {
    await page.goto('/activities/activity-run-easy-2026-06-13');

    await expect(
      page.getByRole('heading', { level: 1, name: /easy aerobic run/i }),
    ).toBeVisible();
    await expect(page.getByRole('tab', { name: /pace/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /cadence/i })).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /run mechanics/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /kilometer rhythm/i }),
    ).toBeVisible();
  });

  test('renders swimming analytics with swim pace, pool efficiency and laps', async ({
    page,
  }) => {
    await page.goto('/activities/activity-swim-technique-2026-06-12');

    await expect(
      page.getByRole('heading', {
        level: 1,
        name: /technique swim with pull buoy/i,
      }),
    ).toBeVisible();
    await expect(page.getByRole('tab', { name: /heart rate/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /swim pace/i })).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /pool efficiency/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /swim set breakdown/i }),
    ).toBeVisible();
  });

  test('renders strength analytics without chart tabs and with set details', async ({
    page,
  }) => {
    await page.goto('/activities/activity-strength-2026-06-10');

    await expect(
      page.getByRole('heading', {
        level: 1,
        name: /lower body strength maintenance/i,
      }),
    ).toBeVisible();
    await expect(page.getByRole('tablist')).toHaveCount(0);
    await expect(
      page.getByRole('heading', { name: /exercise overview/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /set breakdown/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /goblet squat/i }),
    ).toBeVisible();
  });

  test('renders an error state for unknown activity IDs', async ({ page }) => {
    await page.goto('/activities/not-real');

    await expect(
      page.getByRole('heading', { level: 1, name: /activity not found/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /unknown activity/i }),
    ).toBeVisible();
    await expect(page.getByText(/not-real/i)).toBeVisible();
  });
});
