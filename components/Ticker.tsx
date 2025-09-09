"use client";
import { useQuery } from "@tanstack/react-query";
import { API_BASE } from "@/lib/config";

type Incident = {
    id: number;
    type: string;
    description: string;
    location: string;
    status: string;
    source: string;
    latitude: number;
    longitude: number;
    created_at: string;
    updated_at: string;
};
type Road = {
    id: number;
    road_name: string;
    status: string;
    details: string;
    source: string;
    updated_at: string;
};

async function fetchJSON<T>(url: string): Promise<T> {
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) throw new Error(String(r.status));
    return (await r.json()) as T;
}

export default function Ticker() {
    const { data: incidents } = useQuery<Incident[]>({
        queryKey: ["incidents"],
        queryFn: () => fetchJSON(`${API_BASE}/incidents?limit=25`)
    });
    const { data: roads } = useQuery<Road[]>({
        queryKey: ["roads"],
        queryFn: () => fetchJSON(`${API_BASE}/roads?limit=25`)
    });
    const merged =
        (incidents || []).map(i => ({
            ts: i.updated_at || i.created_at,
            kind: "incident",
            title: `${i.type}`,
            subtitle: `${i.location}`,
            extra: i.status
        })).concat(
            (roads || []).map(r => ({
                ts: r.updated_at,
                kind: "road",
                title: `${r.road_name}`,
                subtitle: `${r.status}`,
                extra: r.details
            }))
        ).sort((a, b) => (a.ts > b.ts ? -1 : 1));

    return (
        <div className="w-full rounded-xl border border-neutral-200">
            <div className="flex items-center justify-between border-b p-3">
                <div className="text-sm font-medium">Live Ticker</div>
                <div className="text-[11px] opacity-60">Last 25</div>
            </div>
            <div className="max-h-64 overflow-auto p-3">
                <ul className="space-y-2">
                    {merged.map((x, idx) => (
                        <li key={idx} className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <div className="truncate text-sm font-medium">{x.title}</div>
                                <div className="truncate text-xs opacity-70">{x.subtitle}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-xs">{x.kind}</div>
                                <div className="text-[11px] opacity-60">{new Date(x.ts).toLocaleTimeString()}</div>
                            </div>
                        </li>
                    ))}
                    {!merged.length && <li className="text-sm opacity-70">No data</li>}
                </ul>
            </div>
        </div>
    );
}
