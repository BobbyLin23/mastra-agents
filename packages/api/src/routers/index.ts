import { router } from "../index";

import { agentsRouter } from "./agents";

export const appRouter = router({
	agents: agentsRouter,
});
export type AppRouter = typeof appRouter;
