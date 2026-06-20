export function assertMappedValue<Source extends string, Target>(
  mapName: string,
  value: Source,
  mapping: Record<Source, Target>,
): Target {
  const mappedValue = mapping[value];

  if (mappedValue === undefined) {
    throw new Error(`Unsupported ${mapName} value: ${value}`);
  }

  return mappedValue;
}

export function hasValue<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

export function optionalNumber(value: number | null | undefined) {
  return hasValue(value) ? value : undefined;
}

export function optionalString(value: string | null | undefined) {
  return hasValue(value) && value.length > 0 ? value : undefined;
}

export function toDate(value: string) {
  return new Date(value);
}

export function toOptionalDate(value: string | null | undefined) {
  return hasValue(value) ? toDate(value) : undefined;
}

export function copyJson<T>(value: T): T {
  return structuredClone(value);
}
