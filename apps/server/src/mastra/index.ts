import { fileURLToPath } from "node:url";
import { Mastra } from "@mastra/core/mastra";
import { MastraCompositeStore } from "@mastra/core/storage";
import { DuckDBStore } from "@mastra/duckdb";
import { LibSQLStore } from "@mastra/libsql";
import { PinoLogger } from "@mastra/loggers";
import {
	MastraPlatformExporter,
	MastraStorageExporter,
	Observability,
	SensitiveDataFilter,
} from "@mastra/observability";
import { weatherAgent } from "./agents/weather-agent";
import { weatherWorkflow } from "./workflows/weather-workflow";

// Resolve storage files relative to this source file instead of process.cwd().
// `mastra dev` and `mastra studio` run from different working directories
// (e.g. `src/mastra/public`), and relative paths like "file:./mastra.db" would
// otherwise split the database across several files per process.
const storageFile = (name: string) =>
	fileURLToPath(new URL(`../../${name}`, import.meta.url));
const libsqlUrl = () => `file:${storageFile("mastra.db")}`;
const duckdbPath = () => storageFile("mastra.duckdb");

export const mastra: Mastra = new Mastra({
	workflows: { weatherWorkflow },
	agents: { weatherAgent },
	storage: new MastraCompositeStore({
		id: "composite-storage",
		default: new LibSQLStore({
			id: "mastra-storage",
			// Uses a hosted database when deployed (mastra env db create --kind turso),
			// and a local file during development.
			url: process.env.TURSO_DATABASE_URL ?? libsqlUrl(),
			authToken: process.env.TURSO_AUTH_TOKEN,
		}),
		domains: {
			observability: await new DuckDBStore({
				path: duckdbPath(),
			}).getStore("observability"),
		},
	}),
	logger: new PinoLogger({
		name: "Mastra",
		level: "info",
	}),
	observability: new Observability({
		configs: {
			default: {
				serviceName: "mastra",
				exporters: [
					new MastraStorageExporter(), // Persists observability events to Mastra Storage
					new MastraPlatformExporter(), // Sends observability events to Mastra Platform (if MASTRA_PLATFORM_ACCESS_TOKEN is set)
				],
				spanOutputProcessors: [
					new SensitiveDataFilter(), // Redacts sensitive data like passwords, tokens, keys
				],
				logging: {
					// Forward logger calls to observability storage so Studio's
					// Logs view shows agent logs. Without this the logger
					// defaults to forwarding only warn+ level logs.
					enabled: true,
					level: "info",
				},
			},
		},
	}),
});
