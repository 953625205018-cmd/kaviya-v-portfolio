import React, { useState, useEffect } from 'react';
import { upload as vercelBlobUpload } from '@vercel/blob/client';
import { NavigationTab } from '../types';
import { QuoteBanner } from '../components/QuoteBanner';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowRight, 
  Code2, 
  Globe, 
  Cpu, 
  BarChart3, 
  MessageSquareShare, 
  Terminal, 
  Camera,
  Layers,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import defaultProfileImg from '../assets/images/kaviya_profile_1788929265596.jpg';

interface HomePageProps {
  onNavigate: (tab: NavigationTab) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const { isOwner } = useAuth();
  const [profileImage, setProfileImage] = useState<string>(() => {
    return localStorage.getItem('kaviya_custom_avatar') || defaultProfileImg;
  });

  useEffect(() => {
    fetch('/api/avatar')
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data) => {
        if (data?.avatarUrl) {
          setProfileImage(data.avatarUrl);
          localStorage.setItem('kaviya_custom_avatar', data.avatarUrl);
        }
      })
      .catch(() => {});
  }, []);

  const handleCustomPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isOwner) {
      alert('Action unauthorized. Only the website owner can change the profile photo.');
      return;
    }

    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      try {
        const token = localStorage.getItem('portfolio_owner_auth_token');
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        let avatarUrl = '';

        // 1. Try Vercel Blob direct upload first
        try {
          const cleanExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase() || '.jpg';
          const blob = await vercelBlobUpload(`avatar_${Date.now()}${cleanExt}`, file, {
            access: 'public',
            handleUploadUrl: '/api/upload/blob',
            headers,
          });
          if (blob && blob.url) {
            avatarUrl = blob.url;
            await fetch('/api/avatar', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...headers,
              },
              body: JSON.stringify({ avatarUrl }),
            });
          }
        } catch (blobErr) {
          console.warn('Vercel Blob avatar direct upload fallback:', blobErr);
        }

        // 2. Fallback to standard server avatar upload
        if (!avatarUrl) {
          const formData = new FormData();
          formData.append('avatar', file);
          const res = await fetch('/api/avatar', {
            method: 'POST',
            headers,
            body: formData,
          });
          const data = await res.json();
          if (data?.avatarUrl) {
            avatarUrl = data.avatarUrl;
          }
        }

        if (avatarUrl) {
          setProfileImage(avatarUrl);
          localStorage.setItem('kaviya_custom_avatar', avatarUrl);
        }
      } catch (err) {
        console.error('Avatar upload error:', err);
        // Fallback to client reader if offline
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          setProfileImage(result);
          try {
            localStorage.setItem('kaviya_custom_avatar', result);
          } catch (storageErr) {
            console.warn('Avatar could not be stored in localStorage:', storageErr);
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const scrollToJourney = () => {
    const el = document.getElementById('my-learning-journey');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const myInterests = [
    {
      title: 'Software Engineering',
      icon: Terminal,
      description: 'System design, clean code architecture and building scalable software solutions.',
    },
    {
      title: 'Web Development',
      icon: Globe,
      description: 'Responsive, accessible web interfaces built with modern web technologies.',
    },
    {
      title: 'Python',
      icon: Code2,
      description: 'Object-oriented programming, data structures, automation and scripting.',
    },
    {
      title: 'Machine Learning',
      icon: Cpu,
      description: 'Predictive algorithms, neural patterns and intelligent data models.',
    },
    {
      title: 'Data Science',
      icon: BarChart3,
      description: 'Data analytics, statistical reasoning and extracting actionable insights.',
    },
    {
      title: 'Communication Skills',
      icon: MessageSquareShare,
      description: 'Verbal clarity, technical presentation, and articulate professional expression.',
    },
  ];

  return (
    <div className="space-y-16 pb-12">
      {/* Hero Section */}
      <section className="pt-6 sm:pt-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Heading, Subheading, Intro, and Buttons */}
          <div className="lg:col-span-7 space-y-5">
            
            {/* Tag */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-800 text-xs font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>B.Tech Information Technology</span>
              </div>
            </div>

            {/* Display Headings */}
            <div className="space-y-1.5 rounded-xl bg-[#102A43] p-5 sm:p-6 text-white shadow-xs">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
                Hello, I&apos;m Kaviya V
              </h1>
              <p className="text-lg sm:text-xl font-medium text-slate-200">
                Information Technology Student
              </p>
            </div>

            {/* Short Introduction */}
            <p className="text-base text-slate-600 leading-relaxed max-w-xl">
              I am an Information Technology student passionate about technology, software development and continuous learning. I am developing my technical knowledge along with my communication, presentation and professional skills.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                id="hero-explore-journey-btn"
                onClick={scrollToJourney}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm transition-colors cursor-pointer shadow-sm"
              >
                <span>Explore My Journey</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                id="hero-view-work-btn"
                onClick={() => onNavigate('video-resume')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white hover:bg-slate-50 text-slate-800 font-medium text-sm border border-slate-300 hover:border-slate-400 transition-colors cursor-pointer shadow-sm"
              >
                <span>View My Work</span>
                <ExternalLink className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          </div>

          {/* Right Column: Prominently Displayed Profile Photo */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative">
              
              {/* Clean profile-photo area with a subtle blue circular border */}
              <div className="relative rounded-full p-2 bg-white shadow-sm border border-sky-100 ring-4 ring-sky-50">
                
                {/* Clean circular image container with subtle blue border */}
                <div className="relative w-56 h-56 sm:w-64 sm:h-64 rounded-full overflow-hidden border-2 border-sky-300 shadow-inner bg-slate-50">
                  <img
                    src={profileImage}
                    alt="Kaviya V - Information Technology Student"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover object-center"
                  />
                </div>

                {/* Subtle photo update button for owner only */}
                {isOwner && (
                  <label
                    htmlFor="home-photo-input"
                    className="absolute bottom-2 right-2 p-2 rounded-full bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 shadow-sm cursor-pointer transition-colors"
                    title="Change photo"
                  >
                    <Camera className="w-4 h-4" />
                    <input
                      id="home-photo-input"
                      type="file"
                      accept="image/*"
                      onChange={handleCustomPhotoUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Minimal caption badge under photo */}
              <div className="mt-4 text-center">
                <div className="inline-flex items-center gap-1.5 text-xs text-slate-600 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-xs font-medium">
                  <span>Kaviya V</span>
                  <span>•</span>
                  <span>IT Student</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Quote */}
      <QuoteBanner
        quote="Learn continuously. Communicate confidently. Build creatively."
        author="Kaviya V"
        context="Personal Philosophy"
      />

      {/* My Interests Section */}
      <section className="space-y-6" id="my-interests">
        <div className="space-y-1">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#102A43] bg-[#EAF4FB] px-3.5 py-1 rounded-lg inline-flex items-center">
              My Interests
            </h2>
          </div>
          <p className="text-sm text-slate-500">
            Core domains in technology, computer engineering and professional communication.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {myInterests.map((interest, idx) => {
            const Icon = interest.icon;
            return (
              <div
                key={idx}
                id={`interest-card-${idx}`}
                className="rounded-xl border border-slate-200 bg-white p-5 hover:border-slate-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-3 mb-2.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-900">
                    {interest.title}
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {interest.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* My Learning Journey Section */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-3" id="my-learning-journey">
        <div className="flex items-center gap-2 text-slate-900">
          <Layers className="w-5 h-5 text-[#102A43]" />
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[#102A43] bg-[#EAF4FB] px-3 py-1 rounded-lg inline-flex items-center">
            My Learning Journey
          </h2>
        </div>
        <p className="text-sm sm:text-base text-slate-700 leading-relaxed max-w-3xl">
          &ldquo;My learning journey combines technical knowledge with the ability to communicate ideas clearly, confidently and creatively.&rdquo;
        </p>
      </section>
    </div>
  );
};
