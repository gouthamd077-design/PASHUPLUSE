import React, { useState } from 'react';
import { Bot, Send, Sparkles, AlertTriangle, ShieldCheck, User } from 'lucide-react';
import { apiRequest } from '../api/client';
import { useTranslation } from '../i18n';

export default function PashuCopilotScreen() {
  const { language } = useTranslation();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        language === 'kn'
          ? 'ನಮಸ್ಕಾರ! ನಾನು ಪಶು ಕೋಪೈಲಟ್ (AI ಸಹಾಯಕ). ಹಸು, ಎಮ್ಮೆಗಳ ಪೋಷಣೆ, ಜ್ವರ, ಮೇವು ಮತ್ತು ಲಸಿಕೆಗಳ ಬಗ್ಗೆ ನೀವು ಯಾವುದೇ ಪ್ರಶ್ನೆ ಕೇಳಬಹುದು.'
          : 'Hello! I am Pashu Copilot, your AI livestock assistant. You can ask questions about cattle feeding, fever, milk yield, or vaccination schedules.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (textToSend) => {
    const text = textToSend || input;
    if (!text.trim()) return;

    const newMsgs = [...messages, { role: 'user', content: text }];
    setMessages(newMsgs);
    setInput('');
    setLoading(true);

    try {
      const res = await apiRequest('/copilot/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: text,
          language: language === 'kn' ? 'kn' : 'en',
          history: newMsgs,
        }),
      });

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: res.reply,
          disclaimer: res.disclaimer,
        },
      ]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            language === 'kn'
              ? 'ಹಸುವಿಗೆ ಜ್ವರ ಬಂದಾಗ ನೆರಳಿನಲ್ಲಿ ಕಟ್ಟಿ ಸಾಕಷ್ಟು ಶುದ್ಧ ನೀರು ಕೊಡಿ. ತಕ್ಷಣ ಹತ್ತಿರದ ಪಶುವೈದ್ಯರನ್ನು ಸಂಪರ್ಕಿಸಿ.'
              : 'Keep the animal hydrated and shaded. If temperature is over 103°F, request a vet consultation via the Report Symptoms tab.',
          disclaimer:
            '⚠️ Note: I am an AI Assistant, not a veterinary doctor. This is advisory guidance only.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 pb-24 max-w-2xl mx-auto flex flex-col h-[calc(100vh-140px)]">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-900 to-teal-950 p-4 rounded-3xl text-white shadow-md flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/30 flex items-center justify-center border border-emerald-400/30">
            <Bot size={20} className="text-emerald-300" />
          </div>
          <div>
            <h2 className="text-base font-black tracking-tight">Pashu Copilot (AI Chat)</h2>
            <p className="text-[10px] text-emerald-200">Livestock Care & Feed Guidance Assistant</p>
          </div>
        </div>
        <span className="text-[10px] bg-emerald-800 text-emerald-200 px-2 py-0.5 rounded-full font-bold">
          Gemini Powered
        </span>
      </div>

      {/* Safety Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-2.5 text-[11px] text-amber-900 flex items-center space-x-2 shrink-0">
        <AlertTriangle size={14} className="text-amber-700 shrink-0" />
        <span>
          AI provides educational guidance only. It does not replace a veterinary doctor's diagnosis or prescription.
        </span>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 p-2">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex items-start space-x-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {m.role === 'assistant' && (
              <div className="w-7 h-7 rounded-lg bg-emerald-800 text-white flex items-center justify-center shrink-0 mt-1">
                <Bot size={15} />
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed shadow-sm ${
                m.role === 'user'
                  ? 'bg-emerald-700 text-white rounded-tr-none'
                  : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none space-y-1.5'
              }`}
            >
              <p>{m.content}</p>
              {m.disclaimer && (
                <p className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-100">
                  {m.disclaimer}
                </p>
              )}
            </div>
            {m.role === 'user' && (
              <div className="w-7 h-7 rounded-lg bg-slate-800 text-white flex items-center justify-center shrink-0 mt-1">
                <User size={15} />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center space-x-2 text-xs text-slate-400 p-2">
            <Bot size={16} className="animate-spin text-emerald-600" />
            <span>Pashu Copilot is thinking...</span>
          </div>
        )}
      </div>

      {/* Quick Prompt Chips */}
      <div className="flex space-x-2 overflow-x-auto py-1 px-1 shrink-0 text-xs scrollbar-none">
        {(language === 'kn'
          ? [
              'ಹಸುವಿಗೆ ಜ್ವರ ಬಂದರೆ ಏನು ಮಾಡಬೇಕು?',
              'ಹಾಲು ಉತ್ಪಾದನೆ ಹೆಚ್ಚಿಸಲು ಸಲಹೆ',
              'ಮೇವು ತಿನ್ನದಿರಲು ಕಾರಣಗಳೇನು?',
            ]
          : [
              'What to do if cow has high fever?',
              'How to prevent mastitis?',
              'Emergency signs for bloat',
            ]
        ).map((chip, i) => (
          <button
            key={i}
            type="button"
            onClick={() => handleSend(chip)}
            className="px-3 py-1.5 bg-white border border-slate-200 hover:border-emerald-500 rounded-full text-slate-700 font-semibold whitespace-nowrap shadow-xs"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <div className="flex items-center space-x-2 bg-white rounded-2xl p-2 border border-slate-300 shadow-sm shrink-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder={language === 'kn' ? 'ನಿಮ್ಮ ಪ್ರಶ್ನೆಯನ್ನು ಇಲ್ಲಿ ಬರೆಯಿರಿ...' : 'Type your livestock health question...'}
          className="flex-1 bg-transparent px-3 py-1.5 text-xs text-slate-900 focus:outline-none"
        />
        <button
          type="button"
          onClick={() => handleSend()}
          disabled={loading || !input.trim()}
          className="w-9 h-9 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white flex items-center justify-center disabled:opacity-40 transition-colors"
        >
          <Send size={15} />
        </button>
      </div>
    </div>
  );
}
