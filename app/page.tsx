"use client";
import MapClient from "@/components/MapClient";
import Ticker from "@/components/Ticker";
import Link from "next/link";

export default function Page() {
  return (
    <main className="min-h-screen p-4 md:p-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 md:gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Curfew/Road Status</h1>
          <div className="flex items-center gap-2">
            <span className="text-xs opacity-70">Realtime</span>
            <Link
              href="/report"
              className="rounded-lg bg-black px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
            >
              Report
            </Link>
          </div>
        </div>
        <MapClient />
        <Ticker />
      </div>
    </main>
  );
}
