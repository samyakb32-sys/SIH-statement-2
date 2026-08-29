/**
 * 3D-ULPIN ID generation.
 *
 * A regular ULPIN (Unique Land Parcel Identification Number) identifies a
 * 2D land parcel — it has no idea a 12-storey building sits on that parcel,
 * let alone who owns Floor 5, Unit B of it.
 *
 * A 3D-ULPIN extends the existing 2D ULPIN with a vertical address, so the
 * same identifier scheme that already works for land can also pin down a
 * single unit inside a building:
 *
 *   [2D ULPIN base]-F[FloorNumber]-U[UnitNumber]
 *
 * Example:
 *   MH27-BUILD-0142            <- existing 2D ULPIN for the land parcel
 *   MH27-BUILD-0142-F05-U02    <- Floor 5, Unit 2 inside that building
 *
 * Floor and unit numbers are zero-padded to 2 digits so IDs sort and align
 * visually in tables/search results.
 */

export function padNumber(num, width = 2) {
  return String(num).padStart(width, "0");
}

/** Build the base ULPIN for a new building, e.g. MH27-BUILD-0142 */
export function generateBuildingUlpin(stateCode, sequence) {
  const code = (stateCode || "IN00").toUpperCase();
  return `${code}-BUILD-${padNumber(sequence, 4)}`;
}

/** Build the full 3D-ULPIN for a unit given its building base, floor, and unit number. */
export function generateUnitUlpin(buildingUlpinBase, floorNumber, unitNumber) {
  return `${buildingUlpinBase}-F${padNumber(floorNumber)}-U${padNumber(unitNumber)}`;
}

/** Parse a 3D-ULPIN back into its parts. Returns null if it doesn't match the scheme. */
export function parseUnitUlpin(ulpinId) {
  const match = /^(.+)-F(\d+)-U(\d+)$/.exec(ulpinId.trim());
  if (!match) return null;
  const [, buildingUlpinBase, floorNumber, unitNumber] = match;
  return {
    buildingUlpinBase,
    floorNumber: Number(floorNumber),
    unitNumber: Number(unitNumber),
  };
}
