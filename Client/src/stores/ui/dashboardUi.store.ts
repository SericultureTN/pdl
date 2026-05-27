import { create } from "zustand";

type DashboardUiState = {
  dataEntryOpen: boolean;
  toggleDataEntry: () => void;
};

export const useDashboardUiStore = create<DashboardUiState>((set) => ({
  dataEntryOpen: true,
  toggleDataEntry: () => set((s) => ({ dataEntryOpen: !s.dataEntryOpen })),
}));

