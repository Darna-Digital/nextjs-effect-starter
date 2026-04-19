import { Schema as S } from "effect";
import { apiRoute } from "@/lib/effect/http/api-route";
import { ProjectId } from "@/features/project/project.model";
import { UpdateProjectSchema } from "@/features/project/project.requests";
import { Projects } from "@/features/project/project.service";

const Params = S.Struct({ id: ProjectId });

export const GET = apiRoute({
  span: "GET /api/projects/:id",
  params: Params,
  handle: ({ params }) => Projects.getById(params.id),
});

export const PUT = apiRoute({
  span: "PUT /api/projects/:id",
  params: Params,
  body: UpdateProjectSchema,
  handle: ({ params, body }) => Projects.update(params.id, body),
});

export const DELETE = apiRoute({
  span: "DELETE /api/projects/:id",
  params: Params,
  status: 204,
  handle: ({ params }) => Projects.remove(params.id),
});
