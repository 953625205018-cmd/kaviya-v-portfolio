import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Lock, X, AlertCircle, Loader2 } from 'lucide-react';

export const OwnerLoginModal: React.FC = () => {
  const { loginModalOpen, closeLoginModal, login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (loginModalOpen) {
      setEmail('');
      setPassword('');
      setError(null);
    }
  }, [loginModalOpen]);

  if (!loginModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim()) {
      setError('Please enter your owner email address.');
      return;
    }
    if (!password.trim()) {
      setError('Password is required.');
      return;
    }

    const res = await login(email.trim(), password.trim());
    if (!res.success) {
      setError(res.error || 'Access Denied: Only the designated website owner can access administrative editing privileges.');
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeLoginModal();
      }}
    >
      <div 
        className="relative w-full max-w-md rounded-2xl bg-white p-6 sm:p-7 shadow-xl border border-slate-200 animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="owner-login-title"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={closeLoginModal}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 mb-5">
          <div className="w-10 h-10 rounded-xl bg-[#102A43] text-white flex items-center justify-center shadow-xs">
            <Lock className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 id="owner-login-title" className="text-lg font-bold text-slate-900 tracking-tight">
              Website Owner Sign In
            </h2>
            <p className="text-xs text-slate-500">
              Administrative access to edit and manage portfolio content
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2 animate-in fade-in duration-150">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">{error}</div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="owner-login-email" className="block text-xs font-semibold text-slate-700 mb-1">
              Authorized Owner Email
            </label>
            <input
              id="owner-login-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your owner email"
              className="w-full text-sm text-slate-900 px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-[#102A43] focus:ring-1 focus:ring-[#102A43] bg-white transition-all font-mono"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="owner-login-password" className="block text-xs font-semibold text-slate-700">
                Password / Passcode
              </label>
            </div>
            <input
              id="owner-login-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter owner password"
              className="w-full text-sm text-slate-900 px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-[#102A43] focus:ring-1 focus:ring-[#102A43] bg-white transition-all"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={closeLoginModal}
              disabled={isLoading}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              id="submit-owner-login-btn"
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-[#102A43] hover:bg-[#1A365D] transition-colors shadow-xs cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-sky-300" />
                  <span>Sign In as Owner</span>
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-5 pt-4 border-t border-slate-100 text-[11px] text-slate-400 leading-relaxed text-center">
          Public visitors have view-only access. Only the verified portfolio owner can edit, replace, or delete content.
        </div>
      </div>
    </div>
  );
};
