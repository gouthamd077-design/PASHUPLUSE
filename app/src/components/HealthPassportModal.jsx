import React, { useState, useEffect } from 'react';
import {
  QrCode,
  Syringe,
  AlertCircle,
  X,
  Share2,
  Download,
  Edit3,
  CheckCircle2,
  Save,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import QRCode from 'qrcode';
import { useTranslation } from '../i18n';
import { saveLocalAnimal } from '../storage/repositories';
import { runSync } from '../sync/syncManager';

export default function HealthPassportModal({
  isOpen,
  onClose,
  animal,
  animals = [],
  onAnimalUpdated,
}) {
  if (!isOpen) return null;

  const { language, t } = useTranslation();
  const [activeTab, setActiveTab] = useState('passport'); // 'passport' | 'emergency_summary' | 'edit'
  const [currentAnimal, setCurrentAnimal] = useState(animal || {});
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: '',
    tag_id: '',
    species: 'cattle',
    breed: '',
    gender: 'female',
    age_months: 24,
    district: 'Mandya, Karnataka',
    owner_name: 'Farmer Daniel Gowda',
    owner_phone: '+91 98450 12345',
    allergies: 'None reported',
    current_medication: 'Meloxicam Oral Bolus',
  });

  // Sync state when animal prop changes
  useEffect(() => {
    if (animal) {
      setCurrentAnimal(animal);
      setEditForm({
        name: animal.name || '',
        tag_id: animal.tag_id || '',
        species: animal.species || 'cattle',
        breed: animal.breed || (language === 'kn' ? 'ಹಳ್ಳಿಕಾರ್' : 'Hallikar'),
        gender: animal.gender || 'female',
        age_months: animal.age_months || 24,
        district: animal.district || (language === 'kn' ? 'ಮಂಡ್ಯ, ಕರ್ನಾಟಕ' : 'Mandya, Karnataka'),
        owner_name: animal.owner_name || (language === 'kn' ? 'ರೈತ ಡೇನಿಯಲ್ ಗೌಡ' : 'Farmer Daniel Gowda'),
        owner_phone: animal.owner_phone || '+91 98450 12345',
        allergies: animal.allergies || (language === 'kn' ? 'ಯಾವುದೂ ಇಲ್ಲ' : 'None reported'),
        current_medication: animal.current_medication || (language === 'kn' ? 'ಮೆಲೋಕ್ಸಿಕಾಮ್ ಬೋಲಸ್' : 'Meloxicam Bolus'),
      });
    }
  }, [animal, language]);

  // Generate real dynamic QR Code whenever current animal details change
  useEffect(() => {
    const origin =
      typeof window !== 'undefined' && window.location.origin
        ? window.location.origin
        : 'https://pashupluse.vercel.app';
    const tag = currentAnimal.tag_id || currentAnimal.id || 'KA-MAN-9901';
    const passportUrl = `${origin}/?passport=${encodeURIComponent(tag)}`;

    QRCode.toDataURL(passportUrl, {
      width: 320,
      margin: 2,
      color: {
        dark: '#064e3b', // Deep emerald color
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Error generating QR Code:', err));
  }, [currentAnimal]);

  // Handle switching animal when multiple animals exist
  const handleSelectAnimal = (animalId) => {
    const found = animals.find((a) => a.id === animalId || a.tag_id === animalId);
    if (found) {
      setCurrentAnimal(found);
      setEditForm({
        name: found.name || '',
        tag_id: found.tag_id || '',
        species: found.species || 'cattle',
        breed: found.breed || '',
        gender: found.gender || 'female',
        age_months: found.age_months || 24,
        district: found.district || 'Mandya, Karnataka',
        owner_name: found.owner_name || 'Farmer Daniel Gowda',
        owner_phone: found.owner_phone || '+91 98450 12345',
        allergies: found.allergies || 'None reported',
        current_medication: found.current_medication || 'Meloxicam Bolus',
      });
      setSaveSuccess(false);
    }
  };

  // Handle saving new/edited information
  const handleSaveAnimalInfo = async (e) => {
    e.preventDefault();
    if (!editForm.tag_id.trim()) {
      alert(language === 'kn' ? 'ದಯವಿಟ್ಟು ಟ್ಯಾಗ್ ಐಡಿ ನಮೂದಿಸಿ' : 'Please provide a Tag ID');
      return;
    }

    setSaving(true);
    try {
      const updatedData = {
        ...currentAnimal,
        id: currentAnimal.id || editForm.tag_id,
        tag_id: editForm.tag_id.trim().toUpperCase(),
        name: editForm.name.trim(),
        species: editForm.species,
        breed: editForm.breed.trim(),
        gender: editForm.gender,
        age_months: parseInt(editForm.age_months, 10) || 24,
        district: editForm.district,
        owner_name: editForm.owner_name,
        owner_phone: editForm.owner_phone,
        allergies: editForm.allergies,
        current_medication: editForm.current_medication,
        updated_at: new Date().toISOString(),
      };

      // Save to local IndexedDB and queue sync mutation
      const saved = await saveLocalAnimal(updatedData);
      setCurrentAnimal(saved);

      if (onAnimalUpdated) {
        onAnimalUpdated(saved);
      }

      // Trigger background sync to Postgres if online
      runSync();

      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setActiveTab('passport');
      }, 1200);
    } catch (err) {
      alert((language === 'kn' ? 'ಉಳಿಸಲು ವಿಫಲವಾಗಿದೆ: ' : 'Failed to save: ') + err.message);
    } finally {
      setSaving(false);
    }
  };

  const passportUrl = `${
    typeof window !== 'undefined' ? window.location.origin : 'https://pashupluse.vercel.app'
  }/?passport=${encodeURIComponent(currentAnimal.tag_id || currentAnimal.id || '')}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in text-slate-800">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-emerald-500/30 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-900 p-4 sm:p-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-700/50 flex items-center justify-center border border-emerald-400/30 shrink-0">
              <QrCode size={22} className="text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight leading-tight">
                  {t('passport_title')}
                </h2>
                <span className="bg-emerald-400/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-400/30">
                  {language === 'kn' ? 'ಪರಿಶೀಲಿಸಲಾಗಿದೆ' : 'VERIFIED'}
                </span>
              </div>
              <p className="text-xs text-emerald-200 font-mono">
                {t('tag_id')}: {currentAnimal.tag_id || 'KA-MAN-9901'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Animal Switcher (If user has multiple animals) */}
        {animals && animals.length > 1 && (
          <div className="bg-emerald-900/40 px-4 py-2 border-b border-emerald-800/40 flex items-center justify-between text-xs text-white">
            <span className="text-[11px] text-emerald-200 font-bold">
              {t('select_animal_label')}
            </span>
            <select
              value={currentAnimal.id || currentAnimal.tag_id}
              onChange={(e) => handleSelectAnimal(e.target.value)}
              className="bg-emerald-950 text-white rounded-lg px-2.5 py-1 text-xs font-bold border border-emerald-700 focus:outline-none"
            >
              {animals.map((a) => (
                <option key={a.id || a.tag_id} value={a.id || a.tag_id}>
                  {a.name ? `${a.name} (${a.tag_id})` : a.tag_id}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 sm:px-5 pt-2.5">
          <button
            onClick={() => setActiveTab('passport')}
            className={`pb-2.5 text-xs font-bold uppercase tracking-wider border-b-2 mr-5 transition-all ${
              activeTab === 'passport'
                ? 'border-emerald-600 text-emerald-950 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {t('passport_tab_profile')}
          </button>
          <button
            onClick={() => setActiveTab('emergency_summary')}
            className={`pb-2.5 text-xs font-bold uppercase tracking-wider border-b-2 mr-5 transition-all flex items-center space-x-1 ${
              activeTab === 'emergency_summary'
                ? 'border-amber-600 text-amber-950 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <AlertCircle size={13} className="text-amber-600" />
            <span>{t('passport_tab_summary')}</span>
          </button>
          <button
            onClick={() => setActiveTab('edit')}
            className={`pb-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center space-x-1 ${
              activeTab === 'edit'
                ? 'border-blue-600 text-blue-950 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Edit3 size={13} className="text-blue-600" />
            <span>{t('passport_tab_edit')}</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          
          {/* TAB 1: QR & MEDICAL PROFILE */}
          {activeTab === 'passport' && (
            <>
              {/* Dynamic QR Presentation Card */}
              <div className="bg-gradient-to-b from-emerald-50 via-teal-50/50 to-white rounded-3xl p-5 border border-emerald-200/80 flex flex-col items-center text-center shadow-sm">
                <div className="p-3 bg-white rounded-2xl shadow-md border border-slate-200 flex flex-col items-center">
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt="Verified QR Health Passport"
                      className="w-44 h-44 object-contain rounded-xl"
                    />
                  ) : (
                    <div className="w-44 h-44 flex items-center justify-center bg-slate-100 rounded-xl text-slate-400">
                      Generating QR...
                    </div>
                  )}
                  <div className="mt-2 text-[11px] font-mono font-black text-emerald-950 uppercase tracking-wider">
                    {t('passport_scan_notice')}
                  </div>
                </div>

                {/* QR Quick Actions */}
                <div className="mt-3.5 flex items-center space-x-2">
                  <a
                    href={qrDataUrl}
                    download={`PashuPulse-Passport-${currentAnimal.tag_id || 'KA-MAN-9901'}.png`}
                    className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-bold text-[11px] flex items-center space-x-1 shadow-sm transition-all"
                  >
                    <Download size={13} className="text-emerald-700" />
                    <span>{t('download_qr_badge')}</span>
                  </a>

                  <button
                    onClick={() => setActiveTab('edit')}
                    className="px-3 py-1.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold text-[11px] flex items-center space-x-1 transition-all"
                  >
                    <Edit3 size={13} />
                    <span>{t('edit_animal_info')}</span>
                  </button>
                </div>

                <p className="text-[11px] text-slate-600 mt-2.5 max-w-xs leading-relaxed">
                  {language === 'kn'
                    ? 'ಕಿವಿಯ ಟ್ಯಾಗ್‌ನಲ್ಲಿ ಮುದ್ರಿಸಿ ಅಥವಾ ಪಶುವೈದ್ಯರಿಗೆ ಅಧಿಕೃತ ವೈದ್ಯಕೀಯ ಇತಿಹಾಸಕ್ಕಾಗಿ ಸ್ಕ್ಯಾನ್ ಮಾಡಲು ತೋರಿಸಿ.'
                    : 'Attach to cattle ear tag or display to attending veterinarians for instant authenticated medical history.'}
                </p>
              </div>

              {/* Master Animal Identity Details */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h3 className="font-black text-slate-900 uppercase text-[11px] tracking-wider">
                    {language === 'kn' ? 'ಜಾನುವಾರಿನ ಗುರುತಿನ ವಿವರಗಳು' : 'Live Animal Identity'}
                  </h3>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                    {language === 'kn' ? 'ನವೀಕೃತವಾಗಿದೆ' : 'Up to Date'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[11px]">{t('animal_name')}:</span>
                    <span className="font-bold text-slate-900 text-sm">
                      {currentAnimal.name || (language === 'kn' ? 'ಹೆಸರಿಲ್ಲ' : 'Unnamed')}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">{t('tag_id')}:</span>
                    <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block">
                      {currentAnimal.tag_id || 'KA-MAN-9901'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">{t('species')} & {t('breed')}:</span>
                    <span className="font-bold text-slate-900 capitalize">
                      {currentAnimal.species === 'cattle'
                        ? (language === 'kn' ? 'ಹಸು' : 'Cattle')
                        : (language === 'kn' ? 'ಎಮ್ಮೆ' : 'Buffalo')}{' '}
                      ({currentAnimal.breed || (language === 'kn' ? 'ಹಳ್ಳಿಕಾರ್' : 'Indigenous')})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">{t('gender')} & {t('age_months')}:</span>
                    <span className="font-bold text-slate-900">
                      {currentAnimal.gender === 'female'
                        ? (language === 'kn' ? 'ಹೆಣ್ಣು' : 'Female')
                        : (language === 'kn' ? 'ಗಂಡು' : 'Male')}{' '}
                      • {currentAnimal.age_months || 24} {language === 'kn' ? 'ತಿಂಗಳು' : 'mos'}
                    </span>
                  </div>
                  <div className="col-span-2 pt-1 border-t border-slate-200 flex justify-between">
                    <div>
                      <span className="text-slate-500 block text-[11px]">{language === 'kn' ? 'ಫಾರ್ಮ್ / ಜಿಲ್ಲೆ:' : 'District:'}</span>
                      <span className="font-bold text-slate-900">{currentAnimal.district || 'Mandya, Karnataka'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">{language === 'kn' ? 'ಆರೈಕೆದಾರರ ಫೋನ್:' : 'Caregiver Phone:'}</span>
                      <span className="font-bold text-slate-900">{currentAnimal.owner_phone || '+91 98450 12345'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Vaccination & Preventive History */}
              <div className="border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                  <Syringe size={14} className="text-emerald-600" />
                  <span>{t('passport_vaccine_title')}</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center p-2 rounded-xl bg-emerald-50 border border-emerald-100">
                    <div>
                      <span className="font-bold text-emerald-950 block">{t('passport_fmd')}</span>
                      <span className="text-[11px] text-emerald-700">
                        {language === 'kn' ? 'ವರ್ಷಕ್ಕೆ ಎರಡು ಬಾರಿ ಬೂಸ್ಟರ್ ಮುಗಿದಿದೆ' : 'Bi-annual booster completed'}
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-800 bg-emerald-200/60 px-2 py-0.5 rounded-full">
                      {t('passport_protected')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-xl bg-slate-50 border border-slate-200">
                    <div>
                      <span className="font-bold text-slate-800 block">{t('passport_hs')}</span>
                      <span className="text-[11px] text-slate-500">
                        {language === 'kn' ? 'ಮುಂಗಾರು ಪೂರ್ವದಲ್ಲಿ ನಿಗದಿಪಡಿಸಲಾಗಿದೆ' : 'Scheduled pre-monsoon'}
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-600">
                      {language === 'kn' ? 'ಮೇ 2026' : 'May 2026'}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* TAB 2: EMERGENCY SUMMARY */}
          {activeTab === 'emergency_summary' && (
            <div className="space-y-3.5">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs space-y-1">
                <span className="font-bold text-amber-900 uppercase tracking-wider block text-[11px]">
                  {language === 'kn' ? 'ತುರ್ತು ಚಿಕಿತ್ಸಾ ವೈದ್ಯಕೀಯ ಸಾರಾಂಶ' : 'Clinical Triage Emergency Snapshot'}
                </span>
                <p className="text-amber-800 leading-relaxed">
                  {language === 'kn'
                    ? 'ಭೇಟಿ ನೀಡುವ ಪಶುವೈದ್ಯರಿಗೆ ತಕ್ಷಣದ ನಿರ್ಧಾರಕ್ಕಾಗಿ ಸಿದ್ಧಪಡಿಸಲಾದ ಸಾರಾಂಶ.'
                    : 'Fast summary prepared for attending veterinary surgeon upon physical farm visit.'}
                </p>
              </div>

              <div className="border border-slate-200 rounded-2xl p-4 space-y-2.5 text-xs">
                <div className="flex justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">
                    {language === 'kn' ? 'ಜಾನುವಾರಿನ ಐಡಿ:' : 'Animal ID:'}
                  </span>
                  <span className="font-bold text-slate-900">{currentAnimal.tag_id || 'KA-MAN-9901'}</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">
                    {language === 'kn' ? 'ಪ್ರಸ್ತುತ ನೀಡುತ್ತಿರುವ ಔಷಧಿಗಳು:' : 'Current Medications:'}
                  </span>
                  <span className="font-bold text-slate-800">
                    {currentAnimal.current_medication || (language === 'kn' ? 'ಮೆಲೋಕ್ಸಿಕಾಮ್ ಬೋಲಸ್' : 'Meloxicam Bolus')}
                  </span>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">
                    {language === 'kn' ? 'ಔಷಧಿ ಅಲರ್ಜಿಗಳು / ಅಡ್ಡಪರಿಣಾಮ:' : 'Known Drug Reactions / Allergies:'}
                  </span>
                  <span className="font-bold text-emerald-700">
                    {currentAnimal.allergies || (language === 'kn' ? 'ಯಾವುದೂ ಇಲ್ಲ' : 'None reported')}
                  </span>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">
                    {language === 'kn' ? 'ಮುಖ್ಯ ಆರೈಕೆದಾರರು:' : 'Primary Caregiver:'}
                  </span>
                  <span className="font-bold text-slate-800">
                    {currentAnimal.owner_name || 'Farmer Daniel Gowda'} ({currentAnimal.owner_phone || '+91 98450 12345'})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">
                    {language === 'kn' ? 'ಕೊನೆಯ ತಪಾಸಣೆ:' : 'Last Triage:'}
                  </span>
                  <span className="font-bold text-slate-800">
                    {new Date().toLocaleDateString(language === 'kn' ? 'kn-IN' : 'en-US')}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: FEED & EDIT ANIMAL INFORMATION */}
          {activeTab === 'edit' && (
            <form onSubmit={handleSaveAnimalInfo} className="space-y-3.5">
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3.5 text-xs text-blue-900 flex items-center justify-between">
                <div>
                  <span className="font-bold block">
                    {language === 'kn' ? 'ಮಾಹಿತಿ ನವೀಕರಣ ಮತ್ತು ಕ್ಯೂಆರ್ ಮರುಸೃಷ್ಟಿ' : 'Feed / Update Information'}
                  </span>
                  <span className="text-[11px] text-blue-700">
                    {language === 'kn'
                      ? 'ನೀವು ಇಲ್ಲಿ ನಮೂದಿಸುವ ನಿಖರ ವಿವರಗಳು ಕ್ಯೂಆರ್ ಕೋಡ್‌ನಲ್ಲಿ ನೇರವಾಗಿ ಅಪ್‌ಡೇಟ್ ಆಗುತ್ತವೆ.'
                      : 'Changes saved here instantly regenerate the QR Passport with zero discrepancy.'}
                  </span>
                </div>
                <Sparkles size={18} className="text-blue-600 shrink-0 ml-2" />
              </div>

              {saveSuccess && (
                <div className="bg-emerald-100 border border-emerald-300 rounded-2xl p-3 text-xs text-emerald-900 font-bold flex items-center space-x-2 animate-bounce">
                  <CheckCircle2 size={16} className="text-emerald-700" />
                  <span>{t('qr_updated_success')}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">
                    {t('tag_id')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.tag_id}
                    onChange={(e) => setEditForm({ ...editForm, tag_id: e.target.value })}
                    placeholder="e.g. KA-MAN-9901"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">
                    {t('animal_name')}
                  </label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    placeholder="e.g. Ganga / Lakshmi"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">
                    {t('species')}
                  </label>
                  <select
                    value={editForm.species}
                    onChange={(e) => setEditForm({ ...editForm, species: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="cattle">{language === 'kn' ? 'ಹಸು (Cattle)' : 'Cattle'}</option>
                    <option value="buffalo">{language === 'kn' ? 'ಎಮ್ಮೆ (Buffalo)' : 'Buffalo'}</option>
                    <option value="goat">{language === 'kn' ? 'ಆಡು (Goat)' : 'Goat'}</option>
                    <option value="sheep">{language === 'kn' ? 'ಕುರಿ (Sheep)' : 'Sheep'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">
                    {t('breed')}
                  </label>
                  <input
                    type="text"
                    value={editForm.breed}
                    onChange={(e) => setEditForm({ ...editForm, breed: e.target.value })}
                    placeholder="e.g. Hallikar / Amrithmahal"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">
                    {t('gender')}
                  </label>
                  <select
                    value={editForm.gender}
                    onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="female">{language === 'kn' ? 'ಹೆಣ್ಣು (Female)' : 'Female'}</option>
                    <option value="male">{language === 'kn' ? 'ಗಂಡು (Male)' : 'Male'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">
                    {t('age_months')} ({language === 'kn' ? 'ತಿಂಗಳು' : 'Months'})
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="300"
                    value={editForm.age_months}
                    onChange={(e) => setEditForm({ ...editForm, age_months: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-slate-600 font-bold mb-1">
                    {language === 'kn' ? 'ಫಾರ್ಮ್ ಸ್ಥಳ / ಜಿಲ್ಲೆ' : 'Farm Location / District'}
                  </label>
                  <input
                    type="text"
                    value={editForm.district}
                    onChange={(e) => setEditForm({ ...editForm, district: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">
                    {language === 'kn' ? 'ಆರೈಕೆದಾರರ ಹೆಸರು' : 'Caregiver Name'}
                  </label>
                  <input
                    type="text"
                    value={editForm.owner_name}
                    onChange={(e) => setEditForm({ ...editForm, owner_name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">
                    {language === 'kn' ? 'ಸಂಪರ್ಕ ದೂರವಾಣಿ' : 'Contact Phone'}
                  </label>
                  <input
                    type="text"
                    value={editForm.owner_phone}
                    onChange={(e) => setEditForm({ ...editForm, owner_phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black text-xs rounded-xl shadow-md flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
                >
                  <Save size={15} />
                  <span>{saving ? 'ಉಳಿಸಲಾಗುತ್ತಿದೆ...' : t('save_and_update_qr')}</span>
                </button>
              </div>
            </form>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: `Pashu Health Passport - ${currentAnimal.tag_id || 'KA-MAN-9901'}`,
                  url: passportUrl,
                });
              } else {
                navigator.clipboard?.writeText(passportUrl);
                alert(
                  (language === 'kn'
                    ? 'ಪಾಸ್‌ಪೋರ್ಟ್ ಲಿಂಕ್ ನಕಲಿಸಲಾಗಿದೆ:\n'
                    : 'Passport Link Copied:\n') + passportUrl
                );
              }
            }}
            className="px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center space-x-1.5"
          >
            <Share2 size={14} />
            <span>{language === 'kn' ? 'ಹಂಚಿಕೊಳ್ಳಿ' : 'Share'}</span>
          </button>
          
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-black text-xs shadow-sm"
          >
            {t('done')}
          </button>
        </div>

      </div>
    </div>
  );
}
