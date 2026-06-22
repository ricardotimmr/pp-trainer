// Implemented in P4-004 via deduplicateActivity.
// Returns isDuplicate: false as a pass-through until P4-004.
export async function deduplicateStage(_input: {
  athleteProfileId: string;
  rawPayloadHash?: string;
}): Promise<{ isDuplicate: false }> {
  return { isDuplicate: false };
}
