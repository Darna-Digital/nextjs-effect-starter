import { HttpApi } from "effect/unstable/httpapi";
import { OrganizationApi } from "@/features/organization/http/organization.api";
import { ProjectApi } from "@/features/project/http/project.api";

export class Api extends HttpApi.make("nextjs-effect-starter")
  .add(OrganizationApi)
  .add(ProjectApi)
  .prefix("/api") {}
