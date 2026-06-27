export function getLastCompletedWeekRange(): { weekStart: Date; weekEnd: Date } {
  const now = new Date();
  const day = now.getUTCDay();
  const daysFromMonday = day === 0 ? 6 : day - 1;
  const thisMonday = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - daysFromMonday),
  );
  const lastMonday = new Date(thisMonday);
  lastMonday.setUTCDate(thisMonday.getUTCDate() - 7);
  const lastSunday = new Date(thisMonday);
  lastSunday.setUTCDate(thisMonday.getUTCDate() - 1);
  return { weekStart: lastMonday, weekEnd: lastSunday };
}

export function getWeekRangeFromStart(weekStartDate: string): { weekStart: Date; weekEnd: Date } {
  const weekStart = new Date(`${weekStartDate}T00:00:00Z`);
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekStart.getUTCDate() + 6);
  return { weekStart, weekEnd };
}

export function getCurrentWeekRange(): { weekStart: Date; weekEnd: Date } {
  const now = new Date();
  const day = now.getUTCDay();
  const daysFromMonday = day === 0 ? 6 : day - 1;
  const weekStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - daysFromMonday),
  );
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekStart.getUTCDate() + 7);
  return { weekStart, weekEnd };
}
