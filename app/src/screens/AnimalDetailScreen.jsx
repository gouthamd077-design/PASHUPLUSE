import React, { useState, useEffect } from 'react';
import { useTranslation } from '../i18n';
import {
  getLocalAnimalById,
  getLocalEventsByAnimal,
  saveLocalHealthEvent,
  archiveLocalAnimal,
} from '../storage/repositories';
import { runSync } from '../sync/syncManager';
import {
  ArrowLeft,
  Plus,
  Syringe,
  Pill,
  Thermometer,
  Stethoscope,
  Sparkles,
  Archive,
  Calendar,
  X,
  IndianRupee,
} from 'lucide-react';

export default function AnimalDetailScreen({ animalId, onBack }) {
  const { t } = useTranslation();
  const [animal, setAnimal] = useState(null);
  const [events, setEvents] = useState([]);
  const [showAddEventModal, setShowAddEventModal] = useState(false);

  // Form State
  const [eventType, setEventType] = useState('vaccination');
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [cost, setCost] = useState('');
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      const a = await getLocalAnimalById(animalId);
      setAnimal(a);
      const evs = await getLocalEventsByAnimal(animalId);
      setEvents(evs);
    } catch (e) {
      console.error('Failed to load animal detail:', e);
    }
  };

  useEffect(() => {
    loadData();
    const handleDataSynced = () => loadData();
    window.addEventListener('pashupulse:data-synced', handleDataSynced);
    return () => window.removeEventListener('pashupulse:data-synced', handleDataSynced);
  }, [animalId]);

  const handleAddEvent = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSaving(true);
    try {
      await saveLocalHealthEvent({
        animal_id: animalId,
        event_type: eventType,
        event_date: eventDate,
        title: title.trim(),
        notes: notes.trim() || undefined,
        cost: cost ? parseFloat(cost) : undefined,
      });

      setTitle('');
      setNotes('');
      setCost('');
      setShowAddEventModal(false);
      await loadData();

      // Trigger sync if online
      runSync();
    } catch (err) {
      alert('Failed to save health event: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async () => {
    if (window.confirm(t('archive_confirm'))) {
      await archiveLocalAnimal(animalId);
      runSync();
      onBack();
    }
  };

  const getEventIcon = (type) => {
    switch (type) {
      case 'vaccination':
        return <Syringe size={18} className="text-emerald-600" />;
      case 'deworming':
        return <Pill size={18} className="text-amber-600" />;
      case 'illness':
        return <Thermometer size={18} className="text-red-600" />;
      case 'treatment':
        return <Stethoscope size={18} className="text-blue-600" />;
      case 'insemination':
        return <Sparkles size={18} className="text-purple-600" />;
      default:
        return <Calendar size={18} className="text-slate-600" />;
    }
  };

  if (!animal) {
    return <div className="p-8 text-center">{t('loading')}</div>;
  }

  const totalCost = events.reduce((sum, ev) => sum + (ev.cost || 0), 0);

  return (
    <div className="space-y-5 pb-24">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 touch-target flex items-center space-x-1.5 font-bold text-sm shadow-sm"
        >
          <ArrowLeft size={18} />
          <span>{t('back')}</span>
        </button>

        {animal.status !== 'archived' && (
          <button
            onClick={handleArchive}
            className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 touch-target flex items-center space-x-1.5 font-semibold text-xs border border-red-200"
          >
            <Archive size={16} />
            <span>{t('archive_animal')}</span>
          </button>
        )}
      </div>

      {/* Animal Header Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-2xl font-extrabold text-slate-900">
                {animal.name || `Animal #${animal.tag_id}`}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-100 text-brand-800 border border-brand-200">
                {animal.tag_id}
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1 capitalize">
              {animal.species} • {animal.breed || 'Indigenous'} • {animal.gender} • {animal.age_months ? `${animal.age_months} months old` : 'Age unknown'}
            </p>
          </div>
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
              animal.status === 'archived' ? 'bg-slate-100 text-slate-600' : 'bg-emerald-100 text-emerald-800'
            }`}
          >
            {animal.status}
          </span>
        </div>

        {totalCost > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>Total Healthcare Spend:</span>
            <span className="font-bold text-slate-900 text-sm">₹{totalCost.toFixed(0)}</span>
          </div>
        )}
      </div>

      {/* Health Timeline Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg text-slate-900">{t('timeline_title')}</h3>
          <button
            onClick={() => setShowAddEventModal(true)}
            className="px-3.5 py-2 bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white font-bold rounded-xl shadow-sm touch-target flex items-center space-x-1.5 text-sm"
          >
            <Plus size={16} />
            <span>{t('add_event')}</span>
          </button>
        </div>

        {events.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500">
            <Syringe size={36} className="mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-medium">{t('empty_events')}</p>
          </div>
        ) : (
          <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
            {events.map((ev) => (
              <div key={ev.id} className="relative bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                {/* Timeline Dot */}
                <div className="absolute -left-[27px] top-4 w-6 h-6 rounded-full bg-slate-50 border-2 border-brand-500 flex items-center justify-center shadow-sm">
                  <div className="w-2 h-2 rounded-full bg-brand-600"></div>
                </div>

                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 rounded-lg bg-slate-100">
                      {getEventIcon(ev.event_type)}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{ev.title}</h4>
                      <span className="text-xs text-slate-500">{ev.event_date}</span>
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 capitalize">
                    {t(ev.event_type) || ev.event_type}
                  </span>
                </div>

                {ev.notes && (
                  <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    {ev.notes}
                  </p>
                )}

                {ev.cost && (
                  <div className="mt-2 text-right text-xs font-semibold text-slate-700">
                    Cost: ₹{ev.cost}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Health Event Modal */}
      {showAddEventModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-brand-700 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-lg">{t('add_event')}</h3>
              <button
                onClick={() => setShowAddEventModal(false)}
                className="p-1 rounded-full hover:bg-white/20 touch-target"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddEvent} className="p-5 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  {t('event_type')}
                </label>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl bg-white font-medium text-sm"
                >
                  <option value="vaccination">{t('vaccination')}</option>
                  <option value="deworming">{t('deworming')}</option>
                  <option value="illness">{t('illness')}</option>
                  <option value="treatment">{t('treatment')}</option>
                  <option value="insemination">{t('insemination')}</option>
                  <option value="general">{t('general')}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  {t('event_date')} *
                </label>
                <input
                  type="date"
                  required
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl font-medium text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  {t('event_title')} *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. FMD Booster Dose / Foot checkup"
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl font-medium text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  {t('notes')}
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Observations, manufacturer batch, veterinarian notes..."
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl font-medium text-sm"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  {t('cost')}
                </label>
                <input
                  type="number"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  placeholder="e.g. 100"
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl font-medium text-sm"
                />
              </div>

              <div className="pt-2 flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddEventModal(false)}
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
