/*
  BookQuest config
  --------------
  Optional: paste your Google OAuth Client ID here if you want Drive sync.
  (Leave empty to disable / rely on the built-in fallback client ID.)

  Example:
    window.BOOKQUEST_CONFIG.googleClientId = "1234567890-abcdefg.apps.googleusercontent.com";
*/

window.BOOKQUEST_CONFIG = window.BOOKQUEST_CONFIG || {};
window.BOOKQUEST_CONFIG.googleClientId = (window.BOOKQUEST_CONFIG.googleClientId || "").trim();
