import { Context, Effect, Layer } from "effect";
import type { ProjectId } from "@/features/project/schema/project.schema.model";

/**
 * Thin Effect boundary over starting the durable provisioning workflow. Keeping
 * it behind a service (rather than calling the SDK's `start()` inline) means the
 * domain layer depends on an interface, not the Workflow SDK — so it stays
 * injectable and testable, mirroring the repository pattern.
 *
 * The live implementation lives in `provisioning.layer.live.ts` (it imports the
 * workflow + SDK); {@link ProvisioningClientNoop} below is for tests.
 */
export interface ProvisioningClientApi {
  /** Enqueue provisioning for a project. Best-effort: never fails the caller. */
  readonly start: (projectId: ProjectId) => Effect.Effect<void>;
}

export class ProvisioningClient extends Context.Service<
  ProvisioningClient,
  ProvisioningClientApi
>()("ProvisioningClient") {}

/**
 * No-op client for tests and the in-memory stack: records nothing, starts no
 * workflow, so unit tests never reach the Workflow SDK or MySQL world.
 */
export const ProvisioningClientNoop = Layer.succeed(ProvisioningClient, {
  start: () => Effect.void,
});
