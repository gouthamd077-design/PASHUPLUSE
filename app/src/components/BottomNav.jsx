import React from 'react';
import { useTranslation } from '../i18n';
import { Home, FolderHeart, Mic, Radio, Pill, Bot } from 'lucide-react';

export default function BottomNav({ activeTab, onSelectTab }) {
  const { t, language } = useTranslation();

  const tabs = [
    { id: 'home', label: t('nav_home'), icon: Home },
    { id: 'animals', label: t('nav_animals'), icon: FolderHeart },
    {
      id: 'report',
      label: language === 'kn' ? 'ವರದಿ ಮಾಡಿ' : 'Report',
      icon: Mic,
      highlight: true,
    },
    { id: 'radar', label: language === 'kn' ? 'ರೇಡಾರ್' : 'Radar', icon: Radio },
    { id: 'adherence', label: language === 'kn' ? 'ಔಷಧಿ' : 'Medicines', icon: Pill },
    { id: 'copilot', label: 'Copilot', icon: Bot },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-xl safe-bottom">
      <div className="max-w-2xl mx-auto flex items-stretch justify-around h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center transition-all ${
                isActive
                  ? 'text-emerald-800 font-bold'
                  : 'text-slate-500 hover:text-slate-700 font-medium'
              }`}
            >
              <div
                className={`p-1 rounded-xl transition-all ${
                  tab.highlight && !isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 -mt-3 p-2.5 animate-bounce'
                    : tab.highlight && isActive
                    ? 'bg-emerald-800 text-white shadow-md -mt-3 p-2.5'
                    : isActive
                    ? 'bg-emerald-50 text-emerald-800'
                    : ''
                }`}
              >
                <Icon size={tab.highlight ? 22 : 20} />
              </div>
              <span
                className={`text-[10px] leading-tight mt-0.5 tracking-tight truncate max-w-[56px] ${
                  tab.highlight ? 'font-extrabold text-emerald-900' : ''
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
