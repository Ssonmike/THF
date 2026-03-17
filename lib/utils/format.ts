export function formatNumber(value: number, maximumFractionDigits = 2) {
  return new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: 0,
    maximumFractionDigits
  }).format(value);
}

export function roundTo(value: number, decimals = 2) {
  const precision = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * precision) / precision;
}

export function formatQuantity(value: number) {
  const rounded = roundTo(value, value < 10 ? 2 : 1);

  if (Number.isInteger(rounded)) {
    return String(rounded);
  }

  if (rounded < 10) {
    return formatNumber(rounded, 2);
  }

  return formatNumber(rounded, 1);
}

export function titleCase(text: string) {
  return text
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}
