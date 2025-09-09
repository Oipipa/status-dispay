import { API_BASE } from "./config";

export async function getIncidentsGeoJSON(params?: { bbox?: string; limit?: number; type?: string }) {
    const q = new URLSearchParams();
    if (params?.bbox) q.set("bbox", params.bbox);
    if (params?.limit) q.set("limit", String(params.limit));
    if (params?.type) q.set("type", params.type);
    const r = await fetch(`${API_BASE}/incidents/geojson?${q.toString()}`, { cache: "no-store" });
    if (!r.ok) throw new Error(String(r.status));
    return r.json();
}

export async function getIncidentAttachments(id: number) {
    const r = await fetch(`${API_BASE}/incidents/${id}/attachments`, { cache: "no-store" });
    if (!r.ok) return [];
    return r.json();
}

export async function createIncident(body: {
    type: string;
    description: string;
    location: string;
    status: string;
    source: string;
    latitude: number;
    longitude: number;
}) {
    const r = await fetch(`${API_BASE}/incidents/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });
    if (!r.ok) throw new Error(String(r.status));
    return r.json();
}

export async function uploadIncidentAttachments(incidentId: number, files: FileList) {
    const fd = new FormData();
    Array.from(files).forEach((f) => fd.append("files", f));
    const r = await fetch(`${API_BASE}/incidents/${incidentId}/attachments`, { method: "POST", body: fd });
    if (!r.ok) throw new Error(String(r.status));
    return r.json();
}
