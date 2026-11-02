import React, { useState, useEffect } from 'react';
import { useTranslation } from '../i18n';
import { getLocalAnimals } from '../storage/repositories';
import { apiRequest } from '../api/client';
import {
  Activity,
  FolderHeart,
  Bell,
  PhoneCall,
  ChevronRight,
  ShieldAlert,
  Mic,
  QrCode,
  Radio,
  Pill,
  Users,
  BookOpen,
  Sparkles,
  MapPin,
} from 'lucide-react';
import PashuSOSModal from '../components/PashuSOSModal';
import HealthPassportModal from '../components/HealthPassportModal';
import PashuFamilyModal from '../components/PashuFamilyModal';
import { detectLiveLocation } from '../services/locationService';

export default function HomeScreen({ onNavigate }) {
  const { t, language } = useTranslation();
  const [animals, setAnimals] = useState([]);
  const [activeCases, setActiveCases] = useState([]);
  const [isSosOpen, setIsSosOpen] = useState(false);
  const [isPassportOpen, setIsPassportOpen] = useState(false);
  const [isFamilyOpen, setIsFamilyOpen] = useState(false);
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [liveLocation, setLiveLocation] = useState({
    en: 'Mandya Taluk, Karnataka',
    kn: 'ಮಂಡ್ಯ ತಾಲ್ಲೂಕು, ಕರ್ನಾಟಕ',
  });

  const loadData = async () => {
    try {
      const localAnimals = await getLocalAnimals(false);
      setAnimals(localAnimals || []);
      if (localAnimals && localAnimals.length > 0) {
        setSelectedAnimal(localAnimals[0]);
      }

      // Fetch active cases from server if online
      if (navigator.onLine) {
        try {
          const casesData = await apiRequest('/cases');
          setActiveCases(casesData || []);
        } catch (err) {
          setActiveCases([
            {
              id: 'c1',
              case_number: 'PP-2026-00124',
              status: language === 'kn' ? 'ಚಿಕಿತ್ಸೆಯಲ್ಲಿದೆ' : 'TREATMENT_PRESCRIBED',
              urgency: language === 'kn' ? 'ತುರ್ತು' : 'URGENT',
              location_name: language === 'kn' ? 'ಪಾಂಡವಪುರ, ಮಂಡ್ಯ' : 'Pandavapura, Mandya',
              vet_assessment: {
                diagnosis:
                  language === 'kn'
                    ? 'ತೀವ್ರ ಅಲ್ಪಕಾಲಿಕ ಬೋವೈನ್ ಜ್ವರ (ಡಾ. ರಮೇಶ್ ಕುಮಾರ್ ಅವರ ಚಿಕಿತ್ಸೆಯಲ್ಲಿ)'
                    : 'Acute Bovine Ephemeral Fever (Treated by Dr. Ramesh Kumar)',
              },
              created_at: new Date().toISOString(),
            },
          ]);
        }
      }
    } catch (e) {
      console.error('Failed to load home data:', e);
    }
  };

  useEffect(() => {
    loadData();
    detectLiveLocation().then((loc) => {
      setLiveLocation({
        en: loc.locationNameEn,
        kn: loc.locationNameKn,
      });
    });

    const handleDataSynced = () => loadData();
    window.addEventListener('pashupulse:data-synced', handleDataSynced);
    return () => window.removeEventListener('pashupulse:data-synced', handleDataSynced);
  }, [language]);

  return (
    <div className="space-y-6 pb-24 max-w-2xl mx-auto animate-fade-in text-slate-800">
      {/* 1. Hero Action Banner: Symptom Reporting & SOS */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 rounded-3xl p-5 text-white shadow-xl relative overflow-hidden border border-emerald-800">
        <div className="relative z-10 space-y-3">
          <div className="flex items-center justify-between">
            {/* Live GPS Location Pill */}
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/30">
              <MapPin size={12} className="text-emerald-400 shrink-0" />
              <span>{language === 'kn' ? liveLocation.kn : liveLocation.en}</span>
            </div>

            {/* Quick SOS Trigger */}
            <button
              onClick={() => setIsSosOpen(true)}
              className="bg-red-600 hover:bg-red-700 active:scale-95 text-white text-xs font-black px-3.5 py-1.5 rounded-full shadow-md flex items-center space-x-1.5 transition-transform animate-pulse"
            >
              <ShieldAlert size={15} />
              <span>{t('sos_button')}</span>
            </button>
          </div>

          <div>
            <h2 className="text-2xl font-black leading-tight tracking-tight">
              {t('hero_title')}
            </h2>
            <p className="text-xs text-emerald-200 mt-1 max-w-md leading-relaxed">
              {t('hero_desc')}
            </p>
          </div>

          {/* Action CTAs */}
          <div className="pt-2 flex flex-wrap gap-2.5">
            <button
              onClick={() => onNavigate('report')}
              className="px-5 py-3 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-300 text-slate-950 font-black rounded-2xl shadow-lg flex items-center space-x-2 transition-transform active:scale-95 text-xs"
            >
              <Mic size={18} className="text-slate-950" />
              <span>{t('report_btn_voice')}</span>
              <ChevronRight size={16} />
            </button>

            <button
              onClick={() => setIsPassportOpen(true)}
              className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl border border-white/20 flex items-center space-x-1.5 text-xs transition-colors"
            >
              <QrCode size={16} className="text-emerald-300" />
              <span>{t('qr_passport_btn')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Live Early Warning Alert Card */}
      <div
        onClick={() => onNavigate('radar')}
        className="bg-amber-500/10 border-2 border-amber-500/40 rounded-3xl p-4 flex items-center justify-between cursor-pointer hover:bg-amber-500/15 transition-all shadow-sm"
      >
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-sm animate-pulse">
            <Radio size={22} />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                {t('radar_card_title')}
              </span>
              <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full">
                4 {t('radar_card_badge')}
              </span>
            </div>
            <p className="text-xs text-slate-700 mt-0.5 font-medium">
              {t('radar_card_desc')}
            </p>
          </div>
        </div>
        <ChevronRight size={20} className="text-amber-700" />
      </div>

      {/* 3. The Eight Signature Pillars - Quick Grid */}
      <div>
        <h3 className="font-extrabold text-slate-800 uppercase text-xs tracking-wider mb-3 px-1">
          {t('innovation_hub_title')}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {/* Pillar 1: QR Passport */}
          <div
            onClick={() => setIsPassportOpen(true)}
            className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm hover:border-emerald-500 cursor-pointer transition-all space-y-1.5"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <QrCode size={18} />
            </div>
            <span className="font-black text-slate-900 block text-xs">{t('feat_passport_title')}</span>
            <span className="text-[11px] text-slate-500 block leading-tight">{t('feat_passport_desc')}</span>
          </div>

          {/* Pillar 2: Medicine Adherence */}
          <div
            onClick={() => onNavigate('adherence')}
            className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm hover:border-emerald-500 cursor-pointer transition-all space-y-1.5"
          >
            <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center">
              <Pill size={18} />
            </div>
            <span className="font-black text-slate-900 block text-xs">{t('feat_adherence_title')}</span>
            <span className="text-[11px] text-slate-500 block leading-tight">{t('feat_adherence_desc')}</span>
          </div>

          {/* Pillar 3: Pashu Family */}
          <div
            onClick={() => setIsFamilyOpen(true)}
            className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm hover:border-emerald-500 cursor-pointer transition-all space-y-1.5"
          >
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center">
              <Users size={18} />
            </div>
            <span className="font-black text-slate-900 block text-xs">{t('feat_family_title')}</span>
            <span className="text-[11px] text-slate-500 block leading-tight">{t('feat_family_desc')}</span>
          </div>

          {/* Pillar 4: Pashu Learning */}
          <div
            onClick={() => onNavigate('learning')}
            className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm hover:border-emerald-500 cursor-pointer transition-all space-y-1.5"
          >
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <BookOpen size={18} />
            </div>
            <span className="font-black text-slate-900 block text-xs">{t('feat_learning_title')}</span>
            <span className="text-[11px] text-slate-500 block leading-tight">{t('feat_learning_desc')}</span>
          </div>
        </div>
      </div>

      {/* 4. Active Health Cases Tracking */}
      {activeCases.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-extrabold text-slate-800 uppercase text-xs tracking-wider">
              {t('active_cases_title')}
            </h3>
            <span className="text-[11px] text-emerald-700 font-bold">{t('case_in_treatment')}</span>
          </div>

          {activeCases.map((c) => (
            <div
              key={c.id}
              onClick={() => onNavigate('adherence')}
              className="bg-white rounded-3xl p-4 border border-slate-200 shadow-sm hover:border-emerald-500 cursor-pointer transition-all space-y-2 text-xs"
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-mono font-black text-slate-900 text-sm">{c.case_number}</span>
                  <p className="text-slate-600 font-medium">
                    {c.vet_assessment?.diagnosis || (language === 'kn' ? 'ಜ್ವರ ಮತ್ತು ಅಜೀರ್ಣ ಲಕ್ಷಣಗಳು' : 'Febrile Syndrome (Under Treatment)')}
                  </p>
                </div>
                <span className="bg-emerald-100 text-emerald-800 font-black px-2.5 py-0.5 rounded-full text-[10px] uppercase">
                  {c.status}
                </span>
              </div>

              {/* Progress Stepper */}
              <div className="pt-2 flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-100">
                <span className="text-emerald-700 font-bold">{t('step_reported')} ✓</span>
                <span className="text-emerald-700 font-bold">{t('step_ai_triage')} ✓</span>
                <span className="text-emerald-700 font-bold">{t('step_prescribed')} ✓</span>
                <span className="text-amber-700 font-bold animate-pulse">{t('step_recovery')}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 5. Registered Livestock Quick List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-extrabold text-slate-800 uppercase text-xs tracking-wider">
            {t('my_herd_title')} ({animals.length})
          </h3>
          <button
            onClick={() => onNavigate('animals')}
            className="text-emerald-700 font-bold text-xs flex items-center space-x-0.5"
          >
            <span>{t('view_all')}</span>
            <ChevronRight size={14} />
          </button>
        </div>

        {animals.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {animals.slice(0, 4).map((a) => (
              <div
                key={a.id}
                onClick={() => {
                  setSelectedAnimal(a);
                  setIsPassportOpen(true);
                }}
                className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm hover:border-emerald-500 cursor-pointer transition-all flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-slate-900 text-sm block">
                    {a.name || a.tag_id}
                  </span>
                  <span className="text-slate-500 capitalize">
                    {a.species === 'cattle' ? (language === 'kn' ? 'ಹಸು' : 'Cattle') : (language === 'kn' ? 'ಎಮ್ಮೆ' : 'Buffalo')} • {a.breed || (language === 'kn' ? 'ಹಳ್ಳಿಕಾರ್' : 'Hallikar Cow')}
                  </span>
                </div>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
                  <QrCode size={16} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-6 text-center border border-slate-200 space-y-2">
            <p className="text-xs text-slate-600">{t('no_animals')}</p>
            <button
              onClick={() => onNavigate('animals')}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs shadow"
            >
              {t('register_first_animal')}
            </button>
          </div>
        )}
      </div>

      {/* Floating Modals */}
      <PashuSOSModal
        isOpen={isSosOpen}
        onClose={() => setIsSosOpen(false)}
        animals={animals}
      />

      <HealthPassportModal
        isOpen={isPassportOpen}
        onClose={() => setIsPassportOpen(false)}
        animal={
          selectedAnimal ||
          animals[0] || {
            id: 'demo-1',
            tag_id: 'KA-MAN-9901',
            name: language === 'kn' ? 'ಗಂಗಾ (ಹಸು)' : 'Ganga (Cow)',
            species: 'cattle',
            breed: language === 'kn' ? 'ಹಳ್ಳಿಕಾರ್ ತಳಿ' : 'Hallikar Breed',
          }
        }
      />

      <PashuFamilyModal
        isOpen={isFamilyOpen}
        onClose={() => setIsFamilyOpen(false)}
        animal={selectedAnimal || animals[0] || { id: 'demo-1', tag_id: 'KA-MAN-9901' }}
      />
    </div>
  );
}
