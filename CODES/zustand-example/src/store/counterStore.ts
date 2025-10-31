import { create } from "zustand";

type State = {
  count: number;
};

type Action = {
  increment: () => void;
  decrement: () => void;
};

export const useCounterStore = create<State & Action>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
}));
