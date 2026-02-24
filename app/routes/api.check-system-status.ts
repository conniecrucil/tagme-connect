import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { runLegacyNetlifyHandlerModule } from "~/lib/server/api-route.server";

const MODULE_NAME = "check-system-status";

export async function loader({ request }: LoaderFunctionArgs) {
  return runLegacyNetlifyHandlerModule(MODULE_NAME, request);
}

export async function action({ request }: ActionFunctionArgs) {
  return runLegacyNetlifyHandlerModule(MODULE_NAME, request);
}

export default function ApiCheckSystemStatusRoute() {
  return null;
}
