"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Tv, Plus, Trash2, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import { useLibrary } from "@/store/library";
import { normalizeBaseUrl } from "@/lib/xtream/urls";
import type { Profile } from "@/lib/xtream/types";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const { profiles, addProfile, removeProfile } = useLibrary();
  const [baseUrl, setBaseUrl] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    setShowForm(profiles.length === 0);
  }, [profiles.length]);

  async function connect(creds: { baseUrl: string; username: string; password: string }, save?: string) {
    setBusy(true);
    setError(null);
    try {
      const url = normalizeBaseUrl(creds.baseUrl);
      const res = await api.login(url, creds.username, creds.password);
      if (save !== undefined) {
        const p: Profile = {
          id: `${url}|${creds.username}`,
          label: save || res.user_info.username || url.replace(/^https?:\/\//, ""),
          baseUrl: url,
          username: creds.username,
          password: creds.password,
        };
        addProfile(p);
      }
      router.replace("/");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed");
      setBusy(false);
    }
  }

  return (
    <div className="relative grid min-h-dvh place-items-center overflow-hidden px-5 py-12">
      {/* cinematic backdrop */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/3 h-[60vh] w-[60vh] -translate-x-1/2 rounded-full bg-amber-glow/12 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[40vh] w-[40vh] rounded-full bg-indigo-500/10 blur-[120px]" />
      </div>

      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-amber-soft to-amber-deep text-2xl font-black text-ink-950 shadow-xl glow-amber">
            L
          </span>
          <h1 className="text-3xl font-bold tracking-tight">Lumen</h1>
          <p className="mt-1.5 text-sm text-fog-400">
            Sign in with your Xtream / X3U stream codes.
          </p>
        </div>

        {/* saved profiles */}
        {profiles.length > 0 && !showForm && (
          <div className="space-y-2.5">
            {profiles.map((p) => (
              <button
                key={p.id}
                disabled={busy}
                onClick={() => connect(p)}
                className="group flex w-full items-center gap-3 rounded-2xl glass p-4 text-left transition-all hover:glow-amber disabled:opacity-60"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-ink-700 text-amber-glow">
                  <Tv className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{p.label}</span>
                  <span className="block truncate text-xs text-fog-500">
                    {p.username} · {p.baseUrl.replace(/^https?:\/\//, "")}
                  </span>
                </span>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeProfile(p.id);
                  }}
                  className="grid h-8 w-8 place-items-center rounded-lg text-fog-500 opacity-0 transition-all hover:bg-red-500/15 hover:text-red-300 group-hover:opacity-100"
                >
                  <Trash2 className="h-4 w-4" />
                </span>
                <ArrowRight className="h-4 w-4 text-fog-500 transition-transform group-hover:translate-x-0.5 group-hover:text-amber-glow" />
              </button>
            ))}
            <button
              onClick={() => setShowForm(true)}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-white/10 py-3.5 text-sm text-fog-400 transition-colors hover:border-amber-glow/40 hover:text-foreground"
            >
              <Plus className="h-4 w-4" /> Add another account
            </button>
          </div>
        )}

        {/* form */}
        {showForm && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              connect({ baseUrl, username, password }, label);
            }}
            className="space-y-3.5 rounded-3xl glass p-6"
          >
            <Field label="Server URL" placeholder="http://your-provider.com:8080" value={baseUrl} onChange={setBaseUrl} autoFocus />
            <Field label="Username" placeholder="username" value={username} onChange={setUsername} />
            <Field label="Password" placeholder="••••••••" type="password" value={password} onChange={setPassword} />
            <Field label="Nickname (optional)" placeholder="My IPTV" value={label} onChange={setLabel} />

            {error && (
              <p className="rounded-xl bg-red-500/10 px-3.5 py-2.5 text-sm text-red-300">{error}</p>
            )}

            <button
              type="submit"
              disabled={busy}
              className={cn(
                "flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-soft to-amber-deep py-3 font-semibold text-ink-950 transition-all hover:brightness-110 disabled:opacity-60",
              )}
            >
              {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Connect <ArrowRight className="h-4 w-4" /></>}
            </button>

            {profiles.length > 0 && (
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="w-full py-1 text-center text-xs text-fog-500 hover:text-foreground"
              >
                ← Back to saved accounts
              </button>
            )}
          </form>
        )}

        <p className="mt-6 text-center text-xs text-fog-500">
          Credentials are stored locally on this device only.
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  autoFocus,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-fog-400">{label}</span>
      <input
        type={type}
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-white/8 bg-ink-900/80 px-3.5 py-2.5 text-sm text-foreground placeholder:text-fog-600 transition-colors focus:border-amber-glow/60 focus:outline-none"
      />
    </label>
  );
}
