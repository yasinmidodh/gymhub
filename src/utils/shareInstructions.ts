/**
 * Builds the ready-to-send install message (English / Arabic) that the
 * coach can copy and send to a new athlete via WhatsApp, SMS, etc.
 */

export type ShareLang = 'en' | 'ar';

export interface ShareMessageOptions {
  /** Public link of the web app (GitHub Pages link). */
  appUrl: string;
  /** Optional link where the APK can be downloaded (Drive, Dropbox, ...). */
  apkUrl?: string;
  lang: ShareLang;
}

/** Returns the clean public link of the app (no hash / query string). */
export function getCleanAppUrl(href: string): string {
  try {
    const u = new URL(href);
    u.hash = '';
    u.search = '';
    return u.toString();
  } catch {
    return href;
  }
}

export function buildShareMessage({ appUrl, apkUrl, lang }: ShareMessageOptions): string {
  const apk = (apkUrl || '').trim();

  if (lang === 'ar') {
    const lines: string[] = [
      '🏋️ تطبيق GYM App',
      '',
      'رابط التطبيق:',
      appUrl,
      '',
      '📱 للآيفون (iPhone):',
      '1. افتح الرابط في متصفح Safari (ليس من داخل واتساب أو كروم).',
      '2. اضغط على زر المشاركة (المربع الذي فيه سهم للأعلى) أسفل الشاشة.',
      '3. مرّر للأسفل واضغط "إضافة إلى الشاشة الرئيسية" (Add to Home Screen).',
      '4. اضغط "إضافة" (Add). ستظهر أيقونة GYM App على شاشتك الرئيسية.',
      '',
      '🤖 للأندرويد (Android):',
    ];
    if (apk) {
      lines.push(
        'الطريقة الأولى (ملف APK):',
        `1. حمّل الملف من هنا: ${apk}`,
        '2. افتح الملف واسمح بالتثبيت من مصادر غير معروفة إذا طلب الهاتف ذلك.',
        '3. اضغط "تثبيت".',
        '',
        'الطريقة الثانية (بدون ملف):',
        '1. افتح الرابط في كروم (Chrome).',
        '2. اضغط على القائمة ⋮ ثم "تثبيت التطبيق" أو "إضافة إلى الشاشة الرئيسية".',
      );
    } else {
      lines.push(
        '1. افتح الرابط في كروم (Chrome).',
        '2. اضغط على القائمة ⋮ ثم "تثبيت التطبيق" أو "إضافة إلى الشاشة الرئيسية".',
        '3. اضغط "تثبيت".',
      );
    }
    lines.push('', '💡 إذا فتح الرابط داخل تطبيق آخر (واتساب مثلاً)، اضغط على ⋮ أو أيقونة المتصفح واختر "فتح في المتصفح".');
    return lines.join('\n');
  }

  const lines: string[] = [
    '🏋️ GYM App',
    '',
    'App link:',
    appUrl,
    '',
    '📱 iPhone (iOS):',
    '1. Open the link in Safari (not inside WhatsApp or Chrome).',
    '2. Tap the Share button (square with an arrow pointing up) at the bottom of the screen.',
    '3. Scroll down and tap "Add to Home Screen".',
    '4. Tap "Add". The GYM App icon will appear on your home screen.',
    '',
    '🤖 Android:',
  ];
  if (apk) {
    lines.push(
      'Option 1 (APK file):',
      `1. Download the file here: ${apk}`,
      '2. Open it and allow "Install from unknown sources" if your phone asks.',
      '3. Tap Install.',
      '',
      'Option 2 (no file needed):',
      '1. Open the link in Chrome.',
      '2. Tap the menu (⋮), then "Install app" or "Add to Home screen".',
    );
  } else {
    lines.push(
      '1. Open the link in Chrome.',
      '2. Tap the menu (⋮), then "Install app" or "Add to Home screen".',
      '3. Tap Install.',
    );
  }
  lines.push('', '💡 If the link opens inside another app (like WhatsApp), tap ⋮ or the browser icon and choose "Open in browser" first.');
  return lines.join('\n');
}
