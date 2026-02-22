import { Outlet } from "react-router";
import type { LoaderFunctionArgs } from "react-router";

export function meta() {
  return [
    { title: "Card Details - Admin - TagMe Connections" },
    { name: "description", content: "View and edit detailed information about a specific contact card." },
  ];
}

export async function loader({ params }: LoaderFunctionArgs) {
  const { cardId } = params;
  
  if (!cardId) {
    throw new Error("Card ID is required");
  }

  try {
    const response = await fetch(`/api/get-card-details?cardId=${cardId}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Card not found");
      }
      throw new Error(`Failed to fetch card details: ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      card: data.card,
      assets: data.assets || [],
      cardId,
    };
  } catch (error) {
    console.error('Error in loader:', error);
    throw error;
  }
}

export function handle() {
  return {
    breadcrumb: { label: "Card" }
  };
}

export default function AdminCardLayout() {
  return <Outlet />;
}
