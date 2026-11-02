import React, { useState, useEffect } from 'react';
import { useTranslation } from '../i18n';
import { RefreshCw, Globe, LogOut, ShieldAlert, Stethoscope, Building2, MapPin } from 'lucide-react';
import { runSync } from '../sync/syncManager';
import { detectLiveLocation } from '../services/locationService';

export default function Navbar({ onLogout, isOnline, currentRole, onSwitchRole, onTriggerSOS }) {
  const { language, setLanguage, t } = useTranslation();
  const [syncing, setSyncing] = useState(false);
  const [liveLoc, setLiveLoc] = useState({
    en: 'Mandya Taluk, Karnataka',
    kn: 'ಮಂಡ್ಯ ತಾಲ್ಲೂಕು, ಕರ್ನಾಟಕ',
  });

  useEffect(() => {
    detectLiveLocation().then((loc) => {
      setLiveLoc({
        en: loc.locationNameEn,
        kn: loc.locationNameKn,
      });
    });
  }, []);

  const handleManualSync = async () => {
    if (!isOnline || syncing) return;
    setSyncing(true);
    try {
      await runSync();
    } finally {
      setSyncing(false);
    }
  };

  return (
    <header className="bg-emerald-950 text-white shadow-md sticky top-0 z-40 border-b border-emerald-900">
      {/* Top Banner: Role Switcher & Live GPS Location */}
      <div className="bg-emerald-900/90 px-3 py-1.5 flex items-center justify-between text-xs border-b border-emerald-800">
        <div className="flex items-center space-x-2 text-emerald-200">
          <span className="font-bold uppercase tracking-wider text-[11px] hidden sm:inline">
            {t('role_mode')}
          </span>
          <div className="inline-flex rounded-lg bg-emerald-950 p-0.5 border border-emerald-800">
            <button
              onClick={() => onSwitchRole && onSwitchRole('farmer')}
              className={`px-2 py-0.5 rounded text-[11px] font-bold flex items-center space-x-1 transition-all ${
                currentRole === 'farmer' ? 'bg-emerald-600 text-white shadow-sm' : 'text-emerald-300 hover:text-white'
              }`}
            >
              <span>{t('role_farmer')}</span>
            </button>
            <button
              onClick={() => onSwitchRole && onSwitchRole('veterinarian')}
              className={`px-2 py-0.5 rounded text-[11px] font-bold flex items-center space-x-1 transition-all ${
                currentRole === 'veterinarian' ? 'bg-emerald-600 text-white shadow-sm' : 'text-emerald-300 hover:text-white'
              }`}
            >
              <Stethoscope size={11} />
              <span>{t('role_vet')}</span>
            </button>
            <button
              onClick={() => onSwitchRole && onSwitchRole('admin')}
              className={`px-2 py-0.5 rounded text-[11px] font-bold flex items-center space-x-1 transition-all ${
                currentRole === 'admin' ? 'bg-emerald-600 text-white shadow-sm' : 'text-emerald-300 hover:text-white'
              }`}
            >
              <Building2 size={11} />
              <span>{t('role_admin')}</span>
            </button>
          </div>
        </div>

        {/* SOS Quick Button for Farmer */}
        {currentRole === 'farmer' && onTriggerSOS && (
          <button
            onClick={onTriggerSOS}
            className="bg-red-600 hover:bg-red-700 text-white font-extrabold px-2.5 py-0.5 rounded-full shadow flex items-center space-x-1 text-[11px] animate-pulse"
          >
            <ShieldAlert size={12} />
            <span>{t('sos_button')}</span>
          </button>
        )}
      </div>

      {/* Main Navbar */}
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Brand & Detected Live Location */}
        <div className="flex items-center space-x-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-emerald-400 flex items-center justify-center font-black text-slate-950 text-lg shadow-sm border border-emerald-300/30">
            🐄
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h1 className="font-extrabold text-base tracking-tight leading-tight">{t('app_name')}</h1>
              {/* Live Location Pill */}
              <span className="text-[10px] bg-emerald-800 text-emerald-200 px-2 py-0.5 rounded-full font-bold flex items-center space-x-0.5 border border-emerald-700">
                <MapPin size={9} className="text-emerald-400 shrink-0" />
                <span className="truncate max-w-[130px] sm:max-w-[200px]">
                  {language === 'kn' ? liveLoc.kn : liveLoc.en}
                </span>
              </span>
            </div>
            <p className="text-[10px] text-emerald-300 font-medium hidden sm:block">
              {t('tagline')}
            </p>
          </div>
        </div>

        {/* Right Action Icons */}
        <div className="flex items-center space-x-2">
          {/* Language Selector */}
          <div className="relative inline-flex items-center text-xs bg-emerald-900 rounded-lg p-1 border border-emerald-800">
            <Globe size={13} className="text-emerald-400 mr-1 ml-0.5" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-transparent text-white text-xs font-bold focus:outline-none cursor-pointer pr-1"
            >
              <option value="kn" className="bg-slate-900 text-white">ಕನ್ನಡ</option>
              <option value="en" className="bg-slate-900 text-white">English</option>
              <option value="hi" className="bg-slate-900 text-white">हिंदी</option>
            </select>
          </div>

          {/* Sync Button */}
          {isOnline && (
            <button
              onClick={handleManualSync}
              disabled={syncing}
              title={t('sync_now')}
              className={`p-2 rounded-lg bg-emerald-900/60 hover:bg-emerald-800 text-emerald-300 hover:text-white transition-colors ${
                syncing ? 'opacity-70' : ''
              }`}
            >
              <RefreshCw size={15} className={syncing ? 'animate-spin text-emerald-400' : ''} />
            </button>
          )}

          {/* Logout */}
          {onLogout && (
            <button
              onClick={onLogout}
              title={t('logout')}
              className="p-2 rounded-lg bg-red-950/60 hover:bg-red-900 text-red-300 hover:text-white transition-colors"
            >
              <LogOut size={15} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
