"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { trpcClient } from "@/utils/trpc";

export type ChatMessage = {
	id: string;
	role: "user" | "assistant";
	content: string;
};

export type ChatStatus = "idle" | "streaming";

function randomId(prefix: string) {
	if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
		return `${prefix}-${crypto.randomUUID()}`;
	}
	return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Drives a conversation with a Mastra agent through the tRPC `agents.chatStream`
 * subscription (SSE). The full message history is kept client-side; the agent
 * recalls previous turns server-side via its Memory store, keyed by `threadId`.
 */
export function useAgentChat(agentId = "weatherAgent") {
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [status, setStatus] = useState<ChatStatus>("idle");
	const [error, setError] = useState<string | null>(null);

	const threadIdRef = useRef(randomId("thread"));
	const unsubscribeRef = useRef<(() => void) | null>(null);
	const busyRef = useRef(false);

	const stop = useCallback(() => {
		unsubscribeRef.current?.();
		unsubscribeRef.current = null;
		busyRef.current = false;
		setStatus("idle");
	}, []);

	useEffect(() => stop, [stop]);

	const clear = useCallback(() => {
		stop();
		threadIdRef.current = randomId("thread");
		setMessages([]);
		setError(null);
	}, [stop]);

	const send = useCallback(
		(content: string) => {
			const text = content.trim();
			if (!text || busyRef.current) return;

			busyRef.current = true;
			setError(null);

			const userMessageId = randomId("msg");
			const assistantMessageId = randomId("msg");

			setMessages((prev) => [
				...prev,
				{ id: userMessageId, role: "user", content: text },
				{ id: assistantMessageId, role: "assistant", content: "" },
			]);
			setStatus("streaming");

			const subscription = trpcClient.agents.chatStream.subscribe(
				{ agentId, threadId: threadIdRef.current, message: text },
				{
					onData: (chunk) => {
						if (chunk.type === "text-delta") {
							setMessages((prev) =>
								prev.map((m) =>
									m.id === assistantMessageId
										? { ...m, content: m.content + chunk.text }
										: m,
								),
							);
						}
					},
					onError: (err) => {
						busyRef.current = false;
						unsubscribeRef.current = null;
						setError(err.message || "Something went wrong");
						setStatus("idle");
					},
					onComplete: () => {
						busyRef.current = false;
						unsubscribeRef.current = null;
						setStatus("idle");
					},
				},
			);
			unsubscribeRef.current = () => subscription.unsubscribe();
		},
		[agentId],
	);

	return { messages, status, error, send, stop, clear };
}
