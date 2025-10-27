import { useState, useEffect } from "react";
import { Link, useParams } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Separator } from "~/components/ui/separator";
import { useToast } from "~/components/ui/use-toast";

export function meta() {
  return [
    { title: "Card Details - Admin - TagMe Connections" },
    { name: "description", content: "View detailed information about a specific contact card." },
  ];
}

export function handle() {
  return {
    breadcrumb: { label: "View" }
  };
}

interface CardWithCustomer {
  id: string;
  uuid: string;
  customer?: {
    id: string;
    email: string;
    name?: string;
    phone?: string;
    created_at: string;
  };
  card_data: {
    name?: string;
    email?: string;
    title?: string;
    company?: string;
    phone?: string;
    mobile?: string;
    website?: string;
    description?: string;
    street?: string;
    city?: string;
    state?: string;
    postal?: string;
    country?: string;
    pronouns?: string;
    prefix?: string;
    fname?: string;
    lname?: string;
    biz?: string;
    desc?: string;
    photo?: string;
  };
  primary_actions: Array<{ name: string; value: string; color?: string }>;
  secondary_actions: Array<{ name: string; value: string; color?: string }>;
  logo_or_header: boolean;
  has_logo: boolean;
  has_photo: boolean;
  has_cover: boolean;
  s3_base_url?: string;
  generated_at?: string;
  generation_status: {
    status: 'success' | 'error' | 'pending';
    error?: string;
    timestamp: string;
  };
  created_at: string;
  updated_at: string;
}

interface CardAsset {
  id: string;
  asset_type: 'logo' | 'photo' | 'cover' | 'html' | 'vcf';
  s3_key: string;
  s3_url: string;
  mime_type?: string;
  file_size?: number;
  created_at: string;
}

export default function AdminCardDetail() {
  const { cardId } = useParams();
  const { toast } = useToast();
  const [card, setCard] = useState<CardWithCustomer | null>(null);
  const [assets, setAssets] = useState<CardAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cardId) {
      fetchCardDetails();
    }
  }, [cardId]);

  const fetchCardDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/.netlify/functions/get-card-details?cardId=${cardId}`);
      
      if (!response.ok) {
        let errorMessage = 'Failed to fetch card details';
        
        if (response.status === 404) {
          errorMessage = 'Card not found';
        } else if (response.status === 503) {
          errorMessage = 'Server error - check system configuration';
        } else if (response.status === 500) {
          errorMessage = 'Internal server error';
        } else {
          errorMessage = `Request failed with status ${response.status}`;
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setCard(data.card);
      setAssets(data.assets || []);
    } catch (error) {
      console.error('Error fetching card details:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load card details';
      setError(errorMessage);
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string, error?: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800">Success</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800" title={error}>Error</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            <span className="ml-2 text-gray-600">Loading card details...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-50 py-4 mb-6">
            <nav className="flex items-center space-x-2 text-sm">
              <Link to="/admin" className="text-gray-600 hover:text-green-600">
                Admin Dashboard
              </Link>
              <span className="text-gray-400">›</span>
              <Link to="/admin/cards" className="text-gray-600 hover:text-green-600">
                All Cards
              </Link>
              <span className="text-gray-400">›</span>
              <span className="text-gray-900">Error</span>
            </nav>
          </div>
          
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-600">Error Loading Card</CardTitle>
              <CardDescription>
                Unable to load card details due to an error
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-600">{error}</p>
                
                {error.includes('system configuration') && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-medium text-yellow-800 mb-2">Configuration Issue Detected</h4>
                    <p className="text-sm text-yellow-700 mb-3">
                      This error suggests that environment variables may not be properly configured. 
                      Check the system status for more details.
                    </p>
                    <Button asChild variant="outline" size="sm">
                      <Link to="/admin/system-status">Check System Status</Link>
                    </Button>
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Button onClick={fetchCardDetails}>
                    Retry
                  </Button>
                  <Button variant="outline" asChild>
                    <Link to="/admin/cards">Back to All Cards</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!card && !loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-50 py-4 mb-6">
            <nav className="flex items-center space-x-2 text-sm">
              <Link to="/admin" className="text-gray-600 hover:text-green-600">
                Admin Dashboard
              </Link>
              <span className="text-gray-400">›</span>
              <Link to="/admin/cards" className="text-gray-600 hover:text-green-600">
                All Cards
              </Link>
              <span className="text-gray-400">›</span>
              <span className="text-gray-900">Not Found</span>
            </nav>
          </div>
          
          <Card className="border-yellow-200">
            <CardHeader>
              <CardTitle className="text-yellow-600">Card Not Found</CardTitle>
              <CardDescription>
                The requested card could not be found
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-600">
                  The card with ID "{cardId}" could not be found. It may have been deleted or the ID may be incorrect.
                </p>
                <div className="flex gap-2">
                  <Button asChild>
                    <Link to="/admin/cards">Back to All Cards</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Card Not Found</h1>
            <p className="text-gray-600 mb-6">The requested card could not be found.</p>
            <Button asChild>
              <Link to="/admin/cards">Back to All Cards</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <div className="bg-gray-50 py-4 mb-6">
          <nav className="flex items-center space-x-2 text-sm">
            <Link to="/admin" className="text-gray-600 hover:text-green-600">
              Admin Dashboard
            </Link>
            <span className="text-gray-400">›</span>
            <Link to="/admin/cards" className="text-gray-600 hover:text-green-600">
              All Cards
            </Link>
            <span className="text-gray-400">›</span>
            <span className="text-gray-900">Card Details</span>
          </nav>
        </div>

        {/* Header */}
        <div className="mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {card.card_data.name || 'Untitled Card'}
            </h1>
            <p className="text-gray-600 mt-2">
              Created {formatDate(card.created_at)}
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link to={`/admin/update?cardId=${card.id}`}>
                Edit Card
              </Link>
            </Button>
            {card.s3_base_url && (
              <Button asChild variant="outline">
                <a href={`${card.s3_base_url}/index.html`} target="_blank" rel="noopener noreferrer">
                  View Live Card
                </a>
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card Information */}
          <div className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Card Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <div className="mt-1">
                    {getStatusBadge(card.generation_status.status, card.generation_status.error)}
                  </div>
                  {card.generation_status.error && (
                    <p className="text-sm text-red-600 mt-1">
                      Error: {card.generation_status.error}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">UUID</label>
                  <p className="text-sm font-mono bg-gray-100 p-2 rounded mt-1">
                    {card.uuid}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Generated At</label>
                  <p className="text-sm mt-1">
                    {card.generated_at ? formatDate(card.generated_at) : 'Not generated'}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Last Updated</label>
                  <p className="text-sm mt-1">
                    {formatDate(card.updated_at)}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Contact Details */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {card.card_data.name && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Name</label>
                    <p className="text-sm mt-1">{card.card_data.name}</p>
                  </div>
                )}
                
                {card.card_data.title && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Title</label>
                    <p className="text-sm mt-1">{card.card_data.title}</p>
                  </div>
                )}
                
                {card.card_data.company && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Company</label>
                    <p className="text-sm mt-1">{card.card_data.company}</p>
                  </div>
                )}
                
                {card.card_data.email && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="text-sm mt-1">{card.card_data.email}</p>
                  </div>
                )}
                
                {card.card_data.phone && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Phone</label>
                    <p className="text-sm mt-1">{card.card_data.phone}</p>
                  </div>
                )}
                
                {card.card_data.mobile && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Mobile</label>
                    <p className="text-sm mt-1">{card.card_data.mobile}</p>
                  </div>
                )}
                
                {card.card_data.website && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Website</label>
                    <a href={card.card_data.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline mt-1 block">
                      {card.card_data.website}
                    </a>
                  </div>
                )}
                
                {card.card_data.description && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Description</label>
                    <p className="text-sm mt-1">{card.card_data.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            {(card.primary_actions.length > 0 || card.secondary_actions.length > 0) && (
              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {card.primary_actions.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Primary Actions</label>
                      <div className="mt-2 space-y-1">
                        {card.primary_actions.map((action, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <Badge variant="outline" style={{ backgroundColor: action.color }}>
                              {action.name}
                            </Badge>
                            <span className="text-sm text-gray-600">{action.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {card.secondary_actions.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Secondary Actions</label>
                      <div className="mt-2 space-y-1">
                        {card.secondary_actions.map((action, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <Badge variant="outline" style={{ backgroundColor: action.color }}>
                              {action.name}
                            </Badge>
                            <span className="text-sm text-gray-600">{action.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Customer & Assets */}
          <div className="space-y-6">
            {/* Customer Information */}
            {card.customer && (
              <Card>
                <CardHeader>
                  <CardTitle>Customer Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="text-sm mt-1">{card.customer.email}</p>
                  </div>
                  
                  {card.customer.name && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Name</label>
                      <p className="text-sm mt-1">{card.customer.name}</p>
                    </div>
                  )}
                  
                  {card.customer.phone && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Phone</label>
                      <p className="text-sm mt-1">{card.customer.phone}</p>
                    </div>
                  )}
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Customer Since</label>
                    <p className="text-sm mt-1">{formatDate(card.customer.created_at)}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Assets */}
            <Card>
              <CardHeader>
                <CardTitle>Assets</CardTitle>
                <CardDescription>Files associated with this card</CardDescription>
              </CardHeader>
              <CardContent>
                {assets.length === 0 ? (
                  <p className="text-sm text-gray-500">No assets found</p>
                ) : (
                  <div className="space-y-3">
                    {assets.map((asset) => (
                      <div key={asset.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">
                            {asset.asset_type.toUpperCase()}
                          </Badge>
                          <div>
                            <p className="text-sm font-medium">{asset.s3_key}</p>
                            <p className="text-xs text-gray-500">
                              {asset.mime_type} • {formatFileSize(asset.file_size)}
                            </p>
                          </div>
                        </div>
                        <Button asChild size="sm" variant="outline">
                          <a href={asset.s3_url} target="_blank" rel="noopener noreferrer">
                            Download
                          </a>
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
