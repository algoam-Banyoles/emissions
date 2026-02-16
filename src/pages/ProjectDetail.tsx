import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";

import { CalculadoraEmissions } from "@/components/forms/CalculadoraEmissions";
import { ExportadorBIM } from "@/components/forms/ExportadorBIM";
import { GeneradorEstructures } from "@/components/forms/GeneradorEstructures";
import { ProjectForm } from "@/components/forms/ProjectForm";
import { CalculDistancies } from "@/components/maps/CalculDistancies";
import { MapaComplet } from "@/components/maps/MapaComplet";
import { MapaProjecte } from "@/components/maps/MapaProjecte";
import { MapaUbicacions } from "@/components/maps/MapaUbicacions";
import { SelectorRuta } from "@/components/maps/SelectorRuta";
import { SelectorUbicacio } from "@/components/maps/SelectorUbicacio";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGIS } from "@/hooks/useGIS";
import { useProjects } from "@/hooks/useProjects";
import { type GISRouteResult, type Ubicacio } from "@/types/gis";
import { type ProjectDetail as ProjectDetailType } from "@/types/project";
import { formatDateTime } from "@/utils/locale";

export default function ProjectDetail() {
  const { t } = useTranslation();
  const { id } = useParams();
  const {
    getProject,
    updateProject,
    generarEstructures,
    obtenirEstatGeneracio,
    optimitzarPonderacio,
    optimitzarPareto,
    analisiSensibilitat,
    loading,
    error,
  } = useProjects();
  const { listUbicacions } = useGIS();
  const [project, setProject] = useState<ProjectDetailType | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [ubicacions, setUbicacions] = useState<Ubicacio[]>([]);
  const [routes, setRoutes] = useState<GISRouteResult[]>([]);
  const [distanciaMaterialsKm, setDistanciaMaterialsKm] = useState<number | undefined>(undefined);
  const [distanciaMesclaKm, setDistanciaMesclaKm] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (!id) {
      return;
    }
    void Promise.all([getProject(id), listUbicacions({ actiu: true })]).then(([loadedProject, loadedUbicacions]) => {
      setProject(loadedProject);
      setUbicacions(loadedUbicacions);
    });
  }, [id, getProject, listUbicacions]);

  if (!id) {
    return <p className="p-6">{t("projects.invalidProject")}</p>;
  }

  const inlineUpdate = async (field: keyof ProjectDetailType, value: string) => {
    if (!project) {
      return;
    }

    const numericFields = new Set<keyof ProjectDetailType>([
      "imd",
      "percentatgeVp",
      "vidaUtil",
      "creixementAnual",
      "latitud",
      "longitud",
    ]);

    const payloadValue =
      value === ""
        ? null
        : numericFields.has(field)
          ? Number(value)
          : value;
    const payload = { [field]: payloadValue };
    const updated = await updateProject(id, payload);
    setProject({
      ...project,
      ...updated,
    });
  };

  return (
    <main className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-corporate-blue">{t("projects.detailTitle")}</h1>
          <Link className="text-sm text-corporate-green hover:underline" to="/projects">
            {t("projects.backToList")}
          </Link>
        </div>
        <Button variant="outline" onClick={() => setEditModalOpen(true)}>
          {t("projects.editModal")}
        </Button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {!project ? (
        <p className="text-slate-600">{loading ? t("projects.loading") : "No trobat"}</p>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Dades del projecte (edicio inline)</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              <label className="text-sm">
                <span className="mb-1 block text-slate-600">Nom</span>
                <input
                  className="h-10 w-full rounded-md border px-3"
                  defaultValue={project.nom}
                  onBlur={(event) => void inlineUpdate("nom", event.target.value)}
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-slate-600">Codi</span>
                <input
                  className="h-10 w-full rounded-md border px-3"
                  defaultValue={project.codi}
                  onBlur={(event) => void inlineUpdate("codi", event.target.value)}
                />
              </label>
              <label className="text-sm md:col-span-2">
                <span className="mb-1 block text-slate-600">Descripcio</span>
                <input
                  className="h-10 w-full rounded-md border px-3"
                  defaultValue={project.descripcio ?? ""}
                  onBlur={(event) => void inlineUpdate("descripcio", event.target.value)}
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-slate-600">IMD</span>
                <input
                  className="h-10 w-full rounded-md border px-3"
                  defaultValue={project.imd ?? ""}
                  type="number"
                  onBlur={(event) => void inlineUpdate("imd", event.target.value)}
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-slate-600">% VP</span>
                <input
                  className="h-10 w-full rounded-md border px-3"
                  defaultValue={project.percentatgeVp ?? ""}
                  type="number"
                  onBlur={(event) => void inlineUpdate("percentatgeVp", event.target.value)}
                />
              </label>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Georeferenciacio de l'obra</CardTitle>
            </CardHeader>
            <CardContent>
              <MapaProjecte
                value={
                  project.latitud !== null && project.longitud !== null
                    ? { lat: project.latitud, lng: project.longitud }
                    : null
                }
                onChange={(coordinate) => {
                  void updateProject(id, { latitud: coordinate.lat, longitud: coordinate.lng }).then((updated) => {
                    setProject((current) => (current ? { ...current, ...updated } : current));
                  });
                }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mapa d'ubicacions (plantes i pedreres)</CardTitle>
            </CardHeader>
            <CardContent>
              <MapaUbicacions ubicacions={ubicacions} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Selector d'ubicacio amb geocodificacio inversa</CardTitle>
            </CardHeader>
            <CardContent>
              <SelectorUbicacio
                value={
                  project.latitud !== null && project.longitud !== null
                    ? { lat: project.latitud, lng: project.longitud }
                    : null
                }
                onConfirm={({ coordinates, adreca }) => {
                  void updateProject(id, { latitud: coordinates.lat, longitud: coordinates.lng, descripcio: adreca }).then((updated) => {
                    setProject((current) => (current ? { ...current, ...updated } : current));
                  });
                }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Selector de ruta</CardTitle>
            </CardHeader>
            <CardContent>
              <SelectorRuta ubicacions={ubicacions} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Calcul batch de distancies</CardTitle>
            </CardHeader>
            <CardContent>
              <CalculDistancies
                ubicacions={ubicacions}
                onDistancesChange={({ distanciaMaterialsKm, distanciaMesclaKm, routes }) => {
                  setDistanciaMaterialsKm(distanciaMaterialsKm);
                  setDistanciaMesclaKm(distanciaMesclaKm);
                  setRoutes(routes);
                }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mapa complet amb capes i rutes</CardTitle>
            </CardHeader>
            <CardContent>
              <MapaComplet
                ubicacions={ubicacions}
                obra={
                  project.latitud !== null && project.longitud !== null
                    ? { lat: project.latitud, lng: project.longitud }
                    : null
                }
                rutes={routes}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Generador d'estructures viables</CardTitle>
            </CardHeader>
            <CardContent>
              <GeneradorEstructures
                loading={loading}
                onGenerar={async (payload) => await generarEstructures(id, payload)}
                onPollJob={async (jobId) => await obtenirEstatGeneracio(id, jobId)}
                onOptimitzarPonderacio={async (estructures, pesos) => await optimitzarPonderacio(id, estructures, pesos)}
                onOptimitzarPareto={async (estructures) => await optimitzarPareto(id, estructures)}
                onAnalisiSensibilitat={async (estructures, options) => await analisiSensibilitat(id, estructures, options)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Exportacio BIM (IFC4)</CardTitle>
            </CardHeader>
            <CardContent>
              <ExportadorBIM projectId={id} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Calculadora d'emissions A1-A5</CardTitle>
            </CardHeader>
            <CardContent>
              <CalculadoraEmissions
                {...(distanciaMaterialsKm !== undefined ? { distanciaMaterialsKm } : {})}
                {...(distanciaMesclaKm !== undefined ? { distanciaMesclaKm } : {})}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Historic d'activitats</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {project.activitats.map((activity) => (
                  <li key={activity.id} className="rounded-md border p-3">
                    <p className="font-medium">{activity.tipus}</p>
                    <p className="text-slate-600">{activity.descripcio}</p>
                    <p className="text-xs text-slate-500">
                      {formatDateTime(activity.timestamp)}
                    </p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <ProjectForm
            open={editModalOpen}
            title={t("projects.editModal")}
            initialValue={project}
            onClose={() => setEditModalOpen(false)}
            onSubmit={async (values) => {
              const updated = await updateProject(id, values);
              const refreshed = await getProject(updated.id);
              setProject(refreshed);
            }}
          />
        </>
      )}
    </main>
  );
}
