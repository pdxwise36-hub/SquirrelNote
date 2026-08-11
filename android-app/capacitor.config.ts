import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pdxwise36.squirrelnote',
  appName: 'SquirrelNote',
  webDir: 'www',
  // Load the live site directly instead of bundling a copy of it, so the
  // app always shows whatever's currently deployed to squirrelnote.vercel.app
  // -- no separate "rebuild the APK" step needed after a normal web ship.
  server: {
    url: 'https://squirrelnote.vercel.app',
    cleartext: false
  }
};

export default config;
