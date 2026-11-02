import React, { useState } from 'react';
import { PhoneCall, PhoneIncoming, Radio, Volume2, CheckCircle2, X } from 'lucide-react';
import { useTranslation } from '../i18n';

export default function MissedCallModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const { language, t } = useTranslation();
  const [step, setStep] = useState('idle');

  const handleSimulateMissedCall = () => {
    setStep('dialing');
    setTimeout(() => {
      setStep('ringing');
      setTimeout(() => {
        setStep('callback');
      }, 2500);
    }, 1500);
  };

  const handleSimulateIVRFinish = () => {
    setStep('case_created');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in text-slate-800">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-emerald-500/30">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-900 to-emerald-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-teal-800/60 flex items-center justify-center">
              <PhoneCall size={22} className="text-teal-300" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight leading-tight">{t('missed_call_heading')}</h2>
              <p className="text-xs text-teal-200">{t('missed_call_sub')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5 text-center text-xs">
          {step === 'idle' && (
            <div className="space-y-4">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-teal-50 border-2 border-teal-200 flex items-center justify-center text-teal-700">
                <Radio size={40} className="animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  {language === 'kn' ? 'ಸ್ಮಾರ್ಟ್‌ಫೋನ್ ಅಥವಾ ಇಂಟರ್ನೆಟ್ ಇಲ್ಲವೇ?' : 'No Smartphone or 4G Internet?'}
                </h3>
                <p className="text-slate-600 mt-1 max-w-xs mx-auto leading-relaxed">
                  {t('missed_call_desc')}
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 font-mono text-base font-black text-slate-800">
                📞 1800-PASHU-PULSE
                <span className="block text-[11px] font-sans font-medium text-slate-500 mt-0.5">
                  {language === 'kn' ? 'ಕರ್ನಾಟಕ ಉಚಿತ ಟೋಲ್-ಫ್ರೀ ಐವಿಆರ್ ಗೇಟ್‌ವೇ' : 'Karnataka Toll-Free IVR Gateway'}
                </span>
              </div>

              <button
                onClick={handleSimulateMissedCall}
                className="w-full bg-teal-700 hover:bg-teal-800 text-white py-3.5 rounded-2xl font-bold text-sm shadow-md flex items-center justify-center space-x-2 transition-transform active:scale-95"
              >
                <PhoneCall size={18} />
                <span>{t('simulate_missed_call')}</span>
              </button>
            </div>
          )}

          {step === 'dialing' && (
            <div className="py-8 space-y-3">
              <div className="w-16 h-16 mx-auto rounded-full bg-amber-100 text-amber-700 flex items-center justify-center animate-spin">
                <PhoneCall size={28} />
              </div>
              <p className="text-sm font-bold text-slate-800">
                {language === 'kn' ? '1800-PASHU-PULSE ಗೆ ಕರೆ ಸಂಪರ್ಕಿಸಲಾಗುತ್ತಿದೆ...' : 'Calling 1800-PASHU-PULSE...'}
              </p>
              <p className="text-slate-500">
                {language === 'kn' ? 'ಮೊಬೈಲ್ ಸಂಖ್ಯೆ +91 98450 12345 ನಿಂದ ಕರೆ' : 'Connecting from mobile number +91 98450 12345'}
              </p>
            </div>
          )}

          {step === 'ringing' && (
            <div className="py-8 space-y-3">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center animate-bounce">
                <PhoneIncoming size={28} />
              </div>
              <p className="text-sm font-bold text-emerald-800">
                {language === 'kn' ? 'ಕರೆ ಕಡಿತಗೊಂಡಿದೆ (ಮಿಸ್ಡ್-ಕಾಲ್ ದಾಖಲಾಗಿದೆ!)' : 'Call Disconnected (Missed Call Captured!)'}
              </p>
              <p className="text-slate-500">
                {language === 'kn'
                  ? 'ಸ್ವಯಂಚಾಲಿತ ಐವಿಆರ್ ಬೋಟ್ ಕನ್ನಡದಲ್ಲೇ ಮರುಕರೆ ಆರಂಭಿಸುತ್ತಿದೆ...'
                  : 'Automated IVR Voice Bot initiating callback in Kannada...'}
              </p>
            </div>
          )}

          {step === 'callback' && (
            <div className="space-y-4 text-left">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Volume2 size={22} className="text-emerald-700 animate-pulse" />
                  <div>
                    <span className="font-extrabold text-emerald-950 block text-sm">
                      {language === 'kn' ? 'ಪಶು ಪಲ್ಸ್ ಕನ್ನಡ ಧ್ವನಿ ಸಹಾಯಕ' : 'Pashu Pulse Kannada Voice Agent'}
                    </span>
                    <span className="text-[11px] text-emerald-700">
                      {language === 'kn' ? 'ಒಳಬರುವ ಕರೆ ಸಂಪರ್ಕಗೊಂಡಿದೆ' : 'Incoming call connected'}
                    </span>
                  </div>
                </div>
                <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  LIVE
                </span>
              </div>

              {/* Audio Transcript */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
                <div>
                  <span className="text-[10px] font-bold text-emerald-700 uppercase">
                    {language === 'kn' ? 'ಕಂಪ್ಯೂಟರ್ ಧ್ವನಿ:' : 'IVR Bot (Kannada):'}
                  </span>
                  <p className="text-slate-800 italic mt-0.5">
                    "ನಮಸ್ಕಾರ, ಪಶು ಪಲ್ಸ್‌ಗೆ ಸ್ವಾಗತ. ನಿಮ್ಮ ಹಸುವಿಗೆ ಏನು ತೊಂದರೆ ಇದೆ ಎಂದು ಸ್ಪಷ್ಟವಾಗಿ ಮಾತನಾಡಿ..."
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-indigo-700 uppercase">
                    {language === 'kn' ? 'ರೈತರ ಧ್ವನಿ:' : 'Farmer Voice:'}
                  </span>
                  <p className="text-slate-800 italic mt-0.5">
                    "ನನ್ನ ಹಳ್ಳಿಕಾರ್ ಹಸುವಿಗೆ ಎರಡು ದಿನದಿಂದ ಜ್ವರ ಇದೆ, ಮೇವು ತಿಂತಿಲ್ಲ."
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-emerald-700 uppercase">
                    {language === 'kn' ? 'ವರದಿ ರಚನೆ:' : 'Report Extraction:'}
                  </span>
                  <p className="text-slate-800 italic mt-0.5">
                    "ಧನ್ಯವಾದಗಳು, ನಿಮ್ಮ ವಿವರಗಳನ್ನು ವೈದ್ಯರ ವರದಿಗೆ ಪರಿವರ್ತಿಸಿ ಡಾ. ರಮೇಶ್ ಅವರಿಗೆ ಕಳುಹಿಸಲಾಗಿದೆ."
                  </p>
                </div>
              </div>

              <button
                onClick={handleSimulateIVRFinish}
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white py-3 rounded-2xl font-bold shadow text-xs"
              >
                {language === 'kn' ? 'ಕರೆ ಮುಗಿಸಿ ಪ್ರಕರಣ ರಚಿಸಿ' : 'Complete Voice Call & Generate Case'}
              </button>
            </div>
          )}

          {step === 'case_created' && (
            <div className="py-4 space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 size={36} />
              </div>
              <div>
                <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  {language === 'kn' ? 'ಐವಿಆರ್ ಮೂಲಕ ಪ್ರಕರಣ ಸೃಷ್ಟಿಯಾಗಿದೆ' : 'Case Created via IVR'}
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-2 font-mono">PP-2026-00388</h3>
                <p className="text-slate-600 mt-1 max-w-xs mx-auto leading-relaxed">
                  {language === 'kn'
                    ? 'ರಚಿಸಲಾದ ಕ್ಲಿನಿಕಲ್ ವರದಿಯನ್ನು ಡಾ. ರಮೇಶ್ ಕುಮಾರ್ ಅವರಿಗೆ ಕಳುಹಿಸಲಾಗಿದೆ. ರೈತರಿಗೆ ಕನ್ನಡದಲ್ಲಿ SMS ದೃಢೀಕರಣ ಸಂದೇಶ ರವಾನೆಯಾಗಿದೆ.'
                    : 'A structured clinical report has been dispatched to Dr. Ramesh Kumar. The farmer received an SMS confirmation in Kannada.'}
                </p>
              </div>

              <button
                onClick={onClose}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl font-bold text-xs shadow"
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
