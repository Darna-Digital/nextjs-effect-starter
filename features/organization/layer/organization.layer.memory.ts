import { Layer } from "effect";
import { OrganizationRepository } from "@/features/organization/repository/organization.repository";
import { createMemoryOrganizationRepository } from "@/features/organization/repository/organization.repository.memory";
import type { Organization } from "@/features/organization/schema/organization.schema.model";
import {
  Organizations,
  ReservedOrganizationNames,
} from "@/features/organization/service/organization.service";

export const OrganizationsMemory = ({
  seed = [],
  reserved = [],
}: {
  seed?: readonly Organization[];
  reserved?: readonly string[];
} = {}) =>
  Layer.effect(Organizations, Organizations.make).pipe(
    Layer.provide(
      Layer.mergeAll(
        Layer.effect(
          OrganizationRepository,
          createMemoryOrganizationRepository(seed),
        ),
        Layer.succeed(ReservedOrganizationNames, reserved),
      ),
    ),
  );
