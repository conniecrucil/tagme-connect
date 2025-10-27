import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Search, Loader2, ExternalLink } from "lucide-react";

export function meta() {
  return [
    { title: "Update Contact - Admin - TagMe Connections" },
    { name: "description", content: "Admin tool to retrieve and update existing contact cards. Select from database and edit contact details." },
  ];
}

export function handle() {
  return {
    breadcrumb: { label: "Update Contact" }
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
  generation_status: {
    status: 'success' | 'error' | 'pending';
    error?: string;
    timestamp: string;
  };
  created_at: string;
}

interface ContactCardData {
  name?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  company?: string;
  title?: string;
  website?: string;
  street?: string;
  city?: string;
  state?: string;
  postal?: string;
  country?: string;
  socialMedia?: Record<string, string>;
  customMessage?: string;
  primaryActions?: Array<{ name: string; value: string; color?: string }>;
  secondaryActions?: Array<{ name: string; value: string; color?: string }>;
  logoOrHeader?: boolean;
  images?: {
    logo?: { url?: string; blob?: string; ext?: string; mime?: string };
    photo?: { url?: string; blob?: string; ext?: string; mime?: string };
    cover?: { url?: string; blob?: string; ext?: string; mime?: string };
  };
}

export default function AdminUpdate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [cards, setCards] = useState<CardWithCustomer[]>([]);
  const [selectedCardId, setSelectedCardId] = useState("");
  const [isLoadingCards, setIsLoadingCards] = useState(false);
  const [isLoadingCard, setIsLoadingCard] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [contactData, setContactData] = useState<ContactCardData>({});
  const [socialMedia, setSocialMedia] = useState<Record<string, string>>({});
  const [primaryActions, setPrimaryActions] = useState<Array<{ name: string; value: string; color?: string }>>([]);
  const [secondaryActions, setSecondaryActions] = useState<Array<{ name: string; value: string; color?: string }>>([]);
  const [logoOrHeader, setLogoOrHeader] = useState(false);
  const [images, setImages] = useState<{
    logo?: { url?: string; blob?: string; ext?: string; mime?: string };
    photo?: { url?: string; blob?: string; ext?: string; mime?: string };
    cover?: { url?: string; blob?: string; ext?: string; mime?: string };
  }>({});

  // Check if cardId is provided in URL params
  useEffect(() => {
    const cardId = searchParams.get('cardId');
    if (cardId) {
      setSelectedCardId(cardId);
      fetchCardDetails(cardId);
    }
  }, [searchParams]);

  // Fetch cards list on component mount
  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    try {
      setIsLoadingCards(true);
      const response = await fetch('/.netlify/functions/get-cards?limit=100');
      
      if (!response.ok) {
        throw new Error('Failed to fetch cards');
      }

      const data = await response.json();
      setCards(data.cards);
    } catch (error) {
      console.error('Error fetching cards:', error);
      toast.error("Failed to load cards", {
        description: "Please try again later."
      });
    } finally {
      setIsLoadingCards(false);
    }
  };

  const fetchCardDetails = async (cardId: string) => {
    try {
      setIsLoadingCard(true);
      const response = await fetch(`/.netlify/functions/get-card-details?cardId=${cardId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch card details');
      }

      const data = await response.json();
      const card = data.card;
      
      // Convert database card to form data
      const formData: ContactCardData = {
        name: card.card_data.name,
        email: card.card_data.email,
        phone: card.card_data.phone,
        mobile: card.card_data.mobile,
        company: card.card_data.company,
        title: card.card_data.title,
        website: card.card_data.website,
        street: card.card_data.street,
        city: card.card_data.city,
        state: card.card_data.state,
        postal: card.card_data.postal,
        country: card.card_data.country,
        customMessage: card.card_data.description,
        primaryActions: card.primary_actions,
        secondaryActions: card.secondary_actions,
        logoOrHeader: card.logo_or_header,
        images: {
          logo: card.has_logo ? { url: `${card.s3_base_url}/logo.jpg` } : undefined,
          photo: card.has_photo ? { url: `${card.s3_base_url}/photo.jpg` } : undefined,
          cover: card.has_cover ? { url: `${card.s3_base_url}/cover.jpg` } : undefined,
        }
      };

      setContactData(formData);
      setPrimaryActions(card.primary_actions || []);
      setSecondaryActions(card.secondary_actions || []);
      setLogoOrHeader(card.logo_or_header || false);
      setImages(formData.images || {});

      // Convert actions to social media format
      const socialMediaData: Record<string, string> = {};
      [...card.primary_actions, ...card.secondary_actions].forEach(action => {
        if (action.value) {
          socialMediaData[action.name] = action.value;
        }
      });
      setSocialMedia(socialMediaData);

    } catch (error) {
      console.error('Error fetching card details:', error);
      toast.error("Failed to load card details", {
        description: "Please try again later."
      });
    } finally {
      setIsLoadingCard(false);
    }
  };

  const handleCardSelect = (cardId: string) => {
    setSelectedCardId(cardId);
    fetchCardDetails(cardId);
  };

  const handleUpdate = async () => {
    if (!selectedCardId) {
      toast.error("No Card Selected", {
        description: "Please select a card to update."
      });
      return;
    }

    setIsUpdating(true);

    try {
      // Find the selected card to get UUID
      const selectedCard = cards.find(card => card.id === selectedCardId);
      if (!selectedCard) {
        throw new Error('Selected card not found');
      }

      // Prepare update data
      const updateData = {
        ...contactData,
        primaryActions: primaryActions.filter(a => a.value),
        secondaryActions: secondaryActions.filter(a => a.value),
        logoOrHeader,
        images
      };

      const response = await fetch('/.netlify/functions/update-contact-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uuid: selectedCard.uuid,
          contactData: updateData
        }),
      });

      // Parse response and handle errors more robustly
      let result: any;
      const contentType = response.headers.get('content-type');
      
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Unexpected response format. Server returned ${response.status} ${response.statusText}`);
      }
      
      try {
        result = await response.json();
      } catch {
        throw new Error(`Invalid JSON response from server (${response.status} ${response.statusText})`);
      }

      if (!response.ok) {
        const errorMessage = result?.error || result?.message || `Failed to update contact (${response.status})`;
        throw new Error(errorMessage);
      }

      toast.success("Contact Updated Successfully", {
        description: `Contact card has been updated and re-published.`
      });

      // Reset form
      setContactData({});
      setSocialMedia({});
      setPrimaryActions([]);
      setSecondaryActions([]);
      setLogoOrHeader(false);
      setImages({});
      setSelectedCardId("");

    } catch (error) {
      console.error('Error updating contact:', error);
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
      toast.error("Update Failed", {
        description: errorMessage
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <div className="bg-gray-50 py-4 mb-6">
          <nav className="flex items-center space-x-2 text-sm">
            <button
              onClick={() => navigate('/admin')}
              className="text-gray-600 hover:text-green-600 flex items-center gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              Admin Dashboard
            </button>
            <span className="text-gray-400">›</span>
            <span className="text-gray-900">Update Contact</span>
          </nav>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Update Contact Card</h1>
          <p className="text-gray-600 mt-2">
            Select an existing contact card from the database and update its details.
          </p>
        </div>

        {/* Card Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Select Contact Card</CardTitle>
            <CardDescription>Choose a contact card to update from the database</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingCards ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span>Loading cards...</span>
              </div>
            ) : (
              <Select value={selectedCardId} onValueChange={handleCardSelect}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a contact card to update..." />
                </SelectTrigger>
                <SelectContent>
                  {cards.map((card) => (
                    <SelectItem key={card.id} value={card.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {card.card_data.name || 'Untitled Card'}
                        </span>
                        <span className="text-sm text-gray-500">
                          {card.customer?.email || 'No customer'} • {formatDate(card.created_at)}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </CardContent>
        </Card>

        {/* Contact Form */}
        {selectedCardId && (
          <Card>
            <CardHeader>
              <CardTitle>Contact Details</CardTitle>
              <CardDescription>Update the contact information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoadingCard ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span>Loading contact details...</span>
                </div>
              ) : (
                <>
                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={contactData.name || ''}
                        onChange={(e) => setContactData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={contactData.email || ''}
                        onChange={(e) => setContactData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="john@example.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={contactData.phone || ''}
                        onChange={(e) => setContactData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                    <div>
                      <Label htmlFor="mobile">Mobile</Label>
                      <Input
                        id="mobile"
                        value={contactData.mobile || ''}
                        onChange={(e) => setContactData(prev => ({ ...prev, mobile: e.target.value }))}
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                    <div>
                      <Label htmlFor="company">Company</Label>
                      <Input
                        id="company"
                        value={contactData.company || ''}
                        onChange={(e) => setContactData(prev => ({ ...prev, company: e.target.value }))}
                        placeholder="Acme Corp"
                      />
                    </div>
                    <div>
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={contactData.title || ''}
                        onChange={(e) => setContactData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Software Engineer"
                      />
                    </div>
                    <div>
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        value={contactData.website || ''}
                        onChange={(e) => setContactData(prev => ({ ...prev, website: e.target.value }))}
                        placeholder="https://example.com"
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="street">Street Address</Label>
                      <Input
                        id="street"
                        value={contactData.street || ''}
                        onChange={(e) => setContactData(prev => ({ ...prev, street: e.target.value }))}
                        placeholder="123 Main St"
                      />
                    </div>
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={contactData.city || ''}
                        onChange={(e) => setContactData(prev => ({ ...prev, city: e.target.value }))}
                        placeholder="New York"
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        value={contactData.state || ''}
                        onChange={(e) => setContactData(prev => ({ ...prev, state: e.target.value }))}
                        placeholder="NY"
                      />
                    </div>
                    <div>
                      <Label htmlFor="postal">Postal Code</Label>
                      <Input
                        id="postal"
                        value={contactData.postal || ''}
                        onChange={(e) => setContactData(prev => ({ ...prev, postal: e.target.value }))}
                        placeholder="10001"
                      />
                    </div>
                  </div>

                  {/* Custom Message */}
                  <div>
                    <Label htmlFor="customMessage">Custom Message</Label>
                    <Textarea
                      id="customMessage"
                      value={contactData.customMessage || ''}
                      onChange={(e) => setContactData(prev => ({ ...prev, customMessage: e.target.value }))}
                      placeholder="Add a personal message or description..."
                      rows={3}
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-4">
                    <Button
                      onClick={handleUpdate}
                      disabled={isUpdating}
                      className="flex-1"
                    >
                      {isUpdating ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Updating...
                        </>
                      ) : (
                        'Update Contact Card'
                      )}
                    </Button>
                    
                    {contactData.website && (
                      <Button
                        variant="outline"
                        onClick={() => window.open(contactData.website, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Website
                      </Button>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}