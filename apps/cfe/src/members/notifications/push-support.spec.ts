import { needsInstall } from './push-support';

const IPHONE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1';
const IPAD_DESKTOP_MODE =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15';
const ANDROID = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/126 Mobile';
const MAC = IPAD_DESKTOP_MODE;

describe('needsInstall', () => {
  it('is true on an iPhone in the browser', () => {
    expect(needsInstall({ userAgent: IPHONE, maxTouchPoints: 5, isStandalone: false })).toBe(true);
  });

  it('is true on an iPad that reports a desktop user agent', () => {
    expect(
      needsInstall({ userAgent: IPAD_DESKTOP_MODE, maxTouchPoints: 5, isStandalone: false }),
    ).toBe(true);
  });

  it('is false once the app is installed', () => {
    expect(needsInstall({ userAgent: IPHONE, maxTouchPoints: 5, isStandalone: true })).toBe(false);
  });

  it('is false on Android and on a real Mac', () => {
    expect(needsInstall({ userAgent: ANDROID, maxTouchPoints: 5, isStandalone: false })).toBe(
      false,
    );
    expect(needsInstall({ userAgent: MAC, maxTouchPoints: 0, isStandalone: false })).toBe(false);
  });
});
