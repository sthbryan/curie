// The native picker cannot exist in the browser, so it always cancels.
export async function open(): Promise<string | null> {
  return null;
}

export async function save(): Promise<string | null> {
  return null;
}

export async function message(): Promise<void> {}

export async function ask(): Promise<boolean> {
  return false;
}

export async function confirm(): Promise<boolean> {
  return false;
}
