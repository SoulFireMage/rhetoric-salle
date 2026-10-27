// App state: signals persisted to localStorage, with optional Skapi sync.

import { computed, effect, signal } from '@preact/signals';
import { DEFAULT_MODEL } from '../config';
import * as cloud from '../lib/cloud';
import { applyOutcome, emptyTelemetry, mergeTelemetry, normaliseTelemetry, type NodeDelta, type Outcome } from '../lib/telemetry';
import type { BoutSummary, DrillItem, SavedItem, Settings, UserTelemetry } from '../lib/types';
import { SEED_DRILLS } from '../data/drills';

const KEYS = {
  telemetry: 'rs.telemetry.v1',
  settings: 'rs.settings.v1',
  apiKey: 'rs.openrouter_key',
  transcripts: 'rs.transcripts.v1',
  cloudDrills: 'rs.cloud_drills.v1',
};

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
  } catch {
    /* storage full or blocked: keep running in memory */
  }
}

// ── Settings & key ──────────────────────────────────────

const defaultSettings: Settings = {
  theme: 'auto',
  register: 'dual',
  judge_model: DEFAULT_MODEL,
  opponent_model: DEFAULT_MODEL,
  word_cap: 120,
};

export const settings = signal<Settings>({ ...defaultSettings, ...load<Partial<Settings>>(KEYS.settings, {}) });
effect(() => save(KEYS.settings, settings.value));
export const updateSettings = (patch: Partial<Settings>) => (settings.value = { ...settings.value, ...patch });

export const apiKey = signal<string>((() => {
  try {
    return localStorage.getItem(KEYS.apiKey) ?? '';
  } catch {
    return '';
  }
})());
effect(() => {
  try {
    if (apiKey.value) localStorage.setItem(KEYS.apiKey, apiKey.value);
    else localStorage.removeItem(KEYS.apiKey);
  } catch {
    /* ignore */
  }
});

effect(() => {
  const t = settings.value.theme;
  const root = document.documentElement;
  if (t === 'auto') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', t);
});

// ── Telemetry ───────────────────────────────────────────

export const telemetry = signal<UserTelemetry>(normaliseTelemetry(load(KEYS.telemetry, null)));
effect(() => save(KEYS.telemetry, telemetry.value));

export const profile = signal<cloud.Profile | null>(null);
export const syncState = signal<{ status: 'off' | 'syncing' | 'synced' | 'error'; message?: string; at?: string }>({ status: 'off' });

let syncTimer: ReturnType<typeof setTimeout> | undefined;
function scheduleSync() {
  if (!profile.value) return;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(() => void pushNow(), 4000);
}

async function pushNow() {
  if (!profile.value) return;
  syncState.value = { status: 'syncing' };
  try {
    await cloud.pushTelemetry({ ...telemetry.value, user_id: profile.value.user_id });
    syncState.value = { status: 'synced', at: new Date().toISOString() };
  } catch (e) {
    syncState.value = { status: 'error', message: cloud.errorMessage(e) };
  }
}

/** Pull the cloud copy, merge with local, push the result back. */
export async function syncNow() {
  const p = profile.value;
  if (!p) return;
  syncState.value = { status: 'syncing' };
  try {
    const remoteRaw = await cloud.pullTelemetry(p.user_id);
    const local = telemetry.value;
    telemetry.value = remoteRaw ? mergeTelemetry(local, normaliseTelemetry(remoteRaw, p.user_id), p.user_id) : { ...local, user_id: p.user_id };
    await cloud.pushTelemetry(telemetry.value);
    syncState.value = { status: 'synced', at: new Date().toISOString() };
  } catch (e) {
    syncState.value = { status: 'error', message: cloud.errorMessage(e) };
  }
}

export function recordOutcome(o: Outcome): NodeDelta[] {
  const { telemetry: next, deltas } = applyOutcome(telemetry.value, o);
  telemetry.value = next;
  scheduleSync();
  return deltas;
}

export function addBout(b: BoutSummary) {
  telemetry.value = { ...telemetry.value, salle_history: [...telemetry.value.salle_history, b], updated_at: new Date().toISOString() };
  scheduleSync();
}

export function saveItem(item: Omit<SavedItem, 'id' | 'date'>) {
  const full: SavedItem = { ...item, id: `saved_${Date.now().toString(36)}`, date: new Date().toISOString() };
  telemetry.value = { ...telemetry.value, saved_items: [...telemetry.value.saved_items, full], updated_at: full.date };
  scheduleSync();
}

export function deleteSavedItem(id: string) {
  telemetry.value = { ...telemetry.value, saved_items: telemetry.value.saved_items.filter((x) => x.id !== id), updated_at: new Date().toISOString() };
  scheduleSync();
}

export function resetProgress() {
  telemetry.value = { ...emptyTelemetry(profile.value?.user_id), updated_at: new Date().toISOString() };
  scheduleSync();
}

// ── Transcripts (local; mirrored to the cloud when signed in) ──

export interface StoredTranscript {
  bout_id: string;
  turns: { speaker: 'opponent' | 'user'; round: number; text: string; flagged?: string[] }[];
  scorecard?: unknown;
}

export const transcripts = signal<StoredTranscript[]>(load(KEYS.transcripts, []));
effect(() => save(KEYS.transcripts, transcripts.value.slice(-40)));

export function storeTranscript(t: StoredTranscript) {
  transcripts.value = [...transcripts.value.filter((x) => x.bout_id !== t.bout_id), t];
  const p = profile.value;
  if (p) cloud.pushTranscript(p.user_id, t.bout_id, t).catch(() => undefined);
}

// ── Accounts ────────────────────────────────────────────

export async function initAccount() {
  profile.value = await cloud.currentProfile();
  if (profile.value) await syncNow();
}

export async function loginAndSync(email: string, password: string) {
  profile.value = await cloud.login(email, password);
  await syncNow();
}

export async function signupAndSync(email: string, password: string, name?: string) {
  profile.value = await cloud.signup(email, password, name);
  if (profile.value) await syncNow();
}

export async function logoutAndKeepLocal() {
  await pushNow();
  await cloud.logout();
  cloud.resetTelemetryRecordCache();
  profile.value = null;
  syncState.value = { status: 'off' };
  telemetry.value = { ...telemetry.value, user_id: 'local_anon' };
}

export const isAdmin = computed(() => cloud.isAdmin(profile.value));

// ── Drill bank ──────────────────────────────────────────

export const cloudDrills = signal<cloud.CloudDrill[]>(load(KEYS.cloudDrills, []));
effect(() => save(KEYS.cloudDrills, cloudDrills.value));

export async function refreshCloudDrills() {
  try {
    const extra = isAdmin.value && profile.value ? [profile.value.user_id] : [];
    cloudDrills.value = await cloud.fetchCloudDrills(extra);
  } catch {
    /* offline or project unavailable: keep cached */
  }
}

export const allDrills = computed<DrillItem[]>(() => {
  const map = new Map<string, DrillItem>();
  for (const d of SEED_DRILLS) map.set(d.id, d);
  for (const c of cloudDrills.value) map.set(c.drill.id, c.drill);
  return [...map.values()];
});

export const drillById = (id: string) => allDrills.value.find((d) => d.id === id);

// ── Export / import ─────────────────────────────────────

export function exportJson(): string {
  return JSON.stringify(
    { app: 'rhetoric-forge', version: 1, exported_at: new Date().toISOString(), telemetry: telemetry.value, transcripts: transcripts.value, settings: settings.value },
    null,
    2,
  );
}

/** Import merges rather than overwrites, so nothing local is lost. API keys are never exported or imported. */
export function importJson(text: string) {
  const data = JSON.parse(text);
  const incoming = normaliseTelemetry(data?.telemetry ?? data, telemetry.value.user_id);
  telemetry.value = mergeTelemetry(telemetry.value, incoming, telemetry.value.user_id);
  if (Array.isArray(data?.transcripts)) {
    const byId = new Map(transcripts.value.map((t) => [t.bout_id, t]));
    for (const t of data.transcripts) if (t?.bout_id) byId.set(t.bout_id, t);
    transcripts.value = [...byId.values()];
  }
  scheduleSync();
}
