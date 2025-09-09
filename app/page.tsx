"use client";
import { useState } from "react";
import MapClient from "@/components/MapClient";
import Ticker from "@/components/Ticker";
import Modal from "@/components/Modal";
import ReportIncidentForm from "@/components/ReportIncidentForm";

export default function Page() {
  const [open, setOpen] = useState(false);
  return (
    <main className="min-h-screen p-4 md:p-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 md:gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Curfew/Road Status</h1>
          <div className="flex items-center gap-2">
            <span className="text-xs opacity-70">Realtime</span>
            <button
              onClick={() => setOpen(true)}
              className="rounded-lg bg-black px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
            >
              Report
            </button>
          </div>
        </div>
        <MapClient />
        <Ticker />
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="Report an Incident">
        <ReportIncidentForm onDone={() => setOpen(false)} />
      </Modal>
    </main>
  );
}
