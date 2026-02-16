import L from "leaflet";
import { useMemo, useState } from "react";
import { MapContainer, Marker, Polyline, Popup, TileLayer } from "react-leaflet";

import { type Coordinate, type GISRouteResult, type TipusUbicacio, type Ubicacio } from "@/types/gis";

interface MapaCompletProps {
  ubicacions: Ubicacio[];
  obra: Coordinate | null;
  rutes?: GISRouteResult[];
  heightClassName?: string;
}

function iconByType(type: TipusUbicacio) {
  const map: Record<TipusUbicacio, { color: string; label: string }> = {
    OBRA: { color: "#1e3a5f", label: "O" },
    PLANTA: { color: "#2d8a4e", label: "P" },
    PEDRERA: { color: "#d97706", label: "D" },
    ALTRE: { color: "#64748b", label: "A" },
  };

  const meta = map[type];
  return L.divIcon({
    className: "",
    html: `<div style="width:22px;height:22px;border-radius:9999px;background:${meta.color};color:#fff;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;border:2px solid #fff;box-shadow:0 0 0 1px #0f172a">${meta.label}</div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

function routeColor(index: number) {
  const colors = ["#1e3a5f", "#2d8a4e", "#d97706", "#9333ea", "#0ea5e9"];
  return colors[index % colors.length] ?? "#1e3a5f";
}

export function MapaComplet({ ubicacions, obra, rutes = [], heightClassName = "h-[420px]" }: MapaCompletProps) {
  const [showObra, setShowObra] = useState(true);
  const [showPlantes, setShowPlantes] = useState(true);
  const [showPedreres, setShowPedreres] = useState(true);
  const [showRoutes, setShowRoutes] = useState(true);

  const center = useMemo(() => {
    if (obra) {
      return [obra.lat, obra.lng] as [number, number];
    }
    const first = ubicacions[0];
    if (first) {
      return [first.latitud, first.longitud] as [number, number];
    }
    return [41.3874, 2.1686] as [number, number];
  }, [obra, ubicacions]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-4 rounded-md border p-3 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={showObra} onChange={(event) => setShowObra(event.target.checked)} /> Obra
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={showPlantes} onChange={(event) => setShowPlantes(event.target.checked)} /> Plantes
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={showPedreres} onChange={(event) => setShowPedreres(event.target.checked)} /> Pedreres
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={showRoutes} onChange={(event) => setShowRoutes(event.target.checked)} /> Rutes
        </label>
      </div>

      <MapContainer center={center} zoom={10} className={heightClassName}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {showObra && obra && (
          <Marker position={[obra.lat, obra.lng]} icon={iconByType("OBRA")}>
            <Popup>Obra</Popup>
          </Marker>
        )}

        {showPlantes &&
          ubicacions
            .filter((item) => item.tipus === "PLANTA")
            .map((item) => (
              <Marker key={item.id} position={[item.latitud, item.longitud]} icon={iconByType(item.tipus)}>
                <Popup>{item.nom} · {item.tipus}</Popup>
              </Marker>
            ))}

        {showPedreres &&
          ubicacions
            .filter((item) => item.tipus === "PEDRERA")
            .map((item) => (
              <Marker key={item.id} position={[item.latitud, item.longitud]} icon={iconByType(item.tipus)}>
                <Popup>{item.nom} · {item.tipus}</Popup>
              </Marker>
            ))}

        {showRoutes &&
          rutes.map((ruta, index) => (
            <Polyline key={ruta.id} positions={ruta.geometry.map((point) => [point.lat, point.lng])} color={routeColor(index)} weight={4} opacity={0.75}>
              <Popup>
                Distancia: {ruta.summary.distanceKm.toFixed(2)} km
                <br />
                Provider: {ruta.summary.provider}
              </Popup>
            </Polyline>
          ))}
      </MapContainer>

      <div className="rounded-md border p-3 text-xs text-slate-600">
        <p className="font-medium text-slate-700">Llegenda</p>
        <p>O: Obra · P: Planta · D: Pedrera</p>
        <p>Rutes: colors per origen/desti calculat</p>
      </div>
    </div>
  );
}
