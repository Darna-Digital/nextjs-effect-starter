import { Result, Schema, SchemaIssue } from "effect";
import type { FieldErrors, FieldValues, Resolver } from "react-hook-form";

/**
 * Validates form values with an Effect `Schema` and adapts the result to a
 * react-hook-form `Resolver`. The form value type (`Output`) is supplied by the
 * caller — typically a generated OpenAPI type — while `schema` is used purely as
 * a runtime validator (its decoded type need not equal `Output`; the two are
 * structurally identical shapes, the schema just additionally brands/refines).
 */
const formatIssues = SchemaIssue.makeFormatterStandardSchemaV1();

export function effectSchemaResolver<Output extends FieldValues>(
  schema: Schema.Decoder<unknown>,
): Resolver<Output> {
  return async (values) => {
    const result = Schema.decodeUnknownResult(schema)(values);

    if (Result.isFailure(result)) {
      const { issues } = formatIssues(result.failure);
      const errors: FieldErrors<Output> = {};

      for (const issue of issues) {
        const path = (issue.path ?? []).map(String).join(".");
        if (path && !(path in errors)) {
          (errors as Record<string, unknown>)[path] = {
            type: "validation",
            message: issue.message,
          };
        }
      }

      return { values: {}, errors };
    }

    return { values: result.success as Output, errors: {} };
  };
}
