import { useState, useRef } from "react";
import { useNavigate } from "react-router";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { ActionIcon } from "~/components/Icon";
import { useToast } from "~/components/ui/use-toast";
import { availableActions } from "~/providers/configuration-provider";
import type { VCardData, Action, ImageData } from "~/providers/configuration-provider";
import MobileCardPreview from "~/components/MobileCardPreview";

export default function AdminContactBuilder() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // State management (duplicated from configuration provider)
  const [vCardData, setVCardData] = useState<VCardData>({
    prefix: '',
    fname: '',
    lname: '',
    pronouns: '',
    title: '',
    biz: '',
    desc: '',
    street: '',
    city: '',
    state: '',
    postal: '',
    country: '',
    email: '',
    phone: '',
    mobile: '',
    website: '',
    photo: '',
  });

  const [images, setImages] = useState<{
    logo: ImageData;
    photo: ImageData;
    cover: ImageData;
  }>({
    logo: { url: null, blob: null, ext: null, mime: null, resized: null },
    photo: { url: null, blob: null, ext: null, mime: null, resized: null },
    cover: { url: null, blob: null, ext: null, mime: null, resized: null },
  });

  const [primaryActions, setPrimaryActions] = useState<Action[]>([]);
  const [secondaryActions, setSecondaryActions] = useState<Action[]>([]);
  const [logoOrHeader, setLogoOrHeader] = useState(true);
  const [filterPrimary, setFilterPrimary] = useState('');
  const [filterSecondary, setFilterSecondary] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRefs = {
    logo: useRef<HTMLInputElement>(null),
    photo: useRef<HTMLInputElement>(null),
    cover: useRef<HTMLInputElement>(null),
  };

  const updateVCardField = (field: keyof VCardData, value: string) => {
    setVCardData(prev => ({ ...prev, [field]: value }));
  };

  const updateImage = (type: 'logo' | 'photo' | 'cover', imageData: ImageData) => {
    setImages(prev => ({ ...prev, [type]: imageData }));
  };

  const handleImageUpload = (type: 'logo' | 'photo' | 'cover', file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataURI = e.target?.result as string;
      const ext = dataURI.split(',')[0].split(':')[1].split('/')[1];

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

  const addAction = (type: 'primary' | 'secondary', actionName: string) => {
    const actionConfig = availableActions.find(a => a.name === actionName);
    if (actionConfig) {
      const newAction: Action = {
        name: actionName,
        value: '',
        type: type,
        color: actionConfig.color,
        placeholder: actionConfig.placeholder
      };
      
      if (type === 'primary') {
        setPrimaryActions(prev => [...prev, newAction]);
      } else {
        setSecondaryActions(prev => [...prev, newAction]);
      }
    }
  };

  const removeAction = (type: 'primary' | 'secondary', index: number) => {
    if (type === 'primary') {
      setPrimaryActions(prev => prev.filter((_, i) => i !== index));
    } else {
      setSecondaryActions(prev => prev.filter((_, i) => i !== index));
    }
  };

  const updateActionValue = (type: 'primary' | 'secondary', index: number, value: string) => {
    if (type === 'primary') {
      setPrimaryActions(prev => prev.map((action, i) => 
        i === index ? { ...action, value } : action
      ));
    } else {
      setSecondaryActions(prev => prev.map((action, i) => 
        i === index ? { ...action, value } : action
      ));
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

      // Call admin creation API
      const response = await fetch('/.netlify/functions/admin-create-contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ configuration }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create contact');
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
      toast({
        title: "Creation Failed",
        description: error instanceof Error ? error.message : "An error occurred while creating the contact.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPrimaryActions = availableActions.filter(action => 
    action.name !== 'email' && 
    action.name !== 'call' && 
    action.name !== 'website' &&
    action.name !== 'location' &&
    (filterPrimary === '' || action.label.toLowerCase().includes(filterPrimary.toLowerCase()))
  );

  const filteredSecondaryActions = availableActions.filter(action => 
    ['facebook', 'instagram', 'twitter', 'linkedin', 'youtube', 'tiktok', 'snapchat', 'twitch', 'vimeo', 'spotify', 'discord', 'telegram', 'reddit', 'pinterest', 'github'].includes(action.name) &&
    (filterSecondary === '' || action.label.toLowerCase().includes(filterSecondary.toLowerCase()))
  );

  // Generate vCard content
  const generateVCardContent = (config: any): string => {
    const lines = ['BEGIN:VCARD', 'VERSION:3.0'];
    
    // Name
    if (config.name) {
      const nameParts = config.name.split(' ');
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left Panel - Form */}
      <div className="space-y-8">
        <form id="admin-contact-form" onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Enter the contact's basic details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="prefix">Prefix</Label>
              <Input
                id="prefix"
                value={vCardData.prefix}
                onChange={(e) => updateVCardField('prefix', e.target.value)}
                placeholder="Dr., Mr., Ms., etc."
              />
            </div>
            <div>
              <Label htmlFor="fname">First Name *</Label>
              <Input
                id="fname"
                value={vCardData.fname}
                onChange={(e) => updateVCardField('fname', e.target.value)}
                placeholder="Enter first name"
              />
            </div>
            <div>
              <Label htmlFor="lname">Last Name *</Label>
              <Input
                id="lname"
                value={vCardData.lname}
                onChange={(e) => updateVCardField('lname', e.target.value)}
                placeholder="Enter last name"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="pronouns">Pronouns</Label>
              <Input
                id="pronouns"
                value={vCardData.pronouns}
                onChange={(e) => updateVCardField('pronouns', e.target.value)}
                placeholder="he/him, she/her, they/them"
              />
            </div>
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={vCardData.title}
                onChange={(e) => updateVCardField('title', e.target.value)}
                placeholder="Job title or position"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="biz">Company</Label>
            <Input
              id="biz"
              value={vCardData.biz}
              onChange={(e) => updateVCardField('biz', e.target.value)}
              placeholder="Company or organization name"
            />
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
          <CardDescription>Primary contact details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={vCardData.email}
                onChange={(e) => updateVCardField('email', e.target.value)}
                placeholder="Enter email address"
                
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={vCardData.phone}
                onChange={(e) => updateVCardField('phone', e.target.value)}
                placeholder="Enter phone number"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="mobile">Mobile</Label>
              <Input
                id="mobile"
                value={vCardData.mobile}
                onChange={(e) => updateVCardField('mobile', e.target.value)}
                placeholder="Enter mobile number"
              />
            </div>
            <div>
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={vCardData.website}
                onChange={(e) => updateVCardField('website', e.target.value)}
                placeholder="Enter website URL"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Address Information */}
      <Card>
        <CardHeader>
          <CardTitle>Address Information</CardTitle>
          <CardDescription>Physical address details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="street">Street Address</Label>
            <Input
              id="street"
              value={vCardData.street}
              onChange={(e) => updateVCardField('street', e.target.value)}
              placeholder="Enter street address"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={vCardData.city}
                onChange={(e) => updateVCardField('city', e.target.value)}
                placeholder="Enter city"
              />
            </div>
            <div>
              <Label htmlFor="state">State/Province</Label>
              <Input
                id="state"
                value={vCardData.state}
                onChange={(e) => updateVCardField('state', e.target.value)}
                placeholder="Enter state or province"
              />
            </div>
            <div>
              <Label htmlFor="postal">Postal Code</Label>
              <Input
                id="postal"
                value={vCardData.postal}
                onChange={(e) => updateVCardField('postal', e.target.value)}
                placeholder="Enter postal code"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              value={vCardData.country}
              onChange={(e) => updateVCardField('country', e.target.value)}
              placeholder="Enter country"
            />
          </div>
        </CardContent>
      </Card>

      {/* Custom Message */}
      <Card>
        <CardHeader>
          <CardTitle>Custom Message</CardTitle>
          <CardDescription>Optional message or description</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={vCardData.desc}
            onChange={(e) => updateVCardField('desc', e.target.value)}
            placeholder="Enter a custom message or description"
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Images */}
      <Card>
        <CardHeader>
          <CardTitle>Images</CardTitle>
          <CardDescription>Upload logo, photo, and cover images</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Logo */}
            <div className="space-y-2">
              <Label>Brand Logo</Label>
              <p className="text-sm text-gray-500">Recommended size: 350×100px</p>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                {images.logo.url ? (
                  <div className="space-y-2">
                    <img src={images.logo.url} alt="Logo" className="max-h-20 mx-auto" />
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
                      Upload Logo
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
                )}
              </div>
            </div>

            {/* Photo */}
            <div className="space-y-2">
              <Label>Avatar Photo</Label>
              <p className="text-sm text-gray-500">Recommended size: 300×300px</p>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                {images.photo.url ? (
                  <div className="space-y-2">
                    <img src={images.photo.url} alt="Photo" className="max-h-20 mx-auto rounded-full" />
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

            {/* Cover */}
            <div className="space-y-2">
              <Label>Cover Photo</Label>
              <p className="text-sm text-gray-500">Recommended size: 960×640px</p>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                {images.cover.url ? (
                  <div className="space-y-2">
                    <img src={images.cover.url} alt="Cover" className="max-h-20 mx-auto" />
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
                      Upload Cover
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
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Primary Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Primary Actions</CardTitle>
          <CardDescription>Communication and basic contact actions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {filteredPrimaryActions.map((action) => (
              <Button
                key={action.name}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addAction('primary', action.name)}
                disabled={primaryActions.some(a => a.name === action.name)}
              >
                <ActionIcon name={action.name} className="w-4 h-4 mr-2" />
                {action.label}
              </Button>
            ))}
          </div>

          <div className="space-y-2">
            {primaryActions.map((action, index) => (
              <div key={index} className="flex items-center gap-2">
                <ActionIcon name={action.name} className="w-5 h-5" />
                <Input
                  value={action.value}
                  onChange={(e) => updateActionValue('primary', index, e.target.value)}
                  placeholder={action.placeholder}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeAction('primary', index)}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Secondary Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Secondary Actions</CardTitle>
          <CardDescription>Social media and platform links</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {filteredSecondaryActions.map((action) => (
              <Button
                key={action.name}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addAction('secondary', action.name)}
                disabled={secondaryActions.some(a => a.name === action.name)}
              >
                <ActionIcon name={action.name} className="w-4 h-4 mr-2" />
                {action.label}
              </Button>
            ))}
          </div>

          <div className="space-y-2">
            {secondaryActions.map((action, index) => (
              <div key={index} className="flex items-center gap-2">
                <ActionIcon name={action.name} className="w-5 h-5" />
                <Input
                  value={action.value}
                  onChange={(e) => updateActionValue('secondary', index, e.target.value)}
                  placeholder={action.placeholder}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeAction('secondary', index)}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

        </form>
      </div>

      {/* Right Panel - Preview */}
      <div className="space-y-8">
        <Card className="sticky top-8">
          <CardHeader>
            <CardTitle>Live Preview</CardTitle>
            <CardDescription>Your mobile contact card preview</CardDescription>
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

      {/* Fixed Bottom Right Button Container */}
      <div className="fixed bottom-10 right-10 flex flex-col gap-3 z-50">
        <Button 
          size="lg" 
          variant="outline"
          className="bg-green-600 hover:bg-green-700 text-white border-green-600 hover:border-green-700"
          onClick={handleDownloadContact}
        >
          Download Contact
        </Button>
        <Button 
          type="submit" 
          size="lg" 
          form="admin-contact-form"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Creating Contact..." : "Create Contact"}
        </Button>
      </div>
    </div>
  );
}
