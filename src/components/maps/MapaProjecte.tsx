import L from "leaflet";
import { useMemo, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";

import { Button } from "@/components/ui/button";
import { useGIS } from "@/hooks/useGIS";
import { type Coordinate, type GeocodeResult } from "@/types/gis";

interface MapaProjecteProps {
  value: Coordinate | null;
  onChange: (coordinate: Coordinate) => void;
  heightClassName?: string;
}

function markerIcon(color: string) {
  return L.divIcon({
    className: "",
    html: `<div style="width:16px;height:16px;border-radius:9999px;background:${color};border:2px solid white;box-shadow:0 0 0 1px #0f172a"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

function RecenterMap({ center }: { center: Coordinate }) {
  const map = useMap();
  map.setView([center.lat, center.lng], map.getZoom());
  return null;
}

function ClickHandler({ onSelect }: { onSelect: (coordinate: Coordinate) => void }) {
  useMapEvents({
    click(event) {
      onSelect({ lat: event.latlng.lat, lng: event.latlng.lng });
    },
  });

  return null;
}

export function MapaProjecte({ value, onChange, heightClassName = "h-[320px]" }: MapaProjecteProps) {
  const { geocodeAddress, loading } = useGIS();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeocodeResult[]>([]);

  const center = value ?? { lat: 41.3874, lng: 2.1686 };
  const icon = useMemo(() => markerIcon("#1e3a5f"), []);

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Cercar adreca"
          className="h-10 flex-1 rounded-md border px-3 text-sm"
        />
        <Button
          variant="outline"
          disabled={query.trim().length < 3 || loading}
          onClick={() => {
            void geocodeAddress(query).then((items) => setResults(items));
          }}
        >
          Cercar
        </Button>
      </div>

      {results.length > 0 && (
        <div className="max-h-40 space-y-1 overflow-auto rounded-md border p-2">
          {results.map((item) => (
            <button
              key={`${item.lat}-${item.lng}-${item.label}`}
              type="button"
              className="block w-full rounded px-2 py-1 text-left text-xs hover:bg-slate-100"
              onClick={() => {
                onChange({ lat: item.lat, lng: item.lng });
                setResults([]);
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      <MapContainer center={[center.lat, center.lng]} zoom={12} className={heightClassName}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onSelect={onChange} />
        <RecenterMap center={center} />
        {value && (
          <Marker position={[value.lat, value.lng]} icon={icon}>
            <Popup>Ubicacio del projecte</Popup>
          </Marker>
        )}
      </MapContainer>
      <p className="text-xs text-slate-500">Fes clic al mapa per seleccionar coordenades.</p>
    </div>
  );
}
