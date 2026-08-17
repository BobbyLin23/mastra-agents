"use client";

import { Bubble, BubbleContent } from "@mastra-agents/ui/components/bubble";
import { Button } from "@mastra-agents/ui/components/button";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@mastra-agents/ui/components/empty";
import {
	Message,
	MessageAvatar,
	MessageContent,
	MessageHeader,
} from "@mastra-agents/ui/components/message";
import {
	MessageScroller,
	MessageScrollerButton,
	MessageScrollerContent,
	MessageScrollerItem,
	MessageScrollerProvider,
	MessageScrollerViewport,
} from "@mastra-agents/ui/components/message-scroller";
import { Textarea } from "@mastra-agents/ui/components/textarea";
import {
	CloudSunIcon,
	RotateCcwIcon,
	SendIcon,
	SquareIcon,
} from "lucide-react";
import { type KeyboardEvent, type SubmitEvent, useState } from "react";

import { type ChatMessage, useAgentChat } from "@/hooks/use-agent-chat";

function MessageRow({
	message,
	thinking,
}: {
	message: ChatMessage;
	thinking: boolean;
}) {
	const isUser = message.role === "user";

	return (
		<Message align={isUser ? "end" : "start"}>
			<MessageAvatar>
				<span className="font-semibold text-muted-foreground text-xs">
					{isUser ? "You" : "AI"}
				</span>
			</MessageAvatar>
			<MessageContent>
				<MessageHeader>{isUser ? "You" : "Weather Agent"}</MessageHeader>
				<Bubble
					variant={isUser ? "default" : "muted"}
					align={isUser ? "end" : "start"}
				>
					<BubbleContent className="whitespace-pre-wrap">
						{message.content ||
							(thinking ? <span className="shimmer">Thinking…</span> : null)}
					</BubbleContent>
				</Bubble>
			</MessageContent>
		</Message>
	);
}

const SUGGESTIONS = [
	"What's the weather in Tokyo?",
	"Will it rain in London today?",
	"What's the best day for a hike in San Francisco?",
];

export default function ChatPage() {
	const { messages, status, error, send, stop, clear } = useAgentChat();
	const [input, setInput] = useState("");
	const streaming = status === "streaming";

	const submit = () => {
		if (streaming) return;
		send(input);
		setInput("");
	};

	const handleSubmit = (e: SubmitEvent<HTMLFormElement>) => {
		e.preventDefault();
		submit();
	};

	const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
			e.preventDefault();
			submit();
		}
	};

	return (
		<div className="flex h-full min-h-0 flex-col">
			<header className="flex items-center justify-between gap-2 border-b px-4 py-3">
				<div className="flex items-center gap-2.5">
					<div className="flex size-8 items-center justify-center rounded-none bg-muted text-foreground">
						<CloudSunIcon />
					</div>
					<div>
						<p className="font-semibold text-sm leading-tight">Weather Agent</p>
						<p className="text-muted-foreground text-xs">
							Mastra agent · deepseek-v4-flash
						</p>
					</div>
				</div>
				<Button
					type="button"
					variant="ghost"
					size="sm"
					onClick={clear}
					disabled={streaming || messages.length === 0}
				>
					<RotateCcwIcon data-icon="inline-start" />
					New chat
				</Button>
			</header>

			<main className="flex min-h-0 flex-1 flex-col">
				{messages.length === 0 ? (
					<Empty>
						<EmptyMedia variant="icon">
							<CloudSunIcon />
						</EmptyMedia>
						<EmptyHeader>
							<EmptyTitle>Ask about the weather anywhere</EmptyTitle>
							<EmptyDescription>
								Get current conditions, temperature, humidity and wind — then
								plan activities around the forecast.
							</EmptyDescription>
						</EmptyHeader>
						<EmptyContent>
							{SUGGESTIONS.map((suggestion) => (
								<Button
									key={suggestion}
									type="button"
									variant="outline"
									size="sm"
									onClick={() => {
										send(suggestion);
									}}
								>
									{suggestion}
								</Button>
							))}
						</EmptyContent>
					</Empty>
				) : (
					<MessageScrollerProvider autoScroll>
						<MessageScroller>
							<MessageScrollerViewport>
								<MessageScrollerContent>
									{messages.map((message, index) => (
										<MessageScrollerItem
											key={message.id}
											messageId={message.id}
											scrollAnchor={message.role === "user"}
										>
											<MessageRow
												message={message}
												thinking={
													streaming &&
													message.role === "assistant" &&
													!message.content &&
													index === messages.length - 1
												}
											/>
										</MessageScrollerItem>
									))}
								</MessageScrollerContent>
							</MessageScrollerViewport>
							<MessageScrollerButton />
						</MessageScroller>
					</MessageScrollerProvider>
				)}
			</main>

			<form onSubmit={handleSubmit} className="border-t p-4">
				<div className="mx-auto flex w-full max-w-2xl flex-col gap-2">
					<Textarea
						value={input}
						onChange={(e) => setInput(e.target.value)}
						onKeyDown={handleKeyDown}
						placeholder={
							streaming ? "Agent is replying…" : "Ask about the weather…"
						}
						disabled={streaming}
						rows={1}
					/>
					{error ? <p className="text-destructive text-xs">{error}</p> : null}
					<div className="flex justify-end">
						{streaming ? (
							<Button
								type="button"
								variant="secondary"
								size="sm"
								onClick={stop}
							>
								<SquareIcon data-icon="inline-start" />
								Stop
							</Button>
						) : (
							<Button type="submit" size="sm" disabled={!input.trim()}>
								Send
								<SendIcon data-icon="inline-end" />
							</Button>
						)}
					</div>
				</div>
			</form>
		</div>
	);
}
