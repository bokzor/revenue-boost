// App Proxy passthrough for health check endpoint
// Maps: /apps/revenue-boost/api/health -> /api/health
export { loader } from "~/routes/api.health";
