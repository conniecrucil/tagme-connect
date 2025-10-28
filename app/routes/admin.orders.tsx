import { Outlet } from "react-router";

export function handle() {
  return {
    breadcrumb: { label: "Orders" }
  };
}

export default function AdminOrders() {
  return <Outlet />;
}

