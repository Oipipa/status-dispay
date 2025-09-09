"use client";
import { useEffect, useRef, useState } from "react";
import maplibregl, { Map, Popup } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { API_BASE, WS_URL } from "@/lib/config";
import { createWS } from "@/lib/ws";
import { getIncidentAttachments } from "@/lib/api";
import { NEPAL_BOUNDS, NEPAL_MAX_BOUNDS } from "@/lib/geo";

type Feature = {
    type: "Feature";
    geometry: { type: "Point"; coordinates: [number, number] };
    properties: Record<string, any>;
};
type FC = { type: "FeatureCollection"; features: Feature[] };

const OSM_RASTER_STYLE: any = {
    version: 8,
    glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
    sources: {
        osm: {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }
    },
    layers: [{ id: "osm", type: "raster", source: "osm" }]
};

export default function MapClient() {
    const ref = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<Map | null>(null);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        if (!ref.current || mapRef.current) return;
        const map = new maplibregl.Map({
            container: ref.current,
            style: OSM_RASTER_STYLE,
            center: [85.324, 27.7172],
            zoom: 7,
            maxBounds: NEPAL_MAX_BOUNDS
        });
        mapRef.current = map;
        map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "bottom-right");
        map.addControl(new maplibregl.ScaleControl({ maxWidth: 120, unit: "metric" }), "bottom-left");
        map.on("load", async () => {
            map.fitBounds(NEPAL_BOUNDS, { padding: 40, duration: 0 });
            const b = map.getBounds();
            const bbox = `${b.getWest()},${b.getSouth()},${b.getEast()},${b.getNorth()}`;
            const res = await fetch(`${API_BASE}/incidents/geojson?bbox=${encodeURIComponent(bbox)}&limit=1000`);
            const data: FC = await res.json();
            map.addSource("incidents", {
                type: "geojson",
                data,
                cluster: true,
                clusterRadius: 50,
                clusterMaxZoom: 15
            });
            map.addLayer({
                id: "clusters",
                type: "circle",
                source: "incidents",
                filter: ["has", "point_count"],
                paint: {
                    "circle-color": ["step", ["get", "point_count"], "#60a5fa", 10, "#34d399", 50, "#f59e0b"],
                    "circle-radius": ["step", ["get", "point_count"], 14, 10, 18, 50, 24],
                    "circle-stroke-color": "#111827",
                    "circle-stroke-width": 1
                }
            });
            map.addLayer({
                id: "cluster-count",
                type: "symbol",
                source: "incidents",
                filter: ["has", "point_count"],
                layout: {
                    "text-field": ["get", "point_count_abbreviated"],
                    "text-size": 12,
                    "text-font": ["Open Sans Regular", "Arial Unicode MS Regular"]
                },
                paint: { "text-color": "#111827" }
            });
            map.addLayer({
                id: "incidents-unclustered",
                type: "circle",
                source: "incidents",
                filter: ["!", ["has", "point_count"]],
                paint: {
                    "circle-radius": 6,
                    "circle-color": "#ef4444",
                    "circle-stroke-color": "#111827",
                    "circle-stroke-width": 1
                }
            });
            setReady(true);
        });
        return () => {
            map.remove();
            mapRef.current = null;
        };
    }, []);

    useEffect(() => {
        if (!ready) return;

        const hasIncidentsSource = () => {
            const m = mapRef.current;
            const s = m?.getSource("incidents") as any;
            return !!(s && typeof s.setData === "function");
        };

        const fetchBbox = async () => {
            const m = mapRef.current;
            if (!m || !hasIncidentsSource()) return;
            const b = m.getBounds();
            const bbox = `${b.getWest()},${b.getSouth()},${b.getEast()},${b.getNorth()}`;
            const r = await fetch(`${API_BASE}/incidents/geojson?bbox=${encodeURIComponent(bbox)}&limit=1000`, {
                cache: "no-store"
            });
            if (!r.ok) return;
            const data = (await r.json()) as FC;
            const src = m.getSource("incidents") as any;
            if (src && typeof src.setData === "function") src.setData(data);
        };

        const m = mapRef.current;
        if (!m) return;

        const moveEnd = () => void fetchBbox();
        m.on("moveend", moveEnd);

        const readyCheck = setInterval(() => {
            if (hasIncidentsSource()) {
                fetchBbox();
                clearInterval(readyCheck);
            }
        }, 300);

        const ws = createWS(WS_URL);
        const handler = (msg: any) => {
            if (!msg || msg.channel !== "incidents" || msg.event !== "created") return;
            const lng = Number(msg.data?.lng);
            const lat = Number(msg.data?.lat);
            if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
            const m2 = mapRef.current;
            if (!m2 || !hasIncidentsSource()) return;
            const src = m2.getSource("incidents") as any;
            const current = (src._data || { type: "FeatureCollection", features: [] }) as FC;
            const f: Feature = {
                type: "Feature",
                geometry: { type: "Point", coordinates: [lng, lat] },
                properties: { id: msg.data?.id, type: msg.data?.type }
            };
            const updated: FC = { type: "FeatureCollection", features: [...current.features, f] };
            src.setData(updated);
        };
        ws.onMessage(handler);

        return () => {
            m.off("moveend", moveEnd);
            clearInterval(readyCheck);
            ws.close();
        };
    }, [ready]);

    useEffect(() => {
        if (!ready) return;
        const m = mapRef.current;
        if (!m) return;

        const clickCluster = (e: any) => {
            const features = m.queryRenderedFeatures(e.point, { layers: ["clusters"] });
            if (!features.length) return;
            const clusterId = features[0].properties?.cluster_id;
            const src = m.getSource("incidents") as any;
            src.getClusterExpansionZoom(clusterId, (err: any, zoom: number) => {
                if (err) return;
                m.easeTo({ center: (features[0].geometry as any).coordinates, zoom });
            });
        };

        const clickPoint = async (e: any) => {
            const f = m.queryRenderedFeatures(e.point, { layers: ["incidents-unclustered"] })[0];
            if (!f) return;
            const id = Number(f.properties?.id);
            const lngLat = e.lngLat;
            let html = `<div style="max-width:240px"><div style="font-weight:600;margin-bottom:4px">${f.properties?.type || "incident"}</div>`;
            if (f.properties?.location) html += `<div style="font-size:12px;opacity:.7">${f.properties.location}</div>`;
            if (f.properties?.description) html += `<div style="margin-top:6px;font-size:12px">${f.properties.description}</div>`;
            const atts = Number.isFinite(id) ? await getIncidentAttachments(id).catch(() => []) : [];
            if (atts.length) {
                html += `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:4px;margin-top:8px">`;
                for (const a of atts.slice(0, 6)) {
                    const src = a.url.startsWith("http") ? a.url : `${API_BASE}${a.url}`;
                    html += `<a href="${src}" target="_blank" rel="noreferrer"><img src="${src}" style="width:72px;height:72px;object-fit:cover;border-radius:6px"/></a>`;
                }
                html += `</div>`;
            }
            html += `</div>`;
            new Popup({ closeButton: true }).setLngLat(lngLat).setHTML(html).addTo(m);
        };

        m.on("click", "clusters", clickCluster);
        m.on("click", "incidents-unclustered", clickPoint);
        m.on("mouseenter", "incidents-unclustered", () => (m.getCanvas().style.cursor = "pointer"));
        m.on("mouseleave", "incidents-unclustered", () => (m.getCanvas().style.cursor = ""));

        return () => {
            m.off("click", "clusters", clickCluster as any);
            m.off("click", "incidents-unclustered", clickPoint as any);
        };
    }, [ready]);

    return <div ref={ref} className="h-[70vh] w-full rounded-xl border border-neutral-200" />;
}
