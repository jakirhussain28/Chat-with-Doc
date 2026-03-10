// ─── App-wide configuration ───────────────────────────────────────────────────

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Set to false to let anyone use the app without signing in.
export const LOGIN_REQUIRED = true;
