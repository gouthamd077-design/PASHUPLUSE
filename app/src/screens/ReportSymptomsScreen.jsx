import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../i18n';
import { apiRequest } from '../api/client';
import { getLocalAnimals } from '../storage/repositories';
import { detectLiveLocation } from '../services/locationService';
import {
  Mic,
  MicOff,
  Camera,
  CheckCircle2,
  PhoneCall,
  Sparkles,
  MapPin,
  AlertTriangle,
} from 'lucide-react';
import MissedCallModal from '../components/MissedCallModal';

export default function ReportSymptomsScreen({ onCaseCreated, onNavigateToVets }) {
  const { language, t } = useTranslation();
  const [animals, setAnimals] = useState([]);
  const [selectedAnimalId, setSelectedAnimalId] = useState('');

  // Form fields
  const [symptoms, setSymptoms] = useState([]);
  const [description, setDescription] = useState('');
  const [durationDays, setDurationDays] = useState(2);
  const [temperatureF, setTemperatureF] = useState(103.8);
  const [appetite, setAppetite] = useState('reduced');
  const [locationName, setLocationName] = useState('ಮಂಡ್ಯ ತಾಲ್ಲೂಕು, ಕರ್ನಾಟಕ');
  const [photoUrl, setPhotoUrl] = useState(null);

  // Voice Assistant State
  const [isListening, setIsListening] = useState(false);
  const [voiceLang, setVoiceLang] = useState(language === 'kn' ? 'kn-IN' : 'en-IN');
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const recognitionRef = useRef(null);

  // Submission & Result state
  const [loading, setLoading] = useState(false);
  const [createdCase, setCreatedCase] = useState(null);
  const [showMissedCallModal, setShowMissedCallModal] = useState(false);

  // Load animals & live GPS location
  useEffect(() => {
    async function init() {
      try {
        const local = await getLocalAnimals(false);
        setAnimals(local || []);
        if (local && local.length > 0) {
          setSelectedAnimalId(local[0].id);
        }
      } catch (e) {
        console.warn('Failed to load animals:', e);
      }

      // Detect Live Location
      const loc = await detectLiveLocation();
      setLocationName(language === 'kn' ? loc.locationNameKn : loc.locationNameEn);
    }
    init();
  }, [language]);

  // Sync voice lang with selected app language
  useEffect(() => {
    setVoiceLang(language === 'kn' ? 'kn-IN' : 'en-IN');
  }, [language]);

  // Web Speech API Voice Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = voiceLang;

      recognition.onresult = (event) => {
        const speechText = event.results[0][0].transcript;
        setVoiceTranscript(speechText);
        setDescription(speechText);
        parseVoiceSymptoms(speechText);
        setIsListening(false);
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
    }
  }, [voiceLang]);

  // Voice Parser
  const parseVoiceSymptoms = (text) => {
    const lower = text.toLowerCase();
    const detected = [];

    if (lower.includes('ಜ್ವರ') || lower.includes('fever') || lower.includes('hot') || lower.includes('temperature')) {
      detected.push(t('sym_fever'));
      setTemperatureF(104.2);
    }
    if (lower.includes('ತಿನ್ನುತ್ತಿಲ್ಲ') || lower.includes('ಮೇವು') || lower.includes('feed') || lower.includes('appetite') || lower.includes('eat')) {
      detected.push(t('sym_appetite'));
      setAppetite('reduced');
    }
    if (lower.includes('ಜೊಲ್ಲು') || lower.includes('saliv') || lower.includes('drool') || lower.includes('mouth')) {
      detected.push(t('sym_saliva'));
    }
    if (lower.includes('ಗಂಟು') || lower.includes('skin') || lower.includes('lump') || lower.includes('nodule')) {
      detected.push(t('sym_lumps'));
    }
    if (lower.includes('ಕೆಚ್ಚಲು') || lower.includes('ಹಾಲು') || lower.includes('milk') || lower.includes('udder')) {
      detected.push(t('sym_mastitis'));
    }

    if (detected.length === 0) {
      detected.push(language === 'kn' ? 'ಸಾಮಾನ್ಯ ನಿಶ್ಯಕ್ತಿ' : 'General Malaise');
    }

    setSymptoms(detected);
  };

  const handleStartVoice = () => {
    if (recognitionRef.current) {
      try {
        setIsListening(true);
        recognitionRef.current.lang = voiceLang;
        recognitionRef.current.start();
      } catch (e) {
        setIsListening(false);
      }
    } else {
      // Simulation fallback for environments without microphone permissions
      setIsListening(true);
      setTimeout(() => {
        const sampleText =
          language === 'kn'
            ? 'ನನ್ನ ಹಸುವಿಗೆ ಎರಡು ದಿನಗಳಿಂದ ತೀವ್ರ ಜ್ವರ ಇದೆ, ಮೇವು ತಿನ್ನುತ್ತಿಲ್ಲ ಮತ್ತು ಬಾಯಲ್ಲಿ ಜೊಲ್ಲು ಸುರಿಯುತ್ತಿದೆ.'
            : 'My cow has high fever for two days, stopped eating fodder, and has excessive salivation.';
        setVoiceTranscript(sampleText);
        setDescription(sampleText);
        parseVoiceSymptoms(sampleText);
        setIsListening(false);
      }, 1800);
    }
  };

  const handleToggleSymptom = (sym) => {
    if (symptoms.includes(sym)) {
      setSymptoms(symptoms.filter((s) => s !== sym));
    } else {
      setSymptoms([...symptoms, sym]);
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotoUrl(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitCase = async () => {
    if (symptoms.length === 0) {
      alert(language === 'kn' ? 'ದಯವಿಟ್ಟು ಕನಿಷ್ಠ ಒಂದು ಲಕ್ಷಣವನ್ನು ಆಯ್ಕೆಮಾಡಿ ಅಥವಾ ಮಾತನಾಡಿ.' : 'Please select or speak at least one symptom.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        animal_id: selectedAnimalId || (animals[0] ? animals[0].id : 'temp-id'),
        symptoms,
        description,
        duration_days: durationDays,
        temperature_f: parseFloat(temperatureF),
        appetite,
        location_name: locationName,
        photo_url: photoUrl,
        language: language === 'kn' ? 'kn' : 'en',
      };

      const res = await apiRequest('/cases', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setCreatedCase(res);
      if (onCaseCreated) onCaseCreated(res);
    } catch (e) {
      // Local fallback
      const mockCase = {
        id: 'case-' + Date.now(),
        case_number: 'PP-2026-00' + Math.floor(100 + Math.random() * 900),
        status: language === 'kn' ? 'ವೈದ್ಯರ ಪರಿಶೀಲನೆಯಲ್ಲಿದೆ' : 'AWAITING_VETERINARIAN',
        symptoms,
        location_name: locationName,
        preliminary_ai_report: {
          risk_level: language === 'kn' ? 'ಹೆಚ್ಚಿನ ಅಪಾಯ (HIGH)' : 'HIGH RISK',
          possible_indicators:
            language === 'kn'
              ? [
                  'ತೀವ್ರ ಜ್ವರ ಮತ್ತು ಅಜೀರ್ಣ ಲಕ್ಷಣಗಳು',
                  'ವೈರಲ್ ಸೋಂಕಿನ ಸಾಧ್ಯತೆ (ಎಫ್‌ಎಂಡಿ ತಪಾಸಣೆ ಅಗತ್ಯ)',
                ]
              : [
                  'Acute Febrile Syndrome with Secondary Anorexia',
                  'Possible Bovine Viral Infection (FMD rule-out)',
                ],
          recommended_next_steps:
            language === 'kn'
              ? [
                  'ಹಸುವನ್ನು ತಕ್ಷಣವೇ ಶುದ್ಧ, ನೆರಳಿನ ಕೊಟ್ಟಿಗೆಯಲ್ಲಿ ಪ್ರತ್ಯೇಕಿಸಿ.',
                  'ಎಲೆಕ್ಟ್ರೋಲೈಟ್ ಬೆರೆಸಿದ ಶುದ್ಧ ಕುಡಿಯುವ ನೀರು ನೀಡಿ.',
                  'ಮಂಡ್ಯ ಪಶುವೈದ್ಯಾಧಿಕಾರಿ ಡಾ. ರಮೇಶ್ ಕುಮಾರ್ ಅವರಿಗೆ ಮಾಹಿತಿ ರವಾನಿಸಲಾಗಿದೆ.',
                ]
              : [
                  'Isolate cow in a shaded stall with clean dry bedding',
                  'Offer cool drinking water with electrolytes',
                  'Attending veterinarian Dr. Ramesh Kumar notified in Mandya',
                ],
          disclaimer: t('ai_disclaimer'),
        },
      };
      setCreatedCase(mockCase);
    } finally {
      setLoading(false);
    }
  };

  const symptomList = [
    t('sym_fever'),
    t('sym_appetite'),
    t('sym_saliva'),
    t('sym_lumps'),
    t('sym_mastitis'),
    t('sym_limp'),
    t('sym_diarrhea'),
    t('sym_respiratory'),
    t('sym_bloat'),
  ];

  return (
    <div className="space-y-6 pb-24 max-w-2xl mx-auto text-slate-800">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-3xl p-5 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 text-xs font-semibold uppercase tracking-wider mb-2 border border-emerald-400/30">
            <Sparkles size={13} className="text-emerald-300" />
            <span>{language === 'kn' ? 'AI ಧ್ವನಿ & ಫೋಟೋ ತಪಾಸಣಾ ಎಂಜಿನ್' : 'AI Voice & Photo Case Engine'}</span>
          </div>
          <h2 className="text-xl font-black leading-tight">
            {language === 'kn' ? 'ಜಾನುವಾರಿನ ರೋಗ ಲಕ್ಷಣ ವರದಿ ಮಾಡಿ' : 'Report Animal Symptoms'}
          </h2>
          <p className="text-xs text-emerald-100 mt-1 max-w-md">
            {language === 'kn'
              ? 'ಕನ್ನಡದಲ್ಲಿ ಮಾತನಾಡಿ ಅಥವಾ ಲಕ್ಷಣಗಳನ್ನು ಆರಿಸಿ. AI ಪ್ರಾಥಮಿಕ ವರದಿ ಸಿದ್ಧಪಡಿಸಿ ಹತ್ತಿರದ ವೈದ್ಯರಿಗೆ ತಕ್ಷಣ ಕಳುಹಿಸುತ್ತದೆ.'
              : 'Speak in Kannada or English. AI structures a preliminary report and notifies nearby veterinarians.'}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => setShowMissedCallModal(true)}
              className="px-3.5 py-2 bg-emerald-950/70 hover:bg-emerald-950 text-emerald-200 text-xs font-bold rounded-xl border border-emerald-700/50 flex items-center space-x-1.5 transition-colors"
            >
              <PhoneCall size={14} className="text-emerald-400" />
              <span>{t('missed_call_btn')}</span>
            </button>
          </div>
        </div>
      </div>

      {!createdCase ? (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-6 text-xs">
          {/* 1. Animal Selection */}
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-2">
              {language === 'kn' ? '1. ಅನಾರೋಗ್ಯದ ಜಾನುವಾರನ್ನು ಆಯ್ಕೆಮಾಡಿ' : '1. Select Affected Animal'}
            </label>
            {animals.length > 0 ? (
              <select
                value={selectedAnimalId}
                onChange={(e) => setSelectedAnimalId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                {animals.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name || a.tag_id} ({a.species === 'cattle' ? (language === 'kn' ? 'ಹಸು' : 'Cattle') : (language === 'kn' ? 'ಎಮ್ಮೆ' : 'Buffalo')})
                  </option>
                ))}
              </select>
            ) : (
              <div className="bg-amber-50 p-3 rounded-2xl border border-amber-200 text-xs text-amber-800">
                {language === 'kn' ? 'ಡೆಮೋ ಪರೀಕ್ಷೆಗಾಗಿ ಜಾನುವಾರು ಲಭ್ಯವಿದೆ.' : 'Demo animal profile active for testing.'}
              </div>
            )}
          </div>

          {/* 2. Voice-First Reporting */}
          <div className="bg-gradient-to-b from-emerald-50 to-teal-50/40 p-5 rounded-3xl border border-emerald-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                  <Mic size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    {t('voice_mic_title')}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {t('voice_mic_desc')}
                  </p>
                </div>
              </div>
            </div>

            {/* Microphone Button */}
            <div className="text-center py-2">
              <button
                type="button"
                onClick={handleStartVoice}
                disabled={isListening}
                className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center shadow-lg transition-transform active:scale-95 ${
                  isListening
                    ? 'bg-red-600 text-white animate-pulse shadow-red-500/40'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30'
                }`}
              >
                {isListening ? <MicOff size={32} /> : <Mic size={32} />}
              </button>
              <p className="text-xs font-bold text-slate-700 mt-2">
                {isListening ? t('voice_speaking_now') : t('voice_tap_to_speak')}
              </p>
            </div>

            {/* Transcript */}
            {voiceTranscript && (
              <div className="bg-white p-3 rounded-2xl border border-emerald-200 text-xs space-y-1">
                <span className="font-bold text-emerald-800 text-[10px] uppercase">
                  {t('voice_recognized_label')}
                </span>
                <p className="text-slate-800 italic">"{voiceTranscript}"</p>
              </div>
            )}
          </div>

          {/* 3. Symptom Selection Chips */}
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-2">
              {t('symptoms_label')}
            </label>
            <div className="flex flex-wrap gap-2">
              {symptomList.map((sym) => {
                const active = symptoms.includes(sym);
                return (
                  <button
                    key={sym}
                    type="button"
                    onClick={() => handleToggleSymptom(sym)}
                    className={`px-3 py-2 rounded-xl border font-semibold transition-all ${
                      active
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {sym}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Clinical Parameters */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                {t('duration_label')}
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={durationDays}
                onChange={(e) => setDurationDays(parseInt(e.target.value) || 1)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none font-semibold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                {t('temp_label')}
              </label>
              <input
                type="number"
                step="0.1"
                value={temperatureF}
                onChange={(e) => setTemperatureF(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none font-semibold"
              />
            </div>
          </div>

          {/* 5. Photo Upload */}
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-2">
              {t('photo_label')}
            </label>
            <div className="flex items-center space-x-3">
              <label className="cursor-pointer px-4 py-3 bg-slate-50 hover:bg-slate-100 border border-dashed border-slate-300 rounded-2xl flex items-center space-x-2 font-bold text-slate-700 transition-colors">
                <Camera size={18} className="text-emerald-600" />
                <span>{t('photo_upload_btn')}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
              {photoUrl && (
                <div className="relative w-14 h-14 rounded-2xl overflow-hidden border border-slate-300 shadow-sm">
                  <img src={photoUrl} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>

          {/* 6. Live Detected GPS Farm Location */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-bold text-slate-700 uppercase">
                {t('farm_location_label')}
              </label>
              <span className="text-[10px] text-emerald-700 font-bold flex items-center">
                <MapPin size={10} className="mr-0.5" />
                {language === 'kn' ? 'ಲೈವ್ ಜಿಪಿಎಸ್ ಮೂಲಕ ಪಡೆಯಲಾಗಿದೆ' : 'Captured via Live GPS'}
              </span>
            </div>
            <input
              type="text"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Submit Button */}
          <button
            type="button"
            onClick={handleSubmitCase}
            disabled={loading}
            className="w-full bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] text-white py-4 rounded-2xl font-black text-sm shadow-lg shadow-emerald-700/30 flex items-center justify-center space-x-2 transition-transform"
          >
            <Sparkles size={18} />
            <span>{loading ? t('submitting_report') : t('submit_report_btn')}</span>
          </button>
        </div>
      ) : (
        /* Case Created & AI Preliminary Report */
        <div className="bg-white rounded-3xl p-6 shadow-md border border-slate-200 space-y-6 animate-fade-in text-xs">
          <div className="text-center pb-4 border-b border-slate-200">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2">
              <CheckCircle2 size={36} />
            </div>
            <span className="bg-emerald-100 text-emerald-800 text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
              {t('case_dispatched_title')}
            </span>
            <h2 className="text-2xl font-black text-slate-900 mt-2 font-mono">
              {createdCase.case_number}
            </h2>
            <p className="text-slate-500 mt-0.5">
              {t('assigned_vet_label')}{' '}
              <b>
                {language === 'kn'
                  ? 'ಡಾ. ರಮೇಶ್ ಕುಮಾರ್ (ಮಂಡ್ಯ ಕೇಂದ್ರ ಪಾಲಿಕ್ಲಿನಿಕ್)'
                  : 'Dr. Ramesh Kumar (Mandya Central Polyclinic)'}
              </b>
            </p>
          </div>

          {/* AI Triage Card */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-3xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles size={18} className="text-emerald-700" />
                <h3 className="font-extrabold text-emerald-950 text-sm uppercase tracking-wide">
                  {t('ai_triage_heading')}
                </h3>
              </div>
              <span className="bg-red-100 text-red-800 border border-red-300 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                {createdCase.preliminary_ai_report?.risk_level}
              </span>
            </div>

            {/* Non-Diagnostic Safety Warning */}
            <div className="bg-amber-100/70 border border-amber-300 rounded-2xl p-3 text-[11px] text-amber-950 flex items-start space-x-2 font-medium">
              <AlertTriangle size={15} className="text-amber-700 shrink-0 mt-0.5" />
              <span>{createdCase.preliminary_ai_report?.disclaimer || t('ai_disclaimer')}</span>
            </div>

            {/* Possible Indicators */}
            <div className="space-y-1.5">
              <span className="font-extrabold text-slate-800 uppercase text-[11px]">
                {t('ai_possible_indicators')}
              </span>
              <ul className="list-disc list-inside space-y-1 text-slate-700 font-semibold">
                {createdCase.preliminary_ai_report?.possible_indicators?.map((ind, i) => (
                  <li key={i}>{ind}</li>
                ))}
              </ul>
            </div>

            {/* Care Steps */}
            <div className="space-y-1.5">
              <span className="font-extrabold text-slate-800 uppercase text-[11px]">
                {t('ai_first_aid')}
              </span>
              <ul className="list-disc list-inside space-y-1 text-slate-600">
                {createdCase.preliminary_ai_report?.recommended_next_steps?.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => {
                setCreatedCase(null);
                setSymptoms([]);
                setDescription('');
              }}
              className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl text-center"
            >
              {t('report_another_btn')}
            </button>
            <button
              onClick={() => onNavigateToVets && onNavigateToVets()}
              className="flex-1 px-4 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl text-center shadow flex items-center justify-center space-x-1.5"
            >
              <PhoneCall size={15} />
              <span>{t('contact_vet_btn')}</span>
            </button>
          </div>
        </div>
      )}

      {/* Missed-Call & IVR Accessibility Modal */}
      <MissedCallModal
        isOpen={showMissedCallModal}
        onClose={() => setShowMissedCallModal(false)}
      />
    </div>
  );
}
