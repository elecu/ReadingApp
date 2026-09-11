// config.js
// backendUrl now gates two independent features: Google Drive backup AND
// cloud-AI quest-object generation (both optional -- leave empty to disable
// both and run fully on-device/offline, same as before this was added).
window.BOOKQUEST_CONFIG = {
  googleClientId: "195858719729-36npag3q1fclmj2pnqckk4dgcblqu1f9.apps.googleusercontent.com",
  backendUrl: "https://bookquest-backend.lordquark.workers.dev",
  questAppKey: "tmL57Ft5jEz_IAFpfQc1u2UWcKdjwtIz"
};
