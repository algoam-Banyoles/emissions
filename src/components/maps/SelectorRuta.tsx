import L from "leaflet";
import { useMemo, useState } from "react";
import { MapContainer, Marker, Polyline, Popup, TileLayer } from "react-leaflet";

import { Button } from "@/components/ui/button";
import { useGIS } from "@/hooks/useGIS";
import { type GISRouteResult, type Ubicacio } from "@/types/gis";

interface SelectorRutaProps {
  ubicacions: Ubicacio[];
  defaultOrigenId?: string;
  defaultDestiId?: string;
}

function simpleIcon(color: string) {
  return L.divIcon({
    className: "",
    html: `<div style="width:16px;height:16px;border-radius:9999px;background:${color};border:2px solid white;box-shadow:0 0 0 1px #0f172a"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

export function SelectorRuta({ ubicacions, defaultOrigenId, defaultDestiId }: SelectorRutaProps) {
  const { calcularRuta, loading } = useGIS();
  const [origenId, setOrigenId] = useState(defaultOrigenId ?? ubicacions[0]?.id ?? "");
  const [destiId, setDestiId] = useState(defaultDestiId ?? ubicacions[1]?.id ?? "");
  const [route, setRoute] = useState<GISRouteResult | null>(null);
  const selectedOrigenId = origenId || ubicacions[0]?.id || "";
  const selectedDestiId = destiId || ubicacions[1]?.id || "";

  const origen = useMemo(() => ubicacions.find((item) => item.id === selectedOrigenId) ?? null, [selectedOrigenId, ubicacions]);
  const desti = useMemo(() => ubicacions.find((item) => item.id === selectedDestiId) ?? null, [selectedDestiId, ubicacions]);

  return (
    <div className="space-y-3">
      <div className="grid gap-3 md:grid-cols-3">
        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Origen</span>
          <select className="h-10 w-full rounded-md border px-3" value={selectedOrigenId} onChange={(event) => setOrigenId(event.target.value)}>
            <option value="">Selecciona origen</option>
            {ubicacions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.nom}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Desti</span>
          <select className="h-10 w-full rounded-md border px-3" value={selectedDestiId} onChange={(event) => setDestiId(event.target.value)}>
            <option value="">Selecciona desti</option>
            {ubicacions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.nom}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-end">
          <Button
            className="w-full"
            disabled={!origen || !desti || loading || origen.id === desti.id}
            onClick={() => {
              if (!origen || !desti) {
                return;
              }
              void calcularRuta(
                { lat: origen.latitud, lng: origen.longitud },
                { lat: desti.latitud, lng: desti.longitud },
              ).then(setRoute);
            }}
          >
            Calcular ruta
          </Button>
        </div>
      </div>

      <MapContainer
        center={
          origen
            ? [origen.latitud, origen.longitud]
            : desti
              ? [desti.latitud, desti.longitud]
              : [41.3874, 2.1686]
        }
        zoom={10}
        className="h-[320px]"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {origen && (
          <Marker position={[origen.latitud, origen.longitud]} icon={simpleIcon("#1e3a5f")}>
            <Popup>Origen: {origen.nom}</Popup>
          </Marker>
        )}
        {desti && (
          <Marker position={[desti.latitud, desti.longitud]} icon={simpleIcon("#2d8a4e")}>
            <Popup>Desti: {desti.nom}</Popup>
          </Marker>
        )}
        {route && <Polyline positions={route.geometry.map((point) => [point.lat, point.lng])} color="#1e3a5f" />}
      </MapContainer>

      {route && (
        <div className="rounded-md border p-3 text-sm">
          <p>
            Distancia: <strong>{route.summary.distanceKm.toFixed(2)} km</strong>
          </p>
          <p>
            Temps estimat: <strong>{Math.round(route.summary.durationSeconds / 60)} min</strong>
          </p>
          <p className="text-xs text-slate-500">
            Provider: {route.summary.provider} {route.summary.cached ? "(cache)" : ""}
          </p>
        </div>
      )}
    </div>
  );
}
