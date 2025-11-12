import { create } from 'zustand';

export const useSessionStore = create((set) => ({
  currentSession: null,
  qrToken: null,
  
  setCurrentSession: (session) => set({ currentSession: session }),
  
  setQRToken: (token) => set({ qrToken: token }),
  
  clearSession: () => set({
    currentSession: null,
    qrToken: null,
  }),
}));
