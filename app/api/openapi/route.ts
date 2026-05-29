import { OpenApi } from "@effect/platform";
import { Api } from "@/lib/effect/http/api";

// Derived once from the HttpApi definition. This is the source of truth for
// the generated client types (see `pnpm gen:api`) and the Scalar docs page.
const spec = OpenApi.fromApi(Api);

export function GET() {
  return Response.json(spec);
}
