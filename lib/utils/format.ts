export function formatNumber(value: number, maximumFractionDigits = 2) {
  return new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: 0,
    maximumFractionDigits
  }).format(value);
}

export function formatQuantity(value: number) {
  if (Number.isInteger(value)) {
    return String(value);
  }

  if (value < 10) {
    return formatNumber(value, 2);
  }

  return formatNumber(value, 1);
}

export function titleCase(text: string) {
  return text
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}
