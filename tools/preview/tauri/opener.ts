// Links and reveals are logged instead of opening the OS shell.
export async function openUrl(url: string): Promise<void> {
  console.info("[preview] openUrl:", url);
}

export async function openPath(path: string): Promise<void> {
  console.info("[preview] openPath:", path);
}

export async function revealItemInDir(path: string): Promise<void> {
  console.info("[preview] revealItemInDir:", path);
}
