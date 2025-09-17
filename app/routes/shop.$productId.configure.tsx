import { useRef } from "react";
import { Link, useParams, useNavigate } from "react-router";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { ActionIcon } from "~/components/Icon";
import { useToast } from "~/components/ui/use-toast";
import { useConfiguration } from "~/providers/configuration-provider";
import { availableActions } from "~/providers/configuration-provider";

export default function ConfigureProduct() {
  const { productId } = useParams();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Create configuration object for validation
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

      // Validate configuration
      const response = await fetch('/.netlify/functions/validate-card', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ configuration }),
      });

      const result = await response.json();

      if (response.ok) {
        // Save to context (which handles localStorage)
        await saveConfiguration();

        // Add to cart
        const cartItem = {
          productId,
          productType: productId === 'tag-basic-card' ? 'basic' : 'core',
          quantity: 1,
          configuration,
          price: productId === 'tag-basic-card' ? 40 : 47
        };

        const existingCart = JSON.parse(localStorage.getItem('cart') || '[]');
        existingCart.push(cartItem);
        localStorage.setItem('cart', JSON.stringify(existingCart));

        toast({
          variant: "success",
          title: "Configuration Saved",
          description: "Your card configuration has been saved successfully.",
        });

        // Navigate back to product page
        navigate(`/shop/${productId}`);
      } else {
        toast({
          variant: "destructive",
          title: "Validation Failed",
          description: result.details?.join(', ') || result.error || "Please check your input and try again.",
        });
      }
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
              Fill in your details to personalize your smart card
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid lg:grid-cols-2 gap-12">
              {/* Left Panel - Form */}
              <div className="space-y-8">
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
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                          !logoOrHeader
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-300 bg-white hover:border-gray-400'
                        }`}
                        onClick={() => setLogoOrHeader(false)}
                      >
                        <div className="flex items-start space-x-3">
                          <input
                            type="radio"
                            name="headerType"
                            checked={!logoOrHeader}
                            onChange={() => setLogoOrHeader(false)}
                            className="mt-1 w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                          />
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-1">Brand Logo</h3>
                            <p className="text-sm text-gray-600">
                              Display your company logo prominently
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Cover Photo Option */}
                      <div
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                          logoOrHeader
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-300 bg-white hover:border-gray-400'
                        }`}
                        onClick={() => setLogoOrHeader(true)}
                      >
                        <div className="flex items-start space-x-3">
                          <input
                            type="radio"
                            name="headerType"
                            checked={logoOrHeader}
                            onChange={() => setLogoOrHeader(true)}
                            className="mt-1 w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                          />
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-1">Cover Photo</h3>
                            <p className="text-sm text-gray-600">
                              Use a background image for visual impact
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {logoOrHeader ? (
                      <div className="flex items-center space-x-4">
                        {images.cover.url ? (
                          <img
                            className="w-12 h-12 rounded object-contain"
                            src={images.cover.url}
                            alt="Cover image"
                          />
                        ) : (
                          <button
                            type="button"
                            className="p-3 rounded bg-gray-200 cursor-pointer hover:bg-gray-300"
                            onClick={() => fileInputRefs.cover.current?.click()}
                          >
                            <div className="w-6 h-6 text-gray-700">+</div>
                          </button>
                        )}
                        <input
                          ref={fileInputRefs.cover}
                          type="file"
                          accept=".png,.jpg,.jpeg,.gif,.webp,.svg"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload('cover', file);
                          }}
                        />
                        {images.cover.url && (
                          <button
                            type="button"
                            className="p-1 rounded hover:bg-gray-200"
                            onClick={() => removeImage('cover')}
                          >
                            <div className="w-6 h-6 text-gray-700">×</div>
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center space-x-4">
                        {images.logo.url ? (
                          <img
                            className="w-12 h-12 rounded object-contain"
                            src={images.logo.url}
                            alt="Brand logo"
                          />
                        ) : (
                          <button
                            type="button"
                            className="p-3 rounded bg-gray-200 cursor-pointer hover:bg-gray-300"
                            onClick={() => fileInputRefs.logo.current?.click()}
                          >
                            <div className="w-6 h-6 text-gray-700">+</div>
                          </button>
                        )}
                        <input
                          ref={fileInputRefs.logo}
                          type="file"
                          accept=".png,.jpg,.jpeg,.gif,.webp,.svg"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload('logo', file);
                          }}
                        />
                        {images.logo.url && (
                          <button
                            type="button"
                            className="p-1 rounded hover:bg-gray-200"
                            onClick={() => removeImage('logo')}
                          >
                            <div className="w-6 h-6 text-gray-700">×</div>
                          </button>
                        )}
                      </div>
                    )}
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
                        placeholder="Software Engineer"
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
                    <div className="space-y-4">
                      {primaryActions.map((action, index) => (
                        <div key={index} className="flex items-center space-x-3">
                          <div
                            className="w-12 h-12 flex items-center justify-center rounded-full flex-shrink-0"
                            style={{ backgroundColor: action.color }}
                          >
                            <ActionIcon name={action.name} className="w-6 h-6 text-white" />
                          </div>
                          <Input
                            className="flex-1"
                            value={action.value}
                            onChange={(e) => updateActionValue('primary', index, e.target.value)}
                            placeholder={action.placeholder}
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

                    <div className="mt-4">
                      <Input
                        className="mb-4"
                        value={filterPrimary}
                        onChange={(e) => setFilterPrimary(e.target.value)}
                        placeholder="Search actions..."
                      />
                      <div className="flex flex-wrap gap-2">
                        {availableActions.filter(action =>
                          action.label.toLowerCase().includes(filterPrimary.toLowerCase())
                        ).map((action) => (
                          <Button
                            key={action.name}
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addAction('primary', action.name)}
                            className="flex items-center space-x-2"
                          >
                            <ActionIcon name={action.name} className="w-4 h-4" />
                            <span>{action.label}</span>
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
                    <div className="space-y-4">
                      {secondaryActions.map((action, index) => (
                        <div key={index} className="flex items-center space-x-3">
                          <div
                            className="w-12 h-12 flex items-center justify-center rounded-full flex-shrink-0"
                            style={{ backgroundColor: action.color }}
                          >
                            <ActionIcon name={action.name} className="w-6 h-6 text-white" />
                          </div>
                          <Input
                            className="flex-1"
                            value={action.value}
                            onChange={(e) => updateActionValue('secondary', index, e.target.value)}
                            placeholder={action.placeholder}
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

                    <div className="mt-4">
                      <Input
                        className="mb-4"
                        value={filterSecondary}
                        onChange={(e) => setFilterSecondary(e.target.value)}
                        placeholder="Search actions..."
                      />
                      <div className="flex flex-wrap gap-2">
                        {availableActions.filter(action =>
                          action.label.toLowerCase().includes(filterSecondary.toLowerCase())
                        ).map((action) => (
                          <Button
                            key={action.name}
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addAction('secondary', action.name)}
                            className="flex items-center space-x-2"
                          >
                            <ActionIcon name={action.name} className="w-4 h-4" />
                            <span>{action.label}</span>
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
                    {/* Mobile Preview */}
                    <div className="bg-white text-black rounded-lg shadow-lg overflow-hidden" style={{ maxWidth: '400px', margin: '0 auto' }}>
                      {/* Header Section */}
                      <div
                        className="w-full h-32 relative"
                        style={{
                          backgroundColor: '#e4eaea',
                          backgroundImage: images.cover.url ? `url(${images.cover.url})` : 'none',
                          backgroundSize: 'cover',
                          backgroundPosition: 'center'
                        }}
                      >
                        {images.logo.url && !logoOrHeader && (
                          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2">
                            <img
                              src={images.logo.url}
                              alt="Logo"
                              className="w-16 h-16 rounded-full bg-white p-2 shadow-md"
                            />
                          </div>
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
                              <span>{vCardData.email}</span>
                            </div>
                          )}
                          {vCardData.phone && (
                            <div className="flex items-center gap-2">
                              <span className="w-4 h-4 text-gray-500">📞</span>
                              <span>{vCardData.phone}</span>
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
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-4 mt-8">
              <Link to={`/shop/${productId}`}>
                <Button variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving Configuration...' : 'Save Configuration'}
              </Button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}