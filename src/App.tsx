/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { NavigationTab } from './types';
import { TechBackground } from './components/TechBackground';
import { Navbar } from './components/Navbar';
import { HomePage } from './pages/HomePage';
import { CommunicationSkillsPage } from './pages/CommunicationSkillsPage';
import { PodcastPage } from './pages/PodcastPage';
import { ListeningSkillPage } from './pages/ListeningSkillPage';
import { VideoResumePage } from './pages/VideoResumePage';
import { GroupDiscussionPage } from './pages/GroupDiscussionPage';
import { MockInterviewPage } from './pages/MockInterviewPage';
import { Code2, ShieldCheck, Lock, LogOut } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { OwnerLoginModal } from './components/OwnerLoginModal';

function AppContent() {
  const [currentTab, setCurrentTab] = useState<NavigationTab>('home');
  const { isOwner, openLoginModal, logout } = useAuth();

  const handleNavigate = (tab: NavigationTab) => {
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderCurrentPage = () => {
    switch (currentTab) {
      case 'home':
        return <HomePage onNavigate={handleNavigate} />;
      case 'communication-skills':
        return <CommunicationSkillsPage />;
      case 'podcast':
        return <PodcastPage />;
      case 'listening-skill':
        return <ListeningSkillPage />;
      case 'video-resume':
        return <VideoResumePage />;
      case 'group-discussion':
        return <GroupDiscussionPage />;
      case 'mock-interview':
        return <MockInterviewPage />;
      default:
        return <HomePage onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="relative min-h-screen bg-white text-slate-900 flex flex-col font-sans selection:bg-slate-200 selection:text-slate-900">
      {/* Subtle modern software engineering background on pure white canvas */}
      <TechBackground currentTab={currentTab} />

      {/* Fixed Navigation Bar - Strictly the 6 requested items */}
      <Navbar currentTab={currentTab} onSelectTab={setCurrentTab} />

      {/* Main Content Area */}
      <main className="relative z-10 flex-grow max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        {renderCurrentPage()}
      </main>

      {/* Clean, Professional Footer */}
      <footer className="relative z-10 border-t border-slate-200 bg-white py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
              <Code2 className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold text-slate-800">
              Kaviya V
            </span>
            <span>•</span>
            <span>Information Technology Student</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="font-mono text-slate-400">
              B.Tech IT • 2nd Year
            </div>

            {/* Owner Access Status / Trigger */}
            <div className="border-l border-slate-200 pl-4">
              {isOwner ? (
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-sky-800 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-full">
                    <ShieldCheck className="w-3 h-3 text-sky-600" />
                    <span>Owner Mode</span>
                  </span>
                  <button
                    type="button"
                    onClick={logout}
                    id="footer-owner-logout-btn"
                    className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-red-600 transition-colors cursor-pointer"
                    title="Log out of owner account"
                  >
                    <LogOut className="w-3 h-3" />
                    <span>Log Out</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={openLoginModal}
                  id="footer-owner-login-btn"
                  className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                  title="Owner Authentication"
                >
                  <Lock className="w-3 h-3 text-slate-400" />
                  <span>Owner Sign In</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </footer>

      {/* Owner Login Modal */}
      <OwnerLoginModal />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
