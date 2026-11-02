import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Clock, Shield, X } from 'lucide-react';
import { apiRequest } from '../api/client';
import { useTranslation } from '../i18n';

export default function PashuFamilyModal({ isOpen, onClose, animal }) {
  if (!isOpen || !animal) return null;

  const { language, t } = useTranslation();
  const [members, setMembers] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);

  // New member form
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRole, setNewRole] = useState('CARETAKER');

  const loadFamilyData = async () => {
    try {
      const data = await apiRequest(`/family/${animal.id}`);
      setMembers(data.members || []);
      setTimeline(data.timeline || []);
    } catch (e) {
      setMembers([
        {
          id: '1',
          name: language === 'kn' ? 'ಡೇನಿಯಲ್ ಗೌಡ (ಮಾಲೀಕ)' : 'Daniel Gowda (Owner)',
          phone: '9845012345',
          role: 'OWNER',
        },
        {
          id: '2',
          name: language === 'kn' ? 'ಸುನೀತಾ ಗೌಡ (ತಾಯಿ)' : 'Sunita Gowda (Mother)',
          phone: '9845012346',
          role: 'CARETAKER',
        },
        {
          id: '3',
          name: language === 'kn' ? 'ಚೇತನ್ (ಮಗ)' : 'Chethan (Son)',
          phone: '9845012347',
          role: 'CARETAKER',
        },
      ]);
      setTimeline([
        {
          id: 't1',
          actor_name: language === 'kn' ? 'ಸುನೀತಾ ಗೌಡ' : 'Sunita Gowda',
          actor_role: 'CARETAKER',
          description:
            language === 'kn'
              ? 'ಮೆಲೋಕ್ಸಿಕಾಮ್ ಬೋಲಸ್‌ನ ಬೆಳಗಿನ ಡೋಸ್ ನೀಡಲಾಗಿದೆ ಎಂದು ದೃಢಪಡಿಸಿದರು.'
              : 'Confirmed morning dose of Meloxicam Bolus after feed.',
          created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
        },
        {
          id: 't2',
          actor_name: language === 'kn' ? 'ಡಾ. ರಮೇಶ್ ಕುಮಾರ್' : 'Dr. Ramesh Kumar',
          actor_role: 'VETERINARIAN',
          description:
            language === 'kn'
              ? 'ಪ್ರಕರಣ PP-2026-00124 ಪರಿಶೀಲಿಸಿ ಡಿಜಿಟಲ್ ಚೀಟಿ ನೀಡಿದರು.'
              : 'Case PP-2026-00124 reviewed. Diagnosis confirmed.',
          created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
        },
        {
          id: 't3',
          actor_name: language === 'kn' ? 'ಡೇನಿಯಲ್ ಗೌಡ' : 'Daniel Gowda',
          actor_role: 'OWNER',
          description:
            language === 'kn'
              ? '15 ಕೆಜಿ ಹಸಿರು ಸೈಲೇಜ್ ಮತ್ತು ಖನಿಜ ಮಿಶ್ರಣ ನೀಡಲಾಯಿತು.'
              : 'Provided 15 kg green silage and mineral mix.',
          created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
        },
      ]);
    }
  };

  useEffect(() => {
    loadFamilyData();
  }, [animal.id, language]);

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!newName || !newPhone) return;

    try {
      await apiRequest(`/family/${animal.id}/members`, {
        method: 'POST',
        body: JSON.stringify({
          name: newName,
          phone: newPhone,
          role: newRole,
        }),
      });
      setShowAddForm(false);
      setNewName('');
      setNewPhone('');
      loadFamilyData();
    } catch (err) {
      setMembers((prev) => [
        ...prev,
        { id: Date.now().toString(), name: newName, phone: newPhone, role: newRole },
      ]);
      setShowAddForm(false);
      setNewName('');
      setNewPhone('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in text-slate-800">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-indigo-500/30 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-900 to-indigo-800 p-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-700/50 flex items-center justify-center border border-indigo-400/30">
              <Users size={22} className="text-indigo-300" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight leading-tight">{t('family_title')}</h2>
              <p className="text-xs text-indigo-200">{t('family_sub')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Safety Notice */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-3.5 flex items-start space-x-2 text-indigo-950">
            <Shield size={16} className="text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">
                {language === 'kn' ? 'ಡಬಲ್-ಡೋಸ್ ತಡೆಗಟ್ಟುವಿಕೆ' : 'Duplicate Treatment Prevention'}
              </span>
              <span>{t('family_safety_desc')}</span>
            </div>
          </div>

          {/* Members List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-extrabold text-slate-800 uppercase text-[11px] tracking-wider">
                {t('family_members_count')} ({members.length})
              </h3>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center space-x-1"
              >
                <UserPlus size={14} />
                <span>{showAddForm ? t('cancel') : t('family_invite_btn')}</span>
              </button>
            </div>

            {showAddForm && (
              <form onSubmit={handleAddMember} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-4 space-y-3">
                <h4 className="font-bold text-slate-800">
                  {language === 'kn' ? 'ಹೊಸ ಆರೈಕೆದಾರರನ್ನು ಸೇರಿಸಿ' : 'Add New Family Caregiver'}
                </h4>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">
                    {language === 'kn' ? 'ಪೂರ್ಣ ಹೆಸರು' : 'Full Name'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={language === 'kn' ? 'ಉದಾ: ಸುನೀತಾ ಗೌಡ (ತಾಯಿ)' : 'e.g. Sunita Gowda (Mother)'}
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">
                    {language === 'kn' ? 'ಮೊಬೈಲ್ ಸಂಖ್ಯೆ' : 'Mobile Number'}
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="10-digit phone number"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">
                    {language === 'kn' ? 'ಪಾತ್ರದ ಅನುಮತಿ' : 'Role Permission'}
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="CARETAKER">
                      {language === 'kn' ? 'ಆರೈಕೆದಾರ (ಮೇವು & ಔಷಧಿ ದೃಢೀಕರಣ)' : 'CARETAKER (Can log feed & confirm medicines)'}
                    </option>
                    <option value="VIEWER">
                      {language === 'kn' ? 'ವೀಕ್ಷಕ (ಕೇವಲ ವೀಕ್ಷಣೆ)' : 'VIEWER (Read-only monitoring)'}
                    </option>
                    <option value="OWNER">
                      {language === 'kn' ? 'ಮಾಲೀಕ (ಸಂಪೂರ್ಣ ನಿಯಂತ್ರಣ)' : 'OWNER (Full control)'}
                    </option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full bg-indigo-700 hover:bg-indigo-800 text-white py-2.5 rounded-xl font-bold shadow"
                >
                  {t('save')}
                </button>
              </form>
            )}

            <div className="space-y-2">
              {members.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200"
                >
                  <div>
                    <span className="font-bold text-slate-900 block">{m.name}</span>
                    <span className="text-[11px] text-slate-500">{m.phone}</span>
                  </div>
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      m.role === 'OWNER'
                        ? 'bg-purple-100 text-purple-800'
                        : m.role === 'CARETAKER'
                        ? 'bg-indigo-100 text-indigo-800'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {m.role === 'OWNER' ? (language === 'kn' ? 'ಮಾಲೀಕ' : 'OWNER') : m.role === 'CARETAKER' ? (language === 'kn' ? 'ಆರೈಕೆದಾರ' : 'CARETAKER') : (language === 'kn' ? 'ವೀಕ್ಷಕ' : 'VIEWER')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Timeline */}
          <div>
            <h3 className="font-extrabold text-slate-800 uppercase text-[11px] tracking-wider mb-3 flex items-center space-x-1.5">
              <Clock size={14} className="text-indigo-600" />
              <span>{t('family_timeline_title')}</span>
            </h3>

            <div className="border-l-2 border-indigo-200 ml-3 pl-4 space-y-4">
              {timeline.map((item, idx) => (
                <div key={item.id || idx} className="relative">
                  <div className="absolute -left-[23px] top-0 w-3.5 h-3.5 rounded-full bg-indigo-600 border-2 border-white shadow-sm" />
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-slate-900">
                        {item.actor_name}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-600 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-right">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs shadow"
          >
            {t('done')}
          </button>
        </div>
      </div>
    </div>
  );
}
