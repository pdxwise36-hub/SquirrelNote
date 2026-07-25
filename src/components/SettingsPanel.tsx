"use client";

import { usePrefs, ACCENT_PRESETS } from "@/lib/prefs";

export default function SettingsPanel({ onClose }: { onClose: () => void }) {
  const { prefs, setPref, reset } = usePrefs();

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="scroll-thin relative flex w-[360px] max-w-full flex-col overflow-y-auto border-l bg-surface p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Customize</h2>
          <button
            onClick={onClose}
            className="rounded-app p-1.5 text-muted hover:bg-surface-2"
          >
            ✕
          </button>
        </div>

        <Group label="Theme">
          <Segmented
            value={prefs.theme}
            options={[
              ["light", "Light"],
              ["dark", "Dark"],
              ["system", "System"],
            ]}
            onChange={(v) => setPref("theme", v as never)}
          />
        </Group>

        <Group label="Accent color">
          <div className="flex flex-wrap gap-2">
            {ACCENT_PRESETS.map((a) => (
              <button
                key={a.value}
                title={a.name}
                onClick={() => setPref("accent", a.value)}
                className={`h-8 w-8 rounded-full ring-2 ring-offset-2 ring-offset-surface transition ${
                  prefs.accent === a.value ? "ring-fg" : "ring-transparent"
                }`}
                style={{ background: a.value }}
              />
            ))}
            <label
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border text-xs text-muted"
              title="Custom color"
            >
              +
              <input
                type="color"
                value={prefs.accent}
                onChange={(e) => setPref("accent", e.target.value)}
                className="h-0 w-0 opacity-0"
              />
            </label>
          </div>
        </Group>

        <Group label="Font">
          <Segmented
            value={prefs.font}
            options={[
              ["sans", "Sans"],
              ["serif", "Serif"],
              ["mono", "Mono"],
            ]}
            onChange={(v) => setPref("font", v as never)}
          />
        </Group>

        <Group label="Density">
          <Segmented
            value={prefs.density}
            options={[
              ["comfortable", "Comfortable"],
              ["compact", "Compact"],
            ]}
            onChange={(v) => setPref("density", v as never)}
          />
        </Group>

        <Group label="Default view">
          <Segmented
            value={prefs.view}
            options={[
              ["list", "List"],
              ["grid", "Grid"],
            ]}
            onChange={(v) => setPref("view", v as never)}
          />
        </Group>

        <button
          onClick={reset}
          className="mt-6 rounded-app border px-3 py-2 text-sm text-muted hover:bg-surface-2"
        >
          Reset to defaults
        </button>

        <p className="mt-4 text-xs text-muted">
          Preferences are saved in this browser.
        </p>
      </div>
    </div>
  );
}

function Group({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-5">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
        {label}
      </div>
      {children}
    </div>
  );
}

function Segmented({
  value,
  options,
  onChange,
}: {
  value: string;
  options: [string, string][];
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex overflow-hidden rounded-app border">
      {options.map(([val, label]) => (
        <button
          key={val}
          onClick={() => onChange(val)}
          className={`flex-1 px-3 py-1.5 text-sm transition ${
            value === val
              ? "bg-accent text-accent-contrast"
              : "bg-surface text-muted hover:bg-surface-2"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
