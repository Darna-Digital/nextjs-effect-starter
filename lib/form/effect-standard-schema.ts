// todo: not going to be needed with effect v4 where standard schema will be supported
import { Schema, Either } from "effect";
import { ArrayFormatter } from "effect/ParseResult";

type StandardSchema<T = unknown> = {
  readonly "~standard": {
    readonly version: 1;
    readonly validate: (
      value: unknown,
    ) =>
      | { readonly value: T; readonly issues?: undefined }
      | { readonly issues: ReadonlyArray<{ readonly message: string }> };
  };
};

export function toStandardSchema<A, I>(
  schema: Schema.Schema<A, I>,
): StandardSchema<A> {
  return {
    "~standard": {
      version: 1,
      validate(value) {
        const result = Schema.decodeUnknownEither(schema)(value);
        return Either.match(result, {
          onLeft: (error) => ({
            issues: ArrayFormatter.formatErrorSync(error).map((i) => ({
              message: i.message,
            })),
          }),
          onRight: (data) => ({ value: data }),
        });
      },
    },
  };
}
