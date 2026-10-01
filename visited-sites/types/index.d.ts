export type Visit = { at: number; via: string; target: string; host: string; failed: boolean }

declare module 'claude-code' {
  interface PluginState {
    'visited-sites': { visits: Visit[] }
  }
}
