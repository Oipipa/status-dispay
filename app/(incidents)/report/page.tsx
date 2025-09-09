"use client";
import ReportIncidentForm from "@/components/ReportIncidentForm";

export default function ReportPage() {
    return (
        <main className="min-h-screen p-4 md:p-6">
            <div className="mx-auto max-w-3xl">
                <h1 className="mb-4 text-2xl font-semibold">Report an Incident</h1>
                <ReportIncidentForm />
            </div>
        </main>
    );
}
