import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";

export default function Configure() {
  const { productId } = useParams();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    title: '',
    website: '',
    socialMedia: {
      linkedin: '',
      instagram: '',
      twitter: '',
      facebook: ''
    },
    customMessage: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    if (field.startsWith('socialMedia.')) {
      const socialPlatform = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        socialMedia: {
          ...prev.socialMedia,
          [socialPlatform]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate configuration
      const response = await fetch('/api/validate-card', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ configuration: formData }),
      });

      const result = await response.json();

      if (response.ok) {
        // Store configuration in localStorage and navigate to cart
        const cartItem = {
          productId,
          productType: productId === 'tag-basic-card' ? 'basic' : 'core',
          quantity: 1, // Default quantity, can be updated in cart
          configuration: formData,
          price: productId === 'tag-basic-card' ? 40 : 47
        };

        const existingCart = JSON.parse(localStorage.getItem('cart') || '[]');
        existingCart.push(cartItem);
        localStorage.setItem('cart', JSON.stringify(existingCart));

        navigate('/cart');
      } else {
        alert(`Validation failed: ${result.details?.join(', ') || result.error}`);
      }
    } catch (error) {
      console.error('Error validating configuration:', error);
      alert('An error occurred while validating your configuration. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
              {productId === 'tag-basic-card' ? 'TAG Basic Card' : 'TAG Core Card'}
            </Link>
            <span className="text-gray-400">›</span>
            <span className="text-gray-900">Configure</span>
          </nav>
        </div>
      </div>

      {/* Configuration Form */}
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Configure Your Card
            </h1>
            <p className="text-lg text-gray-600">
              Fill in your details to personalize your {productId === 'tag-basic-card' ? 'TAG Basic Card' : 'TAG Core Card'}
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                This information will be used to create your vCard and personalize your smart card.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Required Fields */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      required
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      required
                      placeholder="john@example.com"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      required
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company">Company</Label>
                    <Input
                      id="company"
                      type="text"
                      value={formData.company}
                      onChange={(e) => handleInputChange('company', e.target.value)}
                      placeholder="Acme Inc."
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Job Title</Label>
                    <Input
                      id="title"
                      type="text"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      placeholder="Software Engineer"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      type="url"
                      value={formData.website}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      placeholder="https://example.com"
                    />
                  </div>
                </div>

                {/* Social Media Links */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Social Media Links</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="linkedin">LinkedIn</Label>
                      <Input
                        id="linkedin"
                        type="url"
                        value={formData.socialMedia.linkedin}
                        onChange={(e) => handleInputChange('socialMedia.linkedin', e.target.value)}
                        placeholder="https://linkedin.com/in/username"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="instagram">Instagram</Label>
                      <Input
                        id="instagram"
                        type="url"
                        value={formData.socialMedia.instagram}
                        onChange={(e) => handleInputChange('socialMedia.instagram', e.target.value)}
                        placeholder="https://instagram.com/username"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="twitter">Twitter</Label>
                      <Input
                        id="twitter"
                        type="url"
                        value={formData.socialMedia.twitter}
                        onChange={(e) => handleInputChange('socialMedia.twitter', e.target.value)}
                        placeholder="https://twitter.com/username"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="facebook">Facebook</Label>
                      <Input
                        id="facebook"
                        type="url"
                        value={formData.socialMedia.facebook}
                        onChange={(e) => handleInputChange('socialMedia.facebook', e.target.value)}
                        placeholder="https://facebook.com/username"
                      />
                    </div>
                  </div>
                </div>

                {/* Custom Message */}
                <div className="space-y-2">
                  <Label htmlFor="customMessage">Custom Message</Label>
                  <Textarea
                    id="customMessage"
                    value={formData.customMessage}
                    onChange={(e) => handleInputChange('customMessage', e.target.value)}
                    placeholder="Add a personal message or tagline..."
                    rows={3}
                  />
                </div>

                {/* Submit Button */}
                <div className="flex justify-end space-x-4 pt-6">
                  <Link to={`/shop/${productId}`}>
                    <Button variant="outline">
                      Back to Product
                    </Button>
                  </Link>
                  <Button 
                    type="submit" 
                    className="bg-green-600 hover:bg-green-700 text-white"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Validating...' : 'Confirm Configuration'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
