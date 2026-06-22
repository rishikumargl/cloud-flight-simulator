import { create } from 'zustand';

const useChallengeStore = create((set) => ({
  challenges: [],
  currentChallenge: null,
  activeMission: null,

  setChallenges: (challenges) => set({ challenges }),
  setCurrentChallenge: (challenge) => set({ currentChallenge: challenge }),
  setActiveMission: (mission) => set({ activeMission: mission }),

  addChallenge: (challenge) =>
    set((state) => ({
      challenges: [...state.challenges, challenge],
    })),

  updateChallenge: (id, updates) =>
    set((state) => ({
      challenges: state.challenges.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    })),
}));

export default useChallengeStore;
