import { Link } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import MobileCardPreview from "~/components/MobileCardPreview";
import type { VCardData, Action, ImageData } from "~/providers/configuration-provider";

export function meta() {
  return [
    { title: "Card Preview - Admin Dashboard" },
    { name: "description", content: "Preview how contact cards will look with dummy data" },
  ];
}

// Dummy data for preview
const dummyVCardData: VCardData = {
  prefix: "Dr.",
  fname: "Sarah",
  lname: "Johnson",
  pronouns: "she/her",
  title: "Senior Software Engineer",
  biz: "TechCorp Solutions",
  desc: "Passionate about creating innovative solutions that make a difference in people's lives.",
  street: "123 Innovation Drive",
  city: "San Francisco",
  state: "CA",
  postal: "94105",
  country: "USA",
  email: "sarah.johnson@techcorp.com",
  phone: "+1 (555) 123-4567",
  mobile: "+1 (555) 987-6543",
  website: "https://sarahjohnson.dev",
  photo: "",
};

const dummyImages = {
  logo: { url: null, blob: null, ext: null, mime: null, resized: null } as ImageData,
  photo: { url: null, blob: null, ext: null, mime: null, resized: null } as ImageData,
  cover: { url: null, blob: null, ext: null, mime: null, resized: null } as ImageData,
};

const dummyPrimaryActions: Action[] = [
  { name: "call", value: "+1 (555) 123-4567", type: "call", color: "#10B981" },
  { name: "email", value: "sarah.johnson@techcorp.com", type: "email", color: "#3B82F6" },
  { name: "linkedin", value: "https://linkedin.com/in/sarahjohnson", type: "linkedin", color: "#0077B5" },
];

const dummySecondaryActions: Action[] = [
  { name: "website", value: "https://sarahjohnson.dev", type: "website", color: "#8B5CF6" },
  { name: "twitter", value: "https://twitter.com/sarahjohnson", type: "twitter", color: "#1DA1F2" },
  { name: "instagram", value: "https://instagram.com/sarahjohnson", type: "instagram", color: "#E4405F" },
];

export default function AdminPreview() {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Card Preview</h1>
              <p className="text-gray-600 mt-2">
                Preview how contact cards will look with dummy data
              </p>
            </div>
            <Button asChild variant="outline">
              <Link to="/admin">← Back to Dashboard</Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Preview Card */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Mobile Card Preview</CardTitle>
                <CardDescription>
                  This is how the contact card will appear on mobile devices
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center p-4 bg-gray-100 rounded-lg">
                  <MobileCardPreview
                    vCardData={dummyVCardData}
                    images={dummyImages}
                    primaryActions={dummyPrimaryActions}
                    secondaryActions={dummySecondaryActions}
                    logoOrHeader={false}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Card with Logo */}
            <Card>
              <CardHeader>
                <CardTitle>Card with Logo Header</CardTitle>
                <CardDescription>
                  Preview with logo displayed in the header section
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center p-4 bg-gray-100 rounded-lg">
                  <MobileCardPreview
                    vCardData={dummyVCardData}
                    images={{
                      ...dummyImages,
                      logo: { url: "/assets/tagme-logo.svg", blob: null, ext: null, mime: null, resized: null }
                    }}
                    primaryActions={dummyPrimaryActions}
                    secondaryActions={dummySecondaryActions}
                    logoOrHeader={true}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Configuration Details */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Dummy Data Configuration</CardTitle>
                <CardDescription>
                  This preview uses the following dummy data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Contact Information</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>Name:</strong> {dummyVCardData.prefix} {dummyVCardData.fname} {dummyVCardData.lname}</p>
                    <p><strong>Title:</strong> {dummyVCardData.title}</p>
                    <p><strong>Company:</strong> {dummyVCardData.biz}</p>
                    <p><strong>Email:</strong> {dummyVCardData.email}</p>
                    <p><strong>Phone:</strong> {dummyVCardData.phone}</p>
                    <p><strong>Mobile:</strong> {dummyVCardData.mobile}</p>
                    <p><strong>Website:</strong> {dummyVCardData.website}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Address</h4>
                  <div className="text-sm text-gray-600">
                    <p>{dummyVCardData.street}</p>
                    <p>{dummyVCardData.city}, {dummyVCardData.state} {dummyVCardData.postal}</p>
                    <p>{dummyVCardData.country}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Custom Message</h4>
                  <div className="text-sm text-gray-600 italic">
                    "{dummyVCardData.desc}"
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Primary Actions</h4>
                  <div className="flex flex-wrap gap-2">
                    {dummyPrimaryActions.map((action) => (
                      <span
                        key={`primary-${action.name}-${action.value}`}
                        className="px-2 py-1 rounded text-xs text-white"
                        style={{ backgroundColor: action.color }}
                      >
                        {action.name}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Secondary Actions</h4>
                  <div className="flex flex-wrap gap-2">
                    {dummySecondaryActions.map((action) => (
                      <span
                        key={`secondary-${action.name}-${action.value}`}
                        className="px-2 py-1 rounded text-xs text-white"
                        style={{ backgroundColor: action.color }}
                      >
                        {action.name}
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Preview Features</CardTitle>
                <CardDescription>
                  What you can see in this preview
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Contact information layout and styling
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Action buttons with custom colors
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Profile photo placeholder (initials)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Logo header option
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Mobile-responsive design
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Interactive contact saving button
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
