import "dotenv/config";
import { DatabaseSync } from "node:sqlite";
import {
  applyMigrations,
  ensureDatabaseDirectory,
  getDatabasePath,
} from "../src/lib/bootstrap/migrations";

const databasePath = getDatabasePath();
ensureDatabaseDirectory(databasePath);

const database = new DatabaseSync(databasePath);
const applied = applyMigrations(database);
for (const name of applied) console.log(`Applied ${name}`);

database.close();
