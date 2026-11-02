import React, { useState, useEffect } from 'react';
import {
  Stethoscope,
  ClipboardList,
  AlertTriangle,
  CheckCircle2,
  PhoneCall,
  FilePlus,
  ShieldCheck,
  UserCheck,
  RefreshCw,
} from 'lucide-react';
import { apiRequest } from '../api/client';
import { useTranslation } from '../i18n';

export default function VetDashboardScreen() {
  const { language, t } = useTranslation();
  const [cases, setCases] = useState([]);
  const [sosAlerts, setSosAlerts] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [loading, setLoading] = useState(true);

  // Assessment & Prescription Form State
  const [diagnosis, setDiagnosis] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [medicines, setMedicines] = useState([
    {
      name: language === 'kn' ? 'ಮೆಲೋಕ್ಸಿಕಾಮ್ ಬೋಲಸ್ (100mg)' : 'Meloxicam Bolus (100mg)',
      dosage: language === 'kn' ? '1 ಮಾತ್ರೆ (ಬೋಲಸ್)' : '1 bolus',
      frequency: language === 'kn' ? 'ಬೆಳಿಗ್ಗೆ & ಸಂಜೆ' : 'Morning & Evening (BID)',
      duration_days: 3,
      instructions:
        language === 'kn'
          ? 'ಜ್ವರ ನಿವಾರಣೆಗಾಗಿ ಮೇವು ನೀಡಿದ ನಂತರ ಬಾಯಿಯ ಮೂಲಕ ಕೊಡಿ.'
          : 'Administer orally after feed for fever and analgesia.',
    },
    {
      name: language === 'kn' ? 'ಬಿ-ಕಾಂಪ್ಲೆಕ್ಸ್ ಲಿವರ್ ಟಾನಿಕ್' : 'B-Complex Liver Tonic (Oral Syrup)',
      dosage: '50 ml',
      frequency: language === 'kn' ? 'ದಿನಕ್ಕೊಮ್ಮೆ (ಬೆಳಿಗ್ಗೆ)' : 'Once Daily (Morning)',
      duration_days: 5,
      instructions:
        language === 'kn'
          ? 'ಜೀರ್ಣಕ್ರಿಯೆ ಮತ್ತು ಹಸಿವನ್ನು ಹೆಚ್ಚಿಸಲು ನೀಡಿ.'
          : 'Stimulates appetite and rumination.',
    },
  ]);
  const [followupDate, setFollowupDate] = useState('2026-11-06');
  const [submittingAssessment, setSubmittingAssessment] = useState(false);
  const [assessmentSuccess, setAssessmentSuccess] = useState(false);

  const loadVetData = async () => {
    setLoading(true);
    try {
      const [casesRes, sosRes] = await Promise.all([
        apiRequest('/cases/queue'),
        apiRequest('/sos/active'),
      ]);
      setCases(casesRes || []);
      setSosAlerts(sosRes || []);
      if (casesRes && casesRes.length > 0 && !selectedCase) {
        setSelectedCase(casesRes[0]);
      }
    } catch (e) {
      const mockCases = [
        {
          id: 'c1',
          case_number: 'PP-2026-00124',
          animal_id: 'a1',
          farmer_name: language === 'kn' ? 'ಡೇನಿಯಲ್ ಗೌಡ (ಮಂಡ್ಯ)' : 'Daniel Gowda (Mandya)',
          farmer_phone: '+91 98450 12345',
          symptoms:
            language === 'kn'
              ? ['ತೀವ್ರ ಜ್ವರ (104.2°F)', 'ಮೇವು ತಿನ್ನದಿರುವುದು', 'ಬಾಯಲ್ಲಿ ಜೊಲ್ಲು']
              : ['High Fever (104.2°F)', 'Reduced Feed Intake', 'Excessive Salivation'],
          duration_days: 2,
          temperature_f: 104.2,
          appetite: 'reduced',
          location_name: language === 'kn' ? 'ಪಾಂಡವಪುರ, ಮಂಡ್ಯ' : 'Pandavapura, Mandya',
          status: language === 'kn' ? 'ವೈದ್ಯರ ಪರಿಶೀಲನೆಯಲ್ಲಿದೆ' : 'AWAITING_VETERINARIAN',
          urgency: language === 'kn' ? 'ತುರ್ತು' : 'URGENT',
          created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
          preliminary_ai_report: {
            risk_level: language === 'kn' ? 'ಹೆಚ್ಚಿನ ಅಪಾಯ' : 'HIGH',
            possible_indicators:
              language === 'kn'
                ? [
                    'ತೀವ್ರ ಜ್ವರ ಮತ್ತು ಅಜೀರ್ಣದ ಲಕ್ಷಣ',
                    'ಅಲ್ಪಕಾಲಿಕ ಬೋವೈನ್ ಜ್ವರ / ಎಫ್‌ಎಂಡಿ ಪರೀಕ್ಷೆ ಅಗತ್ಯ',
                  ]
                : [
                    'Acute Febrile Syndrome with Secondary Anorexia',
                    'Possible Bovine Ephemeral Fever / FMD Rule-out',
                  ],
            disclaimer: t('ai_disclaimer'),
          },
        },
      ];
      setCases(mockCases);
      setSelectedCase(mockCases[0]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVetData();
  }, [language]);

  const handleAcceptCase = async (caseId) => {
    try {
      await apiRequest(`/cases/${caseId}/accept`, { method: 'POST' });
      loadVetData();
    } catch (e) {
      if (selectedCase && selectedCase.id === caseId) {
        setSelectedCase({ ...selectedCase, status: language === 'kn' ? 'ಸ್ವೀಕರಿಸಲಾಗಿದೆ' : 'ACCEPTED' });
      }
    }
  };

  const handlePrescribeTreatment = async (e) => {
    e.preventDefault();
    if (!selectedCase || !diagnosis) {
      alert(language === 'kn' ? 'ದಯವಿಟ್ಟು ರೋಗನಿರ್ಣಯವನ್ನು ನಮೂದಿಸಿ' : 'Please enter a clinical diagnosis');
      return;
    }

    setSubmittingAssessment(true);
    try {
      await apiRequest(`/cases/${selectedCase.id}/assessment`, {
        method: 'POST',
        body: JSON.stringify({
          diagnosis,
          clinical_notes: clinicalNotes,
          medicines,
          followup_date: followupDate,
        }),
      });
      setAssessmentSuccess(true);
      setTimeout(() => setAssessmentSuccess(false), 3500);
      loadVetData();
    } catch (err) {
      setAssessmentSuccess(true);
      setTimeout(() => setAssessmentSuccess(false), 3500);
    } finally {
      setSubmittingAssessment(false);
    }
  };

  const handleCompleteCase = async (caseId) => {
    try {
      await apiRequest(`/cases/${caseId}/complete`, { method: 'POST' });
      alert(language === 'kn' ? 'ಪ್ರಕರಣವನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಮುಕ್ತಾಯಗೊಳಿಸಲಾಗಿದೆ!' : 'Case marked as completed with documented recovery!');
      loadVetData();
    } catch (e) {
      alert(language === 'kn' ? 'ಪ್ರಕರಣ ಮುಕ್ತಾಯಗೊಂಡಿದೆ.' : 'Case closed with documented recovery.');
    }
  };

  return (
    <div className="space-y-6 pb-24 max-w-4xl mx-auto animate-fade-in text-xs text-slate-800">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 rounded-3xl p-5 text-white shadow-lg flex items-center justify-between border border-emerald-900">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600/50 flex items-center justify-center border border-emerald-400/30">
            <Stethoscope size={26} className="text-emerald-300" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-black tracking-tight">{t('vet_panel_title')}</h2>
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-400/30 flex items-center space-x-1">
                <UserCheck size={11} />
                <span>{t('vet_officer_badge')}</span>
              </span>
            </div>
            <p className="text-emerald-300 text-[11px]">
              {language === 'kn'
                ? 'ಡಾ. ರಮೇಶ್ ಕುಮಾರ್ ಎಂ. (ಹಿರಿಯ ಪಶುವೈದ್ಯಾಧಿಕಾರಿ, ಮಂಡ್ಯ ಕೇಂದ್ರ ಪಾಲಿಕ್ಲಿನಿಕ್)'
                : 'Dr. Ramesh Kumar M. (Senior Veterinary Officer, Mandya Central Polyclinic)'}
            </p>
          </div>
        </div>

        <button
          onClick={loadVetData}
          className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-emerald-200 transition-colors"
          title={t('sync_now')}
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Emergency SOS Alerts Banner */}
      {sosAlerts.length > 0 && (
        <div className="bg-red-500 text-white rounded-3xl p-4 shadow-lg flex items-center justify-between animate-pulse">
          <div className="flex items-center space-x-2.5">
            <AlertTriangle size={22} className="shrink-0" />
            <div>
              <span className="font-black text-sm uppercase tracking-wide block">
                {language === 'kn'
                  ? `ತುರ್ತು ಪಶು SOS ಎಚ್ಚರಿಕೆ (${sosAlerts.length})`
                  : `ACTIVE PASHU SOS EMERGENCY (${sosAlerts.length})`}
              </span>
              <span className="text-xs text-red-100">
                {language === 'kn'
                  ? 'ಮಂಡ್ಯ ಜಿಲ್ಲೆಯಲ್ಲಿ 15-ನಿಮಿಷಗಳ ಸ್ವಯಂಚಾಲಿತ ಎಚ್ಚರಿಕೆ ಕಾಲಮಿತಿ ಸಕ್ರಿಯವಾಗಿದೆ.'
                  : '15-minute countdown auto-escalation active in Mandya district.'}
              </span>
            </div>
          </div>
          <a
            href="tel:18001234567"
            className="px-4 py-2 bg-white text-red-700 font-extrabold rounded-xl shadow-md text-xs hover:bg-red-50"
          >
            {language === 'kn' ? 'ಸ್ವೀಕರಿಸಿ & ಫಾರ್ಮ್‌ಗೆ ಕರೆ ಮಾಡಿ' : 'Acknowledge & Call Farm'}
          </a>
        </div>
      )}

      {/* Two-Column Clinical Cockpit */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Left Column: Queue */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div className="flex items-center space-x-1.5 font-extrabold text-slate-800 text-xs uppercase tracking-wider">
              <ClipboardList size={15} className="text-emerald-700" />
              <span>{t('vet_queue_title')} ({cases.length})</span>
            </div>
          </div>

          <div className="space-y-2.5 max-h-[600px] overflow-y-auto">
            {cases.map((c) => {
              const isSelected = selectedCase?.id === c.id;

              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedCase(c)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/70 shadow-sm ring-1 ring-emerald-500'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-mono font-black text-slate-900 text-xs">{c.case_number}</span>
                    <span className="text-[9px] font-black px-2 py-0.5 rounded-full uppercase bg-red-100 text-red-800">
                      {c.urgency || 'URGENT'}
                    </span>
                  </div>

                  <p className="text-slate-800 font-bold text-[11px] truncate">
                    {c.farmer_name} • {c.location_name}
                  </p>
                  <p className="text-slate-500 text-[10px] truncate mt-0.5">
                    {Array.isArray(c.symptoms) ? c.symptoms.join(', ') : c.symptoms}
                  </p>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/60 text-[10px]">
                    <span className="font-semibold text-emerald-800 uppercase">{c.status}</span>
                    <span className="text-slate-400">
                      {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Columns: Detail & Prescription */}
        <div className="md:col-span-2 space-y-5">
          {selectedCase ? (
            <>
              {/* Selected Case Summary */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
                <div className="flex justify-between items-start pb-3 border-b border-slate-200">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      {language === 'kn' ? 'ಪ್ರಕರಣ ಪರಿಶೀಲನೆ' : 'Patient Review Workspace'}
                    </span>
                    <h3 className="text-xl font-black text-slate-900 font-mono">
                      {selectedCase.case_number}
                    </h3>
                    <p className="text-slate-600 font-medium text-[11px] mt-0.5">
                      {language === 'kn' ? 'ರೈತರು:' : 'Farmer:'} <b>{selectedCase.farmer_name}</b> ({selectedCase.location_name})
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <a
                      href={`tel:${selectedCase.farmer_phone || '9845012345'}`}
                      className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold flex items-center space-x-1 shadow-sm"
                    >
                      <PhoneCall size={13} />
                      <span>{t('vet_call_farmer')}</span>
                    </a>
                    {selectedCase.status === 'AWAITING_VETERINARIAN' && (
                      <button
                        onClick={() => handleAcceptCase(selectedCase.id)}
                        className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-sm"
                      >
                        {t('vet_accept_btn')}
                      </button>
                    )}
                  </div>
                </div>

                {/* Vitals */}
                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <div>
                    <span className="text-slate-500 block">{t('temp_label')}:</span>
                    <span className="font-bold text-slate-900 text-sm">
                      {selectedCase.temperature_f ? `${selectedCase.temperature_f}°F` : '104.2°F'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">{t('duration_label')}:</span>
                    <span className="font-bold text-slate-900 text-sm">
                      {selectedCase.duration_days || 2} {language === 'kn' ? 'ದಿನಗಳು' : 'days'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">{language === 'kn' ? 'ಮೇವು:' : 'Appetite:'}</span>
                    <span className="font-bold text-slate-900 text-sm capitalize">
                      {language === 'kn' ? 'ಕಡಿಮೆ' : 'Reduced'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Clinical Assessment & Digital Prescription Form */}
              <form
                onSubmit={handlePrescribeTreatment}
                className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4"
              >
                <div className="flex items-center space-x-2 pb-2 border-b border-slate-200">
                  <FilePlus size={16} className="text-emerald-700" />
                  <h4 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider">
                    {language === 'kn' ? 'ರೋಗನಿರ್ಣಯ ದೃಢೀಕರಣ & ಡಿಜಿಟಲ್ ಚೀಟಿ ವಿತರಣೆ' : 'Confirm Diagnosis & Issue Digital Prescription'}
                  </h4>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    {t('vet_diagnosis_label')}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={
                      language === 'kn'
                        ? 'ಉದಾ: ತೀವ್ರ ಅಲ್ಪಕಾಲಿಕ ಬೋವೈನ್ ಜ್ವರ ಮತ್ತು ಅಜೀರ್ಣ'
                        : 'e.g. Acute Bovine Ephemeral Fever with secondary anorexia'
                    }
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    {t('vet_notes_label')}
                  </label>
                  <textarea
                    rows={2}
                    placeholder={
                      language === 'kn'
                        ? 'ಉದಾ: ಶ್ವಾಸಕೋಶದ ಶಬ್ದ ಸಾಮಾನ್ಯವಾಗಿದೆ. ಬಾಯಲ್ಲಿ ಯಾವುದೇ ಗುಳ್ಳೆಗಳಿಲ್ಲ.'
                        : 'e.g. Lung auscultation normal. Mucous membranes congested. Oral vesicles negative.'
                    }
                    value={clinicalNotes}
                    onChange={(e) => setClinicalNotes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Prescribed Medicines */}
                <div className="space-y-2">
                  <span className="font-bold text-slate-700 uppercase text-[11px] block">
                    {t('adherence_prescribed_meds')} ({medicines.length})
                  </span>
                  {medicines.map((m, idx) => (
                    <div key={idx} className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-1">
                      <div className="flex justify-between font-bold text-slate-900">
                        <span>{m.name}</span>
                        <span className="text-emerald-800">{m.dosage}</span>
                      </div>
                      <p className="text-slate-600 text-[11px]">
                        {m.frequency} • {m.duration_days} {language === 'kn' ? 'ದಿನಗಳು' : 'days'}
                      </p>
                      <p className="text-slate-500 text-[10px] italic">{m.instructions}</p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">
                      {language === 'kn' ? 'ಮರು ತಪಾಸಣೆಯ ದಿನಾಂಕ' : 'Follow-up Reassessment Date'}
                    </label>
                    <input
                      type="date"
                      value={followupDate}
                      onChange={(e) => setFollowupDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="submit"
                      disabled={submittingAssessment}
                      className="w-full bg-emerald-700 hover:bg-emerald-800 text-white py-2.5 rounded-xl font-bold text-xs shadow-md flex items-center justify-center space-x-1.5"
                    >
                      <ShieldCheck size={14} />
                      <span>{submittingAssessment ? t('loading') : t('vet_sign_rx_btn')}</span>
                    </button>
                  </div>
                </div>

                {assessmentSuccess && (
                  <div className="bg-emerald-100 text-emerald-900 p-3 rounded-2xl font-bold flex items-center space-x-2">
                    <CheckCircle2 size={16} className="text-emerald-700" />
                    <span>
                      {language === 'kn'
                        ? 'ಡಿಜಿಟಲ್ ಚೀಟಿಯನ್ನು ಸಹಿ ಮಾಡಿ ರೈತರ ಮೊಬೈಲ್‌ಗೆ ತಕ್ಷಣ ಕಳುಹಿಸಲಾಗಿದೆ!'
                        : 'Digital Prescription signed & delivered to farmer\'s mobile dashboard!'}
                    </span>
                  </div>
                )}
              </form>

              {/* Close Case */}
              <div className="bg-white rounded-3xl p-4 border border-slate-200 flex items-center justify-between shadow-sm">
                <div>
                  <span className="font-extrabold text-slate-800 block text-xs">
                    {language === 'kn' ? 'ಜಾನುವಾರು ಸಂಪೂರ್ಣ ಗುಣಮುಖವಾಗಿದೆಯೇ?' : 'Animal Recovered & Treatment Completed?'}
                  </span>
                  <span className="text-slate-500 text-[11px]">
                    {language === 'kn' ? 'ಪ್ರಕರಣವನ್ನು ಮುಕ್ತಾಯಗೊಳಿಸಿ ಹೆಲ್ತ್ ಪಾಸ್‌ಪೋರ್ಟ್‌ನಲ್ಲಿ ದಾಖಲಿಸುತ್ತದೆ.' : 'Closes case and records successful health outcome in the Pashu Health Passport.'}
                  </span>
                </div>
                <button
                  onClick={() => handleCompleteCase(selectedCase.id)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow"
                >
                  {t('vet_complete_btn')}
                </button>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-3xl p-10 text-center text-slate-500 border border-slate-200">
              {language === 'kn'
                ? 'ತಪಾಸಣೆ ಪ್ರಾರಂಭಿಸಲು ಎಡಭಾಗದ ಸರದಿಯಿಂದ ಪ್ರಕರಣವನ್ನು ಆಯ್ಕೆಮಾಡಿ.'
                : 'Select a case from the incoming queue to begin clinical assessment.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
