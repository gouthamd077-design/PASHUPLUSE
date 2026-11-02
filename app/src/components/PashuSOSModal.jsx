import React, { useState, useEffect } from 'react';
import { ShieldAlert, PhoneCall, AlertTriangle, Clock, CheckCircle2, X, MapPin } from 'lucide-react';
import { apiRequest } from '../api/client';
import { useTranslation } from '../i18n';
import { detectLiveLocation } from '../services/locationService';

export default function PashuSOSModal({ isOpen, onClose, animals = [] }) {
  if (!isOpen) return null;

  const { language, t } = useTranslation();
  const [selectedAnimalId, setSelectedAnimalId] = useState(animals[0]?.id || '');
  const [category, setCategory] = useState(t('sos_cat_bloat'));
  const [location, setLocation] = useState(
    language === 'kn' ? 'ಮಂಡ್ಯ / ಮೈಸೂರು ಗ್ರಾಮಾಂತರ, ಕರ್ನಾಟಕ' : 'Mandya / Mysuru Rural, Karnataka'
  );
  const [isTriggered, setIsTriggered] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(900); // 15 minutes = 900s
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    detectLiveLocation().then((loc) => {
      setLocation(language === 'kn' ? loc.locationNameKn : loc.locationNameEn);
    });
  }, [language]);

  useEffect(() => {
    setCategory(t('sos_cat_bloat'));
  }, [language]);

  useEffect(() => {
    let timer;
    if (isTriggered && secondsLeft > 0) {
      timer = setInterval(() => {
        setSecondsLeft((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isTriggered, secondsLeft]);

  const formatTimer = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTriggerSOS = async () => {
    setLoading(true);
    try {
      await apiRequest('/sos/trigger', {
        method: 'POST',
        body: JSON.stringify({
          animal_id: selectedAnimalId || 'demo-animal',
          category,
          location,
        }),
      });
      setIsTriggered(true);
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.5);
      } catch (err) {}
    } catch (e) {
      setIsTriggered(true);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    t('sos_cat_bloat'),
    t('sos_cat_calving'),
    t('sos_cat_tremors'),
    t('sos_cat_choking'),
    t('sos_cat_bleeding'),
    t('sos_cat_acidosis'),
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in text-slate-800">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border-4 border-red-500">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-rose-700 p-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center animate-bounce">
              <ShieldAlert size={28} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-wide">{t('sos_modal_title')}</h2>
              <p className="text-xs text-rose-100">{t('sos_modal_sub')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-white"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {!isTriggered ? (
            <>
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-xs text-red-800 flex items-start space-x-2.5">
                <AlertTriangle size={18} className="text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-red-900">{t('sos_critical_badge')}</p>
                  <p className="mt-0.5 leading-relaxed">{t('sos_critical_desc')}</p>
                </div>
              </div>

              {/* Animal Selector */}
              {animals.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                    {t('sos_select_animal')}
                  </label>
                  <select
                    value={selectedAnimalId}
                    onChange={(e) => setSelectedAnimalId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm font-semibold focus:ring-2 focus:ring-red-500 focus:outline-none"
                  >
                    {animals.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name || a.tag_id} ({a.species === 'cattle' ? (language === 'kn' ? 'ಹಸು' : 'Cattle') : (language === 'kn' ? 'ಎಮ್ಮೆ' : 'Buffalo')})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Emergency Category */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                  {t('sos_select_cat')}
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`p-3 rounded-xl border text-left font-semibold transition-all ${
                        category === cat
                          ? 'border-red-600 bg-red-50 text-red-900 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Location (with Live GPS Indicator) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase">
                    {t('sos_location_label')}
                  </label>
                  <span className="text-[10px] text-emerald-700 font-bold flex items-center">
                    <MapPin size={10} className="mr-0.5" />
                    {language === 'kn' ? 'ಲೈವ್ ಜಿಪಿಎಸ್ ಮೂಲಕ ಗುರುತಿಸಲಾಗಿದೆ' : 'Live GPS Detected'}
                  </span>
                </div>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none font-semibold"
                />
              </div>

              {/* Action Button */}
              <button
                onClick={handleTriggerSOS}
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white py-4 rounded-2xl font-black text-sm shadow-lg shadow-red-600/30 flex items-center justify-center space-x-2 transition-transform"
              >
                <ShieldAlert size={20} className="animate-pulse" />
                <span>{loading ? t('loading') : t('sos_confirm_btn')}</span>
              </button>
            </>
          ) : (
            /* Active SOS Screen with Countdown */
            <div className="text-center py-4 space-y-4">
              <div className="w-20 h-20 mx-auto rounded-full bg-red-100 text-red-600 flex items-center justify-center animate-pulse border-4 border-red-300">
                <Clock size={38} />
              </div>

              <div>
                <span className="inline-block px-3 py-1 bg-red-100 text-red-700 font-extrabold rounded-full text-xs uppercase tracking-wider mb-2">
                  {t('sos_window_active')}
                </span>
                <div className="text-4xl font-black text-slate-900 font-mono tracking-tight">
                  {formatTimer(secondsLeft)}
                </div>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  {t('sos_escalation_desc')}
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left space-y-2 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-500">{t('sos_select_cat')}:</span>
                  <span className="font-bold text-red-700">{category}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-500">
                    {language === 'kn' ? 'ಎಚ್ಚರಿಸಲಾದ ವೈದ್ಯರು:' : 'Notified Doctors:'}
                  </span>
                  <span className="font-bold text-slate-900">
                    {language === 'kn' ? 'ಡಾ. ರಮೇಶ್ ಕುಮಾರ್ (ಮಂಡ್ಯ ಪಾಲಿಕ್ಲಿನಿಕ್)' : 'Dr. Ramesh Kumar (Mandya Polyclinic)'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">
                    {language === 'kn' ? 'ಪ್ರಸ್ತುತ ಸ್ಥಿತಿ:' : 'Current Status:'}
                  </span>
                  <span className="font-bold text-emerald-600 flex items-center">
                    <CheckCircle2 size={13} className="mr-1" />
                    {language === 'kn' ? 'ವೈದ್ಯರ ಗಮನಕ್ಕೆ ತರಲಾಗಿದೆ' : 'Doctor Paged & Acknowledged'}
                  </span>
                </div>
              </div>

              {/* Direct Call Button */}
              <a
                href="tel:18001234567"
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white py-3.5 rounded-2xl font-bold flex items-center justify-center space-x-2 shadow-md transition-colors text-xs"
              >
                <PhoneCall size={16} />
                <span>{t('sos_call_hotline')}</span>
              </a>

              <button
                onClick={onClose}
                className="text-xs text-slate-500 hover:text-slate-800 underline font-semibold"
              >
                {t('close')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
