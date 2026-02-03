
import { Buffer } from 'buffer';

// Safe Global Resolution
const globalObject = 
  typeof globalThis !== 'undefined' ? globalThis : 
  typeof window !== 'undefined' ? window : 
  typeof self !== 'undefined' ? self : {};

// 1. Ensure 'global' exists
if (typeof (globalObject as any).global === 'undefined') {
  (globalObject as any).global = globalObject;
}

// 2. Ensure 'Buffer' exists (Merge/Polyfill)
if (typeof (globalObject as any).Buffer === 'undefined') {
  (globalObject as any).Buffer = Buffer;
}

// 3. Ensure 'process' exists (Merge/Polyfill)
const process = (globalObject as any).process || {};
(globalObject as any).process = process;

// 4. Ensure process.env exists and merge with import.meta.env
process.env = process.env || {};
process.env = {
  ...process.env,
  NODE_ENV: import.meta.env.MODE || process.env.NODE_ENV || 'production',
  ...import.meta.env, // Inject all VITE_ env vars into process.env for compatibility
};

// 5. Fill missing process properties
if (!process.version) process.version = '';
if (!process.browser) process.browser = true;
if (!process.platform) process.platform = 'browser';
if (!process.nextTick) process.nextTick = (fn: Function) => setTimeout(fn, 0);
if (!process.cwd) process.cwd = () => '/';

export {};
