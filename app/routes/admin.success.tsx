import { useLocation, Link } from "react-router";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { transformS3UrlToDomain } from "~/lib/utils";

export function meta() {
  return [
    { title: "Contact Created Successfully - Admin - TagMe Connections" },
    { name: "description", content: "Contact card has been successfully created and uploaded to S3. View the generated URLs and share the contact information." },
  ];
}

export function handle() {
  return {
    breadcrumb: { label: "Success" }
  };
}

export default function AdminSuccess() {
  const location = useLocation();
  const { creationDetails, contactName, contactEmail } = location.state || {};
  const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>({});

  const handleCopy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedStates(prev => ({ ...prev, [key]: true }));
      
      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [key]: false }));
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      setCopiedStates(prev => ({ ...prev, [key]: true }));
      setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [key]: false }));
      }, 2000);
    }
  };

  if (!creationDetails) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>
              No creation details found. Please return to the admin panel.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/admin/create">
              <Button className="w-full">
                Return to Admin Panel
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Contact Created Successfully!</h1>
          <p className="text-gray-600">
            The contact has been created and is now live online.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Creation Details */}
          <Card>
            <CardHeader>
              <CardTitle>Creation Details</CardTitle>
              <CardDescription>Information about the contact creation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Creation ID</label>
                  <p className="text-sm text-gray-900 font-mono">{creationDetails.sessionId}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Created At</label>
                  <p className="text-sm text-gray-900">{new Date().toLocaleString()}</p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Contact Name</label>
                <p className="text-lg font-semibold text-gray-900">{contactName}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Contact Email</label>
                <p className="text-sm text-gray-900">{contactEmail}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">S3 Folder ID</label>
                <p className="text-sm text-gray-900 font-mono">{creationDetails.s3Urls?.folderId || 'N/A'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Digital Links */}
          <Card>
            <CardHeader>
              <CardTitle>Digital Contact Card</CardTitle>
              <CardDescription>Share these links with anyone</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {creationDetails.s3Urls?.html && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-500">Online Contact Page</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={transformS3UrlToDomain(creationDetails.s3Urls.html)}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm font-mono bg-gray-50"
                    />
                    <Button
                      size="sm"
                      onClick={() => handleCopy(transformS3UrlToDomain(creationDetails.s3Urls.html), 'html')}
                      className={`transition-all duration-200 ${
                        copiedStates.html 
                          ? 'bg-green-500 hover:bg-green-600 text-white' 
                          : 'bg-blue-500 hover:bg-blue-600 text-white'
                      }`}
                    >
                      {copiedStates.html ? '✓ Copied!' : 'Copy'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      asChild
                    >
                      <a href={`https://${transformS3UrlToDomain(creationDetails.s3Urls.html)}`} target="_blank" rel="noopener noreferrer">
                        View
                      </a>
                    </Button>
                  </div>
                </div>
              )}

              {creationDetails.s3Urls?.vcard && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-500">vCard Download</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={transformS3UrlToDomain(creationDetails.s3Urls.vcard)}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm font-mono bg-gray-50"
                    />
                    <Button
                      size="sm"
                      onClick={() => handleCopy(transformS3UrlToDomain(creationDetails.s3Urls.vcard), 'vcard')}
                      className={`transition-all duration-200 ${
                        copiedStates.vcard 
                          ? 'bg-green-500 hover:bg-green-600 text-white' 
                          : 'bg-blue-500 hover:bg-blue-600 text-white'
                      }`}
                    >
                      {copiedStates.vcard ? '✓ Copied!' : 'Copy'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      asChild
                    >
                      <a href={transformS3UrlToDomain(creationDetails.s3Urls.vcard)} download={`${contactName?.replace(/[^a-zA-Z0-9]/g, '_') || 'contact'}.vcf`}>
                        Download
                      </a>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Status Indicators */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Creation Status</CardTitle>
            <CardDescription>All processes completed successfully</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Contact Validated</p>
                  <p className="text-xs text-gray-500">All information verified</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">S3 Upload</p>
                  <p className="text-xs text-gray-500">Files uploaded successfully</p>
                </div>
              </div>

            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <Link to="/admin/create">
            <Button variant="outline" className="w-full sm:w-auto">
              Create Another Contact
            </Button>
          </Link>
          <Link to={`/admin/cards/${creationDetails.card_id}`}>
            <Button variant="outline" className="w-full sm:w-auto">
              View Card Details
            </Button>
          </Link>
          <Link to="/admin/cards">
            <Button variant="outline" className="w-full sm:w-auto">
              Return to Cards
            </Button>
          </Link>
        </div>

        {/* Information Box */}
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-blue-900">What happens next?</h3>
                <p className="text-sm text-blue-700 mt-1">
                  The contact card is now live and shareable. You can share the online link with anyone, 
                  and they'll be able to view the contact information and download the vCard file directly 
                  to their device.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
