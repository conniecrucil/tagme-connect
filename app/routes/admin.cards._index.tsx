import { useState, useEffect, useMemo, useCallback, useId } from "react";
import { Link, useLoaderData, useSearchParams } from "react-router";
import type { ClientLoaderFunctionArgs } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Badge } from "~/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { 
  TableProvider, 
  TableHeader, 
  TableHead, 
  TableHeaderGroup, 
  TableBody, 
  TableRow, 
  TableCell,
  type ColumnDef 
} from "@components/kibo-ui/table";

export function meta() {
  return [
    { title: "All Cards - Admin - TagMe Connections" },
    { name: "description", content: "Browse, search, and manage all contact cards created through the system." },
  ];
}

export async function clientLoader({ request }: ClientLoaderFunctionArgs) {
  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get('limit') || '20');
  const offset = parseInt(url.searchParams.get('offset') || '0');
  const customerEmail = url.searchParams.get('customer_email') || '';
  const status = url.searchParams.get('status') || '';
  const dateFrom = url.searchParams.get('date_from') || '';
  const dateTo = url.searchParams.get('date_to') || '';

  try {
    const searchParams = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });

    if (customerEmail) searchParams.append('customer_email', customerEmail);
    if (status) searchParams.append('status', status);
    if (dateFrom) searchParams.append('date_from', dateFrom);
    if (dateTo) searchParams.append('date_to', dateTo);

    const response = await fetch(`/.netlify/functions/get-cards?${searchParams}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch cards');
    }

    const data: CardsListResponse = await response.json();
    return {
      cards: data.cards || [],
      total: data.total || 0,
      page: Math.floor(offset / limit) + 1,
      limit,
    };
  } catch (error) {
    console.error('Error fetching cards:', error);
    throw error;
  }
}

export function handle() {
  return {
    breadcrumb: { label: "All Cards" }
  };
}

interface CardWithCustomer {
  id: string;
  uuid: string;
  customer?: {
    email: string;
    name?: string;
  };
  card_data: {
    name?: string;
    email?: string;
    title?: string;
    company?: string;
  };
  s3_base_url?: string;
  generation_status: {
    status: 'success' | 'error' | 'pending';
    error?: string;
    timestamp: string;
  };
  created_at: string;
  has_logo: boolean;
  has_photo: boolean;
  has_cover: boolean;
}

interface CardsListResponse {
  cards: CardWithCustomer[];
  total: number;
  page: number;
  limit: number;
}

export default function AdminCardsIndex() {
  const searchEmailId = useId();
  const statusFilterId = useId();
  const dateFromId = useId();
  const dateToId = useId();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const data = useLoaderData<typeof clientLoader>();
  const { cards, total, page: loaderPage, limit } = data;
  
  const [page, setPage] = useState(loaderPage);
  
  // Sync page when loader data changes
  useEffect(() => {
    setPage(loaderPage);
  }, [loaderPage]);
  
  // Filters - get from URL or use defaults
  const [searchEmail, setSearchEmail] = useState(searchParams.get('customer_email') || "");
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || "all");
  const [dateFrom, setDateFrom] = useState(searchParams.get('date_from') || "");
  const [dateTo, setDateTo] = useState(searchParams.get('date_to') || "");

  const getStatusBadge = useCallback((status: string, error?: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800">Live</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800" title={error}>Error</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  }, []);

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  // Column definitions for Kibo UI Table
  const columns = useMemo<ColumnDef<CardWithCustomer>[]>(
    () => [
      {
        accessorKey: "customer",
        header: "Customer",
        cell: ({ row }) => (
          <div>
            <div className="font-medium">
              {row.original.customer?.email || 'No customer'}
            </div>
            {row.original.customer?.name && (
              <div className="text-sm text-gray-500">
                {row.original.customer.name}
              </div>
            )}
          </div>
        ),
      },
      {
        accessorKey: "card_data",
        header: "Card Name",
        cell: ({ row }) => (
          <div>
            <div className="font-medium">
              {row.original.card_data.name || 'Untitled Card'}
            </div>
            {row.original.card_data.title && (
              <div className="text-sm text-gray-500">
                {row.original.card_data.title}
              </div>
            )}
            {row.original.card_data.company && (
              <div className="text-sm text-gray-500">
                {row.original.card_data.company}
              </div>
            )}
          </div>
        ),
      },
      {
        accessorKey: "created_at",
        header: "Created",
        cell: ({ row }) => formatDate(row.original.created_at),
      },
      {
        accessorKey: "generation_status",
        header: "Status",
        cell: ({ row }) => getStatusBadge(
          row.original.generation_status.status, 
          row.original.generation_status.error
        ),
      },
      {
        accessorKey: "assets",
        header: "Assets",
        cell: ({ row }) => (
          <div className="flex gap-1">
            {row.original.has_logo && <Badge variant="outline" className="text-xs">Logo</Badge>}
            {row.original.has_photo && <Badge variant="outline" className="text-xs">Photo</Badge>}
            {row.original.has_cover && <Badge variant="outline" className="text-xs">Cover</Badge>}
          </div>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex gap-2">
            <Button asChild size="sm" variant="outline">
              <Link to={`/admin/cards/${row.original.id}`}>
                View
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to={`/admin/cards/${row.original.id}/edit`}>
                Edit
              </Link>
            </Button>
          </div>
        ),
      },
    ],
    [formatDate, getStatusBadge]
  );

  const updatePage = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    const offset = (newPage - 1) * limit;
    params.set('offset', offset.toString());
    setSearchParams(params);
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchEmail) params.set('customer_email', searchEmail);
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (dateFrom) params.set('date_from', dateFrom);
    if (dateTo) params.set('date_to', dateTo);
    params.set('limit', limit.toString());
    params.set('offset', '0'); // Reset to page 1
    setSearchParams(params);
  };

  const clearFilters = () => {
    setSearchEmail("");
    setStatusFilter("all");
    setDateFrom("");
    setDateTo("");
    setSearchParams({});
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">All Contact Cards</h1>
            <p className="text-gray-600 mt-2">
              Browse, search, and manage all contact cards created through the system.
            </p>
          </div>
          <Button asChild>
            <Link to="/admin/create">
              Create Card
            </Link>
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Search and filter cards by various criteria</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label htmlFor={searchEmailId} className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Email
                </label>
                <Input
                  id={searchEmailId}
                  placeholder="Search by email..."
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                />
              </div>
              
              <div>
                <label htmlFor={statusFilterId} className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger id={statusFilterId}>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label htmlFor={dateFromId} className="block text-sm font-medium text-gray-700 mb-1">
                  From Date
                </label>
                <Input
                  id={dateFromId}
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor={dateToId} className="block text-sm font-medium text-gray-700 mb-1">
                  To Date
                </label>
                <Input
                  id={dateToId}
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <Button onClick={handleSearch}>
                Search
              </Button>
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        <div className="mb-4 flex justify-between items-center">
          <p className="text-sm text-gray-600">
            Showing {cards.length} of {total} cards
          </p>
          <div className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </div>
        </div>

        {/* Cards Table */}
        <Card>
          <CardContent className="p-0">
            {cards.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-600">No cards found matching your criteria.</p>
              </div>
            ) : (
              <div className="pl-4">
                <TableProvider columns={columns} data={cards}>
                <TableHeader>
                  {({ headerGroup }) => (
                    <TableHeaderGroup headerGroup={headerGroup}>
                      {({ header }) => (
                        <TableHead key={header.id} header={header} />
                      )}
                    </TableHeaderGroup>
                  )}
                </TableHeader>
                <TableBody>
                  {({ row }) => (
                    <TableRow row={row}>
                      {({ cell }) => (
                        <TableCell cell={cell} />
                      )}
                    </TableRow>
                  )}
                </TableBody>
              </TableProvider>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-6">
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={page === 1}
                onClick={() => updatePage(page - 1)}
              >
                Previous
              </Button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === page ? "default" : "outline"}
                    onClick={() => updatePage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              
              <Button
                variant="outline"
                disabled={page === totalPages}
                onClick={() => updatePage(page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
