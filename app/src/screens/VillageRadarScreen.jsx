import React, { useState, useEffect } from 'react';
import { Radio, AlertOctagon, MapPin, Volume2, Filter, RefreshCw } from 'lucide-react';
import { apiRequest } from '../api/client';
import { useTranslation } from '../i18n';

export default function VillageRadarScreen() {
  const { language, t } = useTranslation();
  const [clusters, setClusters] = useState([]);
  const [districtFilter, setDistrictFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState(null);

  const loadClusters = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/village-radar/clusters');
      setClusters(data.clusters || []);
    } catch (e) {
      setClusters([
        {
          id: 'c1',
          village_name: language === 'kn' ? 'ಪಾಂಡವಪುರ ಗ್ರಾಮಾಂತರ' : 'Pandavapura Rural',
          district: language === 'kn' ? 'ಮಂಡ್ಯ' : 'Mandya',
          disease_name: language === 'kn' ? 'ಕಾಲು ಮತ್ತು ಬಾಯಿ ರೋಗ (FMD) ಶಂಕೆ' : 'Foot-and-Mouth Disease (FMD) Suspected',
          cases_count: 6,
          status: 'SUSPECTED',
          risk_level: language === 'kn' ? 'ಹೆಚ್ಚಿನ ಅಪಾಯ' : 'HIGH',
          alert_message_kannada:
            'ಪಾಂಡವಪುರ ಸುತ್ತಮುತ್ತ 6 ಜಾನುವಾರುಗಳಲ್ಲಿ ಜೊಲ್ಲು ಸುರಿಯುವುದು ಮತ್ತು ಬಾಯಲ್ಲಿ ಗುಳ್ಳೆಗಳು ಕಂಡುಬಂದಿವೆ. ತಕ್ಷಣ ಹಸುಗಳನ್ನು ಪ್ರತ್ಯೇಕಿಸಿ ಲಸಿಕೆ ಪರಿಶೀಲಿಸಿ.',
          alert_message_english:
            '6 cattle reported with excessive salivation and oral blisters in Pandavapura cluster. Quarantine affected animals and verify FMD vaccination.',
        },
        {
          id: 'c2',
          village_name: language === 'kn' ? 'ಶ್ರೀರಂಗಪಟ್ಟಣ ಪೂರ್ವ' : 'Srirangapatna East',
          district: language === 'kn' ? 'ಮಂಡ್ಯ' : 'Mandya',
          disease_name: language === 'kn' ? 'ಚರ್ಮ ಗಂಟು ರೋಗ (LSD) ಎಚ್ಚರಿಕೆ' : 'Lumpy Skin Disease (LSD) Alert',
          cases_count: 4,
          status: 'UNDER_VERIFICATION',
          risk_level: language === 'kn' ? 'ಮಧ್ಯಮ ಅಪಾಯ' : 'MEDIUM',
          alert_message_kannada:
            'ಶ್ರೀರಂಗಪಟ್ಟಣ ತಾಲ್ಲೂಕಿನಲ್ಲಿ ಚರ್ಮದ ಗಂಟು ರೋಗದ ಲಕ್ಷಣಗಳು ತಪಾಸಣೆಯಲ್ಲಿದೆ. ನೊಣ-ಸೊಳ್ಳೆ ನಿಯಂತ್ರಣಕ್ಕೆ ಬೇವಿನ ಹೊಗೆ ಹಾಕಿ.',
          alert_message_english:
            'Cutaneous skin nodule cases under clinical verification in Srirangapatna. Maintain vector mosquito control.',
        },
        {
          id: 'c3',
          village_name: language === 'kn' ? 'ನಂಜನಗೂಡು ಕೈಗಾರಿಕಾ ವಲಯ' : 'Nanjangud Industrial Belt',
          district: language === 'kn' ? 'ಮೈಸೂರು' : 'Mysuru',
          disease_name: language === 'kn' ? 'ಕೆಚ್ಚಲು ಬಾವು ಕಾಲೋಚಿತ ಹರಡುವಿಕೆ' : 'Bovine Mastitis Seasonal Flare',
          cases_count: 5,
          status: 'CONFIRMED',
          risk_level: language === 'kn' ? 'ಮಧ್ಯಮ ಅಪಾಯ' : 'MEDIUM',
          alert_message_kannada:
            'ನಂಜನಗೂಡು ಹಾಲಿನ ಕೇಂದ್ರ ವ್ಯಾಪ್ತಿಯಲ್ಲಿ ಕೆಚ್ಚಲು ಬಾವು ದೃಢಪಟ್ಟಿದೆ. ಹಾಲು ಕರೆಯುವ ಮುನ್ನ ಮತ್ತು ನಂತರ ಸ್ವಚ್ಛತೆಗೆ ಆದ್ಯತೆ ನೀಡಿ.',
          alert_message_english:
            'Confirmed subclinical mastitis spike in Nanjangud milk collection zones. Post-milking antiseptic teat dipping mandated.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClusters();
  }, [language]);

  const handlePlayAudio = (cluster) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const text = language === 'kn' ? cluster.alert_message_kannada : cluster.alert_message_english;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === 'kn' ? 'kn-IN' : 'en-IN';
      utterance.onstart = () => setPlayingId(cluster.id);
      utterance.onend = () => setPlayingId(null);
      utterance.onerror = () => setPlayingId(null);
      window.speechSynthesis.speak(utterance);
    } else {
      alert(language === 'kn' ? cluster.alert_message_kannada : cluster.alert_message_english);
    }
  };

  const getStatusLabel = (status) => {
    if (status === 'SUSPECTED') return t('radar_status_suspected');
    if (status === 'UNDER_VERIFICATION') return t('radar_status_verification');
    if (status === 'CONFIRMED') return t('radar_status_confirmed');
    return status;
  };

  const filtered = clusters.filter(
    (c) =>
      districtFilter === 'All' ||
      c.district.toLowerCase().includes(districtFilter.toLowerCase())
  );

  return (
    <div className="space-y-5 pb-24 max-w-2xl mx-auto animate-fade-in text-slate-800">
      {/* Official Prototype Synthetic Data Banner */}
      <div className="bg-amber-500 text-slate-950 px-4 py-2.5 rounded-2xl font-black text-xs flex items-center justify-between shadow-md">
        <div className="flex items-center space-x-2">
          <AlertOctagon size={18} className="shrink-0" />
          <span>{t('radar_synthetic_banner')}</span>
        </div>
        <span className="text-[10px] bg-slate-950 text-amber-300 px-2 py-0.5 rounded-full font-bold">
          {language === 'kn' ? 'ಪಾರದರ್ಶಕತೆ' : 'TRANSPARENCY'}
        </span>
      </div>

      {/* Hero Header */}
      <div className="bg-gradient-to-r from-teal-900 to-emerald-950 rounded-3xl p-5 text-white shadow-lg relative overflow-hidden">
        <div className="flex items-center space-x-2 mb-2">
          <div className="w-8 h-8 rounded-xl bg-teal-600/60 flex items-center justify-center">
            <Radio size={18} className="text-teal-300 animate-pulse" />
          </div>
          <span className="text-xs uppercase font-extrabold tracking-wider text-teal-300">
            {language === 'kn' ? 'ಜೈವಿಕ ನಿಗಾ ವ್ಯವಸ್ಥೆ' : 'Biosurveillance Intelligence'}
          </span>
        </div>
        <h2 className="text-xl font-black leading-tight">
          {t('radar_title')}
        </h2>
        <p className="text-xs text-teal-200 mt-1 max-w-md">
          {t('radar_sub')}
        </p>

        {/* District Filter Chips */}
        <div className="mt-4 flex items-center space-x-2 text-xs">
          <span className="font-bold text-teal-300 mr-1 flex items-center">
            <Filter size={12} className="mr-1" />
            {t('radar_filter_district')}
          </span>
          {[
            { id: 'All', label: language === 'kn' ? 'ಎಲ್ಲಾ' : 'All' },
            { id: 'Mandya', label: language === 'kn' ? 'ಮಂಡ್ಯ' : 'Mandya' },
            { id: 'Mysuru', label: language === 'kn' ? 'ಮೈಸೂರು' : 'Mysuru' },
          ].map((d) => (
            <button
              key={d.id}
              onClick={() => setDistrictFilter(d.id)}
              className={`px-3 py-1 rounded-xl font-bold transition-all ${
                districtFilter === d.id
                  ? 'bg-teal-500 text-slate-950 shadow'
                  : 'bg-teal-950/70 text-teal-200 border border-teal-800'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Outbreak Clusters List */}
      <div className="space-y-4">
        {filtered.map((cluster) => {
          const isConfirmed = cluster.status === 'CONFIRMED';
          const isSuspected = cluster.status === 'SUSPECTED';

          return (
            <div
              key={cluster.id}
              className={`rounded-3xl p-5 border shadow-sm space-y-3 transition-all ${
                isConfirmed
                  ? 'bg-red-50/70 border-red-300'
                  : isSuspected
                  ? 'bg-amber-50/70 border-amber-300'
                  : 'bg-blue-50/70 border-blue-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <MapPin size={16} className={isConfirmed ? 'text-red-600' : 'text-amber-600'} />
                    <h3 className="font-black text-slate-900 text-base">{cluster.village_name}</h3>
                    <span className="text-xs font-bold text-slate-500">({cluster.district})</span>
                  </div>
                  <p className="font-extrabold text-sm text-slate-800 mt-0.5">{cluster.disease_name}</p>
                </div>

                {/* Status Badge */}
                <span
                  className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
                    isConfirmed
                      ? 'bg-red-600 text-white'
                      : isSuspected
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-blue-600 text-white'
                  }`}
                >
                  {getStatusLabel(cluster.status)}
                </span>
              </div>

              {/* Advisory Message */}
              <div className="bg-white/80 rounded-2xl p-3.5 border border-slate-200/60 text-xs">
                <span className="font-bold text-slate-700 block mb-1">
                  {t('radar_advisory_label')}
                </span>
                <p className="text-slate-800 leading-relaxed font-medium">
                  {language === 'kn' ? cluster.alert_message_kannada : cluster.alert_message_english}
                </p>
              </div>

              {/* Cluster Stats & Audio Broadcast */}
              <div className="flex items-center justify-between text-xs pt-1">
                <div className="flex items-center space-x-3 text-slate-600 font-semibold">
                  <span>
                    {language === 'kn' ? 'ದಾಖಲಾದ ಪ್ರಕರಣಗಳು:' : 'Reported Cases:'}{' '}
                    <b className="text-slate-900">
                      {cluster.cases_count} {language === 'kn' ? 'ಜಾನುವಾರುಗಳು' : 'animals'}
                    </b>
                  </span>
                  <span>•</span>
                  <span>
                    {language === 'kn' ? 'ಅಪಾಯ ಮಟ್ಟ:' : 'Risk Level:'}{' '}
                    <b className="text-red-700">{cluster.risk_level}</b>
                  </span>
                </div>

                <button
                  onClick={() => handlePlayAudio(cluster)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-all ${
                    playingId === cluster.id
                      ? 'bg-emerald-600 text-white animate-pulse'
                      : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-300'
                  }`}
                >
                  <Volume2 size={14} className={playingId === cluster.id ? 'text-white' : 'text-emerald-700'} />
                  <span>{playingId === cluster.id ? (language === 'kn' ? 'ಆಲಿಸಲಾಗುತ್ತಿದೆ...' : 'Playing...') : t('radar_audio_btn')}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
