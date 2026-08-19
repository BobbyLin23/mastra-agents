import { Agent } from "@mastra/core/agent";
import { webSearchTool } from "@mastra/core/tools";

export const researchAgent: Agent = new Agent({
	id: "research-agent",
	name: "Research Agent",
	instructions:
		"You are a research assistant that can help users find information on various topics. You can use the webSearchTool to search the web for relevant information.",
	model: "deepseek/deepseek-v4-flash",
	tools: { webSearchTool },
});
