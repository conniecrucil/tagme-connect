import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/tests/test-utils';
import MobileCardPreview from './MobileCardPreview';
import type { VCardData, Action, ImageData } from '~/providers/configuration-provider';

// Mock the UnifiedIcon component
vi.mock('./UnifiedIcon', () => ({
  UnifiedIcon: ({ name }: any) => <span data-testid={`icon-${name}`}>{name}</span>,
}));

// Mock the Tooltip component
vi.mock('~/components/ui/tooltip', () => ({
  Tooltip: ({ children }: any) => <div>{children}</div>,
  TooltipTrigger: ({ children }: any) => <div>{children}</div>,
  TooltipContent: ({ children }: any) => <div>{children}</div>,
}));

describe('MobileCardPreview', () => {
  const defaultVCardData: VCardData = {
    prefix: '',
    fname: 'John',
    lname: 'Doe',
    pronouns: '',
    title: 'Software Engineer',
    biz: 'Tech Corp',
    desc: 'Passionate developer',
    street: '123 Main St',
    city: 'San Francisco',
    state: 'CA',
    postal: '94102',
    country: 'USA',
    email: 'john@example.com',
    phone: '555-1234',
    mobile: '555-5678',
    website: 'https://example.com',
    photo: '',
  };

  const defaultImages: Record<string, ImageData> = {
    logo: { url: null, blob: null, ext: null, mime: null, resized: null },
    photo: { url: null, blob: null, ext: null, mime: null, resized: null },
    cover: { url: null, blob: null, ext: null, mime: null, resized: null },
  };

  const defaultPrimaryActions: Action[] = [
    {
      name: 'email',
      value: 'john@example.com',
      type: 'primary',
      label: 'Email',
      placeholder: 'email@example.com',
      color: '#FF6B6B',
    },
  ];

  const defaultSecondaryActions: Action[] = [
    {
      name: 'linkedin',
      value: 'https://linkedin.com/in/johndoe',
      type: 'secondary',
      label: 'LinkedIn',
      placeholder: 'https://linkedin.com/in/...',
      color: '#0A66C2',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the component', () => {
      render(
        <MobileCardPreview
          vCardData={defaultVCardData}
          images={defaultImages}
          primaryActions={defaultPrimaryActions}
          secondaryActions={defaultSecondaryActions}
          logoOrHeader={true}
        />
      );

      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('should display the mobile card container', () => {
      const { container } = render(
        <MobileCardPreview
          vCardData={defaultVCardData}
          images={defaultImages}
          primaryActions={defaultPrimaryActions}
          secondaryActions={defaultSecondaryActions}
          logoOrHeader={true}
        />
      );

      const cardContainer = container.querySelector('.rounded-lg.shadow-sm.border.border-gray-200');
      expect(cardContainer).toBeInTheDocument();
    });
  });

  describe('Basic Information Display', () => {
    it('should display full name correctly', () => {
      render(
        <MobileCardPreview
          vCardData={defaultVCardData}
          images={defaultImages}
          primaryActions={defaultPrimaryActions}
          secondaryActions={defaultSecondaryActions}
          logoOrHeader={true}
        />
      );

      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('should display name with prefix when provided', () => {
      const vCardWithPrefix = {
        ...defaultVCardData,
        prefix: 'Dr.',
      };

      render(
        <MobileCardPreview
          vCardData={vCardWithPrefix}
          images={defaultImages}
          primaryActions={defaultPrimaryActions}
          secondaryActions={defaultSecondaryActions}
          logoOrHeader={true}
        />
      );

      expect(screen.getByText('Dr. John Doe')).toBeInTheDocument();
    });

    it('should display title when provided', () => {
      render(
        <MobileCardPreview
          vCardData={defaultVCardData}
          images={defaultImages}
          primaryActions={defaultPrimaryActions}
          secondaryActions={defaultSecondaryActions}
          logoOrHeader={true}
        />
      );

      expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    });

    it('should display company name when provided', () => {
      render(
        <MobileCardPreview
          vCardData={defaultVCardData}
          images={defaultImages}
          primaryActions={defaultPrimaryActions}
          secondaryActions={defaultSecondaryActions}
          logoOrHeader={true}
        />
      );

      expect(screen.getByText('Tech Corp')).toBeInTheDocument();
    });

    it('should display pronouns when provided', () => {
      const vCardWithPronouns = {
        ...defaultVCardData,
        pronouns: 'he/him',
      };

      render(
        <MobileCardPreview
          vCardData={vCardWithPronouns}
          images={defaultImages}
          primaryActions={defaultPrimaryActions}
          secondaryActions={defaultSecondaryActions}
          logoOrHeader={true}
        />
      );

      expect(screen.getByText('(he/him)')).toBeInTheDocument();
    });

    it('should display default name when name fields are empty', () => {
      const emptyVCard = {
        ...defaultVCardData,
        fname: '',
        lname: '',
      };

      render(
        <MobileCardPreview
          vCardData={emptyVCard}
          images={defaultImages}
          primaryActions={defaultPrimaryActions}
          secondaryActions={defaultSecondaryActions}
          logoOrHeader={true}
        />
      );

      expect(screen.getByText('Your Name')).toBeInTheDocument();
    });
  });

  describe('Contact Information Display', () => {
    it('should display email when provided', () => {
      render(
        <MobileCardPreview
          vCardData={defaultVCardData}
          images={defaultImages}
          primaryActions={defaultPrimaryActions}
          secondaryActions={defaultSecondaryActions}
          logoOrHeader={true}
        />
      );

      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByText('EMAIL')).toBeInTheDocument();
    });

    it('should display phone when provided', () => {
      render(
        <MobileCardPreview
          vCardData={defaultVCardData}
          images={defaultImages}
          primaryActions={defaultPrimaryActions}
          secondaryActions={defaultSecondaryActions}
          logoOrHeader={true}
        />
      );

      expect(screen.getByText('555-1234')).toBeInTheDocument();
      expect(screen.getByText('PHONE')).toBeInTheDocument();
    });

    it('should display mobile when provided', () => {
      render(
        <MobileCardPreview
          vCardData={defaultVCardData}
          images={defaultImages}
          primaryActions={defaultPrimaryActions}
          secondaryActions={defaultSecondaryActions}
          logoOrHeader={true}
        />
      );

      expect(screen.getByText('555-5678')).toBeInTheDocument();
      expect(screen.getByText('MOBILE')).toBeInTheDocument();
    });

    it('should display website when provided', () => {
      render(
        <MobileCardPreview
          vCardData={defaultVCardData}
          images={defaultImages}
          primaryActions={defaultPrimaryActions}
          secondaryActions={defaultSecondaryActions}
          logoOrHeader={true}
        />
      );

      expect(screen.getByText('https://example.com')).toBeInTheDocument();
      expect(screen.getByText('WEBSITE')).toBeInTheDocument();
    });

    it('should not display email label when email is empty', () => {
      const vCardNoEmail = {
        ...defaultVCardData,
        email: '',
      };

      render(
        <MobileCardPreview
          vCardData={vCardNoEmail}
          images={defaultImages}
          primaryActions={defaultPrimaryActions}
          secondaryActions={defaultSecondaryActions}
          logoOrHeader={true}
        />
      );

      expect(screen.queryByText('EMAIL')).not.toBeInTheDocument();
    });
  });

  describe('Primary Actions Display', () => {
    it('should display primary actions with values', () => {
      const { container } = render(
        <MobileCardPreview
          vCardData={defaultVCardData}
          images={defaultImages}
          primaryActions={defaultPrimaryActions}
          secondaryActions={defaultSecondaryActions}
          logoOrHeader={true}
        />
      );

      // The primary action should be rendered as a link
      const actionLinks = container.querySelectorAll('a[href*="mailto"]');
      expect(actionLinks.length).toBeGreaterThan(0);
    });

    it('should not display primary actions without values', () => {
      const emptyPrimaryActions = [
        {
          name: 'email',
          value: '',
          type: 'primary',
          label: 'Email',
          placeholder: 'email@example.com',
          color: '#FF6B6B',
        },
      ];
      
      // Use only secondary actions with empty values too to keep test focused
      const emptySecondaryActions: Action[] = [];
      
      // Also use vCard data without email for this test
      const vCardNoEmail = {
        ...defaultVCardData,
        email: '',
      };

      const { container } = render(
        <MobileCardPreview
          vCardData={vCardNoEmail}
          images={defaultImages}
          primaryActions={emptyPrimaryActions}
          secondaryActions={emptySecondaryActions}
          logoOrHeader={true}
        />
      );

      // The card should not display mailto links
      const actionElements = container.querySelectorAll('[href*="mailto"]');
      expect(actionElements.length).toBe(0);
    });

    it('should handle multiple primary actions', () => {
      const multiplePrimaryActions: Action[] = [
        {
          name: 'email',
          value: 'john@example.com',
          type: 'primary',
          label: 'Email',
          placeholder: 'email@example.com',
          color: '#FF6B6B',
        },
        {
          name: 'phone',
          value: '555-1234',
          type: 'primary',
          label: 'Phone',
          placeholder: '+1 (555) 123-4567',
          color: '#4ECDC4',
        },
      ];

      const { container } = render(
        <MobileCardPreview
          vCardData={defaultVCardData}
          images={defaultImages}
          primaryActions={multiplePrimaryActions}
          secondaryActions={defaultSecondaryActions}
          logoOrHeader={true}
        />
      );

      // Check for the action links
      const mailtoLinks = container.querySelectorAll('[href*="mailto"]');
      const telLinks = container.querySelectorAll('[href*="tel"]');
      expect(mailtoLinks.length + telLinks.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Secondary Actions Display', () => {
    it('should display secondary actions in actions section', () => {
      const { container } = render(
        <MobileCardPreview
          vCardData={defaultVCardData}
          images={defaultImages}
          primaryActions={defaultPrimaryActions}
          secondaryActions={defaultSecondaryActions}
          logoOrHeader={true}
        />
      );

      // Secondary actions should be rendered
      const actionElements = container.querySelectorAll('[title="linkedin"]');
      expect(actionElements.length).toBeGreaterThan(0);
    });

    it('should not display actions section when there are no actions with values', () => {
      const emptyActions: Action[] = [];

      const { container } = render(
        <MobileCardPreview
          vCardData={defaultVCardData}
          images={defaultImages}
          primaryActions={emptyActions}
          secondaryActions={emptyActions}
          logoOrHeader={true}
        />
      );

      // The actions section should not be visible
      const actionSeparators = container.querySelectorAll('hr.border-gray-200');
      // There should be minimal separators (just the main content separators)
      expect(actionSeparators.length).toBeLessThan(3);
    });
  });

  describe('Image Display', () => {
    it('should display default profile image when no image is provided', () => {
      const { container } = render(
        <MobileCardPreview
          vCardData={defaultVCardData}
          images={defaultImages}
          primaryActions={defaultPrimaryActions}
          secondaryActions={defaultSecondaryActions}
          logoOrHeader={true}
        />
      );

      const profileImages = container.querySelectorAll('img[alt="Profile"]');
      expect(profileImages.length).toBeGreaterThan(0);
    });

    it('should display custom profile photo when provided', () => {
      const imagesWithPhoto = {
        ...defaultImages,
        photo: {
          url: 'data:image/jpeg;base64,test',
          blob: null,
          ext: 'jpeg',
          mime: 'image/jpeg',
          resized: 'data:image/jpeg;base64,test',
        },
      };

      const { container } = render(
        <MobileCardPreview
          vCardData={defaultVCardData}
          images={imagesWithPhoto}
          primaryActions={defaultPrimaryActions}
          secondaryActions={defaultSecondaryActions}
          logoOrHeader={true}
        />
      );

      // Check for image with specific src
      const customImage = container.querySelector(
        'img[src="data:image/jpeg;base64,test"]'
      );
      expect(customImage).toBeInTheDocument();
    });

    it('should handle logo display when logoOrHeader is false', () => {
      const imagesWithLogo = {
        ...defaultImages,
        logo: {
          url: 'data:image/png;base64,logodata',
          blob: null,
          ext: 'png',
          mime: 'image/png',
          resized: null,
        },
      };

      const { container } = render(
        <MobileCardPreview
          vCardData={defaultVCardData}
          images={imagesWithLogo}
          primaryActions={defaultPrimaryActions}
          secondaryActions={defaultSecondaryActions}
          logoOrHeader={false}
        />
      );

      // Check for image with logo src
      const logoImage = container.querySelector(
        'img[src="data:image/png;base64,logodata"]'
      );
      expect(logoImage).toBeInTheDocument();
    });
  });

  describe('Address Display', () => {
    it('should not display address section when address is not provided', () => {
      const vCardNoAddress = {
        ...defaultVCardData,
        street: '',
        city: '',
        state: '',
        postal: '',
        country: '',
      };

      render(
        <MobileCardPreview
          vCardData={vCardNoAddress}
          images={defaultImages}
          primaryActions={defaultPrimaryActions}
          secondaryActions={defaultSecondaryActions}
          logoOrHeader={true}
        />
      );

      // No address label should be visible
      expect(screen.queryByText('ADDRESS')).not.toBeInTheDocument();
    });

    it('should display address when provided', () => {
      const { container } = render(
        <MobileCardPreview
          vCardData={defaultVCardData}
          images={defaultImages}
          primaryActions={defaultPrimaryActions}
          secondaryActions={defaultSecondaryActions}
          logoOrHeader={true}
        />
      );

      // Address should be displayed 
      expect(screen.getByText('ADDRESS')).toBeInTheDocument();
    });
  });

  describe('Custom Message Display', () => {
    it('should display custom message when provided', () => {
      const vCardWithMessage = {
        ...defaultVCardData,
        desc: 'Welcome to my profile! Connect with me on social media.',
      };

      render(
        <MobileCardPreview
          vCardData={vCardWithMessage}
          images={defaultImages}
          primaryActions={defaultPrimaryActions}
          secondaryActions={defaultSecondaryActions}
          logoOrHeader={true}
        />
      );

      expect(
        screen.getByText('Welcome to my profile! Connect with me on social media.')
      ).toBeInTheDocument();
    });

    it('should not display custom message when empty', () => {
      const vCardNoMessage = {
        ...defaultVCardData,
        desc: '',
      };

      const { container } = render(
        <MobileCardPreview
          vCardData={vCardNoMessage}
          images={defaultImages}
          primaryActions={defaultPrimaryActions}
          secondaryActions={defaultSecondaryActions}
          logoOrHeader={true}
        />
      );

      // Custom message text should not be present
      const descElements = container.querySelectorAll('.py-3.border-b');
      const hasDesc = Array.from(descElements).some(el => 
        el.textContent && el.textContent.includes('profile')
      );
      expect(hasDesc).toBe(false);
    });
  });

  describe('Link Generation', () => {
    it('should generate mailto link for email', () => {
      const { container } = render(
        <MobileCardPreview
          vCardData={defaultVCardData}
          images={defaultImages}
          primaryActions={defaultPrimaryActions}
          secondaryActions={defaultSecondaryActions}
          logoOrHeader={true}
        />
      );

      const emailLink = container.querySelector(
        'a[href="mailto:john@example.com"]'
      );
      expect(emailLink).toBeInTheDocument();
    });

    it('should generate tel link for phone', () => {
      const { container } = render(
        <MobileCardPreview
          vCardData={defaultVCardData}
          images={defaultImages}
          primaryActions={defaultPrimaryActions}
          secondaryActions={defaultSecondaryActions}
          logoOrHeader={true}
        />
      );

      const phoneLink = container.querySelector('a[href="tel:555-1234"]');
      expect(phoneLink).toBeInTheDocument();
    });

    it('should generate tel link for mobile', () => {
      const { container } = render(
        <MobileCardPreview
          vCardData={defaultVCardData}
          images={defaultImages}
          primaryActions={defaultPrimaryActions}
          secondaryActions={defaultSecondaryActions}
          logoOrHeader={true}
        />
      );

      const mobileLink = container.querySelector('a[href="tel:555-5678"]');
      expect(mobileLink).toBeInTheDocument();
    });

    it('should generate http link for website', () => {
      const { container } = render(
        <MobileCardPreview
          vCardData={defaultVCardData}
          images={defaultImages}
          primaryActions={defaultPrimaryActions}
          secondaryActions={defaultSecondaryActions}
          logoOrHeader={true}
        />
      );

      const websiteLink = container.querySelector(
        'a[href="https://example.com"]'
      );
      expect(websiteLink).toBeInTheDocument();
      expect(websiteLink).toHaveAttribute('target', '_blank');
    });
  });

  describe('Component Props Handling', () => {
    it('should update when vCardData changes', () => {
      const { rerender } = render(
        <MobileCardPreview
          vCardData={defaultVCardData}
          images={defaultImages}
          primaryActions={defaultPrimaryActions}
          secondaryActions={defaultSecondaryActions}
          logoOrHeader={true}
        />
      );

      expect(screen.getByText('John Doe')).toBeInTheDocument();

      const updatedVCard = {
        ...defaultVCardData,
        fname: 'Jane',
        lname: 'Smith',
      };

      rerender(
        <MobileCardPreview
          vCardData={updatedVCard}
          images={defaultImages}
          primaryActions={defaultPrimaryActions}
          secondaryActions={defaultSecondaryActions}
          logoOrHeader={true}
        />
      );

      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    it('should update when primaryActions change', () => {
      const { rerender, container } = render(
        <MobileCardPreview
          vCardData={defaultVCardData}
          images={defaultImages}
          primaryActions={defaultPrimaryActions}
          secondaryActions={defaultSecondaryActions}
          logoOrHeader={true}
        />
      );

      const newPrimaryActions: Action[] = [
        {
          name: 'phone',
          value: '555-9999',
          type: 'primary',
          label: 'Phone',
          placeholder: '+1 (555) 123-4567',
          color: '#4ECDC4',
        },
      ];

      rerender(
        <MobileCardPreview
          vCardData={defaultVCardData}
          images={defaultImages}
          primaryActions={newPrimaryActions}
          secondaryActions={defaultSecondaryActions}
          logoOrHeader={true}
        />
      );

      // Check for phone link
      const phoneLinks = container.querySelectorAll('[href*="tel:555-9999"]');
      expect(phoneLinks.length).toBeGreaterThan(0);
    });
  });
});

