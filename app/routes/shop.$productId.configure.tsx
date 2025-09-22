import { useRef, useState } from "react";
import { Link, useParams, useNavigate } from "react-router";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { ActionIcon } from "~/components/Icon";
import { useToast } from "~/components/ui/use-toast";
import { useConfiguration } from "~/providers/configuration-provider";
import { primaryActions as availablePrimaryActions, secondaryActions as availableSecondaryActions } from "~/providers/configuration-provider";
import SortableActionsList from "~/components/SortableActionsList";

export function meta({ params }: { params: { productId: string } }) {
  const productName = params.productId === 'tag-basic-card' ? 'TAG Basic Card' : 'TAG Core Card';
  const description = params.productId === 'tag-basic-card' 
    ? 'Configure your TAG Basic Card with website URL and logo. Create a simple smart link card for instant connections.'
    : 'Configure your TAG Core Card with complete contact details, social links, and professional information. Build your digital business card.';
  
  return [
    { title: `Configure ${productName} - TagMe Connections` },
    { name: "description", content: description },
  ];
}

export default function ConfigureProduct() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);

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
    reorderActions,
    moveAction,
    logoOrHeader,
    setLogoOrHeader,
    filterPrimary,
    setFilterPrimary,
    filterSecondary,
    setFilterSecondary,
    isSubmitting,
    setIsSubmitting,
    product,
    saveConfiguration,
  } = useConfiguration();

  const { toast } = useToast();

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let configuration;

      if (isBasicCard) {
        // Basic card configuration - website URL and logo
        configuration = {
          website: vCardData.website,
          productType: 'basic',
          images: images
        };

        // Simple validation for basic card
        if (!vCardData.website) {
          toast({
            variant: "destructive",
            title: "Validation Failed",
            description: "Please enter a website URL.",
          });
          return;
        }
      } else {
        // Core card configuration - full contact details
        configuration = {
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
          // Additional fields from builder-test
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

        // Validate configuration for core card
        const response = await fetch('/.netlify/functions/validate-card', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ configuration }),
        });

        const result = await response.json();

        if (!response.ok) {
          toast({
            variant: "destructive",
            title: "Validation Failed",
            description: result.details?.join(', ') || result.error || "Please check your input and try again.",
          });
          return;
        }
      }

      // Save to context (which handles localStorage)
      await saveConfiguration();

      // Add to cart
      const cartItem = {
        productId,
        productType: productId === 'tag-basic-card' ? 'basic' : 'core',
        quantity: quantity,
        configuration,
        url: isBasicCard ? vCardData.website : undefined, // Include URL for basic cards
        price: productId === 'tag-basic-card' ? 40 : 47,
        id: `${productId === 'tag-basic-card' ? 'basic' : 'core'}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` // Unique ID for each configuration
      };

      const existingCart = JSON.parse(localStorage.getItem('cart') || '[]');
      existingCart.push(cartItem);
      localStorage.setItem('cart', JSON.stringify(existingCart));

      // Clear the cached configuration since it's now in the cart
      const storageKey = `configuration-${productId}`;
      localStorage.removeItem(storageKey);

      // Dispatch custom event to update header cart count
      window.dispatchEvent(new CustomEvent('cartUpdated'));

      toast({
        variant: "success",
        title: "Added to Cart",
        description: "Your card configuration has been added to cart!",
      });

      // Navigate to cart
      navigate('/cart');
    } catch (error) {
      console.error('Error validating configuration:', error);
      console.log(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred while validating your configuration. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const productName = product?.name || (productId === 'tag-basic-card' ? 'TAG Basic Card' : 'TAG Core Card');
  const isBasicCard = productId === 'tag-basic-card';

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="bg-gray-50 py-4">
        <div className="container mx-auto px-4">
          <nav className="flex items-center space-x-2 text-sm">
            <Link to="/shop" className="text-gray-600 hover:text-green-600">
              Shop
            </Link>
            <span className="text-gray-400">›</span>
            <Link to={`/shop/${productId}`} className="text-gray-600 hover:text-green-600">
              {productName}
            </Link>
            <span className="text-gray-400">›</span>
            <span className="text-gray-900">Configure</span>
          </nav>
        </div>
      </div>

      {/* Configuration Form */}
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Configure Your {productName}
            </h1>
            <p className="text-lg text-gray-600">
              {isBasicCard 
                ? "Enter your website URL to create a simple smart link card"
                : "Fill in your details to personalize your smart card"
              }
            </p>
          </div>

          <form id="configuration-form" onSubmit={handleSubmit}>
            <div className="grid lg:grid-cols-2 gap-12">
              {/* Left Panel - Form */}
              <div className="space-y-8">
                {isBasicCard ? (
                  /* Basic Card Configuration - Website URL and Logo Upload */
                  <>
                    <Card>
                      <CardHeader>
                        <CardTitle>Website URL</CardTitle>
                        <CardDescription>Enter the website URL you want your card to link to</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="website">Website URL</Label>
                          <Input
                            id="website"
                            type="url"
                            value={vCardData.website}
                            onChange={(e) => handleInputChange('website', e.target.value)}
                            placeholder="https://example.com"
                            required
                          />
                          <p className="text-sm text-gray-600">
                            This is the URL that people will be redirected to when they tap your NFC card.
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                  </>
                ) : (
                  /* Core Card Configuration - Full Form */
                  <>
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
                                  accept="image/jpeg,image/jpg,image/png"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      // Validate file type
                                      if (!file.type.match(/image\/(jpeg|jpg|png)/)) {
                                        toast({
                                          variant: "destructive",
                                          title: "Invalid File Type",
                                          description: "Please upload a JPG or PNG image.",
                                        });
                                        return;
                                      }
                                      handleImageUpload('cover', file);
                                    }
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
                                  accept="image/jpeg,image/jpg,image/png"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      // Validate file type
                                      if (!file.type.match(/image\/(jpeg|jpg|png)/)) {
                                        toast({
                                          variant: "destructive",
                                          title: "Invalid File Type",
                                          description: "Please upload a JPG or PNG image.",
                                        });
                                        return;
                                      }
                                      handleImageUpload('logo', file);
                                    }
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
                                  accept="image/jpeg,image/jpg,image/png"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      // Validate file type
                                      if (!file.type.match(/image\/(jpeg|jpg|png)/)) {
                                        toast({
                                          variant: "destructive",
                                          title: "Invalid File Type",
                                          description: "Please upload a JPG or PNG image.",
                                        });
                                        return;
                                      }
                                      handleImageUpload('photo', file);
                                    }
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
                            placeholder="founder"
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
                            type="email"
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
                                <div
                                  className="w-8 h-8 flex items-center justify-center rounded-full"
                                  style={{ backgroundColor: action.color }}
                                >
                                  <ActionIcon name={action.name} className="w-4 h-4 text-white" />
                                </div>
                                <span className="text-xs">{action.name}</span>
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
                                <div
                                  className="w-8 h-8 flex items-center justify-center rounded-full"
                                  style={{ backgroundColor: action.color }}
                                >
                                  <ActionIcon name={action.name} className="w-4 h-4 text-white" />
                                </div>
                                <span className="text-xs">{action.name}</span>
                              </Button>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>

              {/* Right Panel - Preview Only */}
              <div className="space-y-8">
                {/* Preview Card */}
                <Card className="sticky top-8">
                  <CardHeader>
                    <CardTitle>Preview</CardTitle>
                    <CardDescription>Your card preview</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="min-h-[600px] flex items-center justify-center">
                      {isBasicCard ? (
                        /* Basic Card Preview - Simple Link Card */
                        <div className="bg-white text-black rounded-lg shadow-lg overflow-hidden" style={{ maxWidth: '400px', width: '100%' }}>
                          {/* Header Section */}
                          <div className="w-full h-32 bg-gradient-to-br from-green-100 to-blue-100 flex items-center justify-center">
                            {images.logo.url ? (
                              <img
                                src={images.logo.url}
                                alt="Logo preview"
                                className="max-h-20 max-w-full object-contain"
                              />
                            ) : (
                              <div className="text-center">
                                <div className="w-16 h-16 bg-green-600 rounded-full mx-auto mb-2 flex items-center justify-center">
                                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                  </svg>
                                </div>
                                <h2 className="text-lg font-semibold text-gray-800">Smart Link</h2>
                              </div>
                            )}
                          </div>

                          {/* Content Section */}
                          <div className="p-6 text-center">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">TAG Basic Card</h3>
                            <p className="text-gray-600 mb-4">One Link. Endless Possibilities.</p>
                            
                            {vCardData.website ? (
                              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <p className="text-sm text-gray-700 mb-2">This card will redirect to:</p>
                                <a 
                                  href={vCardData.website} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-green-600 hover:text-green-700 font-medium break-all"
                                >
                                  {vCardData.website}
                                </a>
                              </div>
                            ) : (
                              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                <p className="text-sm text-gray-500">Enter a website URL to see the preview</p>
                              </div>
                            )}
                            
                            <div className="mt-4 text-xs text-gray-500">
                              <p>Tap the NFC card to visit the website</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Core Card Preview - Full Contact Card */
                        <div className="bg-white text-black rounded-lg shadow-lg overflow-hidden" style={{ maxWidth: '400px', width: '100%' }}>
                          {/* Header Section */}
                          <div
                            className="w-full h-32 relative flex items-center justify-center"
                            style={{
                              backgroundColor: '#e4eaea',
                              backgroundImage: images.cover.url ? `url(${images.cover.url})` : 'none',
                              backgroundSize: 'cover',
                              backgroundPosition: 'center'
                            }}
                          >
                            {images.logo.url && !logoOrHeader && (
                              <img
                                src={images.logo.url}
                                alt="Brand Logo"
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>

                          {/* Profile Section */}
                          <div className="p-4 text-center">
                            {/* Profile Photo */}
                            <div className="relative -mt-16 mb-4">
                              <div className="w-24 h-24 bg-gray-300 rounded-full mx-auto flex items-center justify-center overflow-hidden">
                                {images.photo.url ? (
                                  <img src={images.photo.url} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-gray-600 text-xs">Photo</span>
                                )}
                              </div>
                            </div>

                            {/* Name and Title */}
                            <h1 className="text-lg font-bold mb-2">
                              {vCardData.prefix && `${vCardData.prefix} `}{vCardData.fname} {vCardData.lname}
                            </h1>
                            {vCardData.title && (
                              <p className="text-gray-600 mb-1 text-sm">{vCardData.title}</p>
                            )}
                            {vCardData.biz && (
                              <p className="text-gray-600 mb-4 text-sm">{vCardData.biz}</p>
                            )}

                            {/* Contact Information */}
                            <div className="space-y-2 text-left text-sm">
                              {vCardData.email && (
                                <div className="flex items-center gap-2">
                                  <span className="w-4 h-4 text-gray-500">✉</span>
                                  <a href={`mailto:${vCardData.email}`} className="text-blue-600 hover:underline">{vCardData.email}</a>
                                </div>
                              )}
                              {vCardData.phone && (
                                <div className="flex items-center gap-2">
                                  <span className="w-4 h-4 text-gray-500">📞</span>
                                  <a href={`tel:${vCardData.phone}`} className="text-blue-600 hover:underline">{vCardData.phone}</a>
                                </div>
                              )}
                              {vCardData.website && (
                                <div className="flex items-center gap-2">
                                  <span className="w-4 h-4 text-gray-500">🌐</span>
                                  <a href={vCardData.website} className="text-blue-600 hover:underline">{vCardData.website}</a>
                                </div>
                              )}

                              {/* Primary Actions */}
                              {primaryActions.filter(action => action.value).map((action, index) => (
                                <div key={index} className="flex items-center gap-2">
                                  <ActionIcon name={action.name} className="w-4 h-4 text-gray-500" />
                                  <span>{action.value}</span>
                                </div>
                              ))}

                              {/* Secondary Actions */}
                              {secondaryActions.filter(action => action.value).map((action, index) => (
                                <div key={index} className="flex items-center gap-2">
                                  <ActionIcon name={action.name} className="w-4 h-4 text-gray-500" />
                                  <span>{action.value}</span>
                                </div>
                              ))}
                            </div>

                            {/* Description */}
                            {vCardData.desc && (
                              <div className="mt-4 pt-2 border-t border-gray-200">
                                <p className="text-xs text-gray-600 text-left">{vCardData.desc}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </form>

        </div>
      </section>

      {/* Fixed Purchase Section - Lower Right */}
      <div className="fixed bottom-6 right-6 z-50">
        <Card className="w-80 shadow-xl border-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Purchase</CardTitle>
            <CardDescription className="text-sm">Add your configured card to cart</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <label htmlFor="quantity" className="text-sm font-medium text-gray-700">
                Quantity:
              </label>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
                >
                  -
                </button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            <Button
              type="submit"
              form="configuration-form"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-base font-medium transition-colors"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Adding to Cart...' : `Add to Cart - $${(47 * quantity).toFixed(2)}`}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}