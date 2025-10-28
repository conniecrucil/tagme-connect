import { useMatches, Link } from "react-router";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";

interface BreadcrumbHandle {
  breadcrumb?: {
    label: string;
    url?: string;
  } | string;
}

export function AdminBreadcrumbs() {
  const matches = useMatches();
  
  // Filter out layout routes that don't have breadcrumbs and the root route
  const breadcrumbs = matches
    .filter((match) => {
      const handle = match.handle;
      // Handle can be a function that needs to be called
      if (typeof handle === 'function') {
        try {
          const handleData = handle();
          return handleData?.breadcrumb !== undefined;
        } catch (e) {
          return false;
        }
      }
      if (!handle) return false;
      
      if (typeof handle === 'string') return true;
      if (typeof handle === 'object' && handle.breadcrumb !== undefined) {
        return typeof handle.breadcrumb === 'string' || typeof handle.breadcrumb?.label === 'string';
      }
      return false;
    })
    .map((match) => {
      let handle = match.handle;
      
      // Call the function if it's a function
      if (typeof handle === 'function') {
        handle = handle();
      }
      
      const label = typeof handle === 'string' 
        ? handle 
        : (typeof handle.breadcrumb === 'string' 
          ? handle.breadcrumb 
          : handle.breadcrumb?.label || '');
      
      return {
        url: match.pathname,
        label
      };
    })
    .filter((b) => b.label && b.label.trim() !== '');

  if (breadcrumbs.length === 0) {
    return null;
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbs.map((breadcrumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          
          return (
            <div key={breadcrumb.url} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{breadcrumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={breadcrumb.url}>{breadcrumb.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </div>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
