"use client";
import { useEffect, useRef, useState } from "react";
import maplibregl, { Map, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { NEPAL_BOUNDS, NEPAL_MAX_BOUNDS } from "@/lib/geo";

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

export default function LocationPickerMap({
    value,
    onChange
}: {
    value?: { lat: number | null; lng: number | null };
    onChange: (coords: { lat: number; lng: number }) => void;
}) {
    const ref = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<Map | null>(null);
    const markerRef = useRef<Marker | null>(null);
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
        map.on("load", () => {
            map.fitBounds(NEPAL_BOUNDS, { padding: 40, duration: 0 });
            setReady(true);
            if (value?.lat && value?.lng) place({ lng: value.lng, lat: value.lat });
        });
        const click = (e: any) => {
            const { lng, lat } = e.lngLat;
            place({ lng, lat });
            onChange({ lat, lng });
        };
        map.on("click", click);
        return () => {
            map.off("click", click);
            map.remove();
            mapRef.current = null;
            markerRef.current = null;
        };
    }, []);

    const place = ({ lng, lat }: { lng: number; lat: number }) => {
        if (!mapRef.current) return;
        if (markerRef.current) {
            markerRef.current.setLngLat([lng, lat]);
        } else {
            markerRef.current = new maplibregl.Marker({ color: "#ef4444" }).setLngLat([lng, lat]).addTo(mapRef.current);
        }
    };

    const useMyLocation = () => {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                onChange({ lat, lng });
                place({ lng, lat });
                mapRef.current?.easeTo({ center: [lng, lat], zoom: 15 });
            },
            () => { }
        );
    };

    return (
        <div className="space-y-2">
            <div ref={ref} className="h-72 w-full rounded-lg border" />
            <div className="flex items-center justify-between text-sm">
                <button type="button" onClick={useMyLocation} className="rounded bg-neutral-900 px-3 py-1.5 text-white">
                    Use my location
                </button>
                <div className="opacity-70">
                    {value?.lat && value?.lng ? `${value.lat.toFixed(6)}, ${value.lng.toFixed(6)}` : "Tap map to set location"}
                </div>
            </div>
        </div>
    );
}
