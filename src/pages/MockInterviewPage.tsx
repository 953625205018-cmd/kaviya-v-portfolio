import React, { useState, useEffect } from 'react';
import { MediaUploader } from '../components/MediaUploader';
import { QuoteBanner } from '../components/QuoteBanner';
import { Check, Save } from 'lucide-react';
import { getStoredMetadata, setStoredMetadata } from '../lib/storage';
import { fetchNote, saveNote } from '../lib/api';

export const MockInterviewPage: React.FC = () => {
  const [reflection, setReflection] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const local = getStoredMetadata<string>('mock_interview_reflection', '');
    const fallback = local || 'Focused on clear structured answers using the STAR method, maintaining eye contact, and presenting technical problem-solving approaches with calm confidence.';
    setReflection(fallback);

    // Fetch cloud saved note
    fetchNote('mock_interview_reflection', fallback).then((cloudContent) => {
      if (cloudContent) {
        setReflection(cloudContent);
        setStoredMetadata('mock_interview_reflection', cloudContent);
      }
    });
  }, []);

  const handleSaveReflection = async () => {
    setStoredMetadata('mock_interview_reflection', reflection);
    await saveNote('mock_interview_reflection', reflection);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const learnedPoints = [
    'Improved interview confidence',
    'Learned how to answer questions',
    'Improved body language',
    'Learned professional communication',
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-4" id="mock-interview-page">
      {/* Heading & 1-2 line introduction */}
      <div className="rounded-xl bg-[#102A43] p-5 sm:p-6 text-white shadow-xs space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          My Mock Interview
        </h1>
        <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
          The mock interview helped me understand how to communicate professionally and respond confidently during an interview.
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

      {/* Upload My Mock Interview */}
      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold text-[#102A43] bg-[#EAF4FB] px-3 py-1 rounded-lg inline-flex items-center">
            Upload My Mock Interview
          </h2>
        </div>
        <MediaUploader
          storageKey="mock_interview_video"
          acceptedTypes="video"
          sectionName="Mock Interview"
          uploadTitle="Upload My Mock Interview Video"
          defaultTitle="Technical & HR Mock Interview Session"
          defaultDescription="Simulation of technical and behavioral interview questions."
          badgeLabel="Mock Interview"
          studioTheme="interview-room"
          sampleVideoUrl="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
        />
      </section>

      {/* Small section: My Reflection */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-[#102A43] bg-[#EAF4FB] px-3 py-1 rounded-lg inline-flex items-center">
            My Reflection
          </h2>
          <button
            type="button"
            onClick={handleSaveReflection}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-colors cursor-pointer"
          >
            {saved ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Save className="w-3.5 h-3.5" />}
            <span>{saved ? 'Saved' : 'Save Reflection'}</span>
          </button>
        </div>
        <textarea
          id="mock-reflection-input"
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
          rows={3}
          placeholder="Write your reflection on the mock interview performance..."
          className="w-full text-sm text-slate-800 border border-slate-300 rounded-lg p-3 focus:outline-none focus:border-slate-500 bg-white leading-relaxed"
        />
      </section>

      {/* One short quote */}
      <QuoteBanner
        quote="Practice builds confidence."
      />
    </div>
  );
};
