import React, { useState, useEffect } from 'react';
import { useTranslation } from '../i18n';
import { getLocalAnimals, saveLocalAnimal, deleteLocalAnimal } from '../storage/repositories';
import { runSync } from '../sync/syncManager';
import { apiRequest } from '../api/client';
import HealthPassportModal from '../components/HealthPassportModal';
import {
  Plus,
  Search,
  Filter,
  ChevronRight,
  FolderHeart,
  Tag,
  X,
  QrCode,
  Trash2,
  AlertTriangle,
} from 'lucide-react';

export default function AnimalListScreen({ onSelectAnimal }) {
  const { t, language } = useTranslation();
  const [animals, setAnimals] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('active'); // 'active' | 'archived' | 'all'
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPassportAnimal, setSelectedPassportAnimal] = useState(null);

  // Delete State
  const [animalToDelete, setAnimalToDelete] = useState(null);
  const [deleteMode, setDeleteMode] = useState('archive'); // 'archive' | 'permanent'
  const [isDeleting, setIsDeleting] = useState(false);

  // Form State
  const [tagId, setTagId] = useState('');
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('cattle');
  const [breed, setBreed] = useState('Gir');
  const [gender, setGender] = useState('female');
  const [ageMonths, setAgeMonths] = useState('36');
  const [saving, setSaving] = useState(false);

  const loadAnimals = async () => {
    try {
      const data = await getLocalAnimals(true);
      setAnimals(data);
    } catch (e) {
      console.error('Error loading animals:', e);
    }
  };

  useEffect(() => {
    loadAnimals();
    const handleDataSynced = () => loadAnimals();
    window.addEventListener('pashupulse:data-synced', handleDataSynced);
    return () => window.removeEventListener('pashupulse:data-synced', handleDataSynced);
  }, []);

  const handleCreateAnimal = async (e) => {
    e.preventDefault();
    if (!tagId.trim()) return;

    setSaving(true);
    try {
      await saveLocalAnimal({
        tag_id: tagId.trim(),
        name: name.trim() || undefined,
        species,
        breed: breed.trim() || undefined,
        gender,
        age_months: ageMonths ? parseInt(ageMonths, 10) : undefined,
      });

      // Clear & close
      setTagId('');
      setName('');
      setShowAddModal(false);
      await loadAnimals();

      // Trigger sync if online
      runSync();
    } catch (err) {
      alert('Failed to save animal: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleExecuteDelete = async () => {
    if (!animalToDelete) return;
    setIsDeleting(true);
    try {
      const isPermanent = deleteMode === 'permanent';

      // 1. If online, call API
      if (navigator.onLine) {
        try {
          await apiRequest(`/animals/${animalToDelete.id}?hard=${isPermanent}`, {
            method: 'DELETE',
          });
        } catch (apiErr) {
          console.warn('Backend delete error (falling back to offline queue):', apiErr);
        }
      }

      // 2. Local storage delete
      await deleteLocalAnimal(animalToDelete.id, isPermanent);

      // 3. Close modal & reload
      setAnimalToDelete(null);
      await loadAnimals();

      // 4. Trigger sync
      runSync();
    } catch (err) {
      alert('Failed to delete animal: ' + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredAnimals = animals.filter((a) => {
    const matchesStatus =
      filterStatus === 'all'
        ? true
        : filterStatus === 'archived'
        ? a.status === 'archived'
        : a.status !== 'archived';

    const matchesSearch =
      !searchTerm ||
      a.tag_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.breed?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  const getSpeciesIcon = (s) => {
    switch (s?.toLowerCase()) {
      case 'buffalo':
        return '🐃';
      case 'goat':
        return '🐐';
      case 'sheep':
        return '🐑';
      default:
        return '🐄';
    }
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Header and Add Action */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">{t('animals_title')}</h2>
          <p className="text-xs text-slate-500">
            {filteredAnimals.length} {t('total_animals').toLowerCase()}
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white font-bold rounded-xl shadow touch-target flex items-center space-x-1.5 transition-colors"
        >
          <Plus size={18} />
          <span>{t('add_animal')}</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3.5 top-3.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Tag ID or Name..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div className="flex rounded-xl bg-slate-200 p-1 text-xs font-semibold">
          {['active', 'archived', 'all'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterStatus(tab)}
              className={`flex-1 px-3 py-1.5 rounded-lg capitalize transition-colors ${
                filterStatus === tab
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab === 'active' ? t('active') : tab === 'archived' ? t('archived') : 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Animal Cards List */}
      {filteredAnimals.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500">
          <FolderHeart size={40} className="mx-auto text-slate-300 mb-2" />
          <p className="text-sm font-medium">{t('empty_animals')}</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredAnimals.map((animal) => (
            <div
              key={animal.id}
              onClick={() => onSelectAnimal(animal.id)}
              className={`bg-white rounded-xl p-4 border shadow-sm cursor-pointer hover:border-brand-500 transition-all flex items-center justify-between ${
                animal.status === 'archived' ? 'opacity-60 bg-slate-50 border-slate-200' : 'border-slate-200'
              }`}
            >
              <div className="flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-xl bg-brand-50 text-2xl flex items-center justify-center border border-brand-100 flex-shrink-0">
                  {getSpeciesIcon(animal.species)}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900 text-base">
                      {animal.name || `Animal #${animal.tag_id}`}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      {animal.tag_id}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 capitalize">
                    {animal.species} • {animal.breed || 'Indigenous'} • {animal.gender} • {animal.age_months ? `${animal.age_months}m` : ''}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  title="View Verified QR Passport"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPassportAnimal(animal);
                  }}
                  className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center space-x-1 text-xs font-bold transition-all shadow-sm active:scale-95"
                >
                  <QrCode size={16} className="text-emerald-700" />
                  <span className="hidden sm:inline">{language === 'kn' ? 'ಕ್ಯೂಆರ್ ಪಾಸ್‌ಪೋರ್ಟ್' : 'QR Passport'}</span>
                </button>
                <button
                  type="button"
                  title={t('delete_animal')}
                  onClick={(e) => {
                    e.stopPropagation();
                    setAnimalToDelete(animal);
                  }}
                  className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 flex items-center justify-center transition-all shadow-sm active:scale-95 touch-target"
                >
                  <Trash2 size={16} />
                </button>
                <ChevronRight size={20} className="text-slate-400" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Verified Health Passport Modal */}
      {selectedPassportAnimal && (
        <HealthPassportModal
          isOpen={!!selectedPassportAnimal}
          onClose={() => setSelectedPassportAnimal(null)}
          animal={selectedPassportAnimal}
          animals={animals}
          onAnimalUpdated={() => loadAnimals()}
        />
      )}

      {/* Add Animal Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-brand-700 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-lg">{t('add_animal')}</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-full hover:bg-white/20 touch-target"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateAnimal} className="p-5 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  {t('tag_id')} *
                </label>
                <input
                  type="text"
                  required
                  value={tagId}
                  onChange={(e) => setTagId(e.target.value)}
                  placeholder="e.g. GJ-01-2034"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  {t('animal_name')}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Lakshmi"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    {t('species')}
                  </label>
                  <select
                    value={species}
                    onChange={(e) => setSpecies(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl bg-white font-medium text-sm"
                  >
                    <option value="cattle">{t('cattle')}</option>
                    <option value="buffalo">{t('buffalo')}</option>
                    <option value="goat">{t('goat')}</option>
                    <option value="sheep">{t('sheep')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    {t('gender')}
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl bg-white font-medium text-sm"
                  >
                    <option value="female">{t('female')}</option>
                    <option value="male">{t('male')}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    {t('breed')}
                  </label>
                  <input
                    type="text"
                    value={breed}
                    onChange={(e) => setBreed(e.target.value)}
                    placeholder="e.g. Gir / Murrah"
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl font-medium text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    {t('age_months')}
                  </label>
                  <input
                    type="number"
                    value={ageMonths}
                    onChange={(e) => setAgeMonths(e.target.value)}
                    placeholder="e.g. 36"
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl font-medium text-sm"
                  />
                </div>
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

      {/* Delete Animal Confirmation Modal */}
      {animalToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="bg-red-600 text-white p-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Trash2 size={20} />
                <h3 className="font-bold text-lg">{t('delete_animal')}</h3>
              </div>
              <button
                onClick={() => setAnimalToDelete(null)}
                disabled={isDeleting}
                className="p-1 rounded-full hover:bg-white/20 touch-target"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center space-x-3">
                <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 text-2xl flex items-center justify-center flex-shrink-0">
                  {getSpeciesIcon(animalToDelete.species)}
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-base">
                    {animalToDelete.name || `Animal #${animalToDelete.tag_id}`}
                  </div>
                  <div className="text-xs text-slate-500 font-medium">
                    Tag: <span className="font-bold text-slate-700">{animalToDelete.tag_id}</span> • {animalToDelete.species}
                  </div>
                </div>
              </div>

              <p className="text-sm text-slate-700 font-medium">
                {t('delete_confirm')}
              </p>

              {/* Mode Selection */}
              <div className="space-y-2">
                <label
                  onClick={() => setDeleteMode('archive')}
                  className={`flex items-start p-3 border rounded-xl cursor-pointer transition-all ${
                    deleteMode === 'archive'
                      ? 'border-brand-500 bg-brand-50/50 ring-1 ring-brand-500'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="deleteMode"
                    value="archive"
                    checked={deleteMode === 'archive'}
                    onChange={() => setDeleteMode('archive')}
                    className="mt-1 text-brand-600 focus:ring-brand-500"
                  />
                  <div className="ml-3">
                    <span className="block text-sm font-bold text-slate-900">
                      {language === 'kn' ? 'ಆರ್ಕೈವ್ ಮಾಡಿ (ಹಳೆಯ ದಾಖಲೆ - ಶಿಫಾರಸು ಮಾಡಲಾಗಿದೆ)' : 'Archive (Recommended - Keep history)'}
                    </span>
                    <span className="block text-xs text-slate-500 mt-0.5">
                      {t('delete_subtext')}
                    </span>
                  </div>
                </label>

                <label
                  onClick={() => setDeleteMode('permanent')}
                  className={`flex items-start p-3 border rounded-xl cursor-pointer transition-all ${
                    deleteMode === 'permanent'
                      ? 'border-red-500 bg-red-50/50 ring-1 ring-red-500'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="deleteMode"
                    value="permanent"
                    checked={deleteMode === 'permanent'}
                    onChange={() => setDeleteMode('permanent')}
                    className="mt-1 text-red-600 focus:ring-red-500"
                  />
                  <div className="ml-3">
                    <span className="block text-sm font-bold text-red-700">
                      {t('delete_permanent')}
                    </span>
                    <span className="block text-xs text-red-600 mt-0.5">
                      {t('delete_permanent_warning')}
                    </span>
                  </div>
                </label>
              </div>

              <div className="pt-2 flex space-x-3">
                <button
                  type="button"
                  onClick={() => setAnimalToDelete(null)}
                  disabled={isDeleting}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl touch-target"
                >
                  {t('cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleExecuteDelete}
                  disabled={isDeleting}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold rounded-xl touch-target shadow flex items-center justify-center space-x-1.5"
                >
                  <Trash2 size={16} />
                  <span>{isDeleting ? t('loading') : t('confirm')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
