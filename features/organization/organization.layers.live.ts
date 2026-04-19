import { Layer } from "effect";
import { jsonStorage } from "@/layers/storage/storage.json";
import type { Organization } from "./organization.model";
import {
  Organizations,
  OrganizationStorage,
  ReservedOrganizationNames,
} from "./organization.service";

/** Layer that provides `Organizations` backed by the JSON file store. */
export const OrganizationsLive = Organizations.Default.pipe(
  Layer.provide(
    Layer.mergeAll(
      Layer.succeed(
        OrganizationStorage,
        jsonStorage<Organization>("./data/organizations.json"),
      ),
      Layer.succeed(ReservedOrganizationNames, ["admin", "system", "root"]),
    ),
  ),
);
