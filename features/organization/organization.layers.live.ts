import { Layer } from "effect";
import { createMysqlStorageLayer } from "@/lib/effect/layers/storage/storage.mysql";
import { db } from "@/lib/db/client";
import { organizations } from "@/lib/db/schema";
import type { Organization } from "./organization.model";
import {
  Organizations,
  OrganizationStorage,
  ReservedOrganizationNames,
} from "./organization.service";

/** Layer that provides `Organizations` backed by MySQL (via Drizzle). */
export const OrganizationsLive = Organizations.Default.pipe(
  Layer.provide(
    Layer.mergeAll(
      Layer.succeed(
        OrganizationStorage,
        createMysqlStorageLayer<Organization>(db, organizations),
      ),
      Layer.succeed(ReservedOrganizationNames, ["admin", "system", "root"]),
    ),
  ),
);
