import { Effect } from "effect";
import { createJsonPersistence } from "@/layers/persistance/persistence.json";
import { StorageError } from "@/layers/persistance/persistence.base";
import type { OrganizationDependencies } from "../entity/organization.interfaces";
import { OrganizationNotFound } from "../entity/organization.schema";
import { TracingLayer } from "@/lib/tracing";
import { createOrganizationFunctions } from "../functions/organization.functions";
import type {
  Organization,
  OrganizationId,
  CreateOrganization,
  UpdateOrganization,
} from "../entity/organization.schema";
import type { ParseError } from "effect/ParseResult";

const persistence = createJsonPersistence<Organization>(
  "./data/organizations.json",
);

const dependencies: OrganizationDependencies = {
  data: {},
  sideEffects: {
    getAll: () => persistence.getAll(),

    getById: (id: OrganizationId) =>
      persistence
        .getById(id)
        .pipe(
          Effect.catchTag("EntityNotFound", (e) =>
            Effect.fail(
              new OrganizationNotFound({ id: e.id as OrganizationId }),
            ),
          ),
        ),

    create: (input: CreateOrganization) => {
      const org: Organization = {
        id: crypto.randomUUID() as OrganizationId,
        name: input.name,
        description: input.description,
      };
      return persistence.create(org);
    },

    update: (id: OrganizationId, input: UpdateOrganization) =>
      persistence
        .update(id, input)
        .pipe(
          Effect.catchTag("EntityNotFound", (e) =>
            Effect.fail(
              new OrganizationNotFound({ id: e.id as OrganizationId }),
            ),
          ),
        ),

    remove: (id: OrganizationId) =>
      persistence
        .remove(id)
        .pipe(
          Effect.catchTag("EntityNotFound", (e) =>
            Effect.fail(
              new OrganizationNotFound({ id: e.id as OrganizationId }),
            ),
          ),
        ),
  },
};

const organizationFunctions = createOrganizationFunctions(dependencies);

export { organizationFunctions };

type OrganizationError = StorageError | OrganizationNotFound | ParseError;

export const provideAndRun = <A>(
  effect: Effect.Effect<A, OrganizationError>,
): Promise<A | Response> =>
  effect.pipe(
    Effect.catchTags({
      OrganizationNotFound: (e) =>
        Effect.succeed(
          Response.json({ error: "Not found", id: e.id }, { status: 404 }),
        ),
      StorageError: (e) =>
        Effect.succeed(
          Response.json(
            { error: "Storage error", cause: String(e.cause) },
            { status: 500 },
          ),
        ),
      ParseError: (e) =>
        Effect.succeed(
          Response.json(
            { error: "Validation failed", details: e.message },
            { status: 400 },
          ),
        ),
    }),
    Effect.provide(TracingLayer),
    Effect.runPromise,
  );
