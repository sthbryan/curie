import { create } from "zustand";
import type { SkillSearchResult } from "@/components/types";

export type FindState = {
  findResults: SkillSearchResult[];
  findLoading: boolean;
  findError: string | null;
  installingPackage: string | null;
  installError: string | null;

  setFindResults: (results: SkillSearchResult[]) => void;
  setFindLoading: (loading: boolean) => void;
  setFindError: (error: string | null) => void;
  setInstallingPackage: (pkg: string | null) => void;
  setInstallError: (error: string | null) => void;
};

export const useFindStore = create<FindState>()((set) => ({
  findResults: [],
  findLoading: false,
  findError: null,
  installingPackage: null,
  installError: null,

  setFindResults: (findResults) => set({ findResults, findError: null }),
  setFindLoading: (findLoading) => set({ findLoading }),
  setFindError: (findError) => set({ findError }),
  setInstallingPackage: (installingPackage) => set({ installingPackage }),
  setInstallError: (installError) => set({ installError }),
}));
