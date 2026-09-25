import React from 'react';
import { NavigationTab } from '../types';

interface TechBackgroundProps {
  currentTab: NavigationTab;
}

export const TechBackground: React.FC<TechBackgroundProps> = ({ currentTab }) => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-white">
      {/* Soft atmospheric tint depending on page */}
      <div className="absolute -top-28 -left-28 w-96 h-96 bg-sky-50/70 rounded-full blur-3xl" />
      <div className="absolute top-1/3 -right-28 w-96 h-96 bg-blue-50/60 rounded-full blur-3xl" />
      <div className="absolute -bottom-28 left-1/3 w-96 h-96 bg-slate-50/80 rounded-full blur-3xl" />

      {/* RENDER THEME-SPECIFIC BACKGROUND BASED ON CURRENT TAB */}
      {currentTab === 'home' && <HomeDeveloperBackground />}
      {currentTab === 'communication-skills' && <CommunicationSatoriBackground />}
      {currentTab === 'podcast' && <PodcastStudioBackground />}
      {currentTab === 'listening-skill' && <ListeningFocusBackground />}
      {currentTab === 'video-resume' && <VideoResumeProfileBackground />}
      {currentTab === 'mock-interview' && <MockInterviewRoomBackground />}
    </div>
  );
};

/* =========================================================================
   1. HOME: Personal Developer Theme ("Developer Introduction + Communication")
   - Clean white background, light blue digital grid, laptop outline,
   - Small </> coding symbols, subtle speech bubble, thin connection lines
   ========================================================================= */
const HomeDeveloperBackground: React.FC = () => {
  return (
    <div className="absolute inset-0">
      {/* Very light blue digital grid */}
      <div
        className="absolute inset-0 opacity-[0.045]"
        style={{
          backgroundImage: `linear-gradient(#0284c7 1px, transparent 1px), linear-gradient(90deg, #0284c7 1px, transparent 1px)`,
          backgroundSize: '36px 36px',
        }}
      />

      <svg className="absolute inset-0 w-full h-full opacity-[0.14]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="homeLineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0284c7" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
        </defs>

        {/* Thin connection lines with data nodes */}
        <path d="M 60 140 L 220 140 L 260 180 L 440 180" stroke="#0284c7" strokeWidth="1" fill="none" strokeDasharray="4 3" />
        <circle cx="60" cy="140" r="3" fill="#0284c7" />
        <circle cx="260" cy="180" r="2.5" fill="#0284c7" />
        <circle cx="440" cy="180" r="3" fill="#0f172a" />

        <path d="M 850 110 L 1020 110 L 1070 160 L 1280 160" stroke="#0284c7" strokeWidth="1" fill="none" />
        <circle cx="850" cy="110" r="3" fill="#0284c7" />
        <circle cx="1070" cy="160" r="2.5" fill="#0284c7" />
        <circle cx="1280" cy="160" r="3" fill="#0284c7" />

        {/* Laptop outline (Thin-line illustration on top right) */}
        <g transform="translate(1080, 100) scale(0.9)" stroke="#0f172a" strokeWidth="1.2" fill="none">
          {/* Screen frame */}
          <rect x="0" y="0" width="130" height="85" rx="5" />
          <rect x="7" y="7" width="116" height="71" rx="2" strokeDasharray="1 1" />
          {/* Laptop webcam */}
          <circle cx="65" cy="4" r="1.5" fill="#0f172a" />
          {/* Keyboard base */}
          <path d="M -15 85 L 145 85 L 155 96 L -25 96 Z" />
          {/* Trackpad */}
          <rect x="52" y="88" width="26" height="6" rx="1" />
          {/* Code glyph inside screen */}
          <path d="M 50 35 L 42 43 L 50 51" stroke="#0284c7" strokeWidth="1.5" />
          <path d="M 80 35 L 88 43 L 80 51" stroke="#0284c7" strokeWidth="1.5" />
          <line x1="68" y1="33" x2="62" y2="53" stroke="#0284c7" strokeWidth="1.2" />
        </g>

        {/* Subtle speech bubble (connecting developer introduction with communication) */}
        <g transform="translate(140, 480)" stroke="#0284c7" strokeWidth="1.2" fill="none">
          <path d="M 0 15 C 0 6.7 8.9 0 20 0 L 90 0 C 101 0 110 6.7 110 15 L 110 50 C 110 58.3 101 65 90 65 L 40 65 L 15 82 L 22 65 C 9.8 65 0 58.3 0 50 Z" />
          {/* Message lines inside bubble */}
          <line x1="22" y1="22" x2="88" y2="22" stroke="#0f172a" strokeWidth="1" strokeDasharray="3 3" />
          <line x1="22" y1="34" x2="72" y2="34" stroke="#0f172a" strokeWidth="1" strokeDasharray="3 3" />
          <line x1="22" y1="46" x2="55" y2="46" stroke="#0f172a" strokeWidth="1" strokeDasharray="3 3" />
        </g>

        {/* Thin interconnect line between communication bubble & code node */}
        <path d="M 250 512 C 380 512, 420 440, 520 440" stroke="#0284c7" strokeWidth="1" fill="none" strokeDasharray="4 4" />
        <circle cx="520" cy="440" r="3" fill="#0284c7" />

        {/* Floating coding symbols </> */}
        <g transform="translate(90, 280)" stroke="#0f172a" strokeWidth="1.2" fill="none">
          <path d="M 12 0 L 0 10 L 12 20" />
          <path d="M 26 0 L 38 10 L 26 20" />
          <line x1="21" y1="-2" x2="17" y2="22" />
        </g>

        <g transform="translate(980, 520)" stroke="#0284c7" strokeWidth="1.2" fill="none">
          <path d="M 10 0 L 0 8 L 10 16" />
          <path d="M 22 0 L 32 8 L 22 16" />
          <line x1="18" y1="-1" x2="14" y2="17" />
        </g>
      </svg>
    </div>
  );
};

/* =========================================================================
   2. COMMUNICATION SKILLS: Satori Talks Theme ("Speaking + Expression")
   - Soft blue speech-wave pattern, microphone outline, speech bubbles,
   - Small quotation marks, subtle sound-wave lines, very small </> symbols
   ========================================================================= */
const CommunicationSatoriBackground: React.FC = () => {
  return (
    <div className="absolute inset-0">
      <svg className="absolute inset-0 w-full h-full opacity-[0.15]" xmlns="http://www.w3.org/2000/svg">
        {/* Soft blue speech-wave patterns across background */}
        <path
          d="M 0 220 Q 180 160 360 220 T 720 220 T 1080 220 T 1440 220"
          stroke="#0284c7"
          strokeWidth="1"
          fill="none"
          strokeDasharray="5 3"
        />
        <path
          d="M 0 250 Q 200 310 400 250 T 800 250 T 1200 250 T 1600 250"
          stroke="#0ea5e9"
          strokeWidth="0.8"
          fill="none"
        />

        {/* Stage Microphone Outline (Left Side) */}
        <g transform="translate(80, 130)" stroke="#0f172a" strokeWidth="1.2" fill="none">
          {/* Mic capsule */}
          <rect x="25" y="10" width="22" height="42" rx="11" />
          <line x1="25" y1="24" x2="47" y2="24" />
          <line x1="25" y1="36" x2="47" y2="36" />
          {/* Acoustic mesh grid lines */}
          <line x1="36" y1="10" x2="36" y2="52" strokeDasharray="2 2" stroke="#0284c7" />
          {/* U-shaped mount */}
          <path d="M 18 32 C 18 56 54 56 54 32" />
          <line x1="36" y1="56" x2="36" y2="82" />
          <path d="M 20 82 L 52 82" />
          {/* Radiating sound arcs from mic */}
          <path d="M 58 20 A 18 18 0 0 1 58 44" stroke="#0284c7" strokeWidth="1" />
          <path d="M 66 14 A 28 28 0 0 1 66 50" stroke="#0284c7" strokeWidth="1" strokeDasharray="3 2" />
          <path d="M 74 8 A 38 38 0 0 1 74 56" stroke="#0284c7" strokeWidth="0.8" />
        </g>

        {/* Dual Speech Bubbles Outline (Right Side) */}
        <g transform="translate(1040, 120)" stroke="#0284c7" strokeWidth="1.2" fill="none">
          {/* Main speech bubble */}
          <path d="M 10 10 C 10 2 20 0 35 0 L 105 0 C 120 0 130 2 130 10 L 130 50 C 130 58 120 60 105 60 L 55 60 L 30 75 L 38 60 C 20 60 10 58 10 50 Z" />
          {/* Mini speech bubble behind */}
          <path d="M 90 20 L 140 20 C 152 20 160 25 160 35 L 160 65 C 160 75 152 80 140 80 L 125 80 L 115 92 L 120 80 L 100 80" stroke="#0f172a" strokeWidth="1" strokeDasharray="3 2" />
        </g>

        {/* Small quotation marks */}
        <g transform="translate(220, 480)" fill="#0284c7" opacity="0.7">
          <path d="M 0 12 C 0 5 4 0 10 0 C 15 0 18 3 18 8 C 18 15 11 20 4 22 L 2 20 C 6 18 8 15 8 12 L 0 12 Z" />
          <path d="M 16 12 C 16 5 20 0 26 0 C 31 0 34 3 34 8 C 34 15 27 20 20 22 L 18 20 C 22 18 24 15 24 12 L 16 12 Z" />
        </g>

        {/* Very small </> symbols connecting communication with tech */}
        <g transform="translate(1120, 440)" stroke="#0f172a" strokeWidth="1" fill="none">
          <path d="M 8 0 L 0 7 L 8 14" stroke="#0284c7" />
          <path d="M 18 0 L 26 7 L 18 14" stroke="#0284c7" />
          <line x1="14" y1="-1" x2="12" y2="15" />
        </g>
        <g transform="translate(420, 620)" stroke="#0284c7" strokeWidth="1" fill="none">
          <path d="M 7 0 L 0 6 L 7 12" />
          <path d="M 15 0 L 22 6 L 15 12" />
          <line x1="12" y1="-1" x2="10" y2="13" />
        </g>
      </svg>
    </div>
  );
};

/* =========================================================================
   3. PODCAST: Digital Podcast Studio Theme ("Modern Podcast Studio")
   - Circular sound waves, studio mic illustration, audio waveform,
   - Small headphones, minimal recording indicators (REC, audio levels)
   ========================================================================= */
const PodcastStudioBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 bg-slate-50/40">
      <svg className="absolute inset-0 w-full h-full opacity-[0.16]" xmlns="http://www.w3.org/2000/svg">
        {/* Soft concentric circular sound waves in the corner */}
        <g transform="translate(1180, 180)" stroke="#0284c7" strokeWidth="0.8" fill="none">
          <circle cx="0" cy="0" r="30" strokeDasharray="3 3" />
          <circle cx="0" cy="0" r="60" />
          <circle cx="0" cy="0" r="95" strokeDasharray="4 4" />
          <circle cx="0" cy="0" r="135" />
          <circle cx="0" cy="0" r="180" strokeDasharray="5 5" />
        </g>

        {/* Studio Boom Arm Microphone (Left Side) */}
        <g transform="translate(60, 120)" stroke="#0f172a" strokeWidth="1.2" fill="none">
          {/* Boom arm */}
          <line x1="0" y1="0" x2="40" y2="35" />
          <line x1="40" y1="35" x2="80" y2="35" stroke="#0284c7" />
          <circle cx="40" cy="35" r="3" fill="#0f172a" />
          {/* Pop filter ring */}
          <circle cx="95" cy="55" r="16" stroke="#0284c7" strokeWidth="1" strokeDasharray="3 2" />
          {/* Studio condenser mic */}
          <rect x="90" y="40" width="18" height="36" rx="9" />
          <line x1="90" y1="52" x2="108" y2="52" />
          {/* Shock mount elastic lines */}
          <line x1="84" y1="44" x2="114" y2="72" stroke="#0284c7" strokeWidth="0.7" />
          <line x1="114" y1="44" x2="84" y2="72" stroke="#0284c7" strokeWidth="0.7" />
        </g>

        {/* Studio Audio Waveform Visualization Lines */}
        <g transform="translate(380, 100)" stroke="#0284c7" strokeWidth="1.5" strokeLinecap="round">
          <line x1="0" y1="18" x2="0" y2="32" />
          <line x1="8" y1="10" x2="8" y2="40" />
          <line x1="16" y1="4" x2="16" y2="46" />
          <line x1="24" y1="14" x2="24" y2="36" />
          <line x1="32" y1="2" x2="32" y2="48" />
          <line x1="40" y1="8" x2="40" y2="42" />
          <line x1="48" y1="18" x2="48" y2="32" />
          <line x1="56" y1="6" x2="56" y2="44" />
          <line x1="64" y1="14" x2="64" y2="36" />
          <line x1="72" y1="20" x2="72" y2="30" />
        </g>

        {/* Small Studio Headphones Outline */}
        <g transform="translate(140, 480)" stroke="#0f172a" strokeWidth="1.2" fill="none">
          {/* Headband */}
          <path d="M 0 35 A 35 35 0 0 1 70 35" />
          {/* Earcups */}
          <rect x="-8" y="28" width="14" height="24" rx="6" fill="#ffffff" />
          <rect x="64" y="28" width="14" height="24" rx="6" fill="#ffffff" />
          <line x1="-1" y1="34" x2="-1" y2="46" stroke="#0284c7" />
          <line x1="71" y1="34" x2="71" y2="46" stroke="#0284c7" />
        </g>

        {/* Minimal Recording Studio Indicators */}
        <g transform="translate(980, 500)" stroke="#0f172a" strokeWidth="1" fill="none">
          <rect x="0" y="0" width="54" height="22" rx="3" stroke="#e11d48" />
          <circle cx="12" cy="11" r="3.5" fill="#e11d48" />
          <text x="22" y="15" fill="#e11d48" fontSize="9" fontFamily="monospace" fontWeight="bold" stroke="none">REC</text>
        </g>

        {/* Audio Level Meter Bars */}
        <g transform="translate(1060, 495)" fill="#0284c7">
          <rect x="0" y="16" width="3" height="8" rx="1" />
          <rect x="5" y="12" width="3" height="12" rx="1" />
          <rect x="10" y="8" width="3" height="16" rx="1" />
          <rect x="15" y="4" width="3" height="20" rx="1" />
          <rect x="20" y="10" width="3" height="14" rx="1" />
          <rect x="25" y="14" width="3" height="10" rx="1" />
        </g>
      </svg>
    </div>
  );
};

/* =========================================================================
   4. LISTENING SKILL: Sound & Focus Theme ("Listen • Understand • Respond")
   - Very soft sound-wave patterns, headphones outline, ear/audio icon,
   - Small flowing sound waves, subtle communication nodes
   ========================================================================= */
const ListeningFocusBackground: React.FC = () => {
  return (
    <div className="absolute inset-0">
      <svg className="absolute inset-0 w-full h-full opacity-[0.15]" xmlns="http://www.w3.org/2000/svg">
        {/* Soft harmonic sound-wave paths representing focused reception */}
        <path
          d="M 60 160 C 180 120, 260 200, 380 160 S 560 120, 680 160 S 860 200, 980 160"
          stroke="#0284c7"
          strokeWidth="1.2"
          fill="none"
        />
        <path
          d="M 60 180 C 180 140, 260 220, 380 180 S 560 140, 680 180 S 860 220, 980 180"
          stroke="#0ea5e9"
          strokeWidth="0.8"
          fill="none"
          strokeDasharray="4 3"
        />

        {/* Large Focused Over-Ear Headphones Outline (Top Left) */}
        <g transform="translate(80, 100)" stroke="#0f172a" strokeWidth="1.2" fill="none">
          <path d="M 5 50 A 42 45 0 0 1 85 50" />
          <rect x="-4" y="42" width="16" height="30" rx="7" fill="#ffffff" />
          <rect x="78" y="42" width="16" height="30" rx="7" fill="#ffffff" />
          {/* Inner focus pulse */}
          <circle cx="45" cy="50" r="8" stroke="#0284c7" strokeWidth="0.8" strokeDasharray="2 2" />
        </g>

        {/* Ear / Hearing Audio Icon Outline (Right Side) */}
        <g transform="translate(1100, 130)" stroke="#0284c7" strokeWidth="1.2" fill="none">
          {/* Ear outline */}
          <path d="M 25 10 C 10 10 0 20 0 35 C 0 52 14 62 18 72 C 21 78 26 80 32 80 C 38 80 44 75 44 68 C 44 60 36 56 30 52 C 24 48 20 42 20 35 C 20 25 28 20 36 24" />
          {/* Inflow sound waves toward ear */}
          <path d="M 48 24 A 15 15 0 0 1 48 50" strokeWidth="1" />
          <path d="M 56 16 A 25 25 0 0 1 56 58" strokeWidth="1" strokeDasharray="3 2" />
          <path d="M 64 8 A 35 35 0 0 1 64 66" strokeWidth="0.8" />
        </g>

        {/* Communication Nodes (Sender -> Listener -> Feedback loop) */}
        <g transform="translate(180, 490)">
          {/* Node 1 */}
          <circle cx="0" cy="0" r="5" fill="#0284c7" />
          <line x1="5" y1="0" x2="95" y2="0" stroke="#0284c7" strokeWidth="1" strokeDasharray="3 3" />
          {/* Node 2 - Processing */}
          <circle cx="100" cy="0" r="7" stroke="#0f172a" strokeWidth="1.2" fill="#ffffff" />
          <circle cx="100" cy="0" r="3" fill="#0284c7" />
          <line x1="107" y1="0" x2="195" y2="0" stroke="#0284c7" strokeWidth="1" />
          {/* Node 3 - Response */}
          <circle cx="200" cy="0" r="5" fill="#0f172a" />
          {/* Text labels for node concept */}
          <text x="-12" y="16" fill="#0f172a" fontSize="8" fontFamily="sans-serif">Input</text>
          <text x="82" y="18" fill="#0284c7" fontSize="8" fontFamily="sans-serif" fontWeight="bold">Focus</text>
          <text x="182" y="16" fill="#0f172a" fontSize="8" fontFamily="sans-serif">Respond</text>
        </g>

        {/* Small flowing sound waves */}
        <g transform="translate(920, 520)" stroke="#0284c7" strokeWidth="1" fill="none">
          <path d="M 0 15 Q 15 0 30 15 T 60 15 T 90 15" />
          <circle cx="95" cy="15" r="2.5" fill="#0284c7" />
        </g>
      </svg>
    </div>
  );
};

/* =========================================================================
   5. VIDEO RESUME: Professional Developer Profile Theme
   - Laptop outline, video camera icon, professional profile card,
   - Subtle code lines, small </> symbols, digital connection lines
   ========================================================================= */
const VideoResumeProfileBackground: React.FC = () => {
  return (
    <div className="absolute inset-0">
      <svg className="absolute inset-0 w-full h-full opacity-[0.15]" xmlns="http://www.w3.org/2000/svg">
        {/* Professional Profile Card Outline (Left Side) */}
        <g transform="translate(80, 110)" stroke="#0f172a" strokeWidth="1.2" fill="none">
          <rect x="0" y="0" width="115" height="145" rx="6" fill="#ffffff" />
          {/* Photo frame */}
          <circle cx="57" cy="42" r="20" stroke="#0284c7" strokeWidth="1.2" />
          <circle cx="57" cy="38" r="7" fill="#0284c7" />
          <path d="M 44 54 C 44 48 50 46 57 46 C 64 46 70 48 70 54" stroke="#0284c7" />
          {/* Name & detail line skeletons */}
          <line x1="25" y1="76" x2="90" y2="76" strokeWidth="1.5" stroke="#0f172a" />
          <line x1="32" y1="88" x2="83" y2="88" stroke="#0284c7" strokeWidth="1" />
          <line x1="20" y1="104" x2="95" y2="104" strokeDasharray="2 2" strokeWidth="0.8" />
          <line x1="20" y1="116" x2="80" y2="116" strokeDasharray="2 2" strokeWidth="0.8" />
          <line x1="20" y1="128" x2="65" y2="128" strokeDasharray="2 2" strokeWidth="0.8" />
        </g>

        {/* Video Camera Icon (Right Side) */}
        <g transform="translate(1080, 130)" stroke="#0284c7" strokeWidth="1.2" fill="none">
          {/* Camera body */}
          <rect x="0" y="6" width="62" height="42" rx="4" />
          <circle cx="31" cy="27" r="11" stroke="#0f172a" strokeWidth="1.2" />
          <circle cx="31" cy="27" r="4" fill="#0284c7" />
          {/* Lens cone */}
          <path d="M 62 18 L 84 8 L 84 46 L 62 36 Z" fill="#0284c7" fillOpacity="0.08" />
          {/* Recording indicator */}
          <circle cx="10" cy="14" r="2.5" fill="#e11d48" stroke="none" />
        </g>

        {/* Laptop Outline (Lower Right) */}
        <g transform="translate(1000, 470)" stroke="#0f172a" strokeWidth="1.2" fill="none">
          <rect x="0" y="0" width="120" height="78" rx="4" />
          <circle cx="60" cy="4" r="1.5" fill="#0284c7" />
          <path d="M -12 78 L 132 78 L 140 88 L -20 88 Z" />
          {/* Code snippet inside laptop screen */}
          <text x="12" y="24" fill="#0284c7" fontSize="8" fontFamily="monospace" stroke="none">const dev = &#123;</text>
          <text x="20" y="38" fill="#0f172a" fontSize="8" fontFamily="monospace" stroke="none">skills: &quot;IT&quot;,</text>
          <text x="20" y="52" fill="#0284c7" fontSize="8" fontFamily="monospace" stroke="none">videoResume: true</text>
          <text x="12" y="66" fill="#0284c7" fontSize="8" fontFamily="monospace" stroke="none">&#125;;</text>
        </g>

        {/* Digital connection lines */}
        <path d="M 200 180 L 340 180 L 380 230 L 520 230" stroke="#0284c7" strokeWidth="1" fill="none" strokeDasharray="4 4" />
        <circle cx="520" cy="230" r="3" fill="#0284c7" />

        {/* Small coding symbols */}
        <g transform="translate(140, 520)" stroke="#0284c7" strokeWidth="1" fill="none">
          <path d="M 8 0 L 0 7 L 8 14" />
          <path d="M 18 0 L 26 7 L 18 14" />
          <line x1="14" y1="-1" x2="12" y2="15" />
        </g>
      </svg>
    </div>
  );
};

/* =========================================================================
   6. MOCK INTERVIEW: Interview Room Theme ("Professional Interview Practice")
   - Two-person conversation illustration, small laptop, speech bubbles,
   - Question marks, subtle video-call frame, very light code symbols
   ========================================================================= */
const MockInterviewRoomBackground: React.FC = () => {
  return (
    <div className="absolute inset-0">
      <svg className="absolute inset-0 w-full h-full opacity-[0.15]" xmlns="http://www.w3.org/2000/svg">
        {/* Subtle Virtual Video-Call Frame (Top Left) */}
        <g transform="translate(60, 100)" stroke="#0f172a" strokeWidth="1.2" fill="none">
          {/* Video call window */}
          <rect x="0" y="0" width="150" height="96" rx="5" fill="#ffffff" />
          <line x1="0" y1="18" x2="150" y2="18" stroke="#0284c7" strokeWidth="0.8" />
          {/* Traffic light window controls */}
          <circle cx="10" cy="9" r="2.5" fill="#0284c7" />
          <circle cx="18" cy="9" r="2.5" fill="#94a3b8" />
          <circle cx="26" cy="9" r="2.5" fill="#94a3b8" />
          {/* Two video call tiles inside */}
          <rect x="8" y="24" width="62" height="64" rx="3" stroke="#0284c7" strokeDasharray="2 2" />
          <rect x="78" y="24" width="64" height="64" rx="3" stroke="#0f172a" />
          {/* Mini interview person silhouettes */}
          <circle cx="39" cy="46" r="8" fill="#0284c7" />
          <path d="M 23 74 C 23 62 31 58 39 58 C 47 58 55 62 55 74" stroke="#0284c7" />
          <circle cx="110" cy="46" r="8" fill="#0f172a" />
          <path d="M 94 74 C 94 62 102 58 110 58 C 118 58 126 62 126 74" stroke="#0f172a" />
        </g>

        {/* Two-person conversation outline with desk & laptop (Right Side) */}
        <g transform="translate(1000, 120)" stroke="#0f172a" strokeWidth="1.2" fill="none">
          {/* Interviewer (Left) */}
          <circle cx="30" cy="30" r="10" />
          <path d="M 12 60 C 12 46 20 44 30 44 C 40 44 48 46 48 60" />

          {/* Desk line */}
          <line x1="0" y1="65" x2="150" y2="65" strokeWidth="1.5" />

          {/* Laptop on desk */}
          <rect x="62" y="46" width="26" height="18" rx="2" stroke="#0284c7" />
          <line x1="58" y1="64" x2="92" y2="64" stroke="#0284c7" strokeWidth="1.5" />

          {/* Candidate (Right) */}
          <circle cx="120" cy="30" r="10" stroke="#0284c7" />
          <path d="M 102 60 C 102 46 110 44 120 44 C 130 44 138 46 138 60" stroke="#0284c7" />
        </g>

        {/* Speech bubbles & Question marks */}
        <g transform="translate(1045, 75)" stroke="#0284c7" strokeWidth="1" fill="none">
          <path d="M 0 5 C 0 0 6 -2 15 -2 L 35 -2 C 44 -2 50 0 50 5 L 50 20 C 50 25 44 27 35 27 L 20 27 L 10 34 L 14 27 C 5 27 0 25 0 20 Z" />
          {/* Question mark inside bubble */}
          <text x="22" y="16" fill="#0284c7" fontSize="13" fontFamily="sans-serif" fontWeight="bold" stroke="none">?</text>
        </g>

        {/* Response speech bubble */}
        <g transform="translate(1115, 85)" stroke="#0f172a" strokeWidth="1" fill="none">
          <path d="M 0 5 C 0 0 5 -2 12 -2 L 32 -2 C 39 -2 44 0 44 5 L 44 18 C 44 23 39 25 32 25 L 24 25 L 20 30 L 21 25 C 15 25 0 23 0 18 Z" strokeDasharray="2 2" />
        </g>

        {/* Floating Question marks & light code symbols */}
        <g transform="translate(160, 480)" stroke="#0284c7" strokeWidth="1" fill="none">
          <circle cx="15" cy="15" r="12" stroke="#0284c7" strokeDasharray="3 2" />
          <text x="11" y="20" fill="#0284c7" fontSize="14" fontFamily="sans-serif" fontWeight="bold" stroke="none">?</text>
        </g>

        <g transform="translate(240, 510)" stroke="#0f172a" strokeWidth="1" fill="none">
          <path d="M 7 0 L 0 6 L 7 12" />
          <path d="M 15 0 L 22 6 L 15 12" />
          <line x1="12" y1="-1" x2="10" y2="13" stroke="#0284c7" />
        </g>

        <g transform="translate(1020, 520)" stroke="#0284c7" strokeWidth="1" fill="none">
          <path d="M 8 0 L 0 7 L 8 14" stroke="#0284c7" />
          <path d="M 18 0 L 26 7 L 18 14" stroke="#0284c7" />
          <line x1="14" y1="-1" x2="12" y2="15" stroke="#0f172a" />
        </g>
      </svg>
    </div>
  );
};
