import type { Mastra } from "@mastra/core/mastra";
import type { Context as HonoContext } from "hono";

export type CreateContextOptions = {
	context: HonoContext;
	/** The Mastra instance that owns the agents exposed over tRPC. */
	mastra: Mastra;
};

export async function createContext({ mastra }: CreateContextOptions) {
	return {
		auth: null,
		session: null,
		mastra,
	};
}

export type Context = Awaited<ReturnType<typeof createContext>>;
