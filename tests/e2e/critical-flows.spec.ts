import { expect, test } from '@playwright/test';

type ProjectItem = {
  id: string;
  codi: string;
  nom: string;
  descripcio: string | null;
  estat: 'ESBORRANY' | 'ACTIU' | 'COMPLETAT' | 'ARXIUAT';
  organitzacioId: string;
  imd: number | null;
  percentatgeVp: number | null;
  tipusTracat: string | null;
  zonaClimatica: string | null;
  vidaUtil: number | null;
  creixementAnual: number | null;
  latitud: number | null;
  longitud: number | null;
  createdAt: string;
  updatedAt: string;
};

async function mockLogin(page: import('@playwright/test').Page, role: 'ADMIN' | 'ADMIN_EMISSIONS' = 'ADMIN') {
  await page.route('**/api/auth/login', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        accessToken: 'token-test',
        user: {
          id: 'u-1',
          email: 'admin@test.com',
          nom: 'Admin',
          rol: role,
          organitzacioId: 'org-1',
        },
      }),
    });
  });
}

async function doLogin(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.fill('#email', 'admin@test.com');
  await page.fill('#password', 'Password1!');
  await page.getByRole('button', { name: /sign in|entrar|iniciar/i }).click();
  await page.waitForURL('**/', { timeout: 15_000 });
}

test('login -> crear projecte -> generar estructures -> veure resultats', async ({ page }) => {
  const projects: ProjectItem[] = [
    {
      id: 'p-1',
      codi: 'PRJ-001',
      nom: 'Projecte Inicial',
      descripcio: 'desc',
      estat: 'ACTIU',
      organitzacioId: 'org-1',
      imd: 1000,
      percentatgeVp: 10,
      tipusTracat: 'TT2',
      zonaClimatica: 'ZC2',
      vidaUtil: 20,
      creixementAnual: 2,
      latitud: 41.4,
      longitud: 2.1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  await mockLogin(page);

  await page.route('**/api/projects*', async (route) => {
    const req = route.request();
    const url = req.url();
    if (req.method() === 'GET' && url.includes('/api/projects?')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: projects,
          pagination: { page: 1, pageSize: 10, total: projects.length, totalPages: 1 },
        }),
      });
      return;
    }

    if (req.method() === 'POST' && /\/api\/projects$/.test(url)) {
      const payload = req.postDataJSON() as Record<string, unknown>;
      const created: ProjectItem = {
        ...projects[0],
        id: 'p-2',
        codi: String(payload.codi),
        nom: String(payload.nom),
        estat: 'ESBORRANY',
      };
      projects.push(created);
      await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(created) });
      return;
    }

    if (req.method() === 'GET' && /\/api\/projects\/p-2$/.test(url)) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...projects[1], activitats: [] }),
      });
      return;
    }

    if (req.method() === 'GET' && /\/api\/projects\/p-2\/estructures/.test(url)) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          mode: 'sync',
          cacheHit: false,
          pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
          meta: { combinacionsTotals: 1, viablesTotals: 1 },
          items: [],
        }),
      });
      return;
    }

    if (req.method() === 'POST' && /\/api\/projects\/p-2\/estructures\/generar/.test(url)) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          mode: 'sync',
          cacheHit: false,
          pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
          meta: { combinacionsTotals: 12, viablesTotals: 1 },
          items: [
            {
              id: 'est-1',
              gruixTotalCm: 20,
              capes: [
                { tipus: 'RODAMENT', nom: 'CR', gruixCm: 5, modulElasticMpa: 5000, coeficientPoisson: 0.35 },
                { tipus: 'BASE', nom: 'CB', gruixCm: 15, modulElasticMpa: 3500, coeficientPoisson: 0.35 },
              ],
              verificacio: {
                viable: true,
                ratios: { fatiga: 0.5, aixecament: 0.4 },
                deformacions: {
                  epsilonTraccioMicro: 120,
                  epsilonCompressioMicro: 200,
                  deformacioSuperficialMm: 8,
                },
              },
              emissions: { totalKgT: 50, kgM2: 22, nivell: 'BAIX', distanciaMaterialsKm: 10, distanciaMesclaKm: 20 },
              costos: {
                materialEurM2: 20,
                transportEurM2: 5,
                fabricacioEurM2: 8,
                posadaObraEurM2: 4,
                totalEurM2: 37,
                costAnyVidaUtilEurM2: 1.8,
                areaM2: 1000,
                vidaUtilAnys: 20,
                perCapa: [],
              },
            },
          ],
        }),
      });
      return;
    }

    await route.continue();
  });

  await page.route('**/api/ubicacions**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
  });

  await doLogin(page);
  await page.getByRole('link', { name: /projects|projectes|proyectos|projets/i }).click();
  await page.getByRole('button', { name: /new project|nou projecte/i }).click();
  await page.fill('#codi', 'PRJ-002');
  await page.fill('#nom', 'Projecte E2E');
  await page.getByRole('button', { name: /save|guardar/i }).click();

  await page.getByRole('link', { name: /detail|detall/i }).last().click();
  await page.getByRole('button', { name: /Generar estructures viables/i }).click();

  await expect(page.getByText(/Combinacions:/i)).toBeVisible();
  await expect(page.getByText(/Estructura/i)).toBeVisible();
});

test('generar certificat -> descarregar PDF en idioma seleccionat', async ({ page }) => {
  const cert = {
    id: 'c-1',
    codi: 'CERT-2026-TEST',
    organitzacioId: 'org-1',
    projecteNom: 'Projecte Test',
    obraNom: 'Obra Test',
    fabricantNom: 'Fabricant Test',
    mesclaNom: 'MBC',
    tipologiaMescla: 'MBC_CONVENCIONAL',
    estat: 'VALID',
    dataEmissio: new Date().toISOString(),
    dataCaducitat: new Date(Date.now() + 86400000).toISOString(),
    versioMetodologia: 'OC 3/2024',
    quantitatTones: 100,
    emissions: { A1: 10, A2: 5, A3: 8, A4: 4, A5: 3, total: 30, limit: 70, unitat: 'kg CO2e/t' },
    signaturaDigital: false,
    idioma: 'ca',
    pdfPath: '',
    pdfUrl: '/api/certificats/c-1/pdf',
    createdBy: 'u-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await mockLogin(page);

  await page.route('**/api/certificats', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [cert] }) });
      return;
    }
    if (route.request().method() === 'POST') {
      await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(cert) });
      return;
    }
    await route.continue();
  });

  await page.route('**/api/certificats/*/pdf**', async (route) => {
    await route.fulfill({
      status: 200,
      headers: {
        'content-type': 'application/pdf',
      },
      body: 'PDF',
    });
  });

  await doLogin(page);
  await page.getByRole('link', { name: /create certification|crear certificacio|certificats/i }).click();
  await page.getByRole('button', { name: /generate pdf|generar pdf/i }).click();
  await expect(page.getByText(/CERT-2026-TEST/i)).toBeVisible();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /download|descarregar/i }).first().click();
  const download = await downloadPromise;
  expect(download.suggestedFilename().toLowerCase()).toContain('.pdf');
});

test('importar banc de preus i publicar versio', async ({ page }) => {
  await mockLogin(page, 'ADMIN');

  let versions = [
    {
      id: 'v-1',
      numero: '2026.01',
      descripcio: 'Inicial',
      estat: 'PUBLICADA',
      esActual: true,
      dataPublicacio: new Date().toISOString(),
      materialsCount: 10,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  await page.route('**/api/admin/versions**', async (route) => {
    const req = route.request();
    if (req.method() === 'GET') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(versions) });
      return;
    }
    if (req.method() === 'POST') {
      const payload = req.postDataJSON() as Record<string, unknown>;
      const created = {
        ...versions[0],
        id: 'v-2',
        numero: String(payload.numero),
        descripcio: String(payload.descripcio ?? ''),
        esActual: false,
      };
      versions = [versions[0], created];
      await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(created) });
      return;
    }
    await route.continue();
  });

  await page.route('**/api/admin/versions/compare**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ summary: { created: 1, updated: 0, removed: 0 } }) });
  });

  await page.route('**/api/admin/importar-preus', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ version: versions[0], imported: 2 }),
    });
  });

  await doLogin(page);
  await page.getByRole('link', { name: /versions/i }).click();

  await page.fill('input[placeholder="Numero (ex. 2026.02)"]', '2026.02');
  await page.fill('input[placeholder="Descripcio"]', 'Publicacio e2e');
  await page.getByRole('button', { name: /publicar/i }).click();

  await expect(page.getByText('2026.02')).toBeVisible();

  await page.getByRole('button', { name: /importar csv/i }).click();
  const chooser = page.locator('input[type="file"]');
  await chooser.setInputFiles({
    name: 'preus.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from('CODI;NOM;TIPUS;PREU\nMAT1;Material 1;GRAVA;10\nMAT2;Material 2;BASE;20'),
  });
  await page.getByRole('button', { name: /importar/i }).last().click();

  await expect(page.getByText(/Llista de versions/i)).toBeVisible();
});
