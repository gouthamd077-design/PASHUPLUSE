import React, { useState, useEffect } from 'react';
import { useTranslation } from '../i18n';
import { WifiOff, CloudAlert, RefreshCw } from 'lucide-react';
import { getPendingMutations } from '../storage/repositories';
import { runSync } from '../sync/syncManager';

export default function OfflineBanner({ isOnline }) {
  const { t } = useTranslation();
  const [pendingCount, setPendingCount] = useState(0);

  const checkPending = async () => {
    try {
      const pending = await getPendingMutations();
      setPendingCount(pending.length);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    checkPending();
    const handleDataSynced = () => checkPending();
    window.addEventListener('pashupulse:data-synced', handleDataSynced);
    const interval = setInterval(checkPending, 4000);
    return () => {
      window.removeEventListener('pashupulse:data-synced', handleDataSynced);
      clearInterval(interval);
    };
  }, []);

  if (isOnline && pendingCount === 0) {
    return null;
  }

  return (
    <div className="bg-amber-500 text-slate-900 px-4 py-2.5 text-sm font-medium shadow flex items-center justify-between border-b border-amber-600">
      <div className="flex items-center space-x-2">
        {!isOnline ? <WifiOff size={18} className="text-amber-950 flex-shrink-0" /> : <CloudAlert size={18} className="text-amber-950 flex-shrink-0" />}
        <span>
          {!isOnline
            ? t('status_offline')
            : `${pendingCount} unsynced change(s) waiting to upload.`}
        </span>
      </div>
      {isOnline && pendingCount > 0 && (
        <button
          onClick={() => runSync()}
          className="ml-3 px-3 py-1 bg-amber-900 text-white rounded text-xs font-semibold hover:bg-black touch-target flex items-center space-x-1"
        >
          <RefreshCw size={12} />
          <span>{t('sync_now')}</span>
        </button>
      )}
    </div>
  );
}
