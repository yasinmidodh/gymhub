import React, { useState, useEffect } from 'react';
import { 
  X, Smartphone, Download, Share, CheckCircle2, 
  ExternalLink, ArrowRight, ShieldCheck, Zap, Sparkles 
} from 'lucide-react';
import { ThemeSettings, hexToRgb } from '../utils/theme';
import { triggerHaptic, playButtonClickSound, playSuccessChime } from '../utils/media';

interface InstallPwaModalProps {
  isOpen: boolean;
  onClose: () => void;
  themeSettings?: ThemeSettings;
}

export const InstallPwaModal: React.FC<InstallPwaModalProps> = ({
  isOpen,
  onClose,
  themeSettings,
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [activeTab, setActiveTab] = useState<'android' | 'ios' | 'apk'>('android');

  const isDark = themeSettings ? themeSettings.mode === 'dark' : true;
  const accentColor = themeSettings?.accentHex || '#00E5FF';
  const accentRgb = hexToRgb(accentColor);

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    triggerHaptic(30);
    playButtonClickSound();

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        playSuccessChime();
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      // Fallback: explain browser installation
      alert('To install, open your browser menu (⋮) and tap "Install app" or "Add to Home screen".');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div 
        className={`relative w-full max-w-lg rounded-2xl shadow-2xl p-5 sm:p-7 z-10 space-y-5 max-h-[92vh] overflow-y-auto border transition-colors ${
          isDark ? 'bg-[#090D16] border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-xl'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pwa-install-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shrink-0"
              style={{ 
                backgroundColor: `rgba(${accentRgb}, 0.15)`,
                border: `1px solid rgba(${accentRgb}, 0.35)`
              }}
            >
              <Smartphone className="w-5 h-5" style={{ color: accentColor }} />
            </div>
            <div>
              <h2 id="pwa-install-title" className="text-base sm:text-lg font-bold flex items-center gap-2">
                <span>Install on Phone / Mobile App</span>
                <span 
                  className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border"
                  style={{
                    color: accentColor,
                    borderColor: `rgba(${accentRgb}, 0.4)`,
                    backgroundColor: `rgba(${accentRgb}, 0.1)`
                  }}
                >
                  APK & PWA
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Run GYM App full-screen with offline video and zero browser bars
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Platform Selector Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold">
          <button
            onClick={() => {
              triggerHaptic(20);
              setActiveTab('android');
            }}
            className={`flex-1 py-2 rounded-lg transition-all cursor-pointer text-center ${
              activeTab === 'android'
                ? 'bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-sm font-bold'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            Android
          </button>
          <button
            onClick={() => {
              triggerHaptic(20);
              setActiveTab('ios');
            }}
            className={`flex-1 py-2 rounded-lg transition-all cursor-pointer text-center ${
              activeTab === 'ios'
                ? 'bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-sm font-bold'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            iPhone / iOS
          </button>
          <button
            onClick={() => {
              triggerHaptic(20);
              setActiveTab('apk');
            }}
            className={`flex-1 py-2 rounded-lg transition-all cursor-pointer text-center ${
              activeTab === 'apk'
                ? 'bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-sm font-bold'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            APK Package
          </button>
        </div>

        {/* Tab 1: Android PWA */}
        {activeTab === 'android' && (
          <div className="space-y-4">
            <div className={`p-4 rounded-xl border ${
              isDark ? 'bg-[#060910] border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white mb-1">
                <Zap className="w-4 h-4 text-emerald-400" />
                <span>1-Click Native App Installation</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Android supports direct home screen installation. The app installs as a standalone native app icon with custom splash screen and offline video streaming.
              </p>

              {isInstalled ? (
                <div className="mt-3 flex items-center gap-2 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold font-mono">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>GYM App is already installed on your device!</span>
                </div>
              ) : (
                <button
                  onClick={handleInstallClick}
                  className="mt-3 w-full py-3 px-4 rounded-xl text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95 cursor-pointer min-h-[48px]"
                  style={{ backgroundColor: accentColor }}
                >
                  <Download className="w-4 h-4" />
                  <span>Install GYM App to Android Home Screen</span>
                </button>
              )}
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400 space-y-2">
              <div className="font-semibold text-slate-700 dark:text-slate-300">Manual steps if prompt does not appear:</div>
              <ol className="list-decimal list-inside space-y-1 pl-1">
                <li>Tap the browser menu button (<strong>⋮</strong> in Chrome/Edge).</li>
                <li>Select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</li>
                <li>Tap <strong>Install</strong> to add the GYM App icon.</li>
              </ol>
            </div>
          </div>
        )}

        {/* Tab 2: iPhone / iOS PWA */}
        {activeTab === 'ios' && (
          <div className="space-y-4">
            <div className={`p-4 rounded-xl border ${
              isDark ? 'bg-[#060910] border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white mb-2">
                <Share className="w-4 h-4 text-cyan-400" />
                <span>Install on Safari (iPhone / iPad)</span>
              </div>
              <ol className="text-xs text-slate-600 dark:text-slate-300 space-y-2.5 list-decimal list-inside">
                <li>
                  Open this link in <strong>Safari</strong> on your iPhone.
                </li>
                <li>
                  Tap the <strong>Share</strong> button at the bottom of the screen:
                  <span className="inline-flex items-center mx-1 px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-mono">
                    <Share className="w-3 h-3 inline mr-1" /> Share
                  </span>
                </li>
                <li>
                  Scroll down and tap <strong>"Add to Home Screen"</strong>.
                </li>
                <li>
                  Tap <strong>"Add"</strong> in the top right corner.
                </li>
              </ol>
            </div>

            <p className="text-xs text-slate-400">
              GYM App will open in full-screen native mode without Safari browser controls!
            </p>
          </div>
        )}

        {/* Tab 3: Downloadable APK Package */}
        {activeTab === 'apk' && (
          <div className="space-y-4">
            <div className={`p-4 rounded-xl border ${
              isDark ? 'bg-[#060910] border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white mb-1">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Download APK via PWABuilder (1-Click)</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
                Since this repository contains a complete Web App Manifest, Service Worker, and icons, you can generate a signed Android APK package directly:
              </p>

              <ol className="text-xs text-slate-600 dark:text-slate-300 space-y-2 list-decimal list-inside mb-4">
                <li>Deploy this project or copy your live GitHub Pages / Vercel link.</li>
                <li>Go to <a href="https://www.pwabuilder.com" target="_blank" rel="noreferrer" className="underline font-bold" style={{ color: accentColor }}>PWABuilder.com <ExternalLink className="w-3 h-3 inline" /></a>.</li>
                <li>Paste your web link and click <strong>Start</strong>.</li>
                <li>Click <strong>Package for Android</strong> to download your ready-to-install <strong>.apk</strong> file!</li>
              </ol>

              <a
                href="https://www.pwabuilder.com"
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 px-4 rounded-xl text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-transform active:scale-95 cursor-pointer min-h-[44px]"
                style={{ backgroundColor: accentColor }}
              >
                <span>Open PWABuilder.com</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            PWA Standalone & Offline Ready
          </span>
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer min-h-[44px] ${
              isDark 
                ? 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800' 
                : 'bg-slate-100 text-slate-700 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
