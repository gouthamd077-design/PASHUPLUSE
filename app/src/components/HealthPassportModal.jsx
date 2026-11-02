import React, { useState } from 'react';
import { QrCode, Syringe, AlertCircle, X, Share2 } from 'lucide-react';
import { useTranslation } from '../i18n';

export default function HealthPassportModal({ isOpen, onClose, animal }) {
  if (!isOpen || !animal) return null;

  const { language, t } = useTranslation();
  const [activeTab, setActiveTab] = useState('passport');

  const passportUrl = `https://pashupulse.in/passport/${animal.id}`;
  const qrSvgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(passportUrl)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in text-slate-800">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-emerald-500/30 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900 to-emerald-800 p-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-700/50 flex items-center justify-center border border-emerald-400/30">
              <QrCode size={22} className="text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-black tracking-tight leading-tight">{t('passport_title')}</h2>
                <span className="bg-emerald-400/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-400/30">
                  {language === 'kn' ? 'ಪರಿಶೀಲಿಸಲಾಗಿದೆ' : 'VERIFIED'}
                </span>
              </div>
              <p className="text-xs text-emerald-200 font-mono">{t('tag_id')}: {animal.tag_id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-5 pt-3">
          <button
            onClick={() => setActiveTab('passport')}
            className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 mr-6 transition-all ${
              activeTab === 'passport'
                ? 'border-emerald-600 text-emerald-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {t('passport_tab_profile')}
          </button>
          <button
            onClick={() => setActiveTab('emergency_summary')}
            className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center space-x-1 ${
              activeTab === 'emergency_summary'
                ? 'border-amber-600 text-amber-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <AlertCircle size={13} className="text-amber-600" />
            <span>{t('passport_tab_summary')}</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          {activeTab === 'passport' ? (
            <>
              {/* QR Code Presentation */}
              <div className="bg-gradient-to-b from-emerald-50 to-white rounded-2xl p-5 border border-emerald-100 flex flex-col items-center text-center shadow-inner">
                <div className="p-3 bg-white rounded-2xl shadow-md border border-slate-200">
                  <img
                    src={qrSvgUrl}
                    alt="QR Passport"
                    className="w-40 h-40 object-contain rounded-lg"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                  <div className="mt-2 text-[11px] font-mono font-bold text-slate-600 uppercase">
                    {t('passport_scan_notice')}
                  </div>
                </div>
                <p className="text-xs text-slate-600 mt-3 max-w-xs">
                  {language === 'kn'
                    ? 'ಕಿವಿಯ ಟ್ಯಾಗ್‌ನಲ್ಲಿ ಅಂಟಿಸಿ ಅಥವಾ ಹಾಜರಾಗುವ ಪಶುವೈದ್ಯರಿಗೆ ಅಧಿಕೃತ ಇತಿಹಾಸಕ್ಕಾಗಿ ತೋರಿಸಿ.'
                    : 'Attach to ear tag or display to visiting veterinarians for authorized medical history access.'}
                </p>
              </div>

              {/* Animal Master Details */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2">
                <h3 className="font-extrabold text-slate-800 uppercase text-[11px] tracking-wider mb-2">
                  {language === 'kn' ? 'ಜಾನುವಾರಿನ ಗುರುತಿನ ವಿವರಗಳು' : 'Animal Identity Information'}
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-500 block">{t('animal_name')}:</span>
                    <span className="font-bold text-slate-900">{animal.name || (language === 'kn' ? 'ಹೆಸರಿಲ್ಲ' : 'Unnamed')}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">{t('species')} & {t('breed')}:</span>
                    <span className="font-bold text-slate-900 capitalize">
                      {animal.species === 'cattle' ? (language === 'kn' ? 'ಹಸು' : 'Cattle') : (language === 'kn' ? 'ಎಮ್ಮೆ' : 'Buffalo')} ({animal.breed || (language === 'kn' ? 'ಹಳ್ಳಿಕಾರ್' : 'Indigenous')})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">{t('gender')} & {t('age_months')}:</span>
                    <span className="font-bold text-slate-900">
                      {animal.gender === 'female' ? (language === 'kn' ? 'ಹೆಣ್ಣು' : 'Female') : (language === 'kn' ? 'ಗಂಡು' : 'Male')} • {animal.age_months || 24} {language === 'kn' ? 'ತಿಂಗಳು' : 'mos'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">{language === 'kn' ? 'ನೋಂದಾಯಿತ ಜಿಲ್ಲೆ:' : 'District:'}</span>
                    <span className="font-bold text-slate-900">{language === 'kn' ? 'ಮಂಡ್ಯ, ಕರ್ನಾಟಕ' : 'Mandya, Karnataka'}</span>
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
                  <div className="flex justify-between items-center p-2 rounded-xl bg-slate-50 border border-slate-200">
                    <div>
                      <span className="font-bold text-slate-800 block">{t('passport_bq')}</span>
                      <span className="text-[11px] text-slate-500">
                        {language === 'kn' ? 'ಮುಂದಿನ ತ್ರೈಮಾಸಿಕದಲ್ಲಿ' : 'Due next quarter'}
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-600">
                      {t('passport_upcoming')}
                    </span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* One-Tap Emergency Summary for Arriving Veterinarians */
            <div className="space-y-4">
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

              <div className="border border-slate-200 rounded-2xl p-4 space-y-3 text-xs">
                <div className="flex justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">
                    {language === 'kn' ? 'ಸಕ್ರಿಯ ಮುಖ್ಯ ದೂರು:' : 'Active Chief Complaint:'}
                  </span>
                  <span className="font-bold text-red-600">
                    {language === 'kn' ? 'ತೀವ್ರ ಜ್ವರ & ಅಜೀರ್ಣ (ಪರಿಶೀಲನೆಯಲ್ಲಿದೆ)' : 'Acute fever & anorexia (Under Review)'}
                  </span>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">
                    {language === 'kn' ? 'ಪ್ರಸ್ತುತ ನೀಡುತ್ತಿರುವ ಔಷಧಿಗಳು:' : 'Current Medications:'}
                  </span>
                  <span className="font-bold text-slate-800">
                    {language === 'kn' ? 'ಮೆಲೋಕ್ಸಿಕಾಮ್ ಬೋಲಸ್ (ದಿನಕ್ಕೆ 2 ಬಾರಿ)' : 'Meloxicam (Oral Bolus BID)'}
                  </span>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">
                    {language === 'kn' ? 'ಔಷಧಿ ಅಲರ್ಜಿಗಳು / ಅಡ್ಡಪರಿಣಾಮ:' : 'Known Drug Reactions / Allergies:'}
                  </span>
                  <span className="font-bold text-emerald-700">
                    {language === 'kn' ? 'ಯಾವುದೂ ಇಲ್ಲ' : 'None reported'}
                  </span>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">
                    {language === 'kn' ? 'ಹಾಲು ಕರೆಯುವ ಹಂತ:' : 'Lactation & Pregnancy Status:'}
                  </span>
                  <span className="font-bold text-slate-800">
                    {language === 'kn' ? '2ನೇ ಈತು (ದೈನಂದಿನ ಸರಾಸರಿ 9.5 ಲೀಟರ್)' : '2nd Lactation (Daily avg: 9.5 L)'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">
                    {language === 'kn' ? 'ಮುಖ್ಯ ಆರೈಕೆದಾರರು:' : 'Primary Caregiver:'}
                  </span>
                  <span className="font-bold text-slate-800">
                    {language === 'kn' ? 'ರೈತ ಡೇನಿಯಲ್ ಗೌಡ (ಮಂಡ್ಯ)' : 'Farmer Daniel Gowda (Mandya)'}
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs">
                <h4 className="font-bold text-slate-800 uppercase text-[11px] mb-1">
                  {language === 'kn' ? 'ಕೊನೆಯ ಪಶುವೈದ್ಯರ ತಪಾಸಣಾ ಟಿಪ್ಪಣಿ' : 'Last Veterinary Assessment'}
                </h4>
                <p className="text-slate-600 italic">
                  {language === 'kn'
                    ? '"ಡಾ. ರಮೇಶ್ ಕುಮಾರ್ ಅವರಿಂದ ತಪಾಸಣೆ. ಶ್ವಾಸಕೋಶಗಳು ಸಾಮಾನ್ಯ, ಹೊಟ್ಟೆಯ ಚಲನೆ ಮಂದವಾಗಿದೆ. ಪೋಷಕ ಜ್ವರ ನಿವಾರಕ ಔಷಧಿಯನ್ನು ನೀಡಲಾಗಿದೆ."'
                    : '"Attended by Dr. Ramesh Kumar on Nov 1, 2026. Lungs clear, rumen motility slightly subdued (1/min). Prescribed supportive analgesics."'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: `Pashu Health Passport - ${animal.tag_id}`,
                  url: passportUrl,
                });
              } else {
                alert(`Passport URL: ${passportUrl}`);
              }
            }}
            className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center space-x-1.5"
          >
            <Share2 size={14} />
            <span>{language === 'kn' ? 'ಪಾಸ್‌ಪೋರ್ಟ್ ಹಂಚಿಕೊಳ್ಳಿ' : 'Share Passport'}</span>
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow"
          >
            {t('done')}
          </button>
        </div>
      </div>
    </div>
  );
}
