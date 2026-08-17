import type { Agent } from "@mastra/core/agent";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { publicProcedure, router } from "../index";

const chatInputSchema = z.object({
	/** Id of the Mastra agent to talk to. Defaults to the weather agent. */
	agentId: z.string().min(1).default("weatherAgent"),
	/**
	 * Client-owned conversation id. Passing the same `threadId` across turns
	 * lets the agent recall the conversation through its Memory store.
	 */
	threadId: z.string().min(1),
	message: z.string().min(1).max(16_000),
});

const userMessage = (message: string) => [
	{ role: "user" as const, content: message },
];

function resolveAgent(agents: Record<string, Agent>, agentId: string): Agent {
	const agent = agents[agentId];
	if (!agent) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: `Agent "${agentId}" not found. Available: ${Object.keys(agents).join(", ")}`,
		});
	}
	return agent;
}

export const agentsRouter = router({
	/** List the agents registered on the Mastra instance. */
	list: publicProcedure.query(async ({ ctx }) => {
		const agents = ctx.mastra.listAgents();
		return Object.entries(agents).map(([id, agent]) => ({
			id,
			name: agent.name ?? id,
		}));
	}),

	/** Non-streaming chat: returns the full assistant reply in one shot. */
	chat: publicProcedure
		.input(chatInputSchema)
		.mutation(async ({ ctx, input }) => {
			const agent = resolveAgent(ctx.mastra.listAgents(), input.agentId);
			const output = await agent.generate(userMessage(input.message), {
				memory: { thread: input.threadId, resource: "default" },
			});
			return {
				threadId: input.threadId,
				text: output.text,
				finishReason: output.finishReason,
			};
		}),

	/**
	 * Streaming chat over SSE. Yields one `text-delta` event per generated
	 * chunk, then a final `done` event with the full reply.
	 */
	chatStream: publicProcedure
		.input(chatInputSchema)
		.subscription(async function* ({ ctx, input }) {
			const agent = resolveAgent(ctx.mastra.listAgents(), input.agentId);
			const stream = await agent.stream(userMessage(input.message), {
				memory: { thread: input.threadId, resource: "default" },
			});

			for await (const chunk of stream.textStream) {
				yield { type: "text-delta", text: chunk };
			}

			yield { type: "done", text: await stream.text };
		}),
});
