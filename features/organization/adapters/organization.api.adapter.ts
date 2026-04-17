import { createJsonPersistence } from "@/layers/persistance/persistence.json"
import type { OrganizationDependencies } from "../entity/organization.interfaces"
import type { Organization } from "../entity/organization.schema"
import { createOrganizationFunctions } from "../functions/organization.functions"
import { createOrganizationSideEffects } from "./side-effects"

/** Reserved names the product refuses to let anyone claim. */
const RESERVED_NAMES = new Set(["admin", "system", "root"])

const persistence = createJsonPersistence<Organization>(
  "./data/organizations.json",
)

const dependencies: OrganizationDependencies = {
  data: { reservedNames: RESERVED_NAMES },
  sideEffects: createOrganizationSideEffects(persistence),
}

export const organizationFunctions = createOrganizationFunctions(dependencies)
