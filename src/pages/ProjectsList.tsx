import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { ProjectForm } from "@/components/forms/ProjectForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProjects } from "@/hooks/useProjects";
import { type Project, type ProjectStatus } from "@/types/project";
import { formatDate } from "@/utils/locale";

export default function ProjectsList() {
  const { t } = useTranslation();
  const { listProjects, createProject, deleteProject, loading, error } = useProjects();
  const [items, setItems] = useState<Project[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [nom, setNom] = useState("");
  const [estat, setEstat] = useState<ProjectStatus | "">("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const filters = useMemo(
    () => ({
      page,
      pageSize: 10,
      ...(nom ? { nom } : {}),
      ...(estat ? { estat } : {}),
      ...(dateFrom ? { dateFrom: new Date(`${dateFrom}T00:00:00.000Z`).toISOString() } : {}),
      ...(dateTo ? { dateTo: new Date(`${dateTo}T23:59:59.999Z`).toISOString() } : {}),
    }),
    [page, nom, estat, dateFrom, dateTo],
  );

  useEffect(() => {
    void listProjects(filters).then((result) => {
      setItems(result.items);
      setTotalPages(result.pagination.totalPages);
    });
  }, [filters, listProjects]);

  const handleDelete = async (id: string) => {
    await deleteProject(id);
    const refreshed = await listProjects(filters);
    setItems(refreshed.items);
    setTotalPages(refreshed.pagination.totalPages);
  };

  return (
    <main className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-corporate-blue">{t("projects.title")}</h1>
        <Button className="bg-corporate-green hover:bg-corporate-green/90" onClick={() => setModalOpen(true)}>
          {t("projects.newProject")}
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t("projects.filters")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          <input
            className="h-10 rounded-md border px-3 text-sm"
            placeholder={t("projects.projectNamePlaceholder")}
            value={nom}
            onChange={(event) => {
              setPage(1);
              setNom(event.target.value);
            }}
          />
          <select
            className="h-10 rounded-md border px-3 text-sm"
            value={estat}
            onChange={(event) => {
              setPage(1);
              setEstat(event.target.value as ProjectStatus | "");
            }}
          >
            <option value="">{t("projects.allStatuses")}</option>
            <option value="ESBORRANY">{t("projects.status.DRAFT")}</option>
            <option value="ACTIU">{t("projects.status.ACTIVE")}</option>
            <option value="COMPLETAT">{t("projects.status.COMPLETED")}</option>
            <option value="ARXIUAT">{t("projects.status.ARCHIVED")}</option>
          </select>
          <input className="h-10 rounded-md border px-3 text-sm" type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
          <input className="h-10 rounded-md border px-3 text-sm" type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("projects.list")}</CardTitle>
        </CardHeader>
        <CardContent>
          {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b">
                  <th className="p-2">{t("projects.code")}</th>
                  <th className="p-2">{t("projects.name")}</th>
                  <th className="p-2">{t("projectForm.status")}</th>
                  <th className="p-2">{t("projects.date")}</th>
                  <th className="p-2">{t("projects.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((project) => (
                  <tr key={project.id} className="border-b">
                    <td className="p-2">{project.codi}</td>
                    <td className="p-2">{project.nom}</td>
                    <td className="p-2">{project.estat}</td>
                    <td className="p-2">{formatDate(project.createdAt)}</td>
                    <td className="p-2">
                      <div className="flex gap-2">
                        <Link className="text-corporate-blue hover:underline" to={`/projects/${project.id}`}>
                          {t("projects.detail")}
                        </Link>
                        <button
                          className="text-red-600 hover:underline"
                          onClick={() => void handleDelete(project.id)}
                          type="button"
                        >
                          {t("projects.delete")}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!items.length && (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-slate-500">
                      {loading ? t("projects.loading") : t("projects.empty")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <Button variant="outline" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
              {t("projects.prev")}
            </Button>
            <span className="text-sm text-slate-600">
              {t("projects.pageOf", { page, totalPages })}
            </span>
            <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>
              {t("projects.next")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <ProjectForm
        open={modalOpen}
        title={t("projects.createModalTitle")}
        onClose={() => setModalOpen(false)}
        onSubmit={async (values) => {
          await createProject(values);
          const refreshed = await listProjects(filters);
          setItems(refreshed.items);
          setTotalPages(refreshed.pagination.totalPages);
        }}
      />
    </main>
  );
}
