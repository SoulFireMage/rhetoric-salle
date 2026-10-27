// Public configuration. The Skapi project ID is not a secret: it identifies the
// project, and what each user may read or write is enforced by Skapi itself.

export const SKAPI_PROJECT_ID = '5GJ5SJePWQUiq0jvYr-2ZVgaOLUqOhnse3Hcl8M4d';

/**
 * Skapi user IDs whose published drills are trusted as the global drill bank.
 * Anyone can post a public record, so the app only reads drills uploaded by these
 * accounts. Add the admin account's user_id (shown on the Account page) here.
 */
export const ADMIN_USER_IDS: string[] = ['a149c0de-50e1-705d-4ec6-ffb00db55464'];

/** Skapi access group at or above which a signed-in user may open the Admin Studio. */
export const ADMIN_ACCESS_GROUP = 90;

export const TABLES = {
  drills: 'drill_bank',
  telemetry: 'telemetry',
  transcripts: 'salle_transcripts',
} as const;

export const DEFAULT_MODEL = 'anthropic/claude-haiku-4.5';
export const APP_TITLE = 'The Rhetoric Forge';
