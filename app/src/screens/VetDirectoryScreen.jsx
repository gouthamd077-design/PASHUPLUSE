import React, { useState, useEffect } from 'react';
import { useTranslation } from '../i18n';
import { apiRequest } from '../api/client';
import {
  PhoneCall,
  Search,
  MapPin,
  CheckCircle2,
  UserCheck,
  Stethoscope,
  Filter,
} from 'lucide-react';

const FALLBACK_VETS = [
  {
    id: 1,
    name: 'Dr. Ramesh Patel',
    role: 'Govt Veterinary Officer',
    phone: '+919825011223',
    district: 'Anand',
    specialization: 'Cattle & Buffalo Medicine, Obstetrics',
    is_verified: true,
  },
  {
    id: 2,
    name: 'Dr. Sunita Sharma',
    role: 'Veterinary Surgeon',
    phone: '+919812044556',
    district: 'Karnal',
    specialization: 'Dairy Cattle Health & Surgery',
    is_verified: true,
  },
  {
    id: 3,
    name: 'Shri Ramkripal Yadav',
    role: 'Paravet / Pashu Sakha',
    phone: '+919450077889',
    district: 'Varanasi',
    specialization: 'First Aid, Deworming & Vaccination',
    is_verified: true,
  },
  {
    id: 4,
    name: 'Dr. Aniket Deshmukh',
    role: 'Private Vet Practitioner',
    phone: '+919765433221',
    district: 'Pune',
    specialization: 'Ruminant Nutrition & Herd Health',
    is_verified: true,
  },
];

export default function VetDirectoryScreen() {
  const { t } = useTranslation();
  const [vets, setVets] = useState(FALLBACK_VETS);
  const [districts, setDistricts] = useState(['All Districts', 'Anand', 'Karnal', 'Varanasi', 'Pune', 'Jaipur']);
  const [selectedDistrict, setSelectedDistrict] = useState('All Districts');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchVets() {
      if (!navigator.onLine) return;
      setLoading(true);
      try {
        const vetsData = await apiRequest('/vets');
        if (Array.isArray(vetsData) && vetsData.length > 0) {
          setVets(vetsData);
        }
        const dists = await apiRequest('/vets/districts');
        if (Array.isArray(dists) && dists.length > 0) {
          setDistricts(['All Districts', ...dists]);
        }
      } catch (e) {
        console.warn('Could not fetch vets from server, using fallback directory:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchVets();
  }, []);

  const filteredVets = vets.filter((v) => {
    const matchesDistrict =
      selectedDistrict === 'All Districts' ||
      v.district?.toLowerCase() === selectedDistrict.toLowerCase();

    const matchesSearch =
      !search ||
      v.name?.toLowerCase().includes(search.toLowerCase()) ||
      v.specialization?.toLowerCase().includes(search.toLowerCase()) ||
      v.role?.toLowerCase().includes(search.toLowerCase());

    return matchesDistrict && matchesSearch;
  });

  return (
    <div className="space-y-4 pb-24 max-w-xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
          <Stethoscope className="text-brand-600" />
          <span>{t('vets_title')}</span>
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">{t('vets_subtitle')}</p>
      </div>

      {/* Filters: District & Search */}
      <div className="space-y-2 bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative">
          <Search size={18} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('search_vets')}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex items-center space-x-2">
          <MapPin size={16} className="text-slate-400 flex-shrink-0" />
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700"
          >
            {districts.map((d) => (
              <option key={d} value={d}>
                {d === 'All Districts' ? t('all_districts') : d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Vet Cards */}
      {filteredVets.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500">
          <UserCheck size={36} className="mx-auto text-slate-300 mb-2" />
          <p className="text-sm font-medium">{t('no_vets')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredVets.map((v) => (
            <div
              key={v.id}
              className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-brand-500 transition-all"
            >
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-extrabold text-slate-900 text-base">{v.name}</h3>
                  {v.is_verified && (
                    <span className="flex items-center space-x-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircle2 size={12} className="text-emerald-600" />
                      <span>{t('verified_officer')}</span>
                    </span>
                  )}
                </div>
                <div className="text-xs font-semibold text-brand-700 mt-0.5">{v.role}</div>
                {v.specialization && (
                  <div className="text-xs text-slate-600 mt-1">{v.specialization}</div>
                )}
                <div className="flex items-center space-x-1 text-xs text-slate-400 mt-1.5">
                  <MapPin size={13} />
                  <span>District: {v.district}</span>
                </div>
              </div>

              {/* Direct Call Button (tel:) */}
              <a
                href={`tel:${v.phone.replace(/\s+/g, '')}`}
                className="w-full sm:w-auto px-5 py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold rounded-xl shadow touch-target flex items-center justify-center space-x-2 text-sm transition-transform active:scale-95"
              >
                <PhoneCall size={18} />
                <span>{t('call_doctor')}</span>
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
