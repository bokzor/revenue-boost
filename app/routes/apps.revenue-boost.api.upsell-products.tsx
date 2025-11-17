import type { LoaderFunctionArgs } from "react-router";
import { loader as apiLoader } from "./api.upsell-products";

// App proxy wrapper for /apps/revenue-boost/api/upsell-products
export async function loader(args: LoaderFunctionArgs) {
  return apiLoader(args);
}

