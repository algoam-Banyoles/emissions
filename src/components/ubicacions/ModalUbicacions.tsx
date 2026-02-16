import L from "leaflet";
import { useMemo, useState } from "react";
import { Circle, MapContainer, Marker, Popup, TileLayer } from "react-leaflet";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/services/api";
import { calcularRutaORS } from "@/services/apis-externes/distancies.service";
import { importarPedreresOSM, obtenirUbicacionsProperes, type NearbyUbicacio } from "@/services/apis-externes/osm.service";
import { type Coordinate, type TipusUbicacio, type Ubicacio } from "@/types/gis";

interface ModalUbicacionsProps {
  open: boolean;
  obra: Coordinate | null;
  onClose: () => void;
  onSelectForProject: (ubicacio: Pick<Ubicacio, "nom" | "latitud" | "longitud" | "tipus">) => void;
}

const tipologies: { value: TipusUbicacio | "TOTS"; label: string }[] = [
  { value: "TOTS", label: "Tots" },
  { value: "PLANTA", label: "Plantes" },
  { value: "PEDRERA", label: "Pedreres" },
  { value: "ALTRE", label: "Factories/Additius" },
  { value: "OBRA", label: "Obres" },
];

function iconForType(tipus: TipusUbicacio) {
  const meta: Record<TipusUbicacio, { color: string; emoji: string }> = {
    PLANTA: { color: "#16a34a", emoji: "🟢" },
    PEDRERA: { color: "#a16207", emoji: "🟤" },
    ALTRE: { color: "#0f172a", emoji: "⚫" },
    OBRA: { color: "#2563eb", emoji: "🔵" },
  };

  const current = meta[tipus];
  return L.divIcon({
    className: "",
    html: `<div style="width:24px;height:24px;border-radius:9999px;background:${current.color};display:flex;align-items:center;justify-content:center;font-size:12px;border:2px solid #fff">${current.emoji}</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

function obraIcon() {
  return L.divIcon({
    className: "",
    html: `<div style="width:24px;height:24px;border-radius:9999px;background:#dc2626;display:flex;align-items:center;justify-content:center;font-size:12px;border:2px solid #fff">🔴</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

export function ModalUbicacions({ open, obra, onClose, onSelectForProject }: ModalUbicacionsProps) {
  const [radiusKm, setRadiusKm] = useState(50);
  const [search, setSearch] = useState("");
  const [tipusFilter, setTipusFilter] = useState<TipusUbicacio | "TOTS">("TOTS");
  const [ubicacions, setUbicacions] = useState<NearbyUbicacio[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ distanciaKm: number; duradaMin: number } | null>(null);
  const [importSummary, setImportSummary] = useState<string | null>(null);
  const [manualForm, setManualForm] = useState({
    nom: "",
    tipus: "PLANTA" as TipusUbicacio,
    adreca: "",
    latitud: obra?.lat ?? 41.3874,
    longitud: obra?.lng ?? 2.1686,
  });

  const selected = useMemo(
    () => ubicacions.find((item) => item.id === selectedId) ?? null,
    [selectedId, ubicacions],
  );

  const mapCenter = useMemo(() => {
    if (selected) {
      return [selected.latitud, selected.longitud] as [number, number];
    }
    if (obra) {
      return [obra.lat, obra.lng] as [number, number];
    }
    return [41.3874, 2.1686] as [number, number];
  }, [selected, obra]);

  const loadNearby = async () => {
    setLoading(true);
    setError(null);
    try {
      const lat = obra?.lat ?? 41.3874;
      const lng = obra?.lng ?? 2.1686;
      const data = await obtenirUbicacionsProperes(lat, lng, radiusKm, {
        ...(tipusFilter !== "TOTS" ? { tipus: tipusFilter } : {}),
        ...(search.trim().length > 0 ? { q: search.trim() } : {}),
        limit: 300,
      });
      setUbicacions(data);
      if (data.length > 0 && !selectedId) {
        setSelectedId(data[0].id);
      }
    } catch {
      setError("No s'han pogut carregar ubicacions properes");
    } finally {
      setLoading(false);
    }
  };

  const handleImportOsm = async () => {
    setLoading(true);
    setError(null);
    setImportSummary(null);
    try {
      const lat = obra?.lat ?? 41.3874;
      const lng = obra?.lng ?? 2.1686;
      const result = await importarPedreresOSM(lat, lng, radiusKm);
      setImportSummary(
        `OSM: ${result.importades} importades, ${result.duplicades} duplicades, ${result.totalDetectades} detectades.`,
      );
      await loadNearby();
    } catch {
      setError("No s'ha pogut importar des d'OSM");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateManual = async () => {
    if (manualForm.nom.trim().length < 2) {
      setError("El nom ha de tenir almenys 2 caracters");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await api.post("/ubicacions", {
        nom: manualForm.nom.trim(),
        tipus: manualForm.tipus,
        adreca: manualForm.adreca.trim().length > 0 ? manualForm.adreca.trim() : null,
        latitud: Number(manualForm.latitud),
        longitud: Number(manualForm.longitud),
      });
      setManualForm((prev) => ({ ...prev, nom: "", adreca: "" }));
      await loadNearby();
    } catch {
      setError("No s'ha pogut afegir la ubicacio manualment");
    } finally {
      setLoading(false);
    }
  };

  const handleCalcularRuta = async () => {
    if (!selected || !obra) {
      setError("Cal tenir obra i una ubicacio seleccionada");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const route = await calcularRutaORS(obra, { lat: selected.latitud, lng: selected.longitud });
      setRouteInfo({
        distanciaKm: route.distanciaKm,
        duradaMin: route.duradaMin,
      });
    } catch {
      setError("No s'ha pogut calcular la ruta");
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[60] bg-slate-950/70 p-2 md:p-6">
      <div className="flex h-full w-full flex-col rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b p-4">
          <div>
            <h3 className="text-lg font-semibold text-corporate-blue">Gestio d'ubicacions</h3>
            <p className="text-xs text-slate-600">Llista, mapa i detall en un sol espai</p>
          </div>
          <Button variant="outline" onClick={onClose}>
            Tancar
          </Button>
        </div>

        <div className="grid flex-1 gap-3 overflow-hidden p-3 md:grid-cols-[25%_50%_25%]">
          <section className="space-y-3 overflow-auto rounded-lg border p-3">
            <div className="space-y-2">
              <Label htmlFor="filter-search">Cercador</Label>
              <Input
                id="filter-search"
                placeholder="Nom o adreca"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="filter-tipus">Tipus</Label>
              <select
                id="filter-tipus"
                className="h-10 w-full rounded-md border px-3 text-sm"
                value={tipusFilter}
                onChange={(event) => setTipusFilter(event.target.value as TipusUbicacio | "TOTS")}
              >
                {tipologies.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="filter-radius">Radi maxim (km)</Label>
              <Input
                id="filter-radius"
                type="number"
                min={1}
                max={500}
                value={radiusKm}
                onChange={(event) => setRadiusKm(Number(event.target.value || 50))}
              />
            </div>
            <div className="grid gap-2">
              <Button variant="outline" onClick={() => void loadNearby()} disabled={loading}>
                Buscar ubicacions
              </Button>
              <Button onClick={() => void handleImportOsm()} disabled={loading}>
                Importar des d'OSM
              </Button>
            </div>
            {importSummary && <p className="rounded-md bg-slate-100 p-2 text-xs">{importSummary}</p>}
            {error && <p className="text-xs text-red-600">{error}</p>}

            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase text-slate-500">Ubicacions</p>
              <div className="max-h-[280px] space-y-1 overflow-auto">
                {ubicacions.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`w-full rounded-md border p-2 text-left text-xs ${
                      selectedId === item.id ? "border-corporate-blue bg-blue-50" : "hover:bg-slate-50"
                    }`}
                    onClick={() => setSelectedId(item.id)}
                  >
                    <p className="font-semibold">{item.nom}</p>
                    <p className="text-slate-600">
                      {item.tipus} · {item.distanciaKm.toFixed(1)} km
                    </p>
                  </button>
                ))}
                {ubicacions.length === 0 && <p className="text-xs text-slate-500">Sense resultats</p>}
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-lg border">
            <MapContainer center={mapCenter} zoom={10} className="h-full min-h-[380px]">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {obra && (
                <>
                  <Marker position={[obra.lat, obra.lng]} icon={obraIcon()}>
                    <Popup>Obra actual</Popup>
                  </Marker>
                  <Circle center={[obra.lat, obra.lng]} radius={radiusKm * 1000} pathOptions={{ color: "#dc2626", weight: 1 }} />
                </>
              )}
              {ubicacions.map((item) => (
                <Marker
                  key={item.id}
                  position={[item.latitud, item.longitud]}
                  icon={iconForType(item.tipus)}
                  eventHandlers={{
                    click: () => setSelectedId(item.id),
                  }}
                >
                  <Popup>
                    <p className="text-sm font-semibold">{item.nom}</p>
                    <p className="text-xs text-slate-600">{item.tipus}</p>
                    <p className="text-xs text-slate-600">{item.distanciaKm.toFixed(2)} km</p>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </section>

          <section className="space-y-3 overflow-auto rounded-lg border p-3">
            <p className="text-xs font-semibold uppercase text-slate-500">Detall ubicacio</p>
            {selected ? (
              <>
                <div className="space-y-1 rounded-md bg-slate-50 p-3 text-sm">
                  <p className="font-semibold">{selected.nom}</p>
                  <p>Tipus: {selected.tipus}</p>
                  <p>Adreca: {selected.adreca ?? "-"}</p>
                  <p>
                    Coordenades: {selected.latitud.toFixed(6)}, {selected.longitud.toFixed(6)}
                  </p>
                  <p>Distancia lineal: {selected.distanciaKm.toFixed(2)} km</p>
                </div>
                <div className="grid gap-2">
                  <Button variant="outline" onClick={() => void handleCalcularRuta()} disabled={loading || !obra}>
                    Calcular ruta
                  </Button>
                  <Button
                    className="bg-corporate-green hover:bg-corporate-green/90"
                    onClick={() =>
                      onSelectForProject({
                        nom: selected.nom,
                        latitud: selected.latitud,
                        longitud: selected.longitud,
                        tipus: selected.tipus,
                      })
                    }
                  >
                    Seleccionar per al projecte
                  </Button>
                </div>
                {routeInfo && (
                  <div className="rounded-md border p-2 text-xs">
                    <p>Distancia carretera: {routeInfo.distanciaKm.toFixed(2)} km</p>
                    <p>Durada estimada: {routeInfo.duradaMin.toFixed(0)} min</p>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-slate-500">Selecciona una ubicacio de la llista o del mapa.</p>
            )}

            <div className="space-y-2 border-t pt-3">
              <p className="text-xs font-semibold uppercase text-slate-500">Afegir manualment</p>
              <Input
                placeholder="Nom"
                value={manualForm.nom}
                onChange={(event) => setManualForm((prev) => ({ ...prev, nom: event.target.value }))}
              />
              <select
                className="h-10 w-full rounded-md border px-3 text-sm"
                value={manualForm.tipus}
                onChange={(event) => setManualForm((prev) => ({ ...prev, tipus: event.target.value as TipusUbicacio }))}
              >
                <option value="PLANTA">Planta</option>
                <option value="PEDRERA">Pedrera</option>
                <option value="ALTRE">Fabrica/Additiu</option>
                <option value="OBRA">Obra</option>
              </select>
              <Input
                placeholder="Adreca"
                value={manualForm.adreca}
                onChange={(event) => setManualForm((prev) => ({ ...prev, adreca: event.target.value }))}
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  step="0.000001"
                  placeholder="Latitud"
                  value={manualForm.latitud}
                  onChange={(event) => setManualForm((prev) => ({ ...prev, latitud: Number(event.target.value) }))}
                />
                <Input
                  type="number"
                  step="0.000001"
                  placeholder="Longitud"
                  value={manualForm.longitud}
                  onChange={(event) => setManualForm((prev) => ({ ...prev, longitud: Number(event.target.value) }))}
                />
              </div>
              <Button variant="outline" onClick={() => void handleCreateManual()} disabled={loading}>
                Afegir manualment
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
