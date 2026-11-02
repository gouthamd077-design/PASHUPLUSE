import { apiRequest, getAuthToken } from '../api/client';
import {
  getPendingMutations,
  removeMutations,
  getLastSyncedAt,
  setLastSyncedAt,
  saveLocalAnimal,
  saveLocalHealthEvent,
  saveLocalReminder,
  saveCachedSymptomRules,
} from '../storage/repositories';

let isSyncing = false;

export async function runSync() {
  if (isSyncing) return { status: 'already_running' };
  if (!navigator.onLine) return { status: 'offline' };
  const token = getAuthToken();
  if (!token) return { status: 'unauthenticated' };

  isSyncing = true;
  window.dispatchEvent(new CustomEvent('pashupulse:sync-status', { detail: { state: 'syncing' } }));

  try {
    // 1. Fetch and cache symptom rules if online
    try {
      const offlineRules = await apiRequest('/symptom-check/rules');
      if (Array.isArray(offlineRules) && offlineRules.length > 0) {
        await saveCachedSymptomRules(offlineRules);
      }
    } catch (e) {
      console.warn('Could not refresh symptom rules cache:', e);
    }

    // 2. Fetch pending mutations from queue
    const pending = await getPendingMutations();
    const lastSyncedAt = await getLastSyncedAt();

    const payload = {
      mutations: pending.map((m) => ({
        id: m.id,
        entity: m.entity,
        action: m.action,
        entity_id: m.entity_id,
        data: m.data || {},
        client_timestamp: m.client_timestamp,
      })),
      last_synced_at: lastSyncedAt,
    };

    // 3. Send to POST /sync
    const result = await apiRequest('/sync', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    // 4. Clear sent mutations
    if (pending.length > 0) {
      const sentIds = pending.map((m) => m.id);
      await removeMutations(sentIds);
    }

    // 5. Apply server delta to local storage
    if (result.delta) {
      if (result.delta.animals) {
        for (const a of result.delta.animals) {
          await saveLocalAnimal(a, true);
        }
      }
      if (result.delta.health_events) {
        for (const ev of result.delta.health_events) {
          await saveLocalHealthEvent(ev, true);
        }
      }
      if (result.delta.reminders) {
        for (const r of result.delta.reminders) {
          await saveLocalReminder(r, true);
        }
      }
    }

    // 6. Update watermark
    if (result.server_time) {
      await setLastSyncedAt(result.server_time);
    }

    window.dispatchEvent(new CustomEvent('pashupulse:sync-status', { detail: { state: 'success' } }));
    window.dispatchEvent(new CustomEvent('pashupulse:data-synced'));

    return { status: 'success', applied: result.applied_mutations };
  } catch (err) {
    console.error('Sync failed:', err);
    window.dispatchEvent(new CustomEvent('pashupulse:sync-status', { detail: { state: 'error', error: err.message } }));
    return { status: 'error', error: err.message };
  } finally {
    isSyncing = false;
  }
}

// Auto-sync listener on coming back online
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('[SyncManager] Network online detected. Triggering sync...');
    runSync();
  });
}
