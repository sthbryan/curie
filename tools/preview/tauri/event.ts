// No native event loop in the browser: subscriptions resolve to a no-op
// unlisten so callers can mount and unmount cleanly.
export async function listen(): Promise<() => void> {
  return () => {};
}

export async function emit(): Promise<void> {}

export async function once(): Promise<() => void> {
  return () => {};
}
