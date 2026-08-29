import db from "./index.js";
import { newId } from "../utils/ids.js";
import { generateBuildingUlpin, generateUnitUlpin } from "../utils/ulpin.js";

const OWNER_NAMES = [
  "Rajesh Deshmukh",
  "Priya Kulkarni",
  "Anil Mehta",
  "Sunita Rao",
  "Vikram Joshi",
  "Neha Patil",
  "Sanjay Bhosale",
  "Kavita Shinde",
  "Amit Wagh",
  "Meera Naik",
];

const UNIT_TYPES = ["residential", "commercial"];

export function seedIfEmpty() {
  const count = db.prepare("SELECT COUNT(*) as n FROM buildings").get().n;
  if (count > 0) return;

  const buildingId = newId("bldg");
  const ulpinBase = generateBuildingUlpin("MH27", 1);
  const numFloors = 5;
  const floorHeight = 3.2;

  db.prepare(
    `INSERT INTO buildings (id, name, ulpinBase, address, modelUrl, heightMeters)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(
    buildingId,
    "College Building, Nagpur",
    ulpinBase,
    "Wardha Road, Nagpur, Maharashtra",
    null,
    numFloors * floorHeight
  );

  const insertFloor = db.prepare(
    `INSERT INTO floors (id, buildingId, floorNumber, minHeight, maxHeight, label) VALUES (?, ?, ?, ?, ?, ?)`
  );
  const insertUnit = db.prepare(
    `INSERT INTO units (id, ulpinId, floorId, buildingId, unitNumber, ownerName, area, unitType, coordinates)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  let ownerIdx = 0;
  const txn = db.transaction(() => {
    for (let f = 1; f <= numFloors; f++) {
      const floorId = newId("flr");
      const minHeight = (f - 1) * floorHeight;
      const maxHeight = f * floorHeight;
      insertFloor.run(floorId, buildingId, f, minHeight, maxHeight, `Floor ${f}`);

      const unitsOnFloor = f % 2 === 0 ? 2 : 3;
      for (let u = 1; u <= unitsOnFloor; u++) {
        const ulpinId = generateUnitUlpin(ulpinBase, f, u);
        const owner = OWNER_NAMES[ownerIdx % OWNER_NAMES.length];
        ownerIdx++;
        const unitType = UNIT_TYPES[(f + u) % 2];
        const area = 40 + ((f * 7 + u * 3) % 60);
        const width = 4 + (u % 3);
        const depth = 5 + (f % 3);
        const x = (u - 1) * (width + 0.5);
        const coordinates = {
          x,
          z: 0,
          width,
          depth,
        };

        insertUnit.run(
          newId("unit"),
          ulpinId,
          floorId,
          buildingId,
          u,
          owner,
          area,
          unitType,
          JSON.stringify(coordinates)
        );
      }
    }
  });
  txn();

  console.log(`Seeded demo building "${ulpinBase}" with ${numFloors} floors.`);
}
