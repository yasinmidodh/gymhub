import React, { useState, useRef } from 'react';
import { StorageStats } from '../types/workout';
import { exportHubDataAsJson, importHubDataFromJson } from '../utils/storage';
import { 
  X, HardDrive, AlertTriangle, RotateCcw, Database, 
  ShieldAlert, Download, Upload, Smartphone, Laptop, 
  ArrowRight, CheckCircle2, FileJson
} from 'lucide-react';

interface StorageModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: StorageStats;
  videoCount: number;
  userCount: number;
  onResetDemo: () => void;
  onDataImported?: () => void;
}

export const StorageModal: React.FC<StorageModalProps> = ({
  isOpen,
  onClose,
  stats,
  videoCount,
  userCount,
  onResetDemo,
  onDataImported,
}) => {
  const [importStatus, setImportStatus] = useState<{ type: 'idle' | 'success' | 'error'; message: string }>({
    type: 'idle',
    message: ''
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDownloadBackup = () => {
    try {
      const json = exportHubDataAsJson();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `gymapp-backup-${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setImportStatus({
        type: 'success',
        message: 'Backup downloaded! Send this file to your phone and click "Import Backup" on your phone.'
      });
    } catch (e: any) {
      setImportStatus({
        type: 'error',
        message: `Failed to generate backup: ${e.message}`
      });
    }
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const res = importHubDataFromJson(text);
        if (res.success && res.counts) {
          setImportStatus({
            type: 'success',
            message: `Successfully imported ${res.counts.users} users, ${res.counts.videos} videos, and ${res.counts.requests} stage requests!`
          });
          if (onDataImported) onDataImported();
        } else {
          setImportStatus({
            type: 'error',
            message: res.error || 'Failed to import backup.'
          });
        }
      } catch (err: any) {
        setImportStatus({
          type: 'error',
          message: `File read error: ${err.message}`
        });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-6 z-10 space-y-5 text-slate-900 dark:text-slate-100 transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-50 dark:bg-cyan-950 border border-cyan-200 dark:border-cyan-800 text-cyan-600 dark:text-cyan-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Admin Storage & Multi-Device Sync</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Cloud synchronization and laptop-to-phone data transfer</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close storage modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cross-Device Question & Live Cloud Sync Status Banner */}
        <div className="bg-slate-50 dark:bg-[#080C14] p-4 rounded-xl border border-slate-200 dark:border-cyan-900/40 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 font-bold text-xs uppercase tracking-wider">
              <Laptop className="w-4 h-4" />
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              <Smartphone className="w-4 h-4 text-emerald-500" />
              <span>Multi-Device Sync Status</span>
            </div>
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 font-mono text-[10px] font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              CLOUD LIVE
            </span>
          </div>

          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-start gap-2.5 text-xs text-emerald-800 dark:text-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-slate-900 dark:text-white">Cloud Firestore is Live & Connected!</p>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-300/90 leading-relaxed">
                When you add workout videos, create accounts, or approve stage requests on your laptop, they are immediately broadcast to your phone and all connected athlete devices across the internet in real time.
              </p>
            </div>
          </div>

          {/* Quick Transfer / Backup Actions */}
          <div className="space-y-1 pt-1">
            <div className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold flex items-center gap-1">
              <FileJson className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>Offline Backup & Manual Transfer:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <button
                onClick={handleDownloadBackup}
                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer shadow-md shadow-cyan-500/10"
              >
                <Download className="w-4 h-4" />
                <span>Export Backup (.json)</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-bold text-xs transition-colors cursor-pointer"
              >
                <Upload className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <span>Import Backup File</span>
              </button>
              <input 
                ref={fileInputRef}
                type="file" 
                accept=".json"
                onChange={handleFileSelected}
                className="hidden" 
              />
            </div>
          </div>

          {importStatus.type !== 'idle' && (
            <div className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
              importStatus.type === 'success' 
                ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300' 
                : 'bg-red-50 dark:bg-red-950/60 border border-red-300 dark:border-red-800 text-red-800 dark:text-red-300'
            }`}>
              {importStatus.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
              )}
              <span>{importStatus.message}</span>
            </div>
          )}
        </div>

        {/* Quota Gauge */}
        <div className="bg-slate-50 dark:bg-[#080C14] p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <HardDrive className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span>Current Laptop Storage Used</span>
            </span>
            <span className="font-mono text-cyan-600 dark:text-cyan-400 font-bold tabular-nums">
              {stats.usedKb} KB / ~5,000 KB ({(stats.usedKb / 50).toFixed(1)}%)
            </span>
          </div>

          <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                stats.isNearLimit
                  ? 'bg-amber-500'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(2, (stats.usedKb / 5000) * 100))}%` }}
            />
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 dark:border-slate-800/80 text-[11px] text-slate-600 dark:text-slate-400">
            <div>Saved Workout Videos: <span className="font-semibold text-slate-900 dark:text-white font-mono">{videoCount}</span></div>
            <div>Registered Users: <span className="font-semibold text-slate-900 dark:text-white font-mono">{userCount}</span></div>
          </div>
        </div>

        {/* Storage Limits & Error Handling Explainer */}
        <div className="space-y-2 text-xs">
          <h4 className="font-bold text-slate-800 dark:text-slate-300 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span>Native Device Video Storage</span>
          </h4>
          <ul className="space-y-1 text-slate-600 dark:text-slate-400 list-disc list-inside leading-relaxed bg-slate-50 dark:bg-[#080C14]/50 p-3 rounded-lg border border-slate-200 dark:border-slate-800/60 text-[11px]">
            <li>
              <strong className="text-slate-800 dark:text-slate-200">Device Uploads (MP4/WebM):</strong> Stored safely in IndexedDB without quota bottlenecks, paired with dynamic watermarking to protect coach content.
            </li>
            <li>
              <strong className="text-slate-800 dark:text-slate-200">Cloud Sync:</strong> Athlete accounts, stage requests, calorie logs, and routine metadata are synced seamlessly through Firestore.
            </li>
          </ul>
        </div>

        {/* Actions */}
        <div className="pt-2 flex items-center justify-between border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={() => {
              if (confirm('Reset all users, workouts, and completion logs to default factory demo state?')) {
                onResetDemo();
                onClose();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Factory Demo</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
