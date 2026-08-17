import { serve } from "@hono/node-server";
import { trpcServer } from "@hono/trpc-server";
import {
	type HonoBindings,
	type HonoVariables,
	MastraServer,
} from "@mastra/hono";
import { createContext } from "@mastra-agents/api/context";
import { appRouter } from "@mastra-agents/api/routers/index";
import { env } from "@mastra-agents/env/server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { mastra } from "./mastra";

const app = new Hono<{
	Bindings: HonoBindings;
	Variables: HonoVariables;
}>();

const server = new MastraServer({
	app,
	mastra,
});

// Register middleware before server.init() so that it also applies to the
// /api/* routes that init() registers on the app. Hono matches handlers in
// registration order, so CORS registered after init() would be skipped for
// those routes.
app.use(logger());
app.use(
	"/*",
	cors({
		origin: env.CORS_ORIGIN,
		allowMethods: ["GET", "POST", "OPTIONS"],
		// Mastra Studio sends its API requests with credentials (cookies),
		// which requires an explicit allow-credentials header for the browser
		// to accept the cross-origin response.
		credentials: true,
	}),
);

await server.init();

app.use(
	"/trpc/*",
	trpcServer({
		router: appRouter,
		createContext: (_opts, context) => {
			return createContext({ context, mastra });
		},
	}),
);

serve(
	{
		fetch: app.fetch,
		port: 3000,
	},
	(info) => {
		console.log(`Server is running on http://localhost:${info.port}`);
	},
);
