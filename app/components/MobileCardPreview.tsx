import { ActionIcon } from "~/components/Icon";
import type { VCardData, Action, ImageData } from "~/providers/configuration-provider";

interface MobileCardPreviewProps {
  vCardData: VCardData;
  images: {
    logo: ImageData;
    photo: ImageData;
    cover: ImageData;
  };
  primaryActions: Action[];
  secondaryActions: Action[];
  logoOrHeader: boolean;
}

export default function MobileCardPreview({
  vCardData,
  images,
  primaryActions,
  secondaryActions,
  logoOrHeader
}: MobileCardPreviewProps) {
  // Helper function to get initials from name
  const getInitials = (name: string) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Build full name
  const fullName = `${vCardData.prefix ? vCardData.prefix + ' ' : ''}${vCardData.fname} ${vCardData.lname}`.trim();

  // Filter actions that have values
  const activePrimaryActions = primaryActions.filter(action => action.value);
  const activeSecondaryActions = secondaryActions.filter(action => action.value);

  // Build address string
  const addressParts = [vCardData.street, vCardData.city, vCardData.state, vCardData.postal, vCardData.country].filter(Boolean);
  const fullAddress = addressParts.join(', ');

  return (
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
        <div className="relative inline-block mb-4">
          <div 
            className="w-24 h-24 rounded-full mx-auto border-4 border-white shadow-lg flex items-center justify-center text-4xl text-gray-500"
            style={{ backgroundColor: '#f0f0f0' }}
          >
            {images.photo.url ? (
              <img
                src={images.photo.url}
                alt="Profile"
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              getInitials(fullName)
            )}
          </div>
        </div>

        {/* Name and Title */}
        <h1 className="text-xl font-bold text-gray-900 mb-1">
          {fullName || 'Your Name'}
        </h1>
        
        {vCardData.title && (
          <p className="text-sm text-gray-600 mb-1">{vCardData.title}</p>
        )}
        
        {vCardData.biz && (
          <p className="text-sm text-gray-500 mb-4">{vCardData.biz}</p>
        )}

        {vCardData.pronouns && (
          <p className="text-xs text-gray-400 mb-4">({vCardData.pronouns})</p>
        )}
      </div>

      {/* Contact Information */}
      <div className="px-4 pb-4">
        {/* Email */}
        {vCardData.email && (
          <div className="flex items-center py-3 border-b border-gray-100">
            <ActionIcon name="email" className="w-5 h-5 text-gray-600 mr-3" />
            <div className="flex-1">
              <div className="text-xs font-medium text-gray-500">Email</div>
              <div className="text-sm text-gray-800">{vCardData.email}</div>
            </div>
          </div>
        )}

        {/* Phone */}
        {vCardData.phone && (
          <div className="flex items-center py-3 border-b border-gray-100">
            <ActionIcon name="call" className="w-5 h-5 text-gray-600 mr-3" />
            <div className="flex-1">
              <div className="text-xs font-medium text-gray-500">Phone</div>
              <div className="text-sm text-gray-800">{vCardData.phone}</div>
            </div>
          </div>
        )}

        {/* Mobile */}
        {vCardData.mobile && (
          <div className="flex items-center py-3 border-b border-gray-100">
            <ActionIcon name="Mobile" className="w-5 h-5 text-gray-600 mr-3" />
            <div className="flex-1">
              <div className="text-xs font-medium text-gray-500">Mobile</div>
              <div className="text-sm text-gray-800">{vCardData.mobile}</div>
            </div>
          </div>
        )}

        {/* Website */}
        {vCardData.website && (
          <div className="flex items-center py-3 border-b border-gray-100">
            <ActionIcon name="website" className="w-5 h-5 text-gray-600 mr-3" />
            <div className="flex-1">
              <div className="text-xs font-medium text-gray-500">Website</div>
              <div className="text-sm text-gray-800">{vCardData.website}</div>
            </div>
          </div>
        )}

        {/* Address */}
        {fullAddress && (
          <div className="flex items-center py-3 border-b border-gray-100">
            <ActionIcon name="location" className="w-5 h-5 text-gray-600 mr-3" />
            <div className="flex-1">
              <div className="text-xs font-medium text-gray-500">Address</div>
              <div className="text-sm text-gray-800">{fullAddress}</div>
            </div>
          </div>
        )}

        {/* Custom Message */}
        {vCardData.desc && (
          <div className="py-3 border-b border-gray-100">
            <div className="text-xs font-medium text-gray-500 mb-1">Message</div>
            <div className="text-sm text-gray-800 italic">{vCardData.desc}</div>
          </div>
        )}
      </div>

      {/* Primary Actions */}
      {activePrimaryActions.length > 0 && (
        <div className="px-4 pb-4">
          <div className="grid grid-cols-1 gap-2">
            {activePrimaryActions.map((action, index) => (
              <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                <ActionIcon name={action.name} className="w-5 h-5 text-gray-600 mr-3" />
                <div className="flex-1">
                  <div className="text-xs font-medium text-gray-500 capitalize">{action.name}</div>
                  <div className="text-sm text-gray-800">{action.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Secondary Actions (Social Media) */}
      {activeSecondaryActions.length > 0 && (
        <div className="px-4 pb-4 bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Connect</h3>
          <div className="grid grid-cols-2 gap-2">
            {activeSecondaryActions.map((action, index) => (
              <div key={index} className="flex items-center p-2 bg-white rounded-lg shadow-sm">
                <ActionIcon name={action.name} className="w-4 h-4 text-gray-600 mr-2" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-gray-700 capitalize truncate">
                    {action.name}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
