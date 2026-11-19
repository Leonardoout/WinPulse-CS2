export interface WinPulseDesktopBridge {
  isElectron: boolean;
  runWithAdmin: (payload: {
    runBackupFirst: boolean;
    files: { filename: string; content: string; isPowerShell?: boolean }[];
  }) => Promise<{ ok: boolean; workDir?: string; message?: string }>;
  openFolder: (folderPath: string) => Promise<void>;
}

export interface TauriInternals {
  invoke: <T = unknown>(cmd: string, args?: Record<string, unknown>) => Promise<T>;
}

declare global {
  interface Window {
    winpulseDesktop?: WinPulseDesktopBridge;
    __TAURI_INTERNALS__?: TauriInternals;
  }
}

export {};
