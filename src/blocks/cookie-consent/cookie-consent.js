/**
 * Cookie consent banner: stores the visitor's choice and passes it to Google Consent Mode v2.
 * The consent defaults (denied) and the update for returning visitors live in the inline script
 * in _include/page_head.html, before GTM. Keep COOKIE_NAME in sync with that script.
 */
const COOKIE_NAME = 'cookie_consent';
const MAX_AGE = 60 * 60 * 24 * 180; // 180 days, in seconds

function getChoice() {
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=(granted|denied)`));

  return match ? match[1] : null;
}

function initCookieConsent() {
  const banner = document.querySelector('.js-cookie-consent');

  if (!banner || getChoice()) {
    return;
  }

  const acceptButton = banner.querySelector('.js-cookie-consent-accept');
  const rejectButton = banner.querySelector('.js-cookie-consent-reject');

  if (!acceptButton || !rejectButton) {
    return;
  }

  const choose = (value) => {
    document.cookie = `${COOKIE_NAME}=${value}; max-age=${MAX_AGE}; path=/; SameSite=Lax`;

    // On reject the defaults stay denied, nothing to update
    if (value === 'granted' && typeof window.gtag === 'function') {
      window.gtag('consent', 'update', {
        ad_storage: 'granted',
        ad_user_data: 'granted',
        ad_personalization: 'granted',
        analytics_storage: 'granted',
      });
    }

    banner.hidden = true;
  };

  acceptButton.addEventListener('click', () => choose('granted'));
  rejectButton.addEventListener('click', () => choose('denied'));

  banner.hidden = false;
}

initCookieConsent();
