import { useRef } from "react";
import { Link, useNavigate } from "react-router";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { UnifiedIcon } from "~/components/UnifiedIcon";
import { toast } from "sonner";
import { ConfigurationProvider, primaryActions as availablePrimaryActions, secondaryActions as availableSecondaryActions, useConfiguration } from "~/providers/configuration-provider";
import SortableActionsList from "~/components/SortableActionsList";
import MobileCardPreview from "~/components/MobileCardPreview";

interface ApiResponse {
  success?: boolean;
  error?: string;
  details?: string;
  partialSuccess?: boolean;
  succeeded?: {
    customerCreated?: boolean;
    customerId?: string | null;
  };
  troubleshooting?: string;
  message?: string;
}

export function meta() {
  return [
    { title: "Create Contact - Admin - TagMe Connections" },
    { name: "description", content: "Admin tool to create contact cards without purchasing. All cards will be uploaded to S3." },
  ];
}

export function handle() {
  return {
    breadcrumb: { label: "Create Contact" }
  };
}

function AdminCreateForm() {
  const navigate = useNavigate();

  // Use configuration context
  const {
    vCardData,
    updateVCardField,
    images,
    updateImage,
    primaryActions,
    secondaryActions,
    addAction,
    removeAction,
    updateActionValue,
    moveAction,
    logoOrHeader,
    setLogoOrHeader,
    filterPrimary,
    setFilterPrimary,
    filterSecondary,
    setFilterSecondary,
    isSubmitting,
    setIsSubmitting,
  } = useConfiguration();

  const fileInputRefs = {
    logo: useRef<HTMLInputElement>(null),
    photo: useRef<HTMLInputElement>(null),
    cover: useRef<HTMLInputElement>(null),
  };

  const handleInputChange = (field: keyof typeof vCardData, value: string) => {
    updateVCardField(field, value);
  };

  const handleImageUpload = (type: 'logo' | 'photo' | 'cover', file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataURI = e.target?.result as string;
      const ext = dataURI.split(',')[0].split(':')[1].split('/')[1].split(';')[0];

      const imageData = {
        url: dataURI,
        blob: dataURI,
        ext: ext,
        mime: file.type,
        resized: null
      };

      updateImage(type, imageData);

      if (type === 'photo') {
        updateVCardField('photo', dataURI);
      }
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (type: 'logo' | 'photo' | 'cover') => {
    const emptyImageData = { url: null, blob: null, ext: null, mime: null, resized: null };
    updateImage(type, emptyImageData);

    if (type === 'photo') {
      updateVCardField('photo', "");
    }
  };

  const handleDownloadContact = () => {
    // Generate vCard content for download
    const configuration = {
      name: `${vCardData.prefix ? vCardData.prefix + ' ' : ''}${vCardData.fname} ${vCardData.lname}`.trim(),
      email: vCardData.email,
      phone: vCardData.phone,
      company: vCardData.biz,
      title: vCardData.title,
      website: vCardData.website,
      socialMedia: {
        linkedin: primaryActions.find(a => a.name === 'linkedin')?.value || secondaryActions.find(a => a.name === 'linkedin')?.value || '',
        instagram: primaryActions.find(a => a.name === 'instagram')?.value || secondaryActions.find(a => a.name === 'instagram')?.value || '',
        twitter: primaryActions.find(a => a.name === 'twitter')?.value || secondaryActions.find(a => a.name === 'twitter')?.value || '',
        facebook: primaryActions.find(a => a.name === 'facebook')?.value || secondaryActions.find(a => a.name === 'facebook')?.value || ''
      },
      customMessage: vCardData.desc,
      // Additional fields
      prefix: vCardData.prefix,
      fname: vCardData.fname,
      lname: vCardData.lname,
      pronouns: vCardData.pronouns,
      street: vCardData.street,
      city: vCardData.city,
      state: vCardData.state,
      postal: vCardData.postal,
      country: vCardData.country,
      mobile: vCardData.mobile,
      photo: vCardData.photo,
      primaryActions: primaryActions.filter(a => a.value),
      secondaryActions: secondaryActions.filter(a => a.value),
      images: images,
      logoOrHeader: logoOrHeader
    };

    // Generate vCard content
    const vcardContent = generateVCardContent(configuration);
    
    // Create and download the file
    const blob = new Blob([vcardContent], { type: 'text/vcard' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${configuration.name.replace(/[^a-zA-Z0-9]/g, '_') || 'contact'}.vcf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Create configuration object
      const configuration = {
        name: `${vCardData.prefix ? vCardData.prefix + ' ' : ''}${vCardData.fname} ${vCardData.lname}`.trim(),
        email: vCardData.email,
        phone: vCardData.phone,
        company: vCardData.biz,
        title: vCardData.title,
        website: vCardData.website,
        socialMedia: {
          linkedin: primaryActions.find(a => a.name === 'linkedin')?.value || secondaryActions.find(a => a.name === 'linkedin')?.value || '',
          instagram: primaryActions.find(a => a.name === 'instagram')?.value || secondaryActions.find(a => a.name === 'instagram')?.value || '',
          twitter: primaryActions.find(a => a.name === 'twitter')?.value || secondaryActions.find(a => a.name === 'twitter')?.value || '',
          facebook: primaryActions.find(a => a.name === 'facebook')?.value || secondaryActions.find(a => a.name === 'facebook')?.value || ''
        },
        customMessage: vCardData.desc,
        // Additional fields
        prefix: vCardData.prefix,
        fname: vCardData.fname,
        lname: vCardData.lname,
        pronouns: vCardData.pronouns,
        street: vCardData.street,
        city: vCardData.city,
        state: vCardData.state,
        postal: vCardData.postal,
        country: vCardData.country,
        mobile: vCardData.mobile,
        photo: vCardData.photo,
        primaryActions: primaryActions.filter(a => a.value),
        secondaryActions: secondaryActions.filter(a => a.value),
        images: images,
        logoOrHeader: logoOrHeader
      };

      // Get customer email from form (if provided)
      const customerEmail = (e.target as HTMLFormElement).elements.namedItem('customerEmail') as HTMLInputElement;
      const customerEmailValue = customerEmail?.value?.trim() || '';

      // Call admin creation API
      const response = await fetch('/api/admin-create-contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          configuration,
          customerEmail: customerEmailValue || undefined
        }),
      });

      // Parse response and handle errors more robustly
      let result: ApiResponse;
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
        // Check if this is a partial success scenario (customer created but S3 upload failed)
        if (result?.partialSuccess && result?.succeeded?.customerCreated) {
          const errorDetails = result?.details || 'Unknown error';
          const troubleshooting = result?.troubleshooting || '';
          const customerId = result?.succeeded?.customerId;
          
          throw new Error(
            `Partial Success: Customer record created (ID: ${customerId || 'N/A'}), but S3 upload failed.\n\n` +
            `Error: ${errorDetails}\n\n` +
            `${troubleshooting}\n\n` +
            `Please retry the operation or contact support if the issue persists.`
          );
        }
        
        // Regular error case
        const errorMessage = result?.error || result?.message || `Failed to create contact (${response.status})`;
        const details = result?.details ? `: ${result.details}` : '';
        throw new Error(`${errorMessage}${details}`);
      }

      // Navigate to success page with creation details
      navigate('/admin/success', { 
        state: { 
          creationDetails: result,
          contactName: configuration.name,
          contactEmail: configuration.email 
        }
      });

    } catch (error) {
      console.error('Error creating contact:', error);
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred while creating the contact.";
      toast.error("Creation Failed", {
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate vCard content
  const generateVCardContent = (config: Record<string, unknown>): string => {
    const lines = ['BEGIN:VCARD', 'VERSION:3.0'];
    
    // Name
    if (config.name) {
      const nameParts = String(config.name).split(' ');
      if (nameParts.length >= 2) {
        lines.push(`FN:${config.name}`);
        lines.push(`N:${nameParts[nameParts.length - 1]};${nameParts.slice(0, -1).join(' ')};;;`);
      } else {
        lines.push(`FN:${config.name}`);
        lines.push(`N:${config.name};;;;`);
      }
    }
    
    // Organization
    if (config.company) {
      lines.push(`ORG:${config.company}`);
    }
    
    // Title
    if (config.title) {
      lines.push(`TITLE:${config.title}`);
    }
    
    // Email
    if (config.email) {
      lines.push(`EMAIL:${config.email}`);
    }
    
    // Phone
    if (config.phone) {
      lines.push(`TEL:${config.phone}`);
    }
    
    // Mobile
    if (config.mobile) {
      lines.push(`TEL;TYPE=CELL:${config.mobile}`);
    }
    
    // Website
    if (config.website) {
      lines.push(`URL:${config.website}`);
    }
    
    // Address
    if (config.street || config.city || config.state || config.postal || config.country) {
      const address = [config.street, config.city, config.state, config.postal, config.country].filter(Boolean).join(';');
      lines.push(`ADR:;;${address};;;;`);
    }
    
    // Social media
    if (config.socialMedia) {
      Object.entries(config.socialMedia).forEach(([platform, url]) => {
        if (url) {
          lines.push(`URL;TYPE=${platform.toUpperCase()}:${url}`);
        }
      });
    }
    
    // Custom message as note
    if (config.customMessage) {
      lines.push(`NOTE:${config.customMessage}`);
    }
    
    lines.push('END:VCARD');
    return lines.join('\n');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Configuration Form */}
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Admin Contact Creator
            </h1>
            <p className="text-lg text-gray-600">
                Create contact cards without purchasing. All cards will be uploaded to S3.
              </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid lg:grid-cols-2 gap-12">
              {/* Left Panel - Form */}
              <div className="space-y-8">
                {/* Customer Email Section */}
                <Card>
                  <CardHeader>
                    <CardTitle>Customer Information (Optional)</CardTitle>
                    <CardDescription>Link this card to a customer for tracking purposes</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Label htmlFor="customerEmail">Customer Email</Label>
                      <Input
                        id="customerEmail"
                        name="customerEmail"
                        type="text"
                        placeholder="customer@example.com"
                        className="w-full"
                      />
                      <p className="text-sm text-gray-500">
                        If provided, this card will be linked to the customer record. If the customer doesn't exist, a new record will be created.
                      </p>
                    </div>
                  </CardContent>
                </Card>
                {/* Header Image Section */}
                <Card>
                  <CardHeader>
                    <CardTitle>Header Image</CardTitle>
                    <CardDescription>Choose your header style</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      {/* Brand Logo Option */}
                      <div
                        className={`p-4 border-2 rounded-lg transition-all duration-200 ${
                          !logoOrHeader
                            ? 'border-green-500 bg-green-50'
                            : images.cover.url
                            ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50'
                            : 'border-gray-300 bg-white hover:border-gray-400 cursor-pointer'
                        }`}
                        onClick={() => !images.cover.url && setLogoOrHeader(false)}
                      >
                        <div className="flex items-start space-x-3">
                          <input
                            type="radio"
                            name="headerType"
                            checked={!logoOrHeader}
                            onChange={() => !images.cover.url && setLogoOrHeader(false)}
                            disabled={!!images.cover.url}
                            className="mt-1 w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500 disabled:cursor-not-allowed"
                          />
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-1">Brand Logo</h3>
                            <p className="text-sm text-gray-600">
                              Display your company logo prominently
                            </p>
                            <p className="text-xs text-gray-500 mt-1">Recommended size: 350×100px</p>
                            {images.cover.url && (
                              <p className="text-xs text-red-500 mt-1">Remove cover photo to switch</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Cover Photo Option */}
                      <div
                        className={`p-4 border-2 rounded-lg transition-all duration-200 ${
                          logoOrHeader
                            ? 'border-green-500 bg-green-50'
                            : images.logo.url
                            ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50'
                            : 'border-gray-300 bg-white hover:border-gray-400 cursor-pointer'
                        }`}
                        onClick={() => !images.logo.url && setLogoOrHeader(true)}
                      >
                        <div className="flex items-start space-x-3">
                          <input
                            type="radio"
                            name="headerType"
                            checked={logoOrHeader}
                            onChange={() => !images.logo.url && setLogoOrHeader(true)}
                            disabled={!!images.logo.url}
                            className="mt-1 w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500 disabled:cursor-not-allowed"
                          />
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-1">Cover Photo</h3>
                            <p className="text-sm text-gray-600">
                              Use a background image for visual impact
                            </p>
                            <p className="text-xs text-gray-500 mt-1">Recommended size: 960×640px</p>
                            {images.logo.url && (
                              <p className="text-xs text-red-500 mt-1">Remove brand logo to switch</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Upload Section */}
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                      {logoOrHeader ? (
                        // Cover Photo Upload
                        images.cover.url ? (
                          <div className="space-y-2">
                            <img
                              src={images.cover.url}
                              alt="Cover image"
                              className="max-h-20 mx-auto rounded"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeImage('cover')}
                            >
                              Remove
                            </Button>
                          </div>
                        ) : (
                          <div>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => fileInputRefs.cover.current?.click()}
                            >
                              Upload Cover Photo
                            </Button>
                            <input
                              ref={fileInputRefs.cover}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleImageUpload('cover', file);
                              }}
                            />
                          </div>
                        )
                      ) : (
                        // Brand Logo Upload
                        images.logo.url ? (
                          <div className="space-y-2">
                            <img
                              src={images.logo.url}
                              alt="Brand Logo"
                              className="max-h-20 mx-auto rounded"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeImage('logo')}
                            >
                              Remove
                            </Button>
                          </div>
                        ) : (
                          <div>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => fileInputRefs.logo.current?.click()}
                            >
                              Upload Brand Logo
                            </Button>
                            <input
                              ref={fileInputRefs.logo}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleImageUpload('logo', file);
                              }}
                            />
                          </div>
                        )
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Avatar Photo Section */}
                <Card>
                  <CardHeader>
                    <CardTitle>Avatar Photo</CardTitle>
                    <CardDescription>Upload your profile picture</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Label>Avatar Photo</Label>
                      <p className="text-sm text-gray-500">Recommended size: 300×300px</p>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                        {images.photo.url ? (
                          <div className="space-y-2">
                            <img src={images.photo.url} alt="Photo" className="w-20 h-20 mx-auto rounded-full object-cover" />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeImage('photo')}
                            >
                              Remove
                            </Button>
                          </div>
                        ) : (
                          <div>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => fileInputRefs.photo.current?.click()}
                            >
                              Upload Photo
                            </Button>
                            <input
                              ref={fileInputRefs.photo}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleImageUpload('photo', file);
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                    <CardDescription>Your personal and professional details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fname">First Name</Label>
                        <Input
                          id="fname"
                          value={vCardData.fname}
                          onChange={(e) => handleInputChange('fname', e.target.value)}
                          placeholder="John"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lname">Last Name</Label>
                        <Input
                          id="lname"
                          value={vCardData.lname}
                          onChange={(e) => handleInputChange('lname', e.target.value)}
                          placeholder="Doe"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="prefix">Prefix</Label>
                      <Input
                        id="prefix"
                        placeholder="Dr./Mr./Prof."
                        value={vCardData.prefix}
                        onChange={(e) => handleInputChange('prefix', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="pronouns">Pronouns</Label>
                      <Input
                        id="pronouns"
                        placeholder="He/Him/His"
                        value={vCardData.pronouns}
                        onChange={(e) => handleInputChange('pronouns', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="title">Job Title</Label>
                      <Input
                        id="title"
                        value={vCardData.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        placeholder="Designer"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="biz">Company</Label>
                      <Input
                        id="biz"
                        value={vCardData.biz}
                        onChange={(e) => handleInputChange('biz', e.target.value)}
                        placeholder="Acme Inc."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="text"
                        value={vCardData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="john@example.com"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={vCardData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="mobile">Mobile</Label>
                        <Input
                          id="mobile"
                          type="tel"
                          value={vCardData.mobile}
                          onChange={(e) => handleInputChange('mobile', e.target.value)}
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        type="url"
                        value={vCardData.website}
                        onChange={(e) => handleInputChange('website', e.target.value)}
                        placeholder="https://example.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="desc">Description</Label>
                      <Textarea
                        id="desc"
                        value={vCardData.desc}
                        onChange={(e) => handleInputChange('desc', e.target.value)}
                        rows={3}
                        placeholder="Brief description about yourself or your business..."
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Primary Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Primary Actions</CardTitle>
                    <CardDescription>Main contact methods and links</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* Current Primary Actions with Drag Handles */}
                    <SortableActionsList
                      actions={primaryActions}
                      type="primary"
                      moveAction={moveAction}
                      updateActionValue={updateActionValue}
                      removeAction={removeAction}
                    />

                    {/* Search and Available Actions */}
                    <div className="mt-6">
                      <Input
                        className="mb-4"
                        value={filterPrimary}
                        onChange={(e) => setFilterPrimary(e.target.value)}
                        placeholder="Search an action"
                      />
                      <div className="grid grid-cols-4 gap-2">
                        {availablePrimaryActions.filter(action =>
                          action.name.toLowerCase().includes(filterPrimary.toLowerCase()) &&
                          !primaryActions.some(existing => existing.name === action.name)
                        ).map((action) => (
                          <Button
                            key={action.name}
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addAction('primary', action.name)}
                            className="flex flex-col items-center space-y-1 h-auto py-3"
                          >
                            <span 
                              className="px-3 py-1 rounded-lg text-xs font-medium text-white"
                              style={{ backgroundColor: action.color }}
                            >
                              {action.name}
                            </span>
                          </Button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Secondary Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Secondary Actions</CardTitle>
                    <CardDescription>Social media and additional links</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* Current Secondary Actions with Drag Handles */}
                    <SortableActionsList
                      actions={secondaryActions}
                      type="secondary"
                      moveAction={moveAction}
                      updateActionValue={updateActionValue}
                      removeAction={removeAction}
                    />

                    {/* Search and Available Actions */}
                    <div className="mt-6">
                      <Input
                        className="mb-4"
                        value={filterSecondary}
                        onChange={(e) => setFilterSecondary(e.target.value)}
                        placeholder="Search an action"
                      />
                      <div className="grid grid-cols-4 gap-2">
                        {availableSecondaryActions.filter(action =>
                          action.name.toLowerCase().includes(filterSecondary.toLowerCase()) &&
                          !secondaryActions.some(existing => existing.name === action.name)
                        ).map((action) => (
                          <Button
                            key={action.name}
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addAction('secondary', action.name)}
                            className="flex flex-col items-center space-y-1 h-auto py-3"
                          >
                            <span 
                              className="px-3 py-1 rounded-lg text-xs font-medium text-white"
                              style={{ backgroundColor: action.color }}
                            >
                              {action.name}
                            </span>
                          </Button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Panel - Preview */}
              <div className="space-y-8">
                <Card className="sticky top-8">
                  <CardHeader>
                    <CardTitle>Preview</CardTitle>
                    <CardDescription>Your card preview</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <MobileCardPreview
                      vCardData={vCardData}
                      images={images}
                      primaryActions={primaryActions}
                      secondaryActions={secondaryActions}
                      logoOrHeader={logoOrHeader}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-4 mt-8">
              <Button
                type="button"
                variant="outline"
                onClick={handleDownloadContact}
              >
                Download Contact
              </Button>
              <Button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating Contact...' : 'Create Contact'}
            </Button>
          </div>
          </form>
        </div>
      </section>
    </div>
  );
}

export default function AdminCreate() {
  // Create a default product for admin creation
  const product = {
    id: "admin-create",
    name: "Admin Contact Creator",
    price: "$0.00",
    description: "Create contact cards without purchasing",
    image: "/sample-tag-core-card.webp"
  };

  return (
    <ConfigurationProvider product={product}>
      <AdminCreateForm />
    </ConfigurationProvider>
  );
}
