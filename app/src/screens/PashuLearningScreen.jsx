import React, { useState, useEffect } from 'react';
import { BookOpen, Volume2, CheckCircle2, XCircle, Award, Sparkles, HelpCircle } from 'lucide-react';
import { apiRequest } from '../api/client';
import { useTranslation } from '../i18n';

export default function PashuLearningScreen() {
  const { language } = useTranslation();
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeLessonId, setActiveLessonId] = useState(null);
  const [playingId, setPlayingId] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResults, setQuizResults] = useState({});

  useEffect(() => {
    async function fetchLessons() {
      try {
        const data = await apiRequest('/learning/lessons');
        setLessons(data || []);
        if (data && data.length > 0) setActiveLessonId(data[0].id);
      } catch (e) {
        // Fallback
      } finally {
        setLoading(false);
      }
    }
    fetchLessons();
  }, []);

  const handlePlayAudio = (lesson) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const text = language === 'kn' ? lesson.audio_text_kn : lesson.audio_text_en;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === 'kn' ? 'kn-IN' : 'en-IN';
      utterance.onstart = () => setPlayingId(lesson.id);
      utterance.onend = () => setPlayingId(null);
      utterance.onerror = () => setPlayingId(null);
      window.speechSynthesis.speak(utterance);
    } else {
      alert(language === 'kn' ? lesson.audio_text_kn : lesson.audio_text_en);
    }
  };

  const handleSelectQuiz = (lessonId, optionIndex, correctIndex) => {
    setQuizAnswers((prev) => ({ ...prev, [lessonId]: optionIndex }));
    setQuizResults((prev) => ({ ...prev, [lessonId]: optionIndex === correctIndex }));
  };

  return (
    <div className="space-y-6 pb-24 max-w-2xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-700 via-emerald-800 to-emerald-950 rounded-3xl p-5 text-white shadow-lg">
        <div className="flex items-center space-x-2 mb-2">
          <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
            <BookOpen size={18} className="text-white" />
          </div>
          <span className="text-xs uppercase font-extrabold tracking-wider text-amber-200">
            Explain, Don't Just Notify
          </span>
        </div>
        <h2 className="text-xl font-black leading-tight">Pashu Learning (ಪಶು ಜ್ಞಾನ)</h2>
        <p className="text-xs text-amber-100 mt-1 max-w-md">
          45-second regional audio lessons and interactive quizzes designed for dairy farmers and livestock workers.
        </p>
      </div>

      {/* Micro-lessons list */}
      <div className="space-y-5">
        {lessons.map((lesson) => {
          const title = language === 'kn' ? lesson.title_kn : lesson.title_en;
          const summary = language === 'kn' ? lesson.summary_kn : lesson.summary_en;
          const actionSteps = language === 'kn' ? lesson.action_steps_kn : lesson.action_steps_en;
          const quizQuestion = language === 'kn' ? lesson.quiz.question_kn : lesson.quiz.question_en;
          const quizOptions = language === 'kn' ? lesson.quiz.options_kn : lesson.quiz.options_en;

          const isPlaying = playingId === lesson.id;
          const selectedOption = quizAnswers[lesson.id];
          const isCorrect = quizResults[lesson.id];

          return (
            <div
              key={lesson.id}
              className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4"
            >
              {/* Card Title & Audio Button */}
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider block">
                    {lesson.category} • {lesson.duration}
                  </span>
                  <h3 className="text-base font-black text-slate-900 mt-0.5">{title}</h3>
                </div>

                <button
                  type="button"
                  onClick={() => handlePlayAudio(lesson)}
                  className={`px-3 py-2 rounded-2xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-sm ${
                    isPlaying
                      ? 'bg-red-600 text-white animate-pulse'
                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300'
                  }`}
                >
                  <Volume2 size={15} />
                  <span>{isPlaying ? 'Playing Audio...' : 'Listen in Audio'}</span>
                </button>
              </div>

              {/* Summary */}
              <p className="text-xs text-slate-700 leading-relaxed font-medium bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                {summary}
              </p>

              {/* Practical Action Steps */}
              <div className="space-y-1.5 text-xs">
                <span className="font-extrabold text-slate-800 uppercase text-[11px]">
                  What Should Farmers Do:
                </span>
                <ul className="list-disc list-inside space-y-1 text-slate-600">
                  {actionSteps.map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ul>
              </div>

              {/* Interactive Micro Quiz */}
              <div className="bg-amber-50/60 rounded-2xl p-4 border border-amber-200 space-y-2 text-xs">
                <div className="flex items-center space-x-1.5 text-amber-900 font-extrabold text-[11px] uppercase">
                  <HelpCircle size={14} className="text-amber-700" />
                  <span>Knowledge Check (20-Second Quiz)</span>
                </div>
                <p className="font-bold text-slate-800">{quizQuestion}</p>

                <div className="space-y-1.5 pt-1">
                  {quizOptions.map((opt, optIdx) => {
                    const isSelected = selectedOption === optIdx;
                    return (
                      <button
                        key={optIdx}
                        type="button"
                        onClick={() => handleSelectQuiz(lesson.id, optIdx, lesson.quiz.correct_index)}
                        className={`w-full text-left px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
                          isSelected
                            ? isCorrect
                              ? 'bg-emerald-100 border-emerald-500 text-emerald-950 font-bold'
                              : 'bg-red-100 border-red-500 text-red-950 font-bold'
                            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>

                {selectedOption !== undefined && (
                  <div className="pt-1 flex items-center space-x-1.5">
                    {isCorrect ? (
                      <div className="text-emerald-700 font-bold text-xs flex items-center space-x-1">
                        <CheckCircle2 size={14} />
                        <span>Correct! Well done!</span>
                      </div>
                    ) : (
                      <div className="text-red-700 font-bold text-xs flex items-center space-x-1">
                        <XCircle size={14} />
                        <span>Not quite right. Review the action steps above!</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
