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

await server.init();

app.use(logger());
app.use(
	"/*",
	cors({
		origin: env.CORS_ORIGIN,
		allowMethods: ["GET", "POST", "OPTIONS"],
	}),
);

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
