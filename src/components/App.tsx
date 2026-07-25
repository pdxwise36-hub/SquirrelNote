"use client";

import { PreferencesProvider } from "@/lib/prefs";
import Workspace from "./Workspace";

export default function App() {
  return (
    <PreferencesProvider>
      <Workspace />
    </PreferencesProvider>
  );
}
