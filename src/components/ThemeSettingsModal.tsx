import React, { useState } from 'react';
import { 
  X, Sun, Moon, Palette, Sliders, Check, 
  Sparkles, RefreshCw, Layout, ShieldCheck, Eye
} from 'lucide-react';
import { 
  ThemeSettings, 
  ACCENT_PRESETS, 
  DEFAULT_THEME_SETTINGS, 
  saveThemeSettings, 
  saveGlobalGymAccent,
  hexToRgb 
} from '../utils/theme';
import { triggerHaptic } from '../utils/media';

interface ThemeSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ThemeSettings;
  onUpdateSettings: (newSettings: ThemeSettings) => void;
  isAdmin: boolean;
}

export const ThemeSettingsModal: React.FC<ThemeSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  isAdmin,
}) => {
  const [localSettings, setLocalSettings] = useState<ThemeSettings>(settings);
  const [customHex, setCustomHex] = useState(settings.accentHex);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState('');

  if (!isOpen) return null;

  const handleSelectPreset = (preset: typeof ACCENT_PRESETS[0]) => {
    triggerHaptic(25);
    const updated = {
      ...localSettings,
      accentHex: preset.hex,
      accentName: preset.name,
    };
    setLocalSettings(updated);
    setCustomHex(preset.hex);
    onUpdateSettings(updated);
  };

  const handleCustomHexChange = (hex: string) => {
    setCustomHex(hex);
    if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
      triggerHaptic(20);
      const updated = {
        ...localSettings,
        accentHex: hex,
        accentName: 'Custom Palette',
      };
      setLocalSettings(updated);
      onUpdateSettings(updated);
    }
  };

  const handleToggleMode = (mode: 'dark' | 'light') => {
    triggerHaptic(30);
    const updated = {
      ...localSettings,
      mode,
    };
    setLocalSettings(updated);
    onUpdateSettings(updated);
  };

  const handleSetGlobalDefault = () => {
    triggerHaptic([50, 50, 100]);
    saveGlobalGymAccent(localSettings.accentHex);
    setSaveSuccessMessage('Broadcasted as official global gym brand accent!');
    setTimeout(() => setSaveSuccessMessage(''), 2500);
  };

  const handleResetDefaults = () => {
    triggerHaptic(30);
    setLocalSettings(DEFAULT_THEME_SETTINGS);
    setCustomHex(DEFAULT_THEME_SETTINGS.accentHex);
    onUpdateSettings(DEFAULT_THEME_SETTINGS);
  };

  const isDark = localSettings.mode === 'dark';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div className={`relative w-full max-w-xl rounded-2xl shadow-2xl p-6 sm:p-7 z-10 space-y-6 max-h-[92vh] overflow-y-auto border transition-colors ${
        isDark 
          ? 'bg-[#090D16] border-slate-800 text-slate-100' 
          : 'bg-white border-slate-200 text-slate-900 shadow-xl'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between border-b pb-4 ${
          isDark ? 'border-slate-800' : 'border-slate-200'
        }`}>
          <div className="flex items-center gap-3">
            <div 
              className="p-2.5 rounded-xl text-black font-bold shadow-md"
              style={{ backgroundColor: localSettings.accentHex }}
            >
              <Palette className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold tracking-tight">
                UI & Visual Theme Settings
              </h3>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Customize appearance, theme contrast, and athletic brand color
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {saveSuccessMessage && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{saveSuccessMessage}</span>
          </div>
        )}

        {/* 1. Dark vs White Theme Mode Toggle */}
        <div className="space-y-2.5">
          <label className={`block text-xs font-bold uppercase tracking-wider ${
            isDark ? 'text-slate-300' : 'text-slate-700'
          }`}>
            Display Mode
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleToggleMode('dark')}
              className={`p-3.5 rounded-xl border flex items-center justify-center gap-2.5 text-xs font-bold transition-all cursor-pointer ${
                isDark
                  ? 'border-cyan-400 bg-slate-900 text-white shadow-md'
                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Moon className="w-4 h-4 text-cyan-400" />
              <span>Dark Theme (True OLED)</span>
              {isDark && <Check className="w-3.5 h-3.5 ml-1 text-cyan-400" />}
            </button>

            <button
              type="button"
              onClick={() => handleToggleMode('light')}
              className={`p-3.5 rounded-xl border flex items-center justify-center gap-2.5 text-xs font-bold transition-all cursor-pointer ${
                !isDark
                  ? 'border-slate-900 bg-white text-slate-950 shadow-md ring-2 ring-slate-900/10'
                  : 'border-slate-800 bg-[#000000] text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Sun className="w-4 h-4 text-amber-500" />
              <span>White Theme (Clean Light)</span>
              {!isDark && <Check className="w-3.5 h-3.5 ml-1 text-slate-900" />}
            </button>
          </div>
        </div>

        {/* 2. Curated Athletic Accent Color Swatches */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className={`block text-xs font-bold uppercase tracking-wider ${
              isDark ? 'text-slate-300' : 'text-slate-700'
            }`}>
              Brand Accent Palette
            </label>
            <span className="text-xs font-mono font-bold" style={{ color: localSettings.accentHex }}>
              {localSettings.accentName} ({localSettings.accentHex})
            </span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
            {ACCENT_PRESETS.map((preset) => {
              const isSelected = localSettings.accentHex.toLowerCase() === preset.hex.toLowerCase();
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                    isSelected 
                      ? 'ring-2 ring-offset-2 ring-slate-400 scale-105' 
                      : 'hover:scale-102 opacity-80 hover:opacity-100'
                  } ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-slate-50'}`}
                >
                  <div 
                    className="w-6 h-6 rounded-full shadow-md flex items-center justify-center"
                    style={{ backgroundColor: preset.hex }}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 text-slate-950 font-bold" />}
                  </div>
                  <span className="text-[10px] font-semibold truncate w-full text-center">
                    {preset.name.split(' ')[0]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Custom Hex Color Picker (Admin & User Customization) */}
        <div className={`p-4 rounded-xl border space-y-3 ${
          isDark ? 'bg-[#000000] border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Custom Color Wheel & Hex
            </span>
            <span className="text-[11px] font-mono opacity-70">Pick any custom gym color</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex items-center">
              <input
                type="color"
                value={customHex}
                onChange={(e) => handleCustomHexChange(e.target.value)}
                className="w-10 h-10 rounded-xl cursor-pointer border border-slate-700 bg-transparent p-0.5"
                title="Choose custom color"
              />
            </div>

            <div className="flex-1">
              <input
                type="text"
                value={customHex}
                onChange={(e) => handleCustomHexChange(e.target.value)}
                placeholder="#00E5FF"
                className={`w-full px-3 py-2 rounded-lg text-xs font-mono font-bold uppercase border focus:outline-none ${
                  isDark 
                    ? 'bg-slate-900 border-slate-700 text-white' 
                    : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <button
              type="button"
              onClick={() => handleCustomHexChange(customHex)}
              className="px-3 py-2 rounded-lg text-xs font-bold text-slate-950 shadow-sm cursor-pointer"
              style={{ backgroundColor: localSettings.accentHex }}
            >
              Apply Color
            </button>
          </div>
        </div>

        {/* 4. Live UI Component Preview */}
        <div className={`p-4 rounded-xl border space-y-3 ${
          isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span className="flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" />
              <span>Live UI Preview</span>
            </span>
            <span className="text-[11px] font-mono">Real-time simulation</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              className="px-3.5 py-1.5 rounded-lg text-xs font-extrabold text-slate-950 shadow-md flex items-center gap-1.5"
              style={{ backgroundColor: localSettings.accentHex }}
            >
              <span>Primary Button</span>
            </button>

            <span 
              className="px-2.5 py-1 rounded-md text-xs font-mono font-bold border"
              style={{ 
                color: localSettings.accentHex, 
                borderColor: localSettings.accentHex,
                backgroundColor: `rgba(${hexToRgb(localSettings.accentHex)}, 0.1)` 
              }}
            >
              Badge Tag
            </span>

            <div className="flex-1 min-w-[120px] h-2 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-300" 
                style={{ width: '70%', backgroundColor: localSettings.accentHex }}
              />
            </div>
          </div>
        </div>

        {/* 5. Admin Global Broadcast Action */}
        {isAdmin && (
          <div className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
            isDark ? 'bg-cyan-950/30 border-cyan-800/60' : 'bg-cyan-50 border-cyan-200'
          }`}>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
              <div className="text-xs">
                <div className="font-bold">Coach Muhammad's Gym Theme Sync</div>
                <div className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Broadcast this accent color as the official gym standard for all athletes
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleSetGlobalDefault}
              className="px-3 py-1.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-bold shadow-sm whitespace-nowrap cursor-pointer shrink-0"
            >
              Set as Gym Default
            </button>
          </div>
        )}

        {/* Modal Footer */}
        <div className={`flex items-center justify-between pt-4 border-t ${
          isDark ? 'border-slate-800' : 'border-slate-200'
        }`}>
          <button
            type="button"
            onClick={handleResetDefaults}
            className={`flex items-center gap-1.5 text-xs font-semibold cursor-pointer ${
              isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset to Cyan Default</span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic(30);
              saveThemeSettings(localSettings);
              onClose();
            }}
            className="px-5 py-2 rounded-xl text-xs font-extrabold text-slate-950 shadow-lg cursor-pointer transition-all"
            style={{ backgroundColor: localSettings.accentHex }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
