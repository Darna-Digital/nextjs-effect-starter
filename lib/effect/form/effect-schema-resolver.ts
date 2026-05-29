import { Schema, Either } from "effect";
import { ArrayFormatter } from "effect/ParseResult";
import type { FieldErrors, FieldValues, Resolver } from "react-hook-form";

export function effectSchemaResolver<Output extends FieldValues>(
  schema: Schema.Schema.AnyNoContext,
): Resolver<Output> {
  return async (values) => {
    const result = Schema.decodeUnknownEither(schema)(values);

    return Either.match(result, {
      onLeft: (parseError) => {
        const issues = ArrayFormatter.formatErrorSync(parseError);
        const errors: FieldErrors<Output> = {};

        for (const issue of issues) {
          const path = issue.path.join(".");
          if (path && !errors[path]) {
            (errors as Record<string, unknown>)[path] = {
              type: "validation",
              message: issue.message,
            };
          }
        }

        return { values: {}, errors };
      },
      onRight: (data) => ({ values: data, errors: {} }),
    });
  };
}
