import React from 'react';
import { X, Shield, User, Award, HelpCircle, Inbox, Edit, KeyRound } from 'lucide-react';

interface InstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstructionsModal: React.FC<InstructionsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-6 sm:p-8 z-10 space-y-6 max-h-[90vh] overflow-y-auto text-slate-900 dark:text-slate-100 transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-50 dark:bg-cyan-950 border border-cyan-200 dark:border-cyan-800 text-cyan-600 dark:text-cyan-400">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white font-mono">GYM App 3-Stage Architecture</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Internal documentation for athletes & gym administration</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. Default Built-in Accounts */}
        <div className="bg-slate-50 dark:bg-[#080C14] p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">
            <KeyRound className="w-4 h-4" />
            <span>Admin Account Credentials</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-white dark:bg-[#0F172A] border border-cyan-500/30 dark:border-cyan-500/40 shadow-sm">
              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mb-1">
                <Shield className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                <span>Muhammad (Head Coach / Admin)</span>
              </div>
              <div className="text-slate-600 dark:text-slate-400 font-mono text-[11px] space-y-0.5">
                <div>Email: <strong className="text-cyan-600 dark:text-cyan-300">muhammad@gymapp.com</strong></div>
                <div>Username: <strong className="text-cyan-600 dark:text-cyan-300">muhammad</strong> (or admin)</div>
                <div>Password: <strong className="text-cyan-600 dark:text-cyan-300">123</strong></div>
                <div className="text-slate-500 pt-1 text-[10px]">Privileges: Manage video library, enroll athletes, review physique photos, gym analytics</div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800">
              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mb-1">
                <User className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                <span>Athlete Members</span>
              </div>
              <div className="text-slate-600 dark:text-slate-400 text-[11px] space-y-1">
                <div>All previous demo accounts have been deleted.</div>
                <div className="text-slate-500 text-[10px] leading-relaxed">
                  Coach Muhammad can create new athlete accounts anytime via the <strong>Create Athlete</strong> button in the Admin Dashboard. New members start in the <strong>Normal</strong> stage (1 real workout tier).
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. The Three Stages */}
        <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
          <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Award className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span>The Three Training Stages</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#080C14] border border-slate-200 dark:border-slate-800 space-y-1">
              <div className="font-bold text-slate-900 dark:text-white font-mono flex items-center justify-between">
                <span>1. Normal</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">1 real</span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                Foundation tier. All registered users start here. Access to all foundational workout routines.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#080C14] border border-slate-200 dark:border-slate-800 space-y-1">
              <div className="font-bold text-cyan-600 dark:text-cyan-300 font-mono flex items-center justify-between">
                <span>2. Extra</span>
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold">3 real</span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                Intermediate athletic volume. Unlocks both Normal and Extra tier hypertrophy routines.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#080C14] border border-slate-200 dark:border-slate-800 space-y-1">
              <div className="font-bold text-amber-600 dark:text-amber-300 font-mono flex items-center justify-between">
                <span>3. Premium</span>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">5 real</span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                Elite archive access. Unlocks every workout routine in the gym hub library.
              </p>
            </div>
          </div>
        </div>

        {/* 3. Stage Request Workflow */}
        <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-[#080C14] p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Inbox className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span>How Stage Requests Work</span>
          </h4>
          <ol className="list-decimal list-inside space-y-1.5 text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
            <li>Athletes enter the app and see their active enrolled stage (Normal by default).</li>
            <li>Athletes select <strong className="text-slate-800 dark:text-slate-200">Extra</strong> or <strong className="text-slate-800 dark:text-slate-200">Premium</strong>, enter an optional note, and submit directly to Muhammad.</li>
            <li>Muhammad receives the request in his <strong className="text-slate-900 dark:text-white font-mono">Stage Requests</strong> queue.</li>
            <li>Muhammad can click <strong className="text-emerald-600 dark:text-emerald-400 font-bold">Accept & Upgrade</strong> to immediately elevate the athlete's account, or click <strong className="text-red-500 font-bold">Reject</strong>.</li>
          </ol>
        </div>

        {/* 4. Workout Video Editing & Progress Tracking */}
        <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-[#080C14] p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Edit className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span>Video Duration, Calorie Tracking & Daily Deltas</span>
          </h4>
          <ul className="list-disc list-inside space-y-1.5 text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
            <li><strong className="text-slate-800 dark:text-slate-200">Daily Calorie Chart:</strong> Every athlete has a 7-day calorie graph displaying their daily burn and the exact day-over-day difference (e.g. +140 kcal / +22% vs yesterday) with target completion tracking.</li>
            <li><strong className="text-slate-800 dark:text-slate-200">Gym-Wide Analytics:</strong> Muhammad sees total gym calorie burn, active athlete trends, and muscle distribution across all registered members.</li>
            <li><strong className="text-slate-800 dark:text-slate-200">Theme Customization:</strong> Switch between OLED Dark and White Theme anytime, or pick custom accent colors from the palette modal.</li>
          </ul>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer shadow-md shadow-cyan-500/20"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
