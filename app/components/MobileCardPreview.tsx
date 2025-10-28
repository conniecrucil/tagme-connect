import { UnifiedIcon } from "~/components/UnifiedIcon";
import type { VCardData, Action, ImageData } from "~/providers/configuration-provider";
import logoImg from "~/assets/300x300.png";
import headerImg from "~/assets/960x640.png";
import { Tooltip, TooltipTrigger, TooltipContent } from "~/components/ui/tooltip";

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
      {/* Header Section - Edge to edge */}
      <div
        className="w-full h-20 relative"
        style={{
          backgroundColor: (images.logo.url && !logoOrHeader) ? 'transparent' : 
                          images.cover.url ? 'transparent' : 'transparent',
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
        {logoOrHeader && !images.cover.url && (
          <img
            src={headerImg}
            alt="Card Header"
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Profile Section */}
      <div className="p-3 text-center">
        {/* Profile Photo */}
        <div className="relative inline-block mb-3">
          {images.photo.url ? (
            <div 
              className="w-28 h-28 rounded-full mx-auto border-2 shadow-md overflow-hidden"
              style={{ borderColor: '#a2e4d6' }}
            >
              <img
                src={images.photo.url}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <img
              src={logoImg}
              alt="Profile"
              className="w-28 h-28 rounded-full mx-auto border-2 shadow-md object-cover"
              style={{ borderColor: '#a2e4d6' }}
            />
          )}
        </div>

        {/* Name and Title */}
        <h1 className="text-2xl font-bold text-black mb-1">
          {fullName || 'Your Name'}
        </h1>
        
        {vCardData.title && (
          <p className="text-base text-black mb-1">{vCardData.title}</p>
        )}
        
        {vCardData.biz && (
          <p className="text-base mb-2" style={{ color: '#a2e4d6' }}>{vCardData.biz}</p>
        )}

        {vCardData.pronouns && (
          <p className="text-xs text-gray-400 mb-2">({vCardData.pronouns})</p>
        )}
      </div>

      {/* Contact Information */}
      <div className="px-3 pb-3">
        {/* Email */}
        {vCardData.email && (
          <a href={`mailto:${vCardData.email}`} className="flex items-center py-3 border-b border-gray-200 hover:bg-gray-50 transition-colors">
            <div className="flex-1">
              <div className="text-sm font-medium mb-1" style={{ color: '#a2e4d6' }}>EMAIL</div>
              <div className="text-lg text-black">{vCardData.email}</div>
            </div>
          </a>
        )}

        {/* Phone */}
        {vCardData.phone && (
          <a href={`tel:${vCardData.phone}`} className="flex items-center py-3 border-b border-gray-200 hover:bg-gray-50 transition-colors">
            <div className="flex-1">
              <div className="text-sm font-medium mb-1" style={{ color: '#a2e4d6' }}>PHONE</div>
              <div className="text-lg text-black">{vCardData.phone}</div>
            </div>
          </a>
        )}

        {/* Mobile */}
        {vCardData.mobile && (
          <a href={`tel:${vCardData.mobile}`} className="flex items-center py-3 border-b border-gray-200 hover:bg-gray-50 transition-colors">
            <div className="flex-1">
              <div className="text-sm font-medium mb-1" style={{ color: '#a2e4d6' }}>MOBILE</div>
              <div className="text-lg text-black">{vCardData.mobile}</div>
            </div>
          </a>
        )}

        {/* Website */}
        {vCardData.website && (
          <a href={vCardData.website} target="_blank" rel="noopener noreferrer" className="flex items-center py-3 border-b border-gray-200 hover:bg-gray-50 transition-colors">
            <div className="flex-1">
              <div className="text-sm font-medium mb-1" style={{ color: '#a2e4d6' }}>WEBSITE</div>
              <div className="text-lg text-black">{vCardData.website}</div>
            </div>
          </a>
        )}

        {/* Address */}
        {fullAddress && (
          <div className="flex items-center py-3 border-b border-gray-200">
            <div className="flex-1">
              <div className="text-sm font-medium mb-1" style={{ color: '#a2e4d6' }}>ADDRESS</div>
              <div className="text-lg text-black">{fullAddress}</div>
            </div>
          </div>
        )}

        {/* Custom Message */}
        {vCardData.desc && (
          <div className="py-3 border-b border-gray-200">
            <div className="text-lg text-black">{vCardData.desc}</div>
          </div>
        )}
      </div>

      {/* Save Contact Button */}
      <div className={`px-3 ${activePrimaryActions.length > 0 || activeSecondaryActions.length > 0 ? 'pb-3' : 'pb-6'} mt-8`}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button" className="w-3/4 mx-auto font-bold py-3 px-4 rounded transition-colors flex items-center justify-center text-gray-900 hover:text-white" style={{ backgroundColor: '#6ed097', color: '#222' }}>
              Save Contact
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Clicking this button on a live custom website will download the contact file. It is disabled here.</p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Actions Section */}
      {(activePrimaryActions.length > 0 || activeSecondaryActions.length > 0) && (
        <div className="px-3 pb-6">
          {/* Separator between save contact and actions */}
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
                    key={`${action.name}-${index}`}
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
                    key={`${action.name}-${index}`}
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
