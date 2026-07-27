import { signal } from "@preact/signals";
import type { AppUpdateInfo } from "@/components/types";

export const appUpdate = signal<AppUpdateInfo | null>(null);
export const appUpdateLoading = signal<boolean>(false);
export const appUpdateError = signal<string | null>(null);
export const appInstallRunning = signal<boolean>(false);
export const appUpdateCheckedAt = signal<string | null>(null);

export const setAppUpdate = (next: AppUpdateInfo | null) => {
  appUpdate.value = next;
  appUpdateError.value = null;
  appUpdateCheckedAt.value = new Date().toISOString();
};
export const setAppUpdateLoading = (next: boolean) => {
  appUpdateLoading.value = next;
};
export const setAppUpdateError = (next: string | null) => {
  appUpdateError.value = next;
};
export const setAppInstallRunning = (next: boolean) => {
  appInstallRunning.value = next;
};

export const updateStore = {
  appUpdate,
  appUpdateLoading,
  appUpdateError,
  appInstallRunning,
  appUpdateCheckedAt,
  setAppUpdate,
  setAppUpdateLoading,
  setAppUpdateError,
  setAppInstallRunning,
};
