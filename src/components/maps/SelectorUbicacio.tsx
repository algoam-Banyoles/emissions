import { useMemo, useState } from "react";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";

import { Button } from "@/components/ui/button";
import { useGIS } from "@/hooks/useGIS";
import { type Coordinate } from "@/types/gis";

interface SelectorUbicacioProps {
  value: Coordinate | null;
  onConfirm: (value: { coordinates: Coordinate; adreca: string }) => void;
}

function MapClickSelector({ onSelect }: { onSelect: (coordinates: Coordinate) => void }) {
  useMapEvents({
    click(event) {
      onSelect({ lat: event.latlng.lat, lng: event.latlng.lng });
    },
  });
  return null;
}

export function SelectorUbicacio({ value, onConfirm }: SelectorUbicacioProps) {
  const { geocodeAddress, geocodeReverse, loading } = useGIS();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Coordinate | null>(value);
  const [adreca, setAdreca] = useState("");
  const [results, setResults] = useState<{ label: string; lat: number; lng: number }[]>([]);

  const center = useMemo(() => {
    const current = selected ?? value;
    if (current) {
      return [current.lat, current.lng] as [number, number];
    }
    return [41.3874, 2.1686] as [number, number];
  }, [selected, value]);

  const resolveAddress = async (coords: Coordinate) => {
    const reverse = await geocodeReverse(coords);
    setAdreca(reverse.adreca);
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          className="h-10 flex-1 rounded-md border px-3 text-sm"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Cercar adreca"
        />
        <Button
          variant="outline"
          disabled={query.trim().length < 3 || loading}
          onClick={() => {
            void geocodeAddress(query).then(setResults);
          }}
        >
          Cercar
        </Button>
      </div>

      {results.length > 0 && (
        <div className="max-h-36 overflow-auto rounded-md border p-2 text-xs">
          {results.map((result) => (
            <button
              key={`${result.lat}-${result.lng}-${result.label}`}
              type="button"
              className="block w-full rounded px-2 py-1 text-left hover:bg-slate-100"
              onClick={() => {
                const coords = { lat: result.lat, lng: result.lng };
                setSelected(coords);
                setAdreca(result.label);
                setResults([]);
              }}
            >
              {result.label}
            </button>
          ))}
        </div>
      )}

      <MapContainer center={center} zoom={12} className="h-[300px]">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickSelector
          onSelect={(coords) => {
            setSelected(coords);
            void resolveAddress(coords);
          }}
        />
        {selected && <Marker position={[selected.lat, selected.lng]} />}
      </MapContainer>

      <div className="rounded-md border p-3 text-sm">
        <p>Coordenades seleccionades: {selected ? `${selected.lat.toFixed(6)}, ${selected.lng.toFixed(6)}` : "-"}</p>
        <p className="text-slate-600">Adreca: {adreca || "-"}</p>
      </div>

      <Button
        className="bg-corporate-green hover:bg-corporate-green/90"
        disabled={!selected || !adreca}
        onClick={() => {
          if (!selected || !adreca) {
            return;
          }
          onConfirm({ coordinates: selected, adreca });
        }}
      >
        Confirmar ubicacio
      </Button>
    </div>
  );
}
