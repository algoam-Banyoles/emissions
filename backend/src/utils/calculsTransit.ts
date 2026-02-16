export type CategoriaTransit = "TT1" | "TT2" | "TT3" | "TT4" | "TT5";

export function calcularCategoriaTransit(imd: number, percentatgeVp: number): CategoriaTransit {
  if (imd < 150 && percentatgeVp < 10) return "TT1";
  if (imd >= 150 && imd <= 1500 && percentatgeVp >= 10 && percentatgeVp <= 20) return "TT2";
  if (imd >= 1500 && imd <= 6000 && percentatgeVp >= 15 && percentatgeVp <= 25) return "TT3";
  if (imd >= 6000 && imd <= 15000 && percentatgeVp >= 20 && percentatgeVp <= 30) return "TT4";
  if (imd > 15000 || percentatgeVp > 25) return "TT5";

  if (imd > 15000 || percentatgeVp > 25) return "TT5";
  if (imd > 6000 || percentatgeVp > 20) return "TT4";
  if (imd > 1500 || percentatgeVp > 15) return "TT3";
  if (imd > 150 || percentatgeVp > 10) return "TT2";
  return "TT1";
}

