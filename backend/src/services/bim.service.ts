import crypto from "node:crypto";

import { z } from "zod";

const estructuraIfcSchema = z.object({
  nom: z.string().optional(),
  capes: z.array(
    z.object({
      tipus: z.enum(["RODAMENT", "INTERMEDIA", "BASE", "SUBBASE", "FONAMENT"]),
      nom: z.string().min(1),
      gruixCm: z.number().positive(),
      modulElasticMpa: z.number().positive(),
      coeficientPoisson: z.number().min(0.05).max(0.49),
    }),
  ).min(1),
  emissions: z
    .object({
      A1: z.number().optional(),
      A2: z.number().optional(),
      A3: z.number().optional(),
      A4: z.number().optional(),
      A5: z.number().optional(),
      totalKgT: z.number().optional(),
      kgM2: z.number().optional(),
    })
    .optional(),
  costos: z
    .object({
      materialEurM2: z.number().optional(),
      transportEurM2: z.number().optional(),
      fabricacioEurM2: z.number().optional(),
      posadaObraEurM2: z.number().optional(),
      totalEurM2: z.number().optional(),
      costAnyVidaUtilEurM2: z.number().optional(),
      perCapa: z.array(
        z.object({
          tipus: z.string(),
          nom: z.string(),
          costTotalEurM2: z.number(),
        }),
      ).optional(),
    })
    .optional(),
});

export type EstructuraIfcInput = z.infer<typeof estructuraIfcSchema>;

interface ProjecteIfcInput {
  id: string;
  codi: string;
  nom: string;
  descripcio?: string | null;
}

class IfcBuilder {
  private counter = 1;
  private readonly lines: string[] = [];

  add(entity: string) {
    const id = this.counter;
    this.lines.push(`#${id}=${entity};`);
    this.counter += 1;
    return id;
  }

  build() {
    return this.lines.join("\n");
  }
}

function ifcGuid() {
  return crypto.randomBytes(16).toString("base64url").replace(/[-_]/g, "0").slice(0, 22);
}

function ifcText(value: string) {
  return `'${value.replace(/'/g, "''")}'`;
}

function round(value: number, decimals = 6) {
  return Number(value.toFixed(decimals));
}

function nowIfcDate() {
  const now = new Date();
  return now.toISOString().replace("T", " ").slice(0, 19);
}

function buildIfcContent(projecte: ProjecteIfcInput, estructura: EstructuraIfcInput) {
  const b = new IfcBuilder();

  const person = b.add("IFCPERSON($,$,$,$,$,$,$,$)");
  const org = b.add(`IFCORGANIZATION($,${ifcText("Emissionsv2")},$,$,$)`);
  const personOrg = b.add(`IFCPERSONANDORGANIZATION(#${person},#${org},$)`);
  const app = b.add(`IFCAPPLICATION(#${org},${ifcText("1.0")},${ifcText("Emissionsv2 BIM Export")},${ifcText("EM2")})`);
  const ownerHistory = b.add(`IFCOWNERHISTORY(#${personOrg},#${app},$,.ADDED.,$, $, $, ${Math.floor(Date.now() / 1000)})`);

  const originPoint = b.add("IFCCARTESIANPOINT((0.,0.,0.))");
  const axisZ = b.add("IFCDIRECTION((0.,0.,1.))");
  const axisX = b.add("IFCDIRECTION((1.,0.,0.))");
  const wcs = b.add(`IFCAXIS2PLACEMENT3D(#${originPoint},#${axisZ},#${axisX})`);
  const context = b.add(`IFCGEOMETRICREPRESENTATIONCONTEXT($,${ifcText("Model")},3,1.E-05,#${wcs},$)`);
  const unitLength = b.add("IFCSIUNIT(*,.LENGTHUNIT.,$,.METRE.)");
  const unitArea = b.add("IFCSIUNIT(*,.AREAUNIT.,$,.SQUARE_METRE.)");
  const unitVolume = b.add("IFCSIUNIT(*,.VOLUMEUNIT.,$,.CUBIC_METRE.)");
  const units = b.add(`IFCUNITASSIGNMENT((#${unitLength},#${unitArea},#${unitVolume}))`);

  const project = b.add(
    `IFCPROJECT(${ifcText(ifcGuid())},#${ownerHistory},${ifcText(projecte.nom)},${ifcText(projecte.descripcio ?? "")},$,${ifcText(projecte.codi)},$, (#${context}), #${units})`,
  );

  const sitePlacement = b.add(`IFCLOCALPLACEMENT($,#${wcs})`);
  const site = b.add(`IFCSITE(${ifcText(ifcGuid())},#${ownerHistory},${ifcText("Site")},$, $, #${sitePlacement}, $, $, .ELEMENT., $, $, $, $, $, $)`);

  const buildingPlacement = b.add(`IFCLOCALPLACEMENT(#${sitePlacement},#${wcs})`);
  const building = b.add(`IFCBUILDING(${ifcText(ifcGuid())},#${ownerHistory},${ifcText(projecte.nom)},$, $, #${buildingPlacement}, $, $, .ELEMENT., $, $, $)`);

  const storeyPlacement = b.add(`IFCLOCALPLACEMENT(#${buildingPlacement},#${wcs})`);
  const storey = b.add(`IFCBUILDINGSTOREY(${ifcText(ifcGuid())},#${ownerHistory},${ifcText("Pavement Layers")},$, $, #${storeyPlacement}, $, $, .ELEMENT., 0.)`);

  b.add(`IFCRELAGGREGATES(${ifcText(ifcGuid())},#${ownerHistory},${ifcText("Project decomposition")},$,#${project},(#${site}))`);
  b.add(`IFCRELAGGREGATES(${ifcText(ifcGuid())},#${ownerHistory},${ifcText("Site decomposition")},$,#${site},(#${building}))`);
  b.add(`IFCRELAGGREGATES(${ifcText(ifcGuid())},#${ownerHistory},${ifcText("Building decomposition")},$,#${building},(#${storey}))`);

  const layerElementRefs: number[] = [];

  const widthM = 1;
  const lengthM = 1;

  let currentZ = 0;
  estructura.capes.forEach((capa, index) => {
    const layerName = `${capa.tipus}_${index + 1}`;
    const depthM = round(capa.gruixCm / 100, 4);

    const layerPoint = b.add(`IFCCARTESIANPOINT((0.,0.,${round(currentZ, 4)}))`);
    const layerAxis3d = b.add(`IFCAXIS2PLACEMENT3D(#${layerPoint},#${axisZ},#${axisX})`);
    const layerPlacement = b.add(`IFCLOCALPLACEMENT(#${storeyPlacement},#${layerAxis3d})`);

    const profileOrigin = b.add("IFCCARTESIANPOINT((0.,0.))");
    const profileAxis = b.add("IFCAXIS2PLACEMENT2D(#" + profileOrigin + ")");
    const profile = b.add(`IFCRECTANGLEPROFILEDEF(.AREA.,${ifcText(layerName)},#${profileAxis},${widthM},${lengthM})`);
    const bodyAxis = b.add(`IFCAXIS2PLACEMENT3D(#${originPoint},#${axisZ},#${axisX})`);
    const solid = b.add(`IFCEXTRUDEDAREASOLID(#${profile},#${bodyAxis},#${axisZ},${depthM})`);
    const shapeRep = b.add(`IFCSHAPEREPRESENTATION(#${context},${ifcText("Body")},${ifcText("SweptSolid")},(#${solid}))`);
    const prodShape = b.add(`IFCPRODUCTDEFINITIONSHAPE($,$,(#${shapeRep}))`);

    const proxy = b.add(`IFCBUILDINGELEMENTPROXY(${ifcText(ifcGuid())},#${ownerHistory},${ifcText(layerName)},${ifcText(capa.nom)},$,#${layerPlacement},#${prodShape},$,${ifcText("PAVEMENT_LAYER")})`);
    layerElementRefs.push(proxy);

    const costPerLayer = estructura.costos?.perCapa?.find((item) => item.nom === capa.nom || item.tipus === capa.tipus)?.costTotalEurM2;

    const propGruix = b.add(`IFCPROPERTYSINGLEVALUE(${ifcText("Gruix_cm")},$,IFCREAL(${round(capa.gruixCm, 4)}),$)`);
    const propMaterial = b.add(`IFCPROPERTYSINGLEVALUE(${ifcText("Material")},$,IFCTEXT(${ifcText(capa.nom)}),$)`);
    const propModul = b.add(`IFCPROPERTYSINGLEVALUE(${ifcText("ModulElastic_MPa")},$,IFCREAL(${round(capa.modulElasticMpa, 4)}),$)`);
    const propPoisson = b.add(`IFCPROPERTYSINGLEVALUE(${ifcText("Poisson")},$,IFCREAL(${round(capa.coeficientPoisson, 4)}),$)`);
    const propEtotal = b.add(`IFCPROPERTYSINGLEVALUE(${ifcText("Emissions_Total_kgCO2e_t")},$,IFCREAL(${round(estructura.emissions?.totalKgT ?? 0, 4)}),$)`);
    const propEa1 = b.add(`IFCPROPERTYSINGLEVALUE(${ifcText("Emissions_A1")},$,IFCREAL(${round(estructura.emissions?.A1 ?? 0, 4)}),$)`);
    const propEa2 = b.add(`IFCPROPERTYSINGLEVALUE(${ifcText("Emissions_A2")},$,IFCREAL(${round(estructura.emissions?.A2 ?? 0, 4)}),$)`);
    const propEa3 = b.add(`IFCPROPERTYSINGLEVALUE(${ifcText("Emissions_A3")},$,IFCREAL(${round(estructura.emissions?.A3 ?? 0, 4)}),$)`);
    const propEa4 = b.add(`IFCPROPERTYSINGLEVALUE(${ifcText("Emissions_A4")},$,IFCREAL(${round(estructura.emissions?.A4 ?? 0, 4)}),$)`);
    const propEa5 = b.add(`IFCPROPERTYSINGLEVALUE(${ifcText("Emissions_A5")},$,IFCREAL(${round(estructura.emissions?.A5 ?? 0, 4)}),$)`);
    const propCostTotal = b.add(`IFCPROPERTYSINGLEVALUE(${ifcText("Cost_Total_EUR_m2")},$,IFCREAL(${round(estructura.costos?.totalEurM2 ?? 0, 4)}),$)`);
    const propCostAnual = b.add(`IFCPROPERTYSINGLEVALUE(${ifcText("Cost_AnyVidaUtil_EUR_m2_any")},$,IFCREAL(${round(estructura.costos?.costAnyVidaUtilEurM2 ?? 0, 4)}),$)`);
    const propCostLayer = b.add(`IFCPROPERTYSINGLEVALUE(${ifcText("Cost_Capa_EUR_m2")},$,IFCREAL(${round(costPerLayer ?? 0, 4)}),$)`);

    const pset = b.add(`IFCPROPERTYSET(${ifcText(ifcGuid())},#${ownerHistory},${ifcText("Pset_PavementLayer_${index + 1}")},$, (#${propGruix},#${propMaterial},#${propModul},#${propPoisson},#${propEtotal},#${propEa1},#${propEa2},#${propEa3},#${propEa4},#${propEa5},#${propCostTotal},#${propCostAnual},#${propCostLayer}))`);
    b.add(`IFCRELDEFINESBYPROPERTIES(${ifcText(ifcGuid())},#${ownerHistory},${ifcText("Layer properties")},$, (#${proxy}), #${pset})`);

    currentZ += depthM;
  });

  if (layerElementRefs.length > 0) {
    b.add(`IFCRELCONTAINEDINSPATIALSTRUCTURE(${ifcText(ifcGuid())},#${ownerHistory},${ifcText("Storey containment")},$,(${layerElementRefs.map((id) => `#${id}`).join(",")}),#${storey})`);
  }

  return `ISO-10303-21;\nHEADER;\nFILE_DESCRIPTION(('ViewDefinition [CoordinationView]'),'2;1');\nFILE_NAME(${ifcText(`${projecte.codi}.ifc`)},${ifcText(nowIfcDate())},(${ifcText("Emissionsv2")}),(${ifcText("Emissionsv2")}),${ifcText("Emissionsv2 BIM Export")},${ifcText("Emissionsv2")},'');\nFILE_SCHEMA(('IFC4'));\nENDSEC;\nDATA;\n${b.build()}\nENDSEC;\nEND-ISO-10303-21;\n`;
}

export const bimService = {
  parseEstructura(input: unknown) {
    return estructuraIfcSchema.parse(input);
  },

  exportarAIFC(projecte: ProjecteIfcInput, estructuraInput: unknown) {
    const estructura = this.parseEstructura(estructuraInput);
    const content = buildIfcContent(projecte, estructura);
    const fileName = `${projecte.codi}_${(estructura.nom ?? "estructura").replace(/\s+/g, "_")}.ifc`;

    return {
      fileName,
      content,
      mimeType: "application/x-step",
    };
  },
};
