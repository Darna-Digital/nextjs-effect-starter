import { apiRoute } from "@/lib/http/api-route";
import { CreateProjectSchema } from "@/features/project/project.requests";
import { Projects } from "@/features/project/project.service";

export const GET = apiRoute({
  span: "GET /api/projects",
  handle: () => Projects.getAll(),
});

export const POST = apiRoute({
  span: "POST /api/projects",
  body: CreateProjectSchema,
  status: 201,
  handle: ({ body }) => Projects.create(body),
});
