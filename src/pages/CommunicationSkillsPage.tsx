import React from 'react';
import { MediaUploader } from '../components/MediaUploader';
import { QuoteBanner } from '../components/QuoteBanner';
import { Check } from 'lucide-react';

export const CommunicationSkillsPage: React.FC = () => {
  const learnedPoints = [
    'Improved speaking confidence',
    'Learned to express ideas clearly',
    'Improved presentation skills',
    'Learned to organize my thoughts',
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-4" id="communication-skills-page">
      {/* Heading & 1-2 line introduction */}
      <div className="rounded-xl bg-[#102A43] p-5 sm:p-6 text-white shadow-xs space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Explore My Satori Talks
        </h1>
        <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
          Through Satori Talks, I learned to express my thoughts clearly, speak with confidence and communicate ideas effectively.
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

      {/* Upload My Satori Talk */}
      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold text-[#102A43] bg-[#EAF4FB] px-3 py-1 rounded-lg inline-flex items-center">
            Upload My Satori Talk
          </h2>
        </div>
        <MediaUploader
          storageKey="satori_talk_video"
          acceptedTypes="video-or-image"
          uploadTitle="Upload My Satori Talk (Video or Photo)"
          sectionName="Communication Skills"
          defaultTitle="My Satori Talk: Technical Communication in Software Engineering"
          defaultDescription="Recorded Satori Talk presentation session or photo."
          badgeLabel="Satori Talk"
          studioTheme="presentation-stage"
          sampleVideoUrl="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
        />
      </section>

      {/* One short quote */}
      <QuoteBanner
        quote="Speak clearly. Share confidently."
      />
    </div>
  );
};
