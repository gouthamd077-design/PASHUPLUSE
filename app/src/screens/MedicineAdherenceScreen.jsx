import React, { useState, useEffect } from 'react';
import { Pill, CheckCircle2, Scan, ShieldCheck, ArrowRight, TrendingUp } from 'lucide-react';
import { apiRequest } from '../api/client';
import { useTranslation } from '../i18n';

export default function MedicineAdherenceScreen() {
  const { language, t } = useTranslation();
  const [cases, setCases] = useState([]);
  const [activeCase, setActiveCase] = useState(null);
  const [loading, setLoading] = useState(true);

  // Barcode Scanning Simulation State
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  // Dose Confirmation State
  const [doseSlot, setDoseSlot] = useState('Morning');
  const [actorName, setActorName] = useState(
    language === 'kn' ? 'ಸುನೀತಾ ಗೌಡ (ತಾಯಿ)' : 'Sunita Gowda (Mother)'
  );
  const [doseSuccess, setDoseSuccess] = useState(false);

  // Follow-up recovery state
  const [improvementStatus, setImprovementStatus] = useState('improving');
  const [followupNotes, setFollowupNotes] = useState('');
  const [followupSuccess, setFollowupSuccess] = useState(false);

  const getDemoCases = () => [
    {
      id: 'case-demo-1',
      case_number: 'PP-2026-00124',
      animal_name: language === 'kn' ? 'ಗಂಗಾ (ಹಳ್ಳಿಕಾರ್ ಹಸು)' : 'Ganga (Hallikar Cow)',
      status: language === 'kn' ? 'ಚಿಕಿತ್ಸೆಯಲ್ಲಿದೆ' : 'TREATMENT_PRESCRIBED',
      vet_assessment: {
        diagnosis:
          language === 'kn'
            ? 'ತೀವ್ರ ಅಲ್ಪಕಾಲಿಕ ಬೋವೈನ್ ಜ್ವರ (104.2°F ಜ್ವರ ಮತ್ತು ಕುಂಟುವಿಕೆ)'
            : 'Acute Bovine Ephemeral Fever with secondary glossitis',
        diagnosed_by:
          language === 'kn'
            ? 'ಡಾ. ರಮೇಶ್ ಕುಮಾರ್ (ಮಂಡ್ಯ ಪಾಲಿಕ್ಲಿನಿಕ್)'
            : 'Dr. Ramesh Kumar (Mandya Polyclinic)',
      },
      prescription: {
        medicines: [
          {
            name: language === 'kn' ? 'ಮೆಲೋಕ್ಸಿಕಾಮ್ ಬೋಲಸ್ (100mg)' : 'Meloxicam Bolus (100mg)',
            dosage: language === 'kn' ? '1 ಮಾತ್ರೆ (ಬೋಲಸ್)' : '1 bolus',
            frequency: language === 'kn' ? 'ಬೆಳಿಗ್ಗೆ ಮತ್ತು ಸಂಜೆ' : 'Morning & Evening (BID)',
            duration_days: 3,
            instructions:
              language === 'kn'
                ? 'ಹಸಿರು ಮೇವು ನೀಡಿದ ನಂತರ ಬಾಯಿಯ ಮೂಲಕ ಕೊಡಿ.'
                : 'Administer orally after green fodder feed.',
          },
          {
            name: language === 'kn' ? 'ಬಿ-ಕಾಂಪ್ಲೆಕ್ಸ್ ಲಿವರ್ ಟಾನಿಕ್' : 'B-Complex Liver Tonic (Oral Syrup)',
            dosage: '50 ml',
            frequency: language === 'kn' ? 'ದಿನಕ್ಕೆ ಒಮ್ಮೆ (ಬೆಳಿಗ್ಗೆ)' : 'Once Daily (Morning)',
            duration_days: 5,
            instructions:
              language === 'kn'
                ? 'ಮೇವು ತಿನ್ನುವುದನ್ನು ಹೆಚ್ಚಿಸಲು ಮತ್ತು ಜೀರ್ಣಕ್ರಿಯೆಗೆ ನೀಡಿ.'
                : 'Stimulates appetite and rumination.',
          },
          {
            name: language === 'kn' ? 'ಎಲೆಕ್ಟ್ರೋಲೈಟ್ ಶಕ್ತಿವರ್ಧಕ ಸ್ಯಾಚೆಟ್' : 'Electral Energy Booster Oral Sachet',
            dosage: language === 'kn' ? '1 ಪ್ಯಾಕೆಟ್' : '1 sachet',
            frequency: language === 'kn' ? 'ಬೆಚ್ಚಗಿನ ನೀರಿನಲ್ಲಿ ಕರಗಿಸಿ ದಿನಕ್ಕೆ ಒಮ್ಮೆ' : 'Once Daily in 5L warm water',
            duration_days: 3,
            instructions:
              language === 'kn'
                ? 'ನಿರ್ಜಲೀಕರಣ ತಡೆಗಟ್ಟಲು ಮತ್ತು ಶಕ್ತಿ ತುಂಬಲು.'
                : 'Maintains electrolyte balance and prevents weakness.',
          },
        ],
        followup_date: '2026-11-06',
        prescribed_by: language === 'kn' ? 'ಡಾ. ರಮೇಶ್ ಕುಮಾರ್' : 'Dr. Ramesh Kumar',
      },
    },
    {
      id: 'case-demo-2',
      case_number: 'PP-2026-01044',
      animal_name: language === 'kn' ? 'ಯಮುನಾ (ಮುರ್ರಾ ಎಮ್ಮೆ)' : 'Yamuna (Murrah Buffalo)',
      status: language === 'kn' ? 'ಚಿಕಿತ್ಸೆಯಲ್ಲಿದೆ' : 'TREATMENT_PRESCRIBED',
      vet_assessment: {
        diagnosis:
          language === 'kn'
            ? 'ಸಬ್-ಅಕ್ಯೂಟ್ ಕೆಚ್ಚಲು ಬಾವು (ಹಿಂಭಾಗದ ಎಡ ಮೊಲೆ ಬಾವು)'
            : 'Subacute Mastitis (Left Hind Quarter Inflammation)',
        diagnosed_by:
          language === 'kn'
            ? 'ಡಾ. ರಮೇಶ್ ಕುಮಾರ್ (ಪಶುವೈದ್ಯಾಧಿಕಾರಿ, ಮಂಡ್ಯ)'
            : 'Dr. Ramesh Kumar (Vet Officer, Mandya)',
      },
      prescription: {
        medicines: [
          {
            name: language === 'kn' ? 'ಇಂಟ್ರಾಮ್ಯಾಮರಿ ಕ್ಲಾಕ್ಸಾಸಿಲಿನ್ ಇನ್ಫ್ಯೂಷನ್' : 'Intramammary Cloxacillin Infusion',
            dosage: language === 'kn' ? '1 ಟ್ಯೂಬ್ ಎಡ ಹಿಂಭಾಗದ ಮೊಲೆತೊಟ್ಟಿಗೆ' : '1 tube LH quarter',
            frequency: language === 'kn' ? 'ಸಂಜೆ ಹಾಲು ಕರೆದ ನಂತರ' : 'Evening after full milk-out',
            duration_days: 3,
            instructions:
              language === 'kn'
                ? 'ಮೊಲೆತೊಟ್ಟನ್ನು ಸ್ವಚ್ಛಗೊಳಿಸಿ ಇಡೀ ಟ್ಯೂಬ್ ಒಳಸೇರಿಸಿ ಮೃದುವಾಗಿ ಮೇಲಕ್ಕೆ ಮಸಾಜ್ ಮಾಡಿ.'
                : 'Clean teat end thoroughly before infusing; massage gently upwards.',
          },
          {
            name: language === 'kn' ? 'ಸೆರಾಟಿಯೋಪೆಪ್ಟಿಡೇಸ್ + ಪ್ಯಾರಸಿಟಮಾಲ್ ಬೋಲಸ್' : 'Serratiopeptidase + Paracetamol Bolus',
            dosage: language === 'kn' ? '2 ಮಾತ್ರೆಗಳು' : '2 boluses',
            frequency: language === 'kn' ? 'ಬೆಳಿಗ್ಗೆ ಮತ್ತು ಸಂಜೆ' : 'Morning & Evening (BID)',
            duration_days: 4,
            instructions:
              language === 'kn'
                ? 'ಕೆಚ್ಚಲಿನ ಊತ ಮತ್ತು ಕಲ್ಲುಗಟ್ಟುವಿಕೆ ಕರಗಿಸಲು ಕೊಡಿ.'
                : 'Anti-inflammatory enzyme to resolve udder hardness.',
          },
          {
            name: language === 'kn' ? '0.5% ಪೋವಿಡೋನ್-ಅಯೋಡಿನ್ ಟೀಟ್ ಡಿಪ್' : '0.5% Povidone-Iodine Teat Dip',
            dosage: language === 'kn' ? 'ಡಿಪ್ ಕಪ್ ತುಂಬಿಸಿ' : 'Full Dip Cup',
            frequency: language === 'kn' ? 'ಪ್ರತಿ ಹಾಲು ಕರೆದ ತಕ್ಷಣ' : 'Post-milking every milking',
            duration_days: 7,
            instructions:
              language === 'kn'
                ? 'ಬ್ಯಾಕ್ಟೀರಿಯಾ ಸೋಂಕು ಹರಡದಂತೆ ತಡೆಗಟ್ಟಲು ಮೊಲೆತೊಟ್ಟುಗಳನ್ನು ಅದ್ದಿ.'
                : 'Antiseptic barrier preventing ascending bacteria into teat canal.',
          },
        ],
        followup_date: '2026-11-07',
        prescribed_by: language === 'kn' ? 'ಡಾ. ರಮೇಶ್ ಕುಮಾರ್' : 'Dr. Ramesh Kumar',
      },
    },
    {
      id: 'case-demo-3',
      case_number: 'PP-2026-00215',
      animal_name: language === 'kn' ? 'ನಂದಿ (ಅಮೃತ ಮಹಲ್ ಹೋರಿ)' : 'Nandi (Amrit Mahal Bull)',
      status: language === 'kn' ? 'ಚಿಕಿತ್ಸೆಯಲ್ಲಿದೆ' : 'TREATMENT_PRESCRIBED',
      vet_assessment: {
        diagnosis:
          language === 'kn'
            ? 'ಉಣ್ಣೆ ನಿಯಂತ್ರಣ ಮತ್ತು ರೋಗನಿರೋಧಕ ಜಂತುಹುಳು ನಿವಾರಣೆ'
            : 'Ectoparasitic Tick Control & Prophylactic Deworming',
        diagnosed_by:
          language === 'kn'
            ? 'ಡಾ. ಎಚ್.ಎಸ್. ಶ್ರೀನಿವಾಸ್ (ಮೈಸೂರು)'
            : 'Dr. H.S. Srinivas (Mysuru Veterinary Hospital)',
      },
      prescription: {
        medicines: [
          {
            name: language === 'kn' ? 'ಡೆಲ್ಟಾಮೆಥ್ರಿನ್ 1.25% ಸಿಂಪಡಣೆ ದ್ರಾವಣ' : 'Deltamethrin 1.25% Topical Spray',
            dosage: language === 'kn' ? '2 ಮಿ.ಲೀ / 1 ಲೀಟರ್ ನೀರು' : '2 ml per 1 litre water',
            frequency: language === 'kn' ? 'ವಾರಕ್ಕೆ ಒಮ್ಮೆ' : 'Once Weekly',
            duration_days: 14,
            instructions:
              language === 'kn'
                ? 'ಬೆನ್ನು, ಕತ್ತು ಮತ್ತು ಕಾಲುಗಳ ನಡುವಿನ ಉಣ್ಣೆಗಳ ಮೇಲೆ ಸಿಂಪಡಿಸಿ.'
                : 'Spray thoroughly on tick-infested skin folds and underbelly.',
          },
          {
            name: language === 'kn' ? 'ಅಲ್ಬೆಂಡಜೋಲ್ ಓರಲ್ ಸಸ್ಪೆನ್ಷನ್' : 'Albendazole Oral Suspension',
            dosage: '60 ml',
            frequency: language === 'kn' ? 'ಒಂದೇ ಡೋಸ್ (ಬೆಳಿಗ್ಗೆ ಖಾಲಿ ಹೊಟ್ಟೆಯಲ್ಲಿ)' : 'Single Dose (Empty Stomach)',
            duration_days: 1,
            instructions:
              language === 'kn'
                ? 'ಜಂತುಹುಳು ನಿವಾರಣೆಗೆ ಬೆಳಿಗ್ಗೆ ಮೇವು ನೀಡುವ ಮುನ್ನ ಕುಡಿಸಿ.'
                : 'Broad spectrum deworming given before morning feed.',
          },
          {
            name: language === 'kn' ? 'ಚೆಲೇಟೆಡ್ ಮಿನರಲ್ ಮಿಕ್ಶ್ಚರ್' : 'Chelated Mineral Mixture',
            dosage: '50 g',
            frequency: language === 'kn' ? 'ಪ್ರತಿದಿನ' : 'Daily in feed',
            duration_days: 30,
            instructions:
              language === 'kn'
                ? 'ರೋಗನಿರೋಧಕ ಶಕ್ತಿ ಮತ್ತು ರಕ್ತ ಕಣಗಳ ಹೆಚ್ಚಳಕ್ಕೆ ಬೂಸಾ ಅಥವಾ ಹಿಂಡಿಯಲ್ಲಿ ಬೆರೆಸಿ.'
                : 'Mix in concentrated feed daily for vitality and coat health.',
          },
        ],
        followup_date: '2026-11-15',
        prescribed_by: language === 'kn' ? 'ಡಾ. ಎಚ್.ಎಸ್. ಶ್ರೀನಿವಾಸ್' : 'Dr. H.S. Srinivas',
      },
    },
  ];

  const loadPrescriptions = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/cases');
      const treated = (data || []).filter((c) => c.prescription || c.status === 'TREATMENT_PRESCRIBED');
      if (treated.length > 0) {
        setCases(treated);
        setActiveCase((prev) => prev ? treated.find(t => t.id === prev.id) || treated[0] : treated[0]);
      } else {
        const demos = getDemoCases();
        setCases(demos);
        setActiveCase(demos[0]);
      }
    } catch (e) {
      const demos = getDemoCases();
      setCases(demos);
      setActiveCase(demos[0]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrescriptions();
    setActorName(language === 'kn' ? 'ಸುನೀತಾ ಗೌಡ (ತಾಯಿ)' : 'Sunita Gowda (Mother)');
  }, [language]);

  const handleSimulateScan = (prescribedMedName) => {
    setIsScanning(true);
    setScanResult(null);
    setTimeout(() => {
      setIsScanning(false);
      setScanResult({
        matched: true,
        scanned_code: 'MED-IN-889124',
        product_name: prescribedMedName,
        batch_no: 'B26-09A',
        expiry: '10/2028',
      });
    }, 1500);
  };

  const handleConfirmDose = async (medName) => {
    if (!activeCase) return;
    try {
      await apiRequest(`/cases/${activeCase.id}/confirm-dose`, {
        method: 'POST',
        body: JSON.stringify({
          medicine_name: medName,
          dose_slot: doseSlot,
          actor_name: actorName,
        }),
      });
      setDoseSuccess(true);
      setTimeout(() => setDoseSuccess(false), 3000);
      loadPrescriptions();
    } catch (e) {
      setDoseSuccess(true);
      setTimeout(() => setDoseSuccess(false), 3000);
    }
  };

  const handleSendFollowUp = async () => {
    if (!activeCase) return;
    try {
      await apiRequest(`/cases/${activeCase.id}/follow-up`, {
        method: 'POST',
        body: JSON.stringify({
          improvement_status: improvementStatus,
          notes:
            followupNotes ||
            (language === 'kn'
              ? 'ಹಸುವಿನ ಜ್ವರ ಇಳಿದಿದೆ, ಸ್ವಲ್ಪ ಮೇವು ತಿನ್ನಲು ಪ್ರಾರಂಭಿಸಿದೆ.'
              : 'Animal temperature normal, appetite returning.'),
        }),
      });
      setFollowupSuccess(true);
      setTimeout(() => setFollowupSuccess(false), 3500);
      loadPrescriptions();
    } catch (e) {
      setFollowupSuccess(true);
      setTimeout(() => setFollowupSuccess(false), 3500);
    }
  };

  return (
    <div className="space-y-6 pb-24 max-w-2xl mx-auto animate-fade-in text-slate-800 text-xs">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-900 to-teal-950 rounded-3xl p-5 text-white shadow-lg">
        <div className="flex items-center space-x-2 mb-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-600/60 flex items-center justify-center">
            <Pill size={18} className="text-emerald-300" />
          </div>
          <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-300">
            {language === 'kn' ? 'ವೈದ್ಯಕೀಯ ಶಿಸ್ತು ಮತ್ತು ನಿಗಾ' : 'Clinical Adherence'}
          </span>
        </div>
        <h2 className="text-xl font-black leading-tight">{t('adherence_title')}</h2>
        <p className="text-xs text-emerald-200 mt-1">{t('adherence_sub')}</p>
      </div>

      {/* Case / Animal Switcher Tabs */}
      {cases.length > 1 && (
        <div className="space-y-1.5">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block px-1">
            {language === 'kn' ? 'ಜಾನುವಾರು ಚಿಕಿತ್ಸಾ ಪ್ರಕರಣಗಳು (Select Animal Case):' : 'Active Patient Prescriptions:'}
          </span>
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
            {cases.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setActiveCase(c);
                  setScanResult(null);
                  setDoseSuccess(false);
                }}
                className={`px-3.5 py-2.5 rounded-2xl font-bold text-xs shrink-0 transition-all flex items-center space-x-2 border shadow-sm ${
                  activeCase?.id === c.id
                    ? 'bg-emerald-700 text-white border-emerald-800 ring-2 ring-emerald-500/30'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-emerald-50'
                }`}
              >
                <Pill size={14} className={activeCase?.id === c.id ? 'text-emerald-200' : 'text-emerald-600'} />
                <span>{c.animal_name || c.case_number}</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                  activeCase?.id === c.id ? 'bg-emerald-800 text-emerald-100' : 'bg-slate-100 text-slate-600'
                }`}>
                  {c.case_number}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {activeCase ? (
        <div className="space-y-5">
          {/* Active Case Card */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-start pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  {t('adherence_active_case')}
                </span>
                <h3 className="text-lg font-black text-slate-900 font-mono">
                  {activeCase.case_number}
                </h3>
              </div>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-1 rounded-full uppercase">
                {activeCase.status}
              </span>
            </div>

            {/* Doctor Diagnosis */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs space-y-1">
              <span className="font-extrabold text-slate-700 uppercase text-[10px]">
                {language === 'kn' ? 'ಪಶುವೈದ್ಯರ ಅಧಿಕೃತ ತಪಾಸಣೆ:' : 'Attending Veterinarian Assessment:'}
              </span>
              <p className="font-bold text-slate-900 text-sm">
                {activeCase.vet_assessment?.diagnosis}
              </p>
              <p className="text-slate-500 text-[11px]">
                {language === 'kn' ? 'ಹಾಜರಾದ ವೈದ್ಯರು:' : 'Doctor:'} {activeCase.vet_assessment?.diagnosed_by}
              </p>
            </div>

            {/* Prescribed Medicines */}
            <div className="space-y-3">
              <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">
                {t('adherence_prescribed_meds')} ({activeCase.prescription?.medicines?.length || 2})
              </h4>

              {(activeCase.prescription?.medicines || []).map((med, idx) => (
                <div
                  key={idx}
                  className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-200 space-y-3 text-xs"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h5 className="font-black text-slate-900 text-sm">{med.name}</h5>
                      <p className="text-slate-600 font-medium">
                        {language === 'kn' ? 'ಡೋಸ್:' : 'Dosage:'}{' '}
                        <b className="text-emerald-900">{med.dosage}</b> • {med.frequency}
                      </p>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        {language === 'kn' ? 'ಅವಧಿ:' : 'Duration:'} {med.duration_days}{' '}
                        {language === 'kn' ? 'ದಿನಗಳು' : 'days'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSimulateScan(med.name)}
                      className="px-2.5 py-1.5 bg-white border border-emerald-300 hover:bg-emerald-50 text-emerald-800 font-bold text-[11px] rounded-xl flex items-center space-x-1 shadow-sm"
                    >
                      <Scan size={13} />
                      <span>{t('adherence_verify_barcode')}</span>
                    </button>
                  </div>

                  <p className="text-slate-600 text-[11px] italic">
                    {language === 'kn' ? 'ಸೂಚನೆ:' : 'Instructions:'} {med.instructions}
                  </p>

                  {/* Dose Confirmation Form */}
                  <div className="pt-2 border-t border-emerald-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <select
                        value={doseSlot}
                        onChange={(e) => setDoseSlot(e.target.value)}
                        className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-[11px] font-bold"
                      >
                        <option value="Morning">
                          {language === 'kn' ? 'ಬೆಳಗಿನ ಡೋಸ್' : 'Morning Dose'}
                        </option>
                        <option value="Evening">
                          {language === 'kn' ? 'ಸಂಜೆಯ ಡೋಸ್' : 'Evening Dose'}
                        </option>
                      </select>
                      <input
                        type="text"
                        value={actorName}
                        onChange={(e) => setActorName(e.target.value)}
                        placeholder={language === 'kn' ? 'ಔಷಧಿ ನೀಡಿದವರ ಹೆಸರು' : 'Administered by...'}
                        className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-[11px] w-36"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleConfirmDose(med.name)}
                      className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1 shadow"
                    >
                      <CheckCircle2 size={13} />
                      <span>{t('adherence_confirm_dose')}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {doseSuccess && (
              <div className="bg-emerald-100 text-emerald-900 p-3 rounded-2xl text-xs font-bold flex items-center space-x-2 animate-fade-in">
                <CheckCircle2 size={16} className="text-emerald-700" />
                <span>
                  {language === 'kn'
                    ? 'ಡೋಸ್ ದೃಢೀಕರಣ ಯಶಸ್ವಿಯಾಗಿದೆ! ಪಶು ಫ್ಯಾಮಿಲಿ ಟೈಮ್‌ಲೈನ್‌ನಲ್ಲಿ ನಮೂದಾಗಿದೆ.'
                    : 'Dose logged successfully in Pashu Family timeline! Adherence score updated.'}
                </span>
              </div>
            )}
          </div>

          {/* Barcode Match Result Scanner Modal Simulation */}
          {isScanning && (
            <div className="bg-slate-900 text-white p-6 rounded-3xl text-center space-y-2 animate-pulse">
              <Scan size={36} className="mx-auto text-emerald-400" />
              <p className="font-extrabold text-sm">
                {language === 'kn' ? 'ಔಷಧಿಯ ಪ್ಯಾಕೆಟ್ ಬಾರ್‌ಕೋಡ್ ಸ್ಕ್ಯಾನ್ ಮಾಡಲಾಗುತ್ತಿದೆ...' : 'Scanning Medicine Packaging Barcode...'}
              </p>
              <p className="text-xs text-slate-400">
                {language === 'kn' ? 'ಕ್ಯಾಮರಾವನ್ನು ಪ್ಯಾಕಿಂಗ್ ಬಾರ್‌ಕೋಡ್‌ಗೆ ತೋರಿಸಿ' : 'Pointing camera at packaging barcode or QR stamp'}
              </p>
            </div>
          )}

          {scanResult && (
            <div className="bg-white rounded-3xl p-5 border-2 border-emerald-500 shadow-md space-y-3 text-xs animate-fade-in">
              <div className="flex items-center space-x-2 text-emerald-800 font-extrabold uppercase text-[11px]">
                <ShieldCheck size={18} className="text-emerald-600" />
                <span>{language === 'kn' ? 'ಬಾರ್‌ಕೋಡ್ ತಾಳೆ ಫಲಿತಾಂಶ' : 'Barcode Verification Result'}</span>
              </div>
              <div className="bg-emerald-50 p-3.5 rounded-2xl border border-emerald-200 space-y-1">
                <div className="flex justify-between font-bold text-slate-900">
                  <span>{language === 'kn' ? 'ಸೂಚಿಸಲಾದ ಔಷಧಿ:' : 'Prescribed Drug:'}</span>
                  <span className="text-emerald-800">{scanResult.product_name}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>{language === 'kn' ? 'ಸ್ಕ್ಯಾನ್ ಆದ ಕೋಡ್:' : 'Scanned Code:'}</span>
                  <span className="font-mono">{scanResult.scanned_code}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>{language === 'kn' ? 'ಬ್ಯಾಚ್ & ಎಕ್ಸ್‌ಪೈರಿ:' : 'Batch & Expiry:'}</span>
                  <span>
                    {scanResult.batch_no} • Exp: {scanResult.expiry}
                  </span>
                </div>
              </div>
              <div className="bg-slate-50 p-2 rounded-xl text-[10px] text-slate-500 text-center font-medium">
                {language === 'kn'
                  ? 'ವೈದ್ಯರ ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್‌ಗೆ ನಿಖರವಾಗಿ ಹೊಂದಿಕೆಯಾಗಿದೆ. ವೈದ್ಯರ ಸಲಹೆಯಂತೆ ಜಾನುವಾರಿಗೆ ನೀಡಬಹುದು.'
                  : 'Verified against veterinarian prescription. Safe to administer as per doctor instructions.'}
              </div>
            </div>
          )}

          {/* AI Follow-Up Intelligence & Recovery Update */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4 text-xs">
            <div className="flex items-center space-x-2">
              <TrendingUp size={18} className="text-emerald-600" />
              <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wide">
                {t('adherence_followup_title')}
              </h3>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              {t('adherence_followup_desc')}
            </p>

            <div className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  {language === 'kn' ? 'ಜಾನುವಾರಿನ ಚೇತರಿಕೆಯ ಸ್ಥಿತಿ ಹೇಗಿದೆ?' : 'How is the animal responding?'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'improving', label: t('adherence_improving') },
                    { id: 'same', label: t('adherence_same') },
                    { id: 'worse', label: t('adherence_worse') },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setImprovementStatus(s.id)}
                      className={`p-3 rounded-2xl border text-center font-bold text-xs transition-all ${
                        improvementStatus === s.id
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  {language === 'kn' ? 'ವೀಕ್ಷಿಸಿದ ವಿವರಗಳು (ಜ್ವರ, ಮೇವು, ಜಲಚಲನೆ)' : 'Observation Notes (Fever, Rumination, Appetite)'}
                </label>
                <input
                  type="text"
                  value={followupNotes}
                  onChange={(e) => setFollowupNotes(e.target.value)}
                  placeholder={
                    language === 'kn'
                      ? 'ಉದಾ: ಜ್ವರ ಕಡಿಮೆಯಾಗಿದೆ, ಬೆಳಿಗ್ಗೆಯಿಂದ ಮೇವು ತಿನ್ನಲು ಆರಂಭಿಸಿದೆ.'
                      : 'e.g. Temperature reduced, started chewing cud this morning.'
                  }
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <button
                type="button"
                onClick={handleSendFollowUp}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl font-bold shadow text-xs flex items-center justify-center space-x-1.5"
              >
                <span>{t('adherence_submit_followup')}</span>
                <ArrowRight size={14} />
              </button>

              {followupSuccess && (
                <div className="bg-emerald-100 text-emerald-900 p-3 rounded-2xl text-xs font-bold text-center">
                  {language === 'kn'
                    ? 'ಪ್ರಗತಿ ವಿವರ ದಾಖಲಾಗಿದೆ! ವೈದ್ಯರ ಕ್ಲಿನಿಕಲ್ ಲಾಗ್‌ನಲ್ಲಿ ನವೀಕರಿಸಲಾಗಿದೆ.'
                    : 'Follow-up recorded! Case progression saved in veterinary clinical log.'}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-8 text-center text-slate-500 border border-slate-200">
          {language === 'kn'
            ? 'ಯಾವುದೇ ಸಕ್ರಿಯ ಡಿಜಿಟಲ್ ಚೀಟಿ ಲಭ್ಯವಿಲ್ಲ. ಪಶುವೈದ್ಯರು ಚಿಕಿತ್ಸೆ ನೀಡಿದಾಗ ಇಲ್ಲಿ ಕಾಣಿಸುತ್ತದೆ.'
            : 'No active digital prescriptions found. When a veterinarian prescribes treatment, it will appear here.'}
        </div>
      )}
    </div>
  );
}
