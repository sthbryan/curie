import { render } from "preact";
import { Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";

import "@/index.css";

import App from "@/App";

// `?path=/settings` is the form you can paste around; it seeds the hash the
// app actually routes on. Routing in the hash means a reload lands on the same
// screen instead of falling back to the real (Tauri-only) entry point.
const wanted = new URLSearchParams(location.search).get("path");
if (wanted && !location.hash) {
  history.replaceState(null, "", `#${wanted}`);
}

render(
  <Router hook={useHashLocation}>
    <App />
  </Router>,
  document.getElementById("root")!,
);
