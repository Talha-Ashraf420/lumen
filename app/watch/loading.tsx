import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="grid h-dvh place-items-center bg-black">
      <div className="flex flex-col items-center gap-3 text-fog-400">
        <Loader2 className="h-10 w-10 animate-spin text-iris-400" />
        <span className="text-sm">Preparing stream…</span>
      </div>
    </div>
  );
}
