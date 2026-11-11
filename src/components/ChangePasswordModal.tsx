import React, { useState } from 'react';
import { 
  X, Lock, KeyRound, Eye, EyeOff, CheckCircle2, 
  AlertCircle, ShieldCheck, ArrowRight, Sparkles 
} from 'lucide-react';
import { User } from '../types/workout';
import { ThemeSettings, hexToRgb } from '../utils/theme';
import { triggerHaptic, playButtonClickSound, playSuccessChime } from '../utils/media';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onPasswordChanged?: (newPassword: string) => void;
  onUpdatePassword: (newPass: string, currentPass?: string) => { success: boolean; user?: User; error?: string };
  themeSettings?: ThemeSettings;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onPasswordChanged,
  onUpdatePassword,
  themeSettings,
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const isDark = themeSettings ? themeSettings.mode === 'dark' : true;
  const accentColor = themeSettings?.accentHex || '#00E5FF';
  const accentRgb = hexToRgb(accentColor);

  const calculateStrength = (pass: string) => {
    if (!pass) return { score: 0, label: 'Empty', color: 'bg-slate-700' };
    if (pass.length < 3) return { score: 1, label: 'Too short', color: 'bg-red-500' };
    let score = 1;
    if (pass.length >= 6) score++;
    if (/[0-9]/.test(pass) && /[a-zA-Z]/.test(pass)) score++;
    if (/[^a-zA-Z0-9]/.test(pass) || pass.length >= 10) score++;

    switch (score) {
      case 2:
        return { score: 2, label: 'Moderate', color: 'bg-amber-400' };
      case 3:
        return { score: 3, label: 'Good', color: 'bg-cyan-400' };
      case 4:
        return { score: 4, label: 'Strong', color: 'bg-emerald-400' };
      default:
        return { score: 1, label: 'Basic', color: 'bg-yellow-500' };
    }
  };

  const strength = calculateStrength(newPassword);

  const handleReset = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setErrorMsg('');
    setSuccessMsg('');
    setIsSubmitting(false);
  };

  const handleModalClose = () => {
    handleReset();
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!currentPassword) {
      setErrorMsg('Please enter your current password.');
      triggerHaptic(50);
      return;
    }

    if (!newPassword || newPassword.trim().length < 3) {
      setErrorMsg('New password must be at least 3 characters long.');
      triggerHaptic(50);
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('The new password and confirmation password do not match.');
      triggerHaptic(50);
      return;
    }

    if (currentPassword.trim() === newPassword.trim()) {
      setErrorMsg('New password cannot be identical to the current password.');
      triggerHaptic(50);
      return;
    }

    setIsSubmitting(true);
    triggerHaptic(30);

    const result = onUpdatePassword(newPassword.trim(), currentPassword);

    if (!result.success) {
      setIsSubmitting(false);
      setErrorMsg(result.error || 'Failed to update password. Please check your current password.');
      triggerHaptic([60, 40, 80]);
    } else {
      setIsSubmitting(false);
      triggerHaptic([40, 60, 140]);
      playSuccessChime();
      setSuccessMsg('Admin password updated successfully! You can now use your new password at any time.');
      onPasswordChanged?.(newPassword.trim());

      setTimeout(() => {
        handleModalClose();
      }, 1600);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={handleModalClose} aria-hidden="true" />

      <div 
        className={`relative w-full max-w-lg rounded-2xl shadow-2xl p-6 sm:p-7 z-10 space-y-6 max-h-[92vh] overflow-y-auto border transition-colors ${
          isDark ? 'bg-[#090D16] border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-xl'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="change-password-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-transform"
              style={{ 
                backgroundColor: `rgba(${accentRgb}, 0.15)`,
                border: `1px solid rgba(${accentRgb}, 0.35)`
              }}
            >
              <KeyRound className="w-5 h-5" style={{ color: accentColor }} />
            </div>
            <div>
              <h2 id="change-password-title" className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Change Admin Password</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  Security
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Update password for <strong className="text-slate-700 dark:text-slate-200">{currentUser?.name || 'Coach Muhammad'}</strong> ({currentUser?.email || 'muhammad@gymapp.com'})
              </p>
            </div>
          </div>
          <button
            onClick={handleModalClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close password dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Security Notice */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#060910] border border-slate-200 dark:border-slate-800/80 text-xs text-slate-600 dark:text-slate-400 space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Instant Persistence Across Devices</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Your new password is immediately saved to local storage and synced to the cloud database. You can continue using this session and use the new password on future logins.
          </p>
        </div>

        {/* Error / Success Notifications */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 animate-in zoom-in-95 duration-150">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="font-semibold">{successMsg}</span>
          </div>
        )}

        {/* Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current Password */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => { setCurrentPassword(e.target.value); setErrorMsg(''); }}
                placeholder="Enter your current password (default: 123)"
                className="w-full px-3.5 py-2.5 pr-10 rounded-xl text-xs bg-slate-50 dark:bg-[#030712] border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-white transition-all font-mono"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                aria-label={showCurrent ? 'Hide current password' : 'Show current password'}
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                New Password
              </label>
              {newPassword && (
                <span className="text-[10px] font-mono text-slate-400">
                  Strength: <span className="font-bold text-slate-200">{strength.label}</span>
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); setErrorMsg(''); }}
                placeholder="Enter at least 3 characters"
                className="w-full px-3.5 py-2.5 pr-10 rounded-xl text-xs bg-slate-50 dark:bg-[#030712] border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-white transition-all font-mono"
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                aria-label={showNew ? 'Hide new password' : 'Show new password'}
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {/* Password strength bar */}
            {newPassword && (
              <div className="grid grid-cols-4 gap-1 pt-1">
                <div className={`h-1 rounded-full ${strength.score >= 1 ? strength.color : 'bg-slate-800'}`} />
                <div className={`h-1 rounded-full ${strength.score >= 2 ? strength.color : 'bg-slate-800'}`} />
                <div className={`h-1 rounded-full ${strength.score >= 3 ? strength.color : 'bg-slate-800'}`} />
                <div className={`h-1 rounded-full ${strength.score >= 4 ? strength.color : 'bg-slate-800'}`} />
              </div>
            )}
          </div>

          {/* Confirm New Password */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setErrorMsg(''); }}
                placeholder="Re-enter your new password"
                className={`w-full px-3.5 py-2.5 pr-10 rounded-xl text-xs bg-slate-50 dark:bg-[#030712] border focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-white transition-all font-mono ${
                  confirmPassword && confirmPassword !== newPassword 
                    ? 'border-red-500/50' 
                    : confirmPassword && confirmPassword === newPassword 
                    ? 'border-emerald-500/50' 
                    : 'border-slate-200 dark:border-slate-800'
                }`}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {confirmPassword && confirmPassword === newPassword && (
              <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Passwords match
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={handleModalClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-slate-950 shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:opacity-50"
              style={{ backgroundColor: accentColor }}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Saving New Password...' : 'Save New Password'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
