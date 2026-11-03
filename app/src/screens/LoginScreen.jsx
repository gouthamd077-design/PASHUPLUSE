import React, { useState } from 'react';
import { useTranslation } from '../i18n';
import { apiRequest, setAuthToken } from '../api/client';
import { runSync } from '../sync/syncManager';
import {
  supabaseSignInWithOtp,
  supabaseVerifyOtp,
  isSupabaseConfigured,
} from '../services/supabaseClient';
import { Phone, KeyRound, CheckCircle2, AlertCircle, Sparkles, Stethoscope, Building2, User, Database } from 'lucide-react';

export default function LoginScreen({ onLoginSuccess }) {
  const { t, language } = useTranslation();
  const [phone, setPhone] = useState('9845012345');
  const [otp, setOtp] = useState('');
  const [selectedRole, setSelectedRole] = useState('farmer');
  const [step, setStep] = useState('phone'); // 'phone' | 'otp'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [devOtp, setDevOtp] = useState(null);

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isSupabaseConfigured) {
        supabaseSignInWithOtp(phone).catch((err) =>
          console.warn('Supabase Auth sign-in non-blocking note:', err)
        );
      }

      const data = await apiRequest('/auth/request-otp', {
        method: 'POST',
        body: JSON.stringify({ phone }),
      });
      setDevOtp(data.dev_otp || '1234');
      setOtp(data.dev_otp || '1234');
      setStep('otp');
    } catch (err) {
      setError(err.message || 'Failed to request OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isSupabaseConfigured) {
        supabaseVerifyOtp(phone, otp).catch((err) =>
          console.warn('Supabase Auth verify non-blocking note:', err)
        );
      }

      const data = await apiRequest('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ phone, otp, role: selectedRole }),
      });

      setAuthToken(data.access_token);
      localStorage.setItem('pashupulse_phone', data.phone);
      localStorage.setItem('pashupulse_user_id', data.user_id);
      localStorage.setItem('pashupulse_role', data.role || selectedRole);

      runSync();

      if (onLoginSuccess) {
        onLoginSuccess(data);
      }
    } catch (err) {
      setError(err.message || 'Invalid OTP code');
    } finally {
      setLoading(false);
    }
  };

  // Instant 1-Click Persona Login for Hackathon Evaluators
  const handleInstantDemoLogin = async (demoPhone, roleName, displayName) => {
    setLoading(true);
    setError(null);
    try {
      // 1. Request OTP
      const otpData = await apiRequest('/auth/request-otp', {
        method: 'POST',
        body: JSON.stringify({ phone: demoPhone }),
      });

      // 2. Verify OTP with selected persona role
      const data = await apiRequest('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({
          phone: demoPhone,
          otp: otpData.dev_otp || '1234',
          role: roleName,
        }),
      });

      // Immediately save token before making authenticated calls
      setAuthToken(data.access_token);
      localStorage.setItem('pashupulse_phone', data.phone);
      localStorage.setItem('pashupulse_user_id', data.user_id);
      localStorage.setItem('pashupulse_role', roleName);

      // 3. Set name & role with explicit authorization header
      try {
        await apiRequest('/auth/switch-role', {
          method: 'POST',
          headers: { Authorization: `Bearer ${data.access_token}` },
          body: JSON.stringify({ role: roleName, name: displayName }),
        });
      } catch (roleErr) {
        console.warn('Role switch non-critical notice:', roleErr);
      }

      runSync();

      if (onLoginSuccess) {
        onLoginSuccess({ ...data, role: roleName });
      }
    } catch (err) {
      setError('Demo sign-in failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-8 max-w-md mx-auto">
      <div className="w-full bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white p-6 text-center border-b border-emerald-800">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-400 to-teal-300 mx-auto flex items-center justify-center text-3xl mb-3 shadow-lg shadow-emerald-500/20 text-slate-950 font-black">
            🐄
          </div>
          <h2 className="text-2xl font-black tracking-tight">{t('app_name')}</h2>
          <p className="text-xs text-emerald-200 mt-1">From First Symptom to Documented Recovery</p>
          <span className="inline-block mt-2 text-[10px] bg-emerald-800/80 text-emerald-200 px-2.5 py-0.5 rounded-full font-bold">
            Pilot: Mandya & Mysuru, Karnataka
          </span>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs flex items-start space-x-2 rounded-2xl">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Demo Persona Shortcuts */}
          <div className="bg-gradient-to-b from-emerald-50/70 to-teal-50/40 p-4 rounded-2xl border border-emerald-200 space-y-2.5">
            <div className="flex items-center space-x-1.5 text-emerald-900 font-extrabold text-[11px] uppercase tracking-wider">
              <Sparkles size={14} className="text-emerald-700" />
              <span>One-Click Hackathon Evaluator Login:</span>
            </div>
            <div className="grid grid-cols-1 gap-2 text-xs">
              <button
                type="button"
                onClick={() =>
                  handleInstantDemoLogin(
                    '9845012345',
                    'farmer',
                    'Farmer Daniel Gowda (Mandya)'
                  )
                }
                className="p-2.5 rounded-xl bg-white hover:bg-emerald-50 border border-emerald-300 text-left font-bold text-slate-800 flex items-center justify-between shadow-xs transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <User size={16} className="text-emerald-700" />
                  <div>
                    <span className="block text-xs">🧑‍🌾 Farmer Daniel Gowda</span>
                    <span className="text-[10px] text-slate-500 font-normal">Mandya Dairy Farm Owner</span>
                  </div>
                </div>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-extrabold">
                  Demo
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleInstantDemoLogin(
                    '9845023456',
                    'veterinarian',
                    'Dr. Ramesh Kumar M. (Vet Officer)'
                  )
                }
                className="p-2.5 rounded-xl bg-white hover:bg-emerald-50 border border-emerald-300 text-left font-bold text-slate-800 flex items-center justify-between shadow-xs transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <Stethoscope size={16} className="text-emerald-700" />
                  <div>
                    <span className="block text-xs">🩺 Dr. Ramesh Kumar (Vet)</span>
                    <span className="text-[10px] text-slate-500 font-normal">Senior Veterinary Officer</span>
                  </div>
                </div>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-extrabold">
                  Demo
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleInstantDemoLogin(
                    '9845034567',
                    'admin',
                    'District Admin Officer (Mysuru/Mandya)'
                  )
                }
                className="p-2.5 rounded-xl bg-white hover:bg-emerald-50 border border-emerald-300 text-left font-bold text-slate-800 flex items-center justify-between shadow-xs transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <Building2 size={16} className="text-emerald-700" />
                  <div>
                    <span className="block text-xs">🏛️ District Admin Officer</span>
                    <span className="text-[10px] text-slate-500 font-normal">Biosurveillance & Oversight</span>
                  </div>
                </div>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-extrabold">
                  Demo
                </span>
              </button>
            </div>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-3 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
              Or Sign In with Phone OTP
            </span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          {/* Regular Phone OTP Step 1 */}
          {step === 'phone' ? (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  {t('phone_label')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Phone size={16} />
                  </div>
                  <input
                    type="tel"
                    required
                    placeholder={t('phone_placeholder')}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Select Role
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-3 py-2.5 text-xs font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="farmer">🧑‍🌾 Farmer / Animal Owner</option>
                  <option value="veterinarian">🩺 Registered Veterinarian</option>
                  <option value="admin">🏛️ Platform Administrator</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white py-3.5 rounded-2xl font-bold text-xs shadow-md transition-all disabled:opacity-50"
              >
                {loading ? t('loading') : t('send_otp')}
              </button>
            </form>
          ) : (
            /* Regular Phone OTP Step 2 */
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900 font-medium">
                OTP sent to {phone}. Testing code: <b className="font-mono">{devOtp || '1234'}</b>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Enter 4-Digit OTP
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <KeyRound size={16} />
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="1234"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-sm font-mono font-bold tracking-widest focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white py-3.5 rounded-2xl font-bold text-xs shadow-md transition-all disabled:opacity-50"
              >
                {loading ? t('loading') : t('verify_btn')}
              </button>

              <button
                type="button"
                onClick={() => setStep('phone')}
                className="w-full text-center text-xs text-slate-500 hover:text-slate-800 font-semibold"
              >
                {t('resend_otp')}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
