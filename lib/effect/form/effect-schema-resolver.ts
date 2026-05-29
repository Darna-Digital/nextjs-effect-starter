import { Schema, Either } from "effect";
import { ArrayFormatter } from "effect/ParseResult";
import type { FieldErrors, FieldValues, Resolver } from "react-hook-form";

/**
 * Validates form values with an Effect `Schema` and adapts the result to a
 * react-hook-form `Resolver`. The form value type (`Output`) is supplied by the
 * caller — typically a generated OpenAPI type — while `schema` is used purely as
 * a runtime validator (its decoded type need not equal `Output`; the two are
 * structurally identical shapes, the schema just additionally brands/refines).
 * This lets the FE consume generated types while reusing the domain schemas for
 * validation, with no casts at the call site.
 */
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
