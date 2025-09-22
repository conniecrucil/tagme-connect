import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { toast } from "sonner";
import { ArrowLeft, Search, Loader2, ExternalLink } from "lucide-react";

export function meta() {
  return [
    { title: "Update Contact - Admin - TagMe Connections" },
    { name: "description", content: "Admin tool to retrieve and update existing TAG Core card sites by URL. Edit contact details and re-publish under the same UUID." },
  ];
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
  images?: {
    logo?: { url?: string; blob?: string; ext?: string; mime?: string };
    photo?: { url?: string; blob?: string; ext?: string; mime?: string };
    cover?: { url?: string; blob?: string; ext?: string; mime?: string };
  };
}

interface RetrievedContactData {
  success: boolean;
  uuid: string;
  contactData: ContactCardData;
  urls: {
    html: string;
    vcard: string;
  };
}

export default function AdminUpdate() {
  const navigate = useNavigate();
  
  const [contactUrl, setContactUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [retrievedData, setRetrievedData] = useState<RetrievedContactData | null>(null);
  const [contactData, setContactData] = useState<ContactCardData>({});
  const [socialMedia, setSocialMedia] = useState<Record<string, string>>({});

  // Extract UUID from contact card URL
  const extractUuidFromUrl = (url: string): string | null => {
    try {
      // Handle both index.html and contact.vcf URLs
      // Examples: 
      // https://demo.bancroft.io/00534a50-a2f9-430d-9f96-883877a5b6fd/index.html
      // https://demo.bancroft.io/00534a50-a2f9-430d-9f96-883877a5b6fd/contact.vcf
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/').filter(part => part.length > 0);
      
      // Find the UUID part (should be the last directory before the filename)
      if (pathParts.length >= 2) {
        const uuid = pathParts[pathParts.length - 2];
        // Validate UUID format (basic check)
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(uuid)) {
          return uuid;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error parsing URL:', error);
      return null;
    }
  };

  const handleSearch = async () => {
    if (!contactUrl.trim()) {
      toast.error("Contact URL Required", {
        description: "Please enter a contact card URL to search for."
      });
      return;
    }

    // Extract UUID from the provided URL
    const uuid = extractUuidFromUrl(contactUrl.trim());
    if (!uuid) {
      toast.error("Invalid URL", {
        description: "Please enter a valid contact card URL (e.g., https://demo.bancroft.io/uuid/index.html)."
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/.netlify/functions/retrieve-contact-data?contactUrl=${encodeURIComponent(contactUrl.trim())}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to retrieve contact data');
      }

      setRetrievedData(result);
      setContactData(result.contactData);
      setSocialMedia(result.contactData.socialMedia || {});

      toast.success("Contact Found", {
        description: `Successfully retrieved contact data for ${result.contactData.name || 'Unknown'}.`
      });
    } catch (error) {
      console.error('Error retrieving contact data:', error);
      toast.error("Error", {
        description: error instanceof Error ? error.message : "Failed to retrieve contact data"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!retrievedData) {
      toast.error("No Data to Update", {
        description: "Please search for and load a contact card first."
      });
      return;
    }

    setIsUpdating(true);
    try {
      const updateData = {
        ...contactData,
        socialMedia: Object.fromEntries(
          Object.entries(socialMedia).filter(([_, url]) => url.trim())
        )
      };

      const response = await fetch('/.netlify/functions/update-contact-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uuid: retrievedData.uuid,
          contactData: updateData
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update contact data');
      }

      toast.success("Update Successful", {
        description: `Contact card for ${contactData.name || 'Unknown'} has been updated successfully.`
      });

      // Update the retrieved data with new URLs
      setRetrievedData({
        ...retrievedData,
        urls: result.urls
      });

    } catch (error) {
      console.error('Error updating contact data:', error);
      toast.error("Update Failed", {
        description: error instanceof Error ? error.message : "Failed to update contact data"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const updateContactField = (field: keyof ContactCardData, value: string) => {
    setContactData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateSocialMedia = (platform: string, url: string) => {
    setSocialMedia(prev => ({
      ...prev,
      [platform]: url
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button 
              variant="outline" 
              onClick={() => navigate('/admin')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">Update Contact Card</h1>
          </div>
          <p className="text-gray-600">
            Retrieve and update existing TAG Core card sites by URL
          </p>
        </div>

        {/* Search Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Search for Contact Card</CardTitle>
            <CardDescription>
              Enter the URL of the contact card you want to update (e.g., https://demo.bancroft.io/uuid/index.html)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="contactUrl">Contact Card URL</Label>
                <Input
                  id="contactUrl"
                  placeholder="https://demo.bancroft.io/00534a50-a2f9-430d-9f96-883877a5b6fd/index.html"
                  value={contactUrl}
                  onChange={(e) => setContactUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={handleSearch} 
                  disabled={isLoading || !contactUrl.trim()}
                  className="flex items-center gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  {isLoading ? 'Searching...' : 'Search'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Data Form */}
        {retrievedData && (
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Contact Information</CardTitle>
                  <CardDescription>
                    Edit the contact details below and click Update to save changes
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(retrievedData.urls.html, '_blank')}
                    className="flex items-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View Live
                  </Button>
                  <Button
                    onClick={handleUpdate}
                    disabled={isUpdating}
                    className="flex items-center gap-2"
                  >
                    {isUpdating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : null}
                    {isUpdating ? 'Updating...' : 'Update Contact'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={contactData.name || ''}
                      onChange={(e) => updateContactField('name', e.target.value)}
                      placeholder="Full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={contactData.email || ''}
                      onChange={(e) => updateContactField('email', e.target.value)}
                      placeholder="email@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={contactData.phone || ''}
                      onChange={(e) => updateContactField('phone', e.target.value)}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  <div>
                    <Label htmlFor="mobile">Mobile</Label>
                    <Input
                      id="mobile"
                      value={contactData.mobile || ''}
                      onChange={(e) => updateContactField('mobile', e.target.value)}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>
              </div>

              {/* Business Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Business Information</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="company">Company</Label>
                    <Input
                      id="company"
                      value={contactData.company || ''}
                      onChange={(e) => updateContactField('company', e.target.value)}
                      placeholder="Company name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="title">Job Title</Label>
                      <Input
                        id="title"
                        value={contactData.title || ''}
                        onChange={(e) => updateContactField('title', e.target.value)}
                        placeholder="founder"
                      />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={contactData.website || ''}
                      onChange={(e) => updateContactField('website', e.target.value)}
                      placeholder="https://example.com"
                    />
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Address Information</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <Label htmlFor="street">Street Address</Label>
                    <Input
                      id="street"
                      value={contactData.street || ''}
                      onChange={(e) => updateContactField('street', e.target.value)}
                      placeholder="123 Main Street"
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={contactData.city || ''}
                      onChange={(e) => updateContactField('city', e.target.value)}
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State/Province</Label>
                    <Input
                      id="state"
                      value={contactData.state || ''}
                      onChange={(e) => updateContactField('state', e.target.value)}
                      placeholder="State/Province"
                    />
                  </div>
                  <div>
                    <Label htmlFor="postal">Postal Code</Label>
                    <Input
                      id="postal"
                      value={contactData.postal || ''}
                      onChange={(e) => updateContactField('postal', e.target.value)}
                      placeholder="12345"
                    />
                  </div>
                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={contactData.country || ''}
                      onChange={(e) => updateContactField('country', e.target.value)}
                      placeholder="Country"
                    />
                  </div>
                </div>
              </div>

              {/* Social Media */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Social Media Links</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {['linkedin', 'twitter', 'facebook', 'instagram', 'youtube', 'github'].map((platform) => (
                    <div key={platform}>
                      <Label htmlFor={platform}>
                        {platform.charAt(0).toUpperCase() + platform.slice(1)}
                      </Label>
                      <Input
                        id={platform}
                        value={socialMedia[platform] || ''}
                        onChange={(e) => updateSocialMedia(platform, e.target.value)}
                        placeholder={`https://${platform}.com/username`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Custom Message */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Custom Message</h3>
                <Textarea
                  value={contactData.customMessage || ''}
                  onChange={(e) => updateContactField('customMessage', e.target.value)}
                  placeholder="Enter a custom message or tagline..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Current Status */}
        {retrievedData && (
          <Card>
            <CardHeader>
              <CardTitle>Current Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>UUID</Label>
                  <Input value={retrievedData.uuid} readOnly className="bg-gray-50" />
                </div>
                <div>
                  <Label>Contact Name</Label>
                  <Input value={contactData.name || 'Not set'} readOnly className="bg-gray-50" />
                </div>
                <div>
                  <Label>Live URL</Label>
                  <Input 
                    value={retrievedData.urls.html} 
                    readOnly 
                    className="bg-gray-50" 
                    onClick={() => window.open(retrievedData.urls.html, '_blank')}
                  />
                </div>
                <div>
                  <Label>vCard URL</Label>
                  <Input 
                    value={retrievedData.urls.vcard} 
                    readOnly 
                    className="bg-gray-50"
                    onClick={() => window.open(retrievedData.urls.vcard, '_blank')}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
