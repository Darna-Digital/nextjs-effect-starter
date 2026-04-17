import { Layer } from "effect";
import { createMemoryPersistence } from "@/layers/persistance/persistence.memory";
import type { Organization } from "./organization.schema";
import {
  Organizations,
  OrganizationStorage,
  ReservedOrganizationNames,
} from "./organization.service";

/**
 * In-memory Layer — backs `Organizations` with a fresh `Ref`-based store.
 * Used by tests and any dev seeding.
 *
 *     OrganizationsMemory()
 *     OrganizationsMemory({ seed: [orgA] })
 *     OrganizationsMemory({ reserved: ["admin"] })
 *     OrganizationsMemory({ seed: [orgA], reserved: ["admin"] })
 */
export const OrganizationsMemory = ({
  seed = [],
  reserved = [],
}: {
  seed?: readonly Organization[];
  reserved?: readonly string[];
} = {}) =>
  Organizations.Default.pipe(
    Layer.provide(
      Layer.mergeAll(
        Layer.effect(
          OrganizationStorage,
          createMemoryPersistence<Organization>([...seed]),
        ),
        Layer.succeed(ReservedOrganizationNames, reserved),
      ),
    ),
  );
