<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# React 19 event types

`@types/react` 19.2+ marks `FormEvent` / `FormEventHandler` as deprecated — they "don't actually exist", so never use them. Pick the specific event type instead:

- Form submit handlers: `SubmitEvent` — e.g. `const handleSubmit = (e: SubmitEvent<HTMLFormElement>) => { e.preventDefault(); ... }`
- Input/textarea handlers: `ChangeEvent` / `InputEvent`
- Fallback when the exact kind doesn't matter: `SyntheticEvent`
- Key handling stays `KeyboardEvent<T>`

`import { type SubmitEvent } from "react"` imports React's synthetic event type (the module re-exports the whole `React` namespace), not the DOM `SubmitEvent`. Don't cast or alias between them.

Do not call a submit handler from a key handler — `KeyboardEvent` is not assignable to `SubmitEvent` (their `target` types differ). Extract a shared inner function and call it from both.