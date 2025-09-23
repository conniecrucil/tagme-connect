import { UnifiedIcon } from "~/components/UnifiedIcon";
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
    <div className="bg-white text-black rounded-lg shadow-sm border border-gray-200 overflow-hidden min-w-[320px] max-w-[400px]">
      {/* Header Section */}
      <div
        className="w-full h-20 relative flex items-center justify-center"
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
      <div className="p-3 text-center">
        {/* Profile Photo */}
        <div className="relative inline-block mb-3">
          <div 
            className="w-16 h-16 rounded-full mx-auto border-2 border-white shadow-md flex items-center justify-center text-lg text-gray-500"
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
        <h1 className="text-lg font-bold text-gray-900 mb-1">
          {fullName || 'Your Name'}
        </h1>
        
        {vCardData.title && (
          <p className="text-xs text-gray-600 mb-1">{vCardData.title}</p>
        )}
        
        {vCardData.biz && (
          <p className="text-xs text-gray-500 mb-2">{vCardData.biz}</p>
        )}

        {vCardData.pronouns && (
          <p className="text-xs text-gray-400 mb-2">({vCardData.pronouns})</p>
        )}
      </div>

      {/* Contact Information */}
      <div className="px-3 pb-3">
        {/* Email */}
        {vCardData.email && (
          <a href={`mailto:${vCardData.email}`} className="flex items-center py-2 border-b border-gray-100 hover:bg-gray-50 transition-colors">
            <div className="flex-1">
              <div className="text-xs font-medium text-gray-500">Email</div>
              <div className="text-sm text-gray-800">{vCardData.email}</div>
            </div>
          </a>
        )}

        {/* Phone */}
        {vCardData.phone && (
          <a href={`tel:${vCardData.phone}`} className="flex items-center py-2 border-b border-gray-100 hover:bg-gray-50 transition-colors">
            <div className="flex-1">
              <div className="text-xs font-medium text-gray-500">Phone</div>
              <div className="text-sm text-gray-800">{vCardData.phone}</div>
            </div>
          </a>
        )}

        {/* Mobile */}
        {vCardData.mobile && (
          <a href={`tel:${vCardData.mobile}`} className="flex items-center py-2 border-b border-gray-100 hover:bg-gray-50 transition-colors">
            <div className="flex-1">
              <div className="text-xs font-medium text-gray-500">Mobile</div>
              <div className="text-sm text-gray-800">{vCardData.mobile}</div>
            </div>
          </a>
        )}

        {/* Website */}
        {vCardData.website && (
          <a href={vCardData.website} target="_blank" rel="noopener noreferrer" className="flex items-center py-2 border-b border-gray-100 hover:bg-gray-50 transition-colors">
            <div className="flex-1">
              <div className="text-xs font-medium text-gray-500">Website</div>
              <div className="text-sm text-gray-800">{vCardData.website}</div>
            </div>
          </a>
        )}

        {/* Address */}
        {fullAddress && (
          <div className="flex items-center py-2 border-b border-gray-100">
            <div className="flex-1">
              <div className="text-xs font-medium text-gray-500">Address</div>
              <div className="text-sm text-gray-800">{fullAddress}</div>
            </div>
          </div>
        )}

        {/* Custom Message */}
        {vCardData.desc && (
          <div className="py-2 border-b border-gray-100">
            <div className="text-xs font-medium text-gray-500 mb-1">Message</div>
            <div className="text-sm text-gray-800 italic">{vCardData.desc}</div>
          </div>
        )}
      </div>

      {/* Actions Section */}
      {(activePrimaryActions.length > 0 || activeSecondaryActions.length > 0) && (
        <div className="px-3 pb-3">
          {/* Separator between contact info and actions */}
          <hr className="border-gray-200 my-3" />
          
          {/* Primary Actions */}
          {activePrimaryActions.length > 0 && (
            <div className="flex flex-wrap gap-3 justify-center mb-4">
              {activePrimaryActions.map((action, index) => {
                // Handle phone number links
                const isPhoneAction = action.name === 'call' || action.name === 'Mobile' || action.name === 'phone' || action.name === 'Home' || action.name === 'Office' || action.name === 'fax' || action.name === 'signal';
                const isWhatsAppAction = action.name === 'whatsApp';
                
                let href = action.value;
                if (isPhoneAction) {
                  href = `tel:${action.value}`;
                } else if (isWhatsAppAction) {
                  // Format WhatsApp links as https://wa.me/[number]
                  const phoneNumber = action.value.replace(/[^\d+]/g, ''); // Remove all non-digit characters except +
                  href = `https://wa.me/${phoneNumber}`;
                }
                
                return (
                  <a
                    key={index}
                    href={href}
                    target={isPhoneAction ? "_self" : "_blank"}
                    rel={isPhoneAction ? "" : "noopener noreferrer"}
                    className="flex items-center justify-center px-3 py-1.5 rounded-lg transition-all hover:-translate-y-0.5 hover:shadow-md"
                    style={{ backgroundColor: action.color }}
                    title={action.name}
                  >
                    <UnifiedIcon name={action.name} className="text-xs font-semibold text-white whitespace-nowrap" />
                  </a>
                );
              })}
            </div>
          )}

          {/* Horizontal Separator between primary and secondary actions */}
          {activePrimaryActions.length > 0 && activeSecondaryActions.length > 0 && (
            <hr className="border-gray-200 my-3" />
          )}

          {/* Secondary Actions */}
          {activeSecondaryActions.length > 0 && (
            <div className="flex flex-wrap gap-3 justify-center">
              {activeSecondaryActions.map((action, index) => {
                // Handle phone number links
                const isPhoneAction = action.name === 'call' || action.name === 'Mobile' || action.name === 'phone' || action.name === 'Home' || action.name === 'Office' || action.name === 'fax' || action.name === 'signal';
                const isWhatsAppAction = action.name === 'whatsApp';
                
                let href = action.value;
                if (isPhoneAction) {
                  href = `tel:${action.value}`;
                } else if (isWhatsAppAction) {
                  // Format WhatsApp links as https://wa.me/[number]
                  const phoneNumber = action.value.replace(/[^\d+]/g, ''); // Remove all non-digit characters except +
                  href = `https://wa.me/${phoneNumber}`;
                }
                
                return (
                  <a
                    key={index}
                    href={href}
                    target={isPhoneAction ? "_self" : "_blank"}
                    rel={isPhoneAction ? "" : "noopener noreferrer"}
                    className="flex items-center justify-center px-3 py-1.5 rounded-lg transition-all hover:-translate-y-0.5 hover:shadow-md"
                    style={{ backgroundColor: action.color }}
                    title={action.name}
                  >
                    <UnifiedIcon name={action.name} className="text-xs font-semibold text-white whitespace-nowrap" />
                  </a>
                );
              })}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
