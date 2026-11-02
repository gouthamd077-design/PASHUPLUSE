import React, { useState, useEffect } from 'react';
import { useTranslation } from '../i18n';
import { apiRequest } from '../api/client';
import { getCachedSymptomRules } from '../storage/repositories';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  Eye,
  PhoneCall,
  RotateCcw,
  ShieldCheck,
  ChevronRight,
  HelpCircle,
  WifiOff,
} from 'lucide-react';

export default function SymptomCheckScreen({ onNavigateToVets }) {
  const { language, t, getLocalized } = useTranslation();

  const [species, setSpecies] = useState('cattle');
  const [symptomKey, setSymptomKey] = useState('');
  const [catalog, setCatalog] = useState([]);
  const [offlineRules, setOfflineRules] = useState([]);

  // Session state
  const [sessionActive, setSessionActive] = useState(false);
  const [ruleId, setRuleId] = useState(null);
  const [activeRule, setActiveRule] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isOfflineEngine, setIsOfflineEngine] = useState(false);

  // Load catalog and offline rules
  useEffect(() => {
    async function loadCatalogAndRules() {
      // 1. Try local cache first
      try {
        const cached = await getCachedSymptomRules();
        if (cached && cached.length > 0) {
          setOfflineRules(cached);
          const localCat = cached.map((r) => ({
            symptom_key: r.symptom_key,
            name: r.rule_data?.symptom_name || { en: r.symptom_key, hi: r.symptom_key },
            species: r.species,
          }));
          setCatalog(localCat);
          if (localCat.length > 0) setSymptomKey(localCat[0].symptom_key);
        }
      } catch (e) {
        console.warn('Error reading cached rules:', e);
      }

      // 2. Refresh from server if online
      if (navigator.onLine) {
        try {
          const serverCatalog = await apiRequest(`/symptom-check/catalog?species=${species}`);
          if (Array.isArray(serverCatalog) && serverCatalog.length > 0) {
            setCatalog(serverCatalog);
            setSymptomKey(serverCatalog[0].symptom_key);
          }
          const allRules = await apiRequest('/symptom-check/rules');
          if (Array.isArray(allRules)) {
            setOfflineRules(allRules);
          }
        } catch (e) {
          console.log('Online catalog fetch failed, relying on offline cache');
        }
      }
    }
    loadCatalogAndRules();
  }, [species]);

  // Start guided triage
  const handleStartTriage = async () => {
    if (!symptomKey) return;
    setLoading(true);
    setResult(null);

    // Try server first if online
    if (navigator.onLine) {
      try {
        const data = await apiRequest('/symptom-check/start', {
          method: 'POST',
          body: JSON.stringify({ species, symptom_key: symptomKey }),
        });
        setRuleId(data.rule_id);
        setCurrentQuestion(data.current_question);
        setSessionActive(true);
        setIsOfflineEngine(false);
        setLoading(false);
        return;
      } catch (e) {
        console.warn('Server triage start failed, falling back to offline engine:', e);
      }
    }

    // Offline Fallback Engine
    const matchedRule = offlineRules.find(
      (r) => r.species.toLowerCase() === species.toLowerCase() && r.symptom_key === symptomKey
    );

    if (!matchedRule) {
      alert('Symptom rule not cached locally. Connect to internet once to sync all rules.');
      setLoading(false);
      return;
    }

    setActiveRule(matchedRule);
    setRuleId(matchedRule.id);
    const questions = matchedRule.rule_data.questions || [];
    const startQId = matchedRule.rule_data.start_question_id || 'q1';
    const firstQ = questions.find((q) => q.id === startQId) || questions[0];

    setCurrentQuestion({
      id: firstQ.id,
      text: firstQ.text,
      options: firstQ.options,
    });
    setSessionActive(true);
    setIsOfflineEngine(true);
    setLoading(false);
  };

  // Submit Answer
  const handleAnswer = async (answerValue) => {
    if (!currentQuestion) return;
    setLoading(true);

    if (!isOfflineEngine && navigator.onLine) {
      try {
        const data = await apiRequest('/symptom-check/answer', {
          method: 'POST',
          body: JSON.stringify({
            rule_id: ruleId,
            question_id: currentQuestion.id,
            answer_value: answerValue,
          }),
        });

        if (data.status === 'completed') {
          setResult(data.result);
          setCurrentQuestion(null);
        } else {
          setCurrentQuestion(data.current_question);
        }
        setLoading(false);
        return;
      } catch (e) {
        console.warn('Server answer failed, continuing with offline rule data:', e);
      }
    }

    // Local evaluation
    if (activeRule) {
      const qData = activeRule.rule_data.questions.find((q) => q.id === currentQuestion.id);
      const chosenOpt = qData?.options.find((o) => o.value === answerValue);

      if (chosenOpt?.outcome) {
        const outcome = activeRule.rule_data.outcomes[chosenOpt.outcome];
        setResult({
          level: outcome.level,
          title: outcome.title,
          guidance: outcome.guidance,
          disclaimer: t('disclaimer_text'),
          is_emergency: outcome.level === 'emergency',
        });
        setCurrentQuestion(null);
      } else if (chosenOpt?.next) {
        const nextQ = activeRule.rule_data.questions.find((q) => q.id === chosenOpt.next);
        if (nextQ) {
          setCurrentQuestion(nextQ);
        } else {
          // might be outcome key
          const outcome = activeRule.rule_data.outcomes[chosenOpt.next];
          if (outcome) {
            setResult({
              level: outcome.level,
              title: outcome.title,
              guidance: outcome.guidance,
              disclaimer: t('disclaimer_text'),
              is_emergency: outcome.level === 'emergency',
            });
            setCurrentQuestion(null);
          }
        }
      }
    }
    setLoading(false);
  };

  const handleReset = () => {
    setSessionActive(false);
    setCurrentQuestion(null);
    setResult(null);
  };

  return (
    <div className="space-y-5 pb-24 max-w-xl mx-auto">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 flex items-center space-x-2">
          <Activity className="text-red-600" />
          <span>{t('checker_title')}</span>
        </h2>
        <p className="text-sm text-slate-600 mt-1">{t('checker_subtitle')}</p>
      </div>

      {!sessionActive ? (
        /* Step 1 & 2: Species & Symptom Selection */
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-5">
          {/* Species */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
              {t('select_species')}
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { id: 'cattle', name: t('cattle'), icon: '🐄' },
                { id: 'buffalo', name: t('buffalo'), icon: '🐃' },
                { id: 'goat', name: t('goat'), icon: '🐐' },
                { id: 'sheep', name: t('sheep'), icon: '🐑' },
              ].map((sp) => (
                <button
                  key={sp.id}
                  type="button"
                  onClick={() => setSpecies(sp.id)}
                  className={`p-3 rounded-xl border-2 text-left touch-target flex items-center space-x-2.5 transition-all ${
                    species === sp.id
                      ? 'border-brand-600 bg-brand-50/70 text-brand-900 font-bold shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <span className="text-2xl">{sp.icon}</span>
                  <span className="text-sm">{sp.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Primary Symptom */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
              {t('select_symptom')}
            </label>
            <div className="space-y-2">
              {catalog.map((item) => (
                <button
                  key={item.symptom_key}
                  type="button"
                  onClick={() => setSymptomKey(item.symptom_key)}
                  className={`w-full p-3.5 rounded-xl border-2 text-left touch-target flex items-center justify-between transition-all ${
                    symptomKey === item.symptom_key
                      ? 'border-brand-600 bg-brand-50/70 text-brand-900 font-bold shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700 font-medium'
                  }`}
                >
                  <span className="text-base">{getLocalized(item.name)}</span>
                  <ChevronRight size={18} className={symptomKey === item.symptom_key ? 'text-brand-600' : 'text-slate-400'} />
                </button>
              ))}
            </div>
          </div>

          {/* Start Button */}
          <button
            onClick={handleStartTriage}
            disabled={loading || !symptomKey}
            className="w-full py-4 bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white font-extrabold rounded-xl shadow-md touch-target flex items-center justify-center space-x-2 text-lg transition-transform active:scale-98"
          >
            <Activity size={20} />
            <span>{loading ? t('loading') : t('start_triage')}</span>
          </button>
        </div>
      ) : currentQuestion ? (
        /* In-Progress Question Card */
        <div className="bg-white rounded-2xl p-6 border-2 border-brand-500 shadow-lg space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-700 flex items-center space-x-1">
              <HelpCircle size={15} />
              <span>Diagnostic Question</span>
            </span>
            <button
              onClick={handleReset}
              className="text-xs text-slate-400 hover:text-slate-700 font-medium flex items-center space-x-1 touch-target p-1"
            >
              <RotateCcw size={12} />
              <span>Cancel</span>
            </button>
          </div>

          <h3 className="text-xl font-extrabold text-slate-900 leading-snug">
            {getLocalized(currentQuestion.text)}
          </h3>

          {/* Big Touch Answer Options */}
          <div className="space-y-3 pt-2">
            {currentQuestion.options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleAnswer(opt.value)}
                disabled={loading}
                className="w-full p-4 rounded-xl border-2 border-slate-300 hover:border-brand-600 bg-slate-50 hover:bg-brand-50/50 active:bg-brand-100 font-bold text-slate-800 text-base text-left touch-target flex items-center justify-between shadow-sm transition-all"
              >
                <span>{getLocalized(opt.label)}</span>
                <ChevronRight size={20} className="text-slate-400" />
              </button>
            ))}
          </div>
        </div>
      ) : result ? (
        /* Final Triage Outcome Card */
        <div
          className={`rounded-2xl border-2 shadow-xl overflow-hidden animate-fadeIn ${
            result.level === 'emergency'
              ? 'border-red-600 bg-red-50/40'
              : result.level === 'call_vet_soon'
              ? 'border-amber-500 bg-amber-50/40'
              : 'border-blue-500 bg-blue-50/40'
          }`}
        >
          {/* Header Banner */}
          <div
            className={`p-5 text-white flex items-center space-x-3 ${
              result.level === 'emergency'
                ? 'bg-red-600'
                : result.level === 'call_vet_soon'
                ? 'bg-amber-600'
                : 'bg-blue-600'
            }`}
          >
            {result.level === 'emergency' ? (
              <AlertOctagon size={32} className="flex-shrink-0 animate-bounce" />
            ) : result.level === 'call_vet_soon' ? (
              <AlertTriangle size={32} className="flex-shrink-0" />
            ) : (
              <Eye size={32} className="flex-shrink-0" />
            )}
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-white/80">
                Triage Assessment
              </div>
              <h3 className="text-xl font-extrabold leading-tight">
                {getLocalized(result.title)}
              </h3>
            </div>
          </div>

          <div className="p-5 space-y-5 bg-white">
            {/* Guidance Items */}
            <div>
              <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-2">
                Immediate Action Steps:
              </h4>
              <ul className="space-y-2.5">
                {result.guidance.map((g, idx) => (
                  <li key={idx} className="flex items-start space-x-2.5 text-slate-800 font-medium text-sm">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span>{getLocalized(g)}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Emergency CTA */}
            {result.level === 'emergency' && (
              <div className="pt-2">
                <button
                  onClick={onNavigateToVets}
                  className="w-full py-4 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-black text-lg rounded-xl shadow-lg touch-target flex items-center justify-center space-x-2 animate-pulse"
                >
                  <PhoneCall size={22} />
                  <span>{t('call_vet_button')}</span>
                </button>
              </div>
            )}

            {result.level === 'call_vet_soon' && (
              <div className="pt-2">
                <button
                  onClick={onNavigateToVets}
                  className="w-full py-3.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-bold text-base rounded-xl shadow-md touch-target flex items-center justify-center space-x-2"
                >
                  <PhoneCall size={18} />
                  <span>Find Nearest Veterinarian</span>
                </button>
              </div>
            )}

            {/* Mandatory Clinical Disclaimer */}
            <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-600 flex items-start space-x-2">
              <ShieldCheck size={18} className="text-brand-700 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Clinical Disclaimer:</strong> {t('disclaimer_text')}
              </span>
            </div>

            {/* Reset Button */}
            <button
              onClick={handleReset}
              className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl touch-target flex items-center justify-center space-x-1.5 text-sm"
            >
              <RotateCcw size={16} />
              <span>{t('check_another')}</span>
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
