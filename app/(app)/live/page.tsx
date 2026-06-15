"use client";

import { TopBar } from "@/components/layout/TopBar";
import { LiveBrowser } from "@/components/catalog/LiveBrowser";

export default function LivePage() {
  return (
    <>
      <TopBar title="Live TV" />
      <LiveBrowser />
    </>
  );
}
