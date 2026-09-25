import React, { useState } from 'react';
import { NavigationTab } from '../types';
import { useAuth } from '../context/AuthContext';
import { 
  Home, 
  MessageSquareShare, 
  Mic, 
  Headphones, 
  Video, 
  Users,
  UserCheck, 
  Menu, 
  X,
  Code2,
  ShieldCheck,
  Lock,
  LogOut
} from 'lucide-react';

interface NavbarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
}

const NAV_ITEMS: { id: NavigationTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'communication-skills', label: 'Communication Skills', icon: MessageSquareShare },
  { id: 'podcast', label: 'Podcast', icon: Mic },
  { id: 'listening-skill', label: 'Listening Skill', icon: Headphones },
  { id: 'video-resume', label: 'Video Resume', icon: Video },
  { id: 'group-discussion', label: 'Group Discussion', icon: Users },
  { id: 'mock-interview', label: 'Mock Interview', icon: UserCheck },
];

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onSelectTab }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isOwner, openLoginModal, logout } = useAuth();

  const handleNavClick = (tab: NavigationTab) => {
    onSelectTab(tab);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header 
      className="fixed top-0 left-0 right-0 z-50 border-b border-white/15 bg-[#102A43] shadow-sm"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          {/* Logo / Student Identity - strictly NO "English Communication Lab" */}
          <button 
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-3 text-left group focus:outline-none cursor-pointer shrink-0"
            id="nav-brand-button"
          >
            <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-white border border-white/20 shadow-xs transition-transform duration-200 group-hover:scale-105 shrink-0">
              <Code2 className="w-4 h-4 text-white" />
            </div>
            <div className="shrink-0">
              <div className="flex items-center gap-2 flex-nowrap shrink-0">
                <span className="font-bold text-white text-base sm:text-lg tracking-tight whitespace-nowrap shrink-0">
                  Kaviya&nbsp;V
                </span>
                <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded bg-white/15 text-white border border-white/25 font-semibold whitespace-nowrap shrink-0">
                  IT Student
                </span>
              </div>
              <p className="text-xs text-white/70 font-normal whitespace-nowrap">
                Information Technology
              </p>
            </div>
          </button>

          {/* Desktop Navigation - STRICTLY the 6 requested items */}
          <nav className="hidden lg:flex items-center gap-1.5" aria-label="Main Navigation">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-item-${item.id}`}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'text-white bg-white/20 border-b-2 border-sky-300 font-semibold shadow-xs'
                      : 'text-white/80 hover:text-white hover:bg-white/10 border-b-2 border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-white/75'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}

            {/* Desktop Owner Mode status / trigger */}
            {isOwner ? (
              <div className="flex items-center gap-1.5 pl-2 ml-1 border-l border-white/20">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-sky-400/20 text-sky-200 border border-sky-300/30">
                  <ShieldCheck className="w-3.5 h-3.5 text-sky-300" />
                  <span>Owner</span>
                </span>
                <button
                  type="button"
                  onClick={logout}
                  id="nav-owner-logout-btn"
                  title="Log out of owner account"
                  className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={openLoginModal}
                id="nav-owner-login-btn"
                title="Owner Sign In"
                className="ml-1 p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
              </button>
            )}
          </nav>

          {/* Mobile Hamburger Toggle */}
          <div className="flex items-center lg:hidden">
            <button
              id="mobile-menu-toggle-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-white/15 text-white hover:bg-white/25 border border-white/20 focus:outline-none cursor-pointer"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation - STRICTLY the 6 items */}
      {mobileMenuOpen && (
        <div 
          className="lg:hidden border-t border-white/15 bg-[#102A43] px-4 pt-3 pb-4 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150 shadow-lg"
        >
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                id={`mobile-nav-item-${item.id}`}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors text-left cursor-pointer ${
                  isActive
                    ? 'text-white bg-white/20 border-l-4 border-sky-300 font-semibold shadow-xs'
                    : 'text-white/80 hover:text-white hover:bg-white/10 border-l-4 border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-white/75'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}

          {/* Mobile Owner Trigger */}
          <div className="pt-2 border-t border-white/15">
            {isOwner ? (
              <div className="flex items-center justify-between px-3.5 py-2 rounded-lg bg-white/10 text-white text-xs">
                <span className="flex items-center gap-1.5 font-medium text-sky-200">
                  <ShieldCheck className="w-4 h-4 text-sky-300" />
                  <span>Owner Mode Active</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="text-red-300 hover:text-white underline cursor-pointer"
                >
                  Log Out
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  openLoginModal();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <Lock className="w-4 h-4 text-white/50" />
                <span>Owner Sign In</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
