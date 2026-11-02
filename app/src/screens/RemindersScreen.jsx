import React, { useState, useEffect } from 'react';
import { useTranslation } from '../i18n';
import {
  getLocalReminders,
  getLocalAnimals,
  saveLocalReminder,
  toggleLocalReminder,
} from '../storage/repositories';
import { runSync } from '../sync/syncManager';
import {
  Bell,
  Plus,
  CheckCircle,
  Circle,
  Calendar,
  X,
  Syringe,
  Pill,
  Clock,
} from 'lucide-react';

export default function RemindersScreen() {
  const { t } = useTranslation();
  const [reminders, setReminders] = useState([]);
  const [animals, setAnimals] = useState([]);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'completed' | 'all'
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [reminderType, setReminderType] = useState('vaccine');
  const [animalId, setAnimalId] = useState('');
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      const rems = await getLocalReminders();
      setReminders(rems);
      const anims = await getLocalAnimals(false);
      setAnimals(anims);
    } catch (e) {
      console.error('Failed to load reminders:', e);
    }
  };

  useEffect(() => {
    loadData();
    const handleDataSynced = () => loadData();
    window.addEventListener('pashupulse:data-synced', handleDataSynced);
    return () => window.removeEventListener('pashupulse:data-synced', handleDataSynced);
  }, []);

  const handleCreateReminder = async (e) => {
    e.preventDefault();
    if (!title.trim() || !dueDate) return;

    setSaving(true);
    try {
      await saveLocalReminder({
        title: title.trim(),
        due_date: dueDate,
        reminder_type: reminderType,
        animal_id: animalId || undefined,
      });

      setTitle('');
      setDueDate('');
      setAnimalId('');
      setShowAddModal(false);
      await loadData();

      // Trigger sync if online
      runSync();
    } catch (err) {
      alert('Failed to save reminder: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id, currentStatus) => {
    await toggleLocalReminder(id, !currentStatus);
    await loadData();
    runSync();
  };

  const filtered = reminders.filter((r) => {
    if (activeTab === 'pending') return !r.is_done;
    if (activeTab === 'completed') return r.is_done;
    return true;
  });

  const getLinkedAnimalName = (id) => {
    if (!id) return null;
    const a = animals.find((item) => item.id === id);
    return a ? (a.name || `#${a.tag_id}`) : null;
  };

  return (
    <div className="space-y-4 pb-24 max-w-xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">{t('reminders_title')}</h2>
          <p className="text-xs text-slate-500">Stay on top of vaccinations & health schedules</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white font-bold rounded-xl shadow touch-target flex items-center space-x-1.5 transition-colors"
        >
          <Plus size={18} />
          <span>{t('add_reminder')}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl bg-slate-200 p-1 text-xs font-semibold">
        {[
          { id: 'pending', label: t('filter_pending') },
          { id: 'completed', label: t('filter_completed') },
          { id: 'all', label: t('filter_all') },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 rounded-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-slate-900 shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Reminders List */}
      {filtered.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500">
          <Bell size={36} className="mx-auto text-slate-300 mb-2" />
          <p className="text-sm font-medium">{t('empty_reminders')}</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((r) => {
            const animalName = getLinkedAnimalName(r.animal_id);
            return (
              <div
                key={r.id}
                className={`p-4 rounded-xl border bg-white shadow-sm flex items-start space-x-3 transition-all ${
                  r.is_done ? 'border-slate-200 opacity-60 bg-slate-50' : 'border-slate-200 hover:border-brand-500'
                }`}
              >
                {/* Toggle Button */}
                <button
                  onClick={() => handleToggle(r.id, r.is_done)}
                  className="mt-0.5 text-slate-400 hover:text-brand-600 active:scale-95 transition-transform touch-target p-1 flex-shrink-0"
                >
                  {r.is_done ? (
                    <CheckCircle size={24} className="text-emerald-600 fill-emerald-100" />
                  ) : (
                    <Circle size={24} className="hover:text-brand-600" />
                  )}
                </button>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4
                      className={`font-bold text-slate-900 text-base ${
                        r.is_done ? 'line-through text-slate-400' : ''
                      }`}
                    >
                      {r.title}
                    </h4>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded uppercase bg-slate-100 text-slate-600 border border-slate-200">
                      {r.reminder_type}
                    </span>
                  </div>

                  <div className="flex items-center space-x-3 text-xs text-slate-500 mt-1">
                    <span className="flex items-center space-x-1">
                      <Calendar size={13} />
                      <span>Due: {r.due_date}</span>
                    </span>
                    {animalName && (
                      <span className="bg-brand-50 text-brand-700 px-2 py-0.5 rounded font-medium">
                        🐄 {animalName}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Reminder Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-brand-700 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-lg">{t('add_reminder')}</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-full hover:bg-white/20 touch-target"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateReminder} className="p-5 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  {t('reminder_title')} *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. FMD Booster Vaccine / Albendazole Deworming"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  {t('due_date')} *
                </label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  {t('reminder_type')}
                </label>
                <select
                  value={reminderType}
                  onChange={(e) => setReminderType(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl bg-white font-medium text-sm"
                >
                  <option value="vaccine">Vaccination</option>
                  <option value="deworm">Deworming</option>
                  <option value="checkup">Vet Checkup</option>
                  <option value="general">General Care</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  {t('linked_animal')}
                </label>
                <select
                  value={animalId}
                  onChange={(e) => setAnimalId(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl bg-white font-medium text-sm"
                >
                  <option value="">-- No specific animal (Herd general) --</option>
                  {animals.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name ? `${a.name} (${a.tag_id})` : `Animal #${a.tag_id}`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl touch-target"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white font-bold rounded-xl touch-target shadow"
                >
                  {saving ? t('loading') : t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
