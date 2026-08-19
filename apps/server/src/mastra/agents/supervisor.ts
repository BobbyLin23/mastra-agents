import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";

const writer = new Agent({
	id: "writer",
	name: "Writer",
	instructions: "Write content based on the supervisor's instructions.",
	model: "deepseek/deepseek-v4-flash",
});

export const supervisor = new Agent({
	id: "supervisor",
	name: "Supervisor",
	instructions: "Coordinate the writer to produce content.",
	model: "deepseek/deepseek-v4-flash",
	agents: { writer },
	memory: new Memory(),
});
