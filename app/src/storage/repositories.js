import {
  getAllFromStore,
  getByIdFromStore,
  putToStore,
  deleteFromStore,
  getDB,
} from './db';

export function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ----------------- SYNC QUEUE -----------------

export async function enqueueMutation({ entity, action, entityId, data }) {
  const mutation = {
    id: generateUUID(),
    entity,
    action,
    entity_id: entityId,
    data,
    client_timestamp: new Date().toISOString(),
    status: 'pending',
  };
  await putToStore('sync_queue', mutation);
  return mutation;
}

export async function getPendingMutations() {
  const all = await getAllFromStore('sync_queue');
  return all.sort((a, b) => new Date(a.client_timestamp) - new Date(b.client_timestamp));
}

export async function removeMutations(ids) {
  const db = await getDB();
  const tx = db.transaction('sync_queue', 'readwrite');
  const store = tx.objectStore('sync_queue');
  for (const id of ids) {
    store.delete(id);
  }
  return new Promise((resolve) => {
    tx.oncomplete = () => resolve();
  });
}

// ----------------- ANIMALS -----------------

export async function getLocalAnimals(includeArchived = false) {
  const animals = await getAllFromStore('animals');
  if (includeArchived) return animals;
  return animals.filter((a) => a.status !== 'archived');
}

export async function getLocalAnimalById(id) {
  return await getByIdFromStore('animals', id);
}

export async function saveLocalAnimal(animalData, isFromSync = false) {
  const now = new Date().toISOString();
  const animal = {
    id: animalData.id || generateUUID(),
    user_id: animalData.user_id || 'local_user',
    tag_id: animalData.tag_id,
    name: animalData.name || '',
    species: animalData.species || 'cattle',
    breed: animalData.breed || '',
    gender: animalData.gender || 'female',
    age_months: animalData.age_months ? parseInt(animalData.age_months, 10) : null,
    photo_url: animalData.photo_url || null,
    status: animalData.status || 'active',
    created_at: animalData.created_at || now,
    updated_at: now,
  };

  await putToStore('animals', animal);

  if (!isFromSync) {
    const action = animalData.id ? 'update' : 'create';
    await enqueueMutation({
      entity: 'animal',
      action,
      entityId: animal.id,
      data: animal,
    });
  }

  return animal;
}

export async function archiveLocalAnimal(id, isFromSync = false) {
  const animal = await getByIdFromStore('animals', id);
  if (!animal) return;

  animal.status = 'archived';
  animal.updated_at = new Date().toISOString();
  await putToStore('animals', animal);

  if (!isFromSync) {
    await enqueueMutation({
      entity: 'animal',
      action: 'delete',
      entityId: id,
      data: animal,
    });
  }
}

// ----------------- HEALTH EVENTS -----------------

export async function getLocalEventsByAnimal(animalId) {
  const all = await getAllFromStore('health_events');
  return all
    .filter((e) => e.animal_id === animalId)
    .sort((a, b) => new Date(b.event_date) - new Date(a.event_date));
}

export async function saveLocalHealthEvent(eventData, isFromSync = false) {
  const now = new Date().toISOString();
  const event = {
    id: eventData.id || generateUUID(),
    animal_id: eventData.animal_id,
    user_id: eventData.user_id || 'local_user',
    event_type: eventData.event_type || 'general',
    event_date: eventData.event_date || now.split('T')[0],
    title: eventData.title,
    notes: eventData.notes || '',
    cost: eventData.cost ? parseFloat(eventData.cost) : null,
    created_at: eventData.created_at || now,
    updated_at: now,
  };

  await putToStore('health_events', event);

  if (!isFromSync) {
    await enqueueMutation({
      entity: 'health_event',
      action: 'create',
      entityId: event.id,
      data: event,
    });
  }

  return event;
}

// ----------------- REMINDERS -----------------

export async function getLocalReminders() {
  const all = await getAllFromStore('reminders');
  return all.sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
}

export async function saveLocalReminder(remData, isFromSync = false) {
  const now = new Date().toISOString();
  const reminder = {
    id: remData.id || generateUUID(),
    user_id: remData.user_id || 'local_user',
    animal_id: remData.animal_id || null,
    title: remData.title,
    due_date: remData.due_date,
    reminder_type: remData.reminder_type || 'general',
    is_done: !!remData.is_done,
    completed_at: remData.completed_at || null,
    created_at: remData.created_at || now,
    updated_at: now,
  };

  await putToStore('reminders', reminder);

  if (!isFromSync) {
    const action = remData.id ? 'update' : 'create';
    await enqueueMutation({
      entity: 'reminder',
      action,
      entityId: reminder.id,
      data: reminder,
    });
  }

  return reminder;
}

export async function toggleLocalReminder(id, isDone, isFromSync = false) {
  const reminder = await getByIdFromStore('reminders', id);
  if (!reminder) return;

  const now = new Date().toISOString();
  reminder.is_done = isDone;
  reminder.completed_at = isDone ? now : null;
  reminder.updated_at = now;

  await putToStore('reminders', reminder);

  if (!isFromSync) {
    await enqueueMutation({
      entity: 'reminder',
      action: 'update',
      entityId: id,
      data: { is_done: isDone },
    });
  }
  return reminder;
}

// ----------------- SYMPTOM RULES (OFFLINE CACHE) -----------------

export async function getCachedSymptomRules() {
  return await getAllFromStore('symptom_rules');
}

export async function saveCachedSymptomRules(rules) {
  const db = await getDB();
  const tx = db.transaction('symptom_rules', 'readwrite');
  const store = tx.objectStore('symptom_rules');
  for (const r of rules) {
    store.put(r);
  }
  return new Promise((resolve) => {
    tx.oncomplete = () => resolve();
  });
}

// ----------------- META WATERMARKS -----------------

export async function getLastSyncedAt() {
  const record = await getByIdFromStore('app_meta', 'last_synced_at');
  return record ? record.value : null;
}

export async function setLastSyncedAt(timestamp) {
  await putToStore('app_meta', { key: 'last_synced_at', value: timestamp });
}
