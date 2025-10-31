import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

type State = {
  deep: {
    tips: string;
    nested: {
      obj: { count: number };
    };
  };
};

type Action = {
  increment: () => void;
};

export const useNestedStore = create<State & Action>()(
  immer((set) => ({
    deep: {
      tips: "Only update the necessary parts to avoid unnecessary re‑renders.",
      nested: {
        obj: { count: 0 },
      },
    },
    increment: () =>
      set((state) => {
        state.deep.nested.obj.count++;
      }),
  }))
);
