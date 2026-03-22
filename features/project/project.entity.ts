import { Schema } from "effect";

export const Project = Schema.Struct({
  id: Schema.String,
  title: Schema.String.pipe(Schema.minLength(1)),
});

export type Todo = typeof Project.Type;
