"use client";

import createFetchClient from "openapi-fetch";
import createClient from "openapi-react-query";
import type { paths } from "./api-schema";

const baseUrl =
  typeof window === "undefined"
    ? "http://localhost:3000"
    : window.location.origin;

export const fetchClient = createFetchClient<paths>({
  baseUrl,
  credentials: "include",
});

export const $api = createClient(fetchClient);
