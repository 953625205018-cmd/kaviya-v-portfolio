import React, { useState, useEffect } from 'react';
import { MediaUploader } from '../components/MediaUploader';
import { QuoteBanner } from '../components/QuoteBanner';
import { useAuth } from '../context/AuthContext';
import { 
  Check, 
  Edit3, 
  Save, 
  X, 
  RotateCcw, 
  Users, 
  AlertTriangle 
} from 'lucide-react';
import { getStoredMetadata, setStoredMetadata, fetchStoredNote } from '../lib/storage';

const DEFAULT_TOPIC = 'Who has contributed the most to our nation — Teachers, Politicians, Soldiers, or Scientists?';

export const GroupDiscussionPage: React.FC = () => {
  const { isOwner } = useAuth();
  // Topic state - source of truth is saved user value
  const [topic, setTopic] = useState<string>(() => {
    return getStoredMetadata<string>('groupDiscussionTopic', DEFAULT_TOPIC);
  });
  const [isEditingTopic, setIsEditingTopic] = useState(false);
  const [topicInput, setTopicInput] = useState<string>(topic);
  const [topicSavedAlert, setTopicSavedAlert] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Background cloud synchronization on mount
  useEffect(() => {
    // Load cloud topic if modified on another device
    fetchStoredNote('groupDiscussionTopic', topic).then((cloudTopic) => {
      if (cloudTopic && cloudTopic.trim() !== '') {
        setTopic(cloudTopic);
        setTopicInput(cloudTopic);
        setStoredMetadata('groupDiscussionTopic', cloudTopic);
      }
    });
  }, []);

  // Save edited topic permanently
  const handleSaveTopic = () => {
    if (!isOwner) return;
    const trimmed = topicInput.trim();
    if (!trimmed) return;
    setTopic(trimmed);
    setStoredMetadata('groupDiscussionTopic', trimmed);
    setIsEditingTopic(false);
    setTopicSavedAlert(true);
    setTimeout(() => setTopicSavedAlert(false), 3000);
  };

  // Cancel topic editing
  const handleCancelTopic = () => {
    setTopicInput(topic);
    setIsEditingTopic(false);
  };

  // Reset topic to default with confirmation
  const handleConfirmReset = () => {
    if (!isOwner) return;
    setTopic(DEFAULT_TOPIC);
    setTopicInput(DEFAULT_TOPIC);
    setStoredMetadata('groupDiscussionTopic', DEFAULT_TOPIC);
    setIsEditingTopic(false);
    setShowResetConfirm(false);
    setTopicSavedAlert(true);
    setTimeout(() => setTopicSavedAlert(false), 3000);
  };

  const learnedPoints = [
    'Learned active listening and constructive turn-taking',
    'Articulated viewpoints with logical structure and data',
    'Practiced respectful rebuttals and handling counterarguments',
    'Synthesized diverse group perspectives toward a consensus',
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-4" id="group-discussion-page">
      {/* Top Header Card */}
      <div className="rounded-xl bg-[#102A43] p-5 sm:p-6 text-white shadow-xs space-y-2">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Users className="w-7 h-7 text-sky-300 flex-shrink-0" />
            <span>Group Discussion</span>
          </h1>
          <span className="text-xs font-mono uppercase bg-white/15 px-2.5 py-1 rounded-full text-slate-200 border border-white/20">
            Interactive Lab
          </span>
        </div>
        <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
          Practice, participate and improve communication skills through Group Discussion.
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

      {/* Topic Section */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4" id="gd-topic-section">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-[#102A43] bg-[#EAF4FB] px-3 py-1 rounded-lg inline-flex items-center">
              Topic
            </h2>
            <span className="text-[11px] font-medium text-slate-500 hidden sm:inline">
              Assigned Group Discussion Subject
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isOwner && !isEditingTopic && (
              <>
                <button
                  type="button"
                  id="edit-gd-topic-btn"
                  onClick={() => {
                    setTopicInput(topic);
                    setIsEditingTopic(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#102A43] hover:bg-[#1A365D] transition-colors cursor-pointer shadow-xs"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>

                <button
                  type="button"
                  id="reset-gd-topic-btn"
                  onClick={() => setShowResetConfirm(true)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                  title="Reset to default topic"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span className="hidden sm:inline">Reset to Default</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Reset Confirmation Prompt */}
        {showResetConfirm && (
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-xs">
            <div className="flex items-center gap-2 text-amber-900 font-semibold">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>Reset Topic Confirmation</span>
            </div>
            <p className="text-amber-800 text-[11px]">
              Are you sure you want to reset this topic back to the default topic?
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-3 py-1 bg-white border border-slate-300 rounded text-slate-700 hover:bg-slate-50 transition-colors font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded font-medium transition-colors cursor-pointer"
              >
                Yes, Reset
              </button>
            </div>
          </div>
        )}

        {/* Success Alert */}
        {topicSavedAlert && (
          <div className="flex items-center gap-2 p-2.5 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg font-medium animate-in fade-in duration-150">
            <Check className="w-4 h-4 flex-shrink-0" />
            <span>Topic saved permanently. Persisted across sessions & refreshes.</span>
          </div>
        )}

        {/* Topic Content / Editing View */}
        {isEditingTopic ? (
          <div className="space-y-3 pt-1">
            <label htmlFor="gd-topic-textarea" className="block text-xs font-medium text-slate-600">
              Edit Group Discussion Topic:
            </label>
            <textarea
              id="gd-topic-textarea"
              rows={3}
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              placeholder="Enter discussion topic..."
              className="w-full text-sm font-medium text-slate-900 border-2 border-[#102A43] rounded-lg p-3 focus:outline-none bg-white leading-relaxed"
              autoFocus
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                id="save-gd-topic-btn"
                onClick={handleSaveTopic}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#102A43] hover:bg-[#1A365D] text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>
              <button
                type="button"
                id="cancel-gd-topic-btn"
                onClick={handleCancelTopic}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors cursor-pointer border border-slate-200"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-lg bg-slate-50 border border-slate-200/80 p-4 sm:p-5">
            <p className="text-base sm:text-lg font-semibold text-slate-900 leading-snug">
              {topic}
            </p>
          </div>
        )}
      </section>

      {/* Upload Group Discussion Media (Video or Photo) */}
      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold text-[#102A43] bg-[#EAF4FB] px-3 py-1 rounded-lg inline-flex items-center">
            Upload Group Discussion Media
          </h2>
        </div>
        <MediaUploader
          storageKey="group_discussion_media"
          acceptedTypes="video-or-image"
          sectionName="Group Discussion"
          uploadTitle="Upload Group Discussion (Video or Photo)"
          defaultTitle="Group Discussion Session: National Contribution Debate"
          defaultDescription="Recorded GD round or photographic evidence of classroom discussion participation."
          badgeLabel="Group Discussion"
          studioTheme="presentation-stage"
          sampleVideoUrl="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
        />
      </section>

      {/* Quote Banner */}
      <QuoteBanner
        quote="Speak with conviction, listen with respect."
      />
    </div>
  );
};
