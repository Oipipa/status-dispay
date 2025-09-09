"use client";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import LocationPickerMap from "./LocationPickerMap";
import { createIncident, uploadIncidentAttachments } from "@/lib/api";

const types = ["curfew", "roadblock", "info", "medical", "fire", "arrest"];
const statuses = ["reported", "active", "verified", "resolved"];

export default function ReportIncidentForm({ onDone }: { onDone?: () => void }) {
    const qc = useQueryClient();
    const [type, setType] = useState("info");
    const [description, setDescription] = useState("");
    const [location, setLocation] = useState("");
    const [status, setStatus] = useState("reported");
    const [source, setSource] = useState("");
    const [coords, setCoords] = useState<{ lat: number | null; lng: number | null }>({ lat: null, lng: null });
    const [files, setFiles] = useState<FileList | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!coords.lat || !coords.lng) {
            setMsg("Set a location on the map");
            return;
        }
        setSubmitting(true);
        setMsg(null);
        try {
            const created = await createIncident({
                type,
                description,
                location,
                status,
                source,
                latitude: coords.lat,
                longitude: coords.lng
            });
            if (files && files.length) {
                await uploadIncidentAttachments(created.id, files);
            }
            await Promise.allSettled([qc.invalidateQueries({ queryKey: ["incidents"] }), qc.invalidateQueries({ queryKey: ["roads"] })]);
            setMsg("Submitted");
            onDone && onDone();
        } catch {
            setMsg("Failed");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="flex flex-col gap-1">
                    <label className="text-sm">Type</label>
                    <select value={type} onChange={(e) => setType(e.target.value)} className="rounded border p-2">
                        {types.map((t) => (
                            <option key={t} value={t}>
                                {t}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-sm">Status</label>
                    <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded border p-2">
                        {statuses.map((s) => (
                            <option key={s} value={s}>
                                {s}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="md:col-span-2 flex flex-col gap-1">
                    <label className="text-sm">Location name</label>
                    <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g., Thamel, Kathmandu" className="rounded border p-2" />
                </div>
                <div className="md:col-span-2 flex flex-col gap-1">
                    <label className="text-sm">Description</label>
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="rounded border p-2" />
                </div>
                <div className="md:col-span-2 flex flex-col gap-1">
                    <label className="text-sm">Source</label>
                    <input value={source} onChange={(e) => setSource(e.target.value)} placeholder="optional" className="rounded border p-2" />
                </div>
            </div>
            <LocationPickerMap value={coords} onChange={(c) => setCoords(c)} />
            <div className="flex flex-col gap-1">
                <label className="text-sm">Attach images</label>
                <input type="file" accept="image/*" multiple onChange={(e) => setFiles(e.target.files)} />
            </div>
            <div className="flex items-center gap-3">
                <button type="submit" disabled={submitting} className="rounded bg-black px-4 py-2 text-white disabled:opacity-60">
                    {submitting ? "Submitting..." : "Submit report"}
                </button>
                {msg && <span className="text-sm opacity-70">{msg}</span>}
            </div>
        </form>
    );
}
