import React, { useState, useEffect } from 'react';
import {
  Building2,
  ShieldCheck,
  Radio,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import { apiRequest } from '../api/client';
import { useTranslation } from '../i18n';

export default function AdminDashboardScreen() {
  const { language, t } = useTranslation();
  const [stats, setStats] = useState({
    farmersCount: 42,
    animalsCount: 118,
    vetsCount: 5,
    clustersCount: 4,
  });
  const [vets, setVets] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [vetsRes, clustersRes] = await Promise.all([
        apiRequest('/vets'),
        apiRequest('/village-radar/clusters'),
      ]);
      setVets(vetsRes || []);
      setClusters(clustersRes?.clusters || []);
    } catch (e) {
      setVets([
        {
          id: 'v1',
          name: language === 'kn' ? 'ಡಾ. ರಮೇಶ್ ಕುಮಾರ್ ಎಂ.' : 'Dr. Ramesh Kumar M.',
          role: language === 'kn' ? 'ಹಿರಿಯ ಪಶುವೈದ್ಯಾಧಿಕಾರಿ' : 'Govt Senior Vet Officer',
          phone: '+91 98450 12345',
          district: language === 'kn' ? 'ಮಂಡ್ಯ' : 'Mandya',
          sub_district: language === 'kn' ? 'ಮಂಡ್ಯ ಕೇಂದ್ರ ಪಾಲಿಕ್ಲಿನಿಕ್' : 'Mandya Central Polyclinic',
          is_verified: true,
        },
        {
          id: 'v2',
          name: language === 'kn' ? 'ಡಾ. ಬಸವರಾಜು ಗೌಡ' : 'Dr. Basavaraju Gowda',
          role: language === 'kn' ? 'ಪಶು ಶಸ್ತ್ರಚಿಕಿತ್ಸಕರು' : 'Veterinary Surgeon',
          phone: '+91 98451 23456',
          district: language === 'kn' ? 'ಮೈಸೂರು' : 'Mysuru',
          sub_district: language === 'kn' ? 'ನಂಜನಗೂಡು ಪಾಲಿಕ್ಲಿನಿಕ್' : 'Nanjangud Polyclinic',
          is_verified: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, [language]);

  const handleToggleClusterStatus = async (clusterId, currentStatus) => {
    const nextStatus =
      currentStatus === 'SUSPECTED'
        ? 'UNDER_VERIFICATION'
        : currentStatus === 'UNDER_VERIFICATION'
        ? 'CONFIRMED'
        : 'SUSPECTED';

    try {
      await apiRequest(`/village-radar/clusters/${clusterId}/verify`, {
        method: 'POST',
        body: JSON.stringify({ status: nextStatus }),
      });
      loadAdminData();
    } catch (e) {
      setClusters((prev) =>
        prev.map((c) => (c.id === clusterId ? { ...c, status: nextStatus } : c))
      );
    }
  };

  const handleToggleVetVerification = (vetId) => {
    setVets((prev) =>
      prev.map((v) => (v.id === vetId ? { ...v, is_verified: !v.is_verified } : v))
    );
  };

  return (
    <div className="space-y-6 pb-24 max-w-4xl mx-auto animate-fade-in text-xs text-slate-800">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-3xl p-5 text-white shadow-lg flex items-center justify-between border border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
            <Building2 size={26} className="text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-black tracking-tight">{t('admin_panel_title')}</h2>
              <span className="bg-amber-400/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-400/30">
                {t('admin_oversight_badge')}
              </span>
            </div>
            <p className="text-slate-300 text-[11px]">
              {language === 'kn'
                ? 'ಜಿಲ್ಲಾ ಮಟ್ಟದ ರೋಗ ನಿಗಾ ಮತ್ತು ಪಶುವೈದ್ಯಕೀಯ ಆಡಳಿತ (ಮಂಡ್ಯ & ಮೈಸೂರು)'
                : 'District Health Surveillance & Veterinary Administration (Mysuru & Mandya)'}
            </p>
          </div>
        </div>

        <button
          onClick={loadAdminData}
          className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 transition-colors"
          title={t('sync_now')}
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
            {t('admin_farmers_count')}
          </span>
          <div className="text-2xl font-black text-slate-900 mt-1">{stats.farmersCount}</div>
          <span className="text-[10px] text-emerald-700 font-bold mt-1 block">
            {language === 'kn' ? 'ಮಂಡ್ಯ & ಮೈಸೂರು' : 'Mandya & Mysuru'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
            {t('admin_herd_count')}
          </span>
          <div className="text-2xl font-black text-slate-900 mt-1">{stats.animalsCount}</div>
          <span className="text-[10px] text-emerald-700 font-bold mt-1 block">
            {language === 'kn' ? 'ಹಸುಗಳು & ಎಮ್ಮೆಗಳು' : 'Cattle & Buffaloes'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
            {t('admin_vets_count')}
          </span>
          <div className="text-2xl font-black text-slate-900 mt-1">{stats.vetsCount}</div>
          <span className="text-[10px] text-emerald-700 font-bold mt-1 block">
            {language === 'kn' ? 'ನೋಂದಾಯಿತ ಅಧಿಕಾರಿಗಳು' : 'Licensed Officers'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
            {t('admin_clusters_count')}
          </span>
          <div className="text-2xl font-black text-amber-600 mt-1">{clusters.length || 4}</div>
          <span className="text-[10px] text-amber-700 font-bold mt-1 block">
            {language === 'kn' ? 'ಜೈವಿಕ ನಿಗಾ ವಲಯಗಳು' : 'Biosurveillance'}
          </span>
        </div>
      </div>

      {/* Outbreak Cluster Verification Manager */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <div className="flex items-center space-x-2 text-slate-900 font-extrabold text-xs uppercase tracking-wider">
            <Radio size={16} className="text-emerald-700" />
            <span>{t('admin_cluster_mgr')}</span>
          </div>
          <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
            {t('radar_synthetic_banner')}
          </span>
        </div>

        <div className="space-y-2.5">
          {clusters.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200"
            >
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-slate-900 text-sm">{c.village_name}</span>
                  <span className="text-[11px] text-slate-500">({c.district})</span>
                </div>
                <p className="text-slate-700 font-medium text-xs mt-0.5">{c.disease_name}</p>
                <p className="text-slate-400 text-[10px]">
                  {language === 'kn' ? 'ದಾಖಲಾದ ಪ್ರಕರಣಗಳು:' : 'Reported Cases:'} {c.cases_count}{' '}
                  {language === 'kn' ? 'ಜಾನುವಾರುಗಳು' : 'animals'}
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <span
                  className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase ${
                    c.status === 'CONFIRMED'
                      ? 'bg-red-600 text-white'
                      : c.status === 'SUSPECTED'
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-blue-600 text-white'
                  }`}
                >
                  {c.status}
                </span>

                <button
                  type="button"
                  onClick={() => handleToggleClusterStatus(c.id, c.status)}
                  className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-[11px] shadow-xs"
                >
                  {language === 'kn' ? 'ಸ್ಥಿತಿ ಬದಲಾಯಿಸಿ' : 'Change Status'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Veterinarian License Verification Table */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <div className="flex items-center space-x-2 text-slate-900 font-extrabold text-xs uppercase tracking-wider">
            <ShieldCheck size={16} className="text-emerald-700" />
            <span>{t('admin_verify_vets')}</span>
          </div>
          <span className="text-[10px] text-slate-400">
            {language === 'kn' ? 'ಕಟ್ಟುನಿಟ್ಟಾದ ಕ್ಲಿನಿಕಲ್ ನಿಯಮ' : 'Strict Clinical Governance'}
          </span>
        </div>

        <div className="space-y-2.5">
          {vets.map((v) => (
            <div
              key={v.id}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200"
            >
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-slate-900 text-sm">{v.name}</span>
                  <span className="text-[11px] text-slate-500">
                    ({v.district} {language === 'kn' ? 'ಪಾಲಿಕ್ಲಿನಿಕ್' : 'Polyclinic'})
                  </span>
                </div>
                <p className="text-slate-600 text-xs mt-0.5">{v.role}</p>
                <p className="text-slate-400 text-[10px] font-mono">{v.phone}</p>
              </div>

              <div className="flex items-center space-x-2">
                <span
                  className={`text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center space-x-1 ${
                    v.is_verified
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {v.is_verified ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                  <span>
                    {v.is_verified
                      ? language === 'kn'
                        ? 'ಪರಿಶೀಲಿತ ಪರವಾನಗಿ'
                        : 'Verified License'
                      : language === 'kn'
                      ? 'ಬಾಕಿ ಇದೆ'
                      : 'Pending'}
                  </span>
                </span>

                <button
                  type="button"
                  onClick={() => handleToggleVetVerification(v.id)}
                  className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-[11px]"
                >
                  {v.is_verified ? (language === 'kn' ? 'ರದ್ದುಮಾಡಿ' : 'Revoke') : (language === 'kn' ? 'ಅನುಮೋದಿಸಿ' : 'Approve')}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
