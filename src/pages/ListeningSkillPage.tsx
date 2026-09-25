import React, { useState, useEffect } from 'react';
import { PdfUploader } from '../components/PdfUploader';
import { QuoteBanner } from '../components/QuoteBanner';
import { Check, Save } from 'lucide-react';
import { getStoredMetadata, setStoredMetadata } from '../lib/storage';
import { fetchNote, saveNote } from '../lib/api';

export const ListeningSkillPage: React.FC = () => {
  const [myLearning, setMyLearning] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const local = getStoredMetadata<string>('listening_my_learning', '');
    const fallback = local || 'Practiced identifying core technical arguments and structured note-taking while listening.';
    setMyLearning(fallback);

    // Fetch cloud saved note
    fetchNote('listening_my_learning', fallback).then((cloudContent) => {
      if (cloudContent) {
        setMyLearning(cloudContent);
        setStoredMetadata('listening_my_learning', cloudContent);
      }
    });
  }, []);

  const handleSaveLearning = async () => {
    setStoredMetadata('listening_my_learning', myLearning);
    await saveNote('listening_my_learning', myLearning);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const learnedPoints = [
    'Improved concentration',
    'Learned active listening',
    'Improved understanding',
    'Learned to identify key points',
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-4" id="listening-skill-page">
      {/* Heading & 1-2 line introduction */}
      <div className="rounded-xl bg-[#102A43] p-5 sm:p-6 text-white shadow-xs space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          My Listening Activity
        </h1>
        <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
          This activity helped me understand spoken information carefully and respond appropriately.
        </p>
      </div>

      {/* What I Learned */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-3">
        <div>
          <h2 className="text-base font-semibold text-[#102A43] bg-[#EAF4FB] px-3 py-1 rounded-lg inline-flex items-center">
            What I Learned
          </h2>
        </div>
        <ul className="space-y-2">
          {learnedPoints.map((point, index) => (
            <li key={index} className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-700">
              <span className="w-4 h-4 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-800 flex-shrink-0">
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              </span>
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Upload My Listening Activity */}
      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold text-[#102A43] bg-[#EAF4FB] px-3 py-1 rounded-lg inline-flex items-center">
            Upload My Listening Activity
          </h2>
        </div>
        <PdfUploader
          storageKey="listening_activity_pdf"
        />
      </section>

      {/* Small field: My Learning */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <label htmlFor="my-learning-input" className="text-base font-semibold text-[#102A43] bg-[#EAF4FB] px-3 py-1 rounded-lg inline-flex items-center">
            My Learning
          </label>
          <button
            type="button"
            onClick={handleSaveLearning}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-colors cursor-pointer"
          >
            {saved ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Save className="w-3.5 h-3.5" />}
            <span>{saved ? 'Saved' : 'Save Note'}</span>
          </button>
        </div>
        <textarea
          id="my-learning-input"
          value={myLearning}
          onChange={(e) => setMyLearning(e.target.value)}
          rows={3}
          placeholder="Write what you learned from this listening activity..."
          className="w-full text-sm text-slate-800 border border-slate-300 rounded-lg p-3 focus:outline-none focus:border-slate-500 bg-white leading-relaxed"
        />
      </section>

      {/* One short quote */}
      <QuoteBanner
        quote="Listen to understand."
      />
    </div>
  );
};
