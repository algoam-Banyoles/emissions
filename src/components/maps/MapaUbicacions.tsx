import L from "leaflet";
import { useMemo } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";

import { type TipusUbicacio, type Ubicacio } from "@/types/gis";

interface MapaUbicacionsProps {
  ubicacions: Ubicacio[];
  heightClassName?: string;
}

function iconByType(type: TipusUbicacio) {
  const map: Record<TipusUbicacio, { color: string; label: string }> = {
    OBRA: { color: "#1e3a5f", label: "O" },
    PLANTA: { color: "#2d8a4e", label: "P" },
    PEDRERA: { color: "#d97706", label: "D" },
    ALTRE: { color: "#6b7280", label: "A" },
  };

  const meta = map[type];
  return L.divIcon({
    className: "",
    html: `<div style="width:22px;height:22px;border-radius:9999px;background:${meta.color};color:#fff;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;border:2px solid #fff;box-shadow:0 0 0 1px #0f172a">${meta.label}</div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

export function MapaUbicacions({ ubicacions, heightClassName = "h-[360px]" }: MapaUbicacionsProps) {
  const center = useMemo(() => {
    if (ubicacions.length === 0) {
      return { lat: 41.3874, lng: 2.1686 };
    }

    const first = ubicacions[0];
    return { lat: first.latitud, lng: first.longitud };
  }, [ubicacions]);

  return (
    <MapContainer center={[center.lat, center.lng]} zoom={10} className={heightClassName}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {ubicacions.map((ubicacio) => (
        <Marker
          key={ubicacio.id}
          position={[ubicacio.latitud, ubicacio.longitud]}
          icon={iconByType(ubicacio.tipus)}
        >
          <Popup>
            <p className="text-sm font-semibold">{ubicacio.nom}</p>
            <p className="text-xs text-slate-600">Tipus: {ubicacio.tipus}</p>
            {ubicacio.adreca && <p className="text-xs text-slate-600">{ubicacio.adreca}</p>}
            {ubicacio.descripcio && <p className="text-xs text-slate-600">{ubicacio.descripcio}</p>}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
