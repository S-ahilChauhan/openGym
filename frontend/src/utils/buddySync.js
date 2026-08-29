// frontend/src/utils/buddySync.js

export function generateBuddyInvitePayload(S = {}, durationWeeks = 4) {
  const payload = {
    creatorName: S?.profile?.name || 'Warrior',
    durationWeeks: durationWeeks || 4,
    createdAt: new Date().toISOString().slice(0, 10),
    routines: S?.routines || [],
    week: S?.week || {},
    customEx: S?.customEx || []
  };

  try {
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
    const shareUrl = `${window.location.origin}/#/plan?buddyToken=${encoded}`;
    return { payload, encoded, shareUrl };
  } catch (e) {
    console.error('Failed to encode buddy payload:', e);
    return { payload, encoded: '', shareUrl: window.location.href };
  }
}

export function unpackBuddyInviteToken(token = '') {
  try {
    const jsonStr = decodeURIComponent(escape(atob(token)));
    return JSON.parse(jsonStr);
  } catch (err) {
    console.error('Invalid buddy token:', err);
    return null;
  }
}