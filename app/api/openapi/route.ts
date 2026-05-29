import { OpenApi } from "effect/unstable/httpapi";
import { Api } from "@/lib/effect/http/api";

const spec = OpenApi.fromApi(Api);

export function GET() {
  return Response.json(spec);
}
