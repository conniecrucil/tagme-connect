import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { runLegacyApiModule } from "~/lib/server/api-route.server";

const MODULE_NAME = "upload-to-s3";

export async function loader({ request }: LoaderFunctionArgs) {
  return runLegacyApiModule(MODULE_NAME, request);
}

export async function action({ request }: ActionFunctionArgs) {
  return runLegacyApiModule(MODULE_NAME, request);
}

export default function ApiRoute() {
  return null;
}
