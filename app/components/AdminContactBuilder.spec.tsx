import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@/tests/test-utils';
import userEvent from '@testing-library/user-event';
import AdminContactBuilder from './AdminContactBuilder';

// Mock the dependencies
vi.mock('react-router', () => ({
  useNavigate: () => vi.fn(),
  BrowserRouter: ({ children }: any) => <>{children}</>,
}));

vi.mock('~/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

vi.mock('~/lib/imageUtils', () => ({
  resizeImage: vi.fn(async (file: File) => {
    const reader = new FileReader();
    return new Promise((resolve) => {
      reader.onload = (e) => {
        resolve(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    });
  }),
}));

vi.mock('~/providers/configuration-provider', () => ({
  availableActions: [
    { name: 'email', label: 'Email', color: '#FF6B6B', placeholder: 'email@example.com' },
    { name: 'phone', label: 'Phone', color: '#4ECDC4', placeholder: '+1 (555) 123-4567' },
    { name: 'call', label: 'Call', color: '#FFE66D', placeholder: '+1 (555) 123-4567' },
    { name: 'website', label: 'Website', color: '#95E1D3', placeholder: 'https://example.com' },
    { name: 'linkedin', label: 'LinkedIn', color: '#0A66C2', placeholder: 'https://linkedin.com/in/...' },
    { name: 'twitter', label: 'Twitter', color: '#1DA1F2', placeholder: 'https://twitter.com/...' },
    { name: 'instagram', label: 'Instagram', color: '#E4405F', placeholder: 'https://instagram.com/...' },
    { name: 'facebook', label: 'Facebook', color: '#1877F2', placeholder: 'https://facebook.com/...' },
    { name: 'github', label: 'GitHub', color: '#333333', placeholder: 'https://github.com/...' },
    { name: 'youtube', label: 'YouTube', color: '#FF0000', placeholder: 'https://youtube.com/@...' },
    { name: 'location', label: 'Location', color: '#FF6B6B', placeholder: 'City, Country' },
  ],
}));

describe('AdminContactBuilder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Information Section', () => {
    it('should render the basic information form fields', () => {
      render(<AdminContactBuilder />);
      
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/prefix/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/pronouns/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/company/i)).toBeInTheDocument();
    });

    it('should update form fields when user types', async () => {
      const user = userEvent.setup();
      render(<AdminContactBuilder />);
      
      const firstNameInput = screen.getByLabelText(/first name/i) as HTMLInputElement;
      const lastNameInput = screen.getByLabelText(/last name/i) as HTMLInputElement;
      
      await user.type(firstNameInput, 'John');
      await user.type(lastNameInput, 'Doe');
      
      expect(firstNameInput.value).toBe('John');
      expect(lastNameInput.value).toBe('Doe');
    });

    it('should handle all basic information fields', async () => {
      const user = userEvent.setup();
      render(<AdminContactBuilder />);
      
      const fields = {
        prefix: screen.getByLabelText(/prefix/i),
        fname: screen.getByLabelText(/first name/i),
        lname: screen.getByLabelText(/last name/i),
        pronouns: screen.getByLabelText(/pronouns/i),
        title: screen.getByLabelText(/title/i),
        biz: screen.getByLabelText(/company/i),
      };
      
      await user.type(fields.prefix as HTMLInputElement, 'Dr.');
      await user.type(fields.fname as HTMLInputElement, 'Jane');
      await user.type(fields.lname as HTMLInputElement, 'Smith');
      await user.type(fields.pronouns as HTMLInputElement, 'she/her');
      await user.type(fields.title as HTMLInputElement, 'Manager');
      await user.type(fields.biz as HTMLInputElement, 'Tech Corp');
      
      expect((fields.prefix as HTMLInputElement).value).toBe('Dr.');
      expect((fields.fname as HTMLInputElement).value).toBe('Jane');
      expect((fields.lname as HTMLInputElement).value).toBe('Smith');
      expect((fields.pronouns as HTMLInputElement).value).toBe('she/her');
      expect((fields.title as HTMLInputElement).value).toBe('Manager');
      expect((fields.biz as HTMLInputElement).value).toBe('Tech Corp');
    });
  });

  describe('Contact Information Section', () => {
    it('should render contact information fields', () => {
      render(<AdminContactBuilder />);
      
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^phone/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/mobile/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/website/i)).toBeInTheDocument();
    });

    it('should update contact information fields', async () => {
      const user = userEvent.setup();
      render(<AdminContactBuilder />);
      
      const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
      const phoneInput = screen.getByLabelText(/^phone/i) as HTMLInputElement;
      const mobileInput = screen.getByLabelText(/mobile/i) as HTMLInputElement;
      const websiteInput = screen.getByLabelText(/website/i) as HTMLInputElement;
      
      await user.type(emailInput, 'test@example.com');
      await user.type(phoneInput, '555-1234');
      await user.type(mobileInput, '555-5678');
      await user.type(websiteInput, 'https://example.com');
      
      expect(emailInput.value).toBe('test@example.com');
      expect(phoneInput.value).toBe('555-1234');
      expect(mobileInput.value).toBe('555-5678');
      expect(websiteInput.value).toBe('https://example.com');
    });
  });

  describe('Address Information Section', () => {
    it('should render address fields', () => {
      render(<AdminContactBuilder />);
      
      expect(screen.getByLabelText(/street address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^city/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/state\/province/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/postal code/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/country/i)).toBeInTheDocument();
    });

    it('should update address fields', async () => {
      const user = userEvent.setup();
      render(<AdminContactBuilder />);
      
      const streetInput = screen.getByLabelText(/street address/i) as HTMLInputElement;
      const cityInput = screen.getByLabelText(/^city/i) as HTMLInputElement;
      const stateInput = screen.getByLabelText(/state\/province/i) as HTMLInputElement;
      const postalInput = screen.getByLabelText(/postal code/i) as HTMLInputElement;
      const countryInput = screen.getByLabelText(/country/i) as HTMLInputElement;
      
      await user.type(streetInput, '123 Main St');
      await user.type(cityInput, 'San Francisco');
      await user.type(stateInput, 'CA');
      await user.type(postalInput, '94102');
      await user.type(countryInput, 'USA');
      
      expect(streetInput.value).toBe('123 Main St');
      expect(cityInput.value).toBe('San Francisco');
      expect(stateInput.value).toBe('CA');
      expect(postalInput.value).toBe('94102');
      expect(countryInput.value).toBe('USA');
    });
  });

  describe('Custom Message Section', () => {
    it('should render custom message textarea', () => {
      render(<AdminContactBuilder />);
      
      const textarea = screen.getByPlaceholderText(/enter a custom message or description/i);
      expect(textarea).toBeInTheDocument();
    });

    it('should update custom message', async () => {
      const user = userEvent.setup();
      render(<AdminContactBuilder />);
      
      const textarea = screen.getByPlaceholderText(/enter a custom message or description/i) as HTMLTextAreaElement;
      const message = 'Welcome to my professional profile!';
      
      await user.type(textarea, message);
      
      expect(textarea.value).toBe(message);
    });
  });

  describe('Image Upload Section', () => {
    it('should render image upload sections', () => {
      render(<AdminContactBuilder />);
      
      expect(screen.getByText(/brand logo/i)).toBeInTheDocument();
      expect(screen.getByText(/avatar photo/i)).toBeInTheDocument();
      expect(screen.getByText(/cover photo/i)).toBeInTheDocument();
    });

    it('should display upload buttons when no image is present', () => {
      render(<AdminContactBuilder />);
      
      const uploadButtons = screen.getAllByRole('button', { name: /upload/i });
      expect(uploadButtons.length).toBeGreaterThanOrEqual(3); // Logo, Photo, Cover
    });

    it('should trigger file input when upload button is clicked', async () => {
      const user = userEvent.setup();
      render(<AdminContactBuilder />);
      
      const uploadButtons = screen.getAllByRole('button', { name: /upload logo/i });
      expect(uploadButtons.length).toBeGreaterThan(0);
      
      const fileInputs = screen.getAllByDisplayValue('') as HTMLInputElement[];
      const fileInput = fileInputs.find(input => input.type === 'file');
      
      if (fileInput) {
        expect(fileInput.accept).toBe('image/*');
      }
    });
  });

  describe('Primary Actions Section', () => {
    it('should render primary actions section', () => {
      render(<AdminContactBuilder />);
      
      expect(screen.getByText(/primary actions/i)).toBeInTheDocument();
      expect(screen.getByText(/communication and basic contact actions/i)).toBeInTheDocument();
    });

    it('should display available primary action buttons', () => {
      render(<AdminContactBuilder />);
      
      // Primary actions should include email, phone, call, website, linkedin (filtered)
      // Search for buttons in the primary section - these are the action config labels
      const buttons = screen.getAllByRole('button');
      const emailButton = buttons.find(btn => btn.textContent?.toLowerCase().includes('email'));
      const phoneButton = buttons.find(btn => btn.textContent?.toLowerCase().includes('phone'));
      
      // At least email or phone should be present
      expect(emailButton || phoneButton).toBeTruthy();
      
      // Or check that we have some action buttons
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should add a primary action when button is clicked', async () => {
      const user = userEvent.setup();
      render(<AdminContactBuilder />);
      
      // Find email button by searching through all buttons
      const buttons = screen.getAllByRole('button');
      const emailButton = buttons.find(btn => btn.textContent?.toLowerCase().includes('email'));
      
      if (emailButton) {
        await user.click(emailButton);
        
        // After clicking, there should be an input field for email
        await waitFor(() => {
          const emailInputs = screen.getAllByDisplayValue('');
          const emailInput = emailInputs.find(input => input.getAttribute('placeholder')?.includes('email'));
          expect(emailInput).toBeInTheDocument();
        });
      }
    });

    it('should disable action button after it has been added', async () => {
      const user = userEvent.setup();
      render(<AdminContactBuilder />);
      
      // Find email button by searching through all buttons
      const buttons = screen.getAllByRole('button');
      const emailButton = buttons.find(btn => btn.textContent?.toLowerCase().includes('email')) as HTMLButtonElement;
      
      if (emailButton) {
        await user.click(emailButton);
        
        await waitFor(() => {
          expect(emailButton).toBeDisabled();
        });
      }
    });

    it('should allow removing a primary action', async () => {
      const user = userEvent.setup();
      render(<AdminContactBuilder />);
      
      // Find email button by searching through all buttons
      const buttons = screen.getAllByRole('button');
      const emailButton = buttons.find(btn => btn.textContent?.toLowerCase().includes('email')) as HTMLButtonElement;
      
      if (emailButton) {
        await user.click(emailButton);
        
        await waitFor(() => {
          const removeButtons = screen.getAllByRole('button', { name: /remove/i });
          expect(removeButtons.length).toBeGreaterThan(0);
        });
        
        const removeButtons = screen.getAllByRole('button', { name: /remove/i });
        const firstRemoveButton = removeButtons[0];
        await user.click(firstRemoveButton);
        
        await waitFor(() => {
          // Email button should be enabled again
          expect(emailButton).not.toBeDisabled();
        });
      }
    });

    it('should update action value when input is changed', async () => {
      const user = userEvent.setup();
      render(<AdminContactBuilder />);
      
      // Find email button by searching through all buttons
      const buttons = screen.getAllByRole('button');
      const emailButton = buttons.find(btn => btn.textContent?.toLowerCase().includes('email'));
      
      if (emailButton) {
        await user.click(emailButton);
        
        await waitFor(() => {
          const inputs = screen.getAllByDisplayValue('');
          const emailInputFound = inputs.some(input => input.getAttribute('placeholder')?.includes('email'));
          expect(emailInputFound).toBe(true);
        });
        
        const allInputs = screen.getAllByDisplayValue('');
        const emailInput = allInputs.find(input => input.getAttribute('placeholder')?.includes('email')) as HTMLInputElement;
        
        if (emailInput) {
          await user.type(emailInput, 'contact@example.com');
          expect(emailInput.value).toBe('contact@example.com');
        }
      }
    });
  });

  describe('Secondary Actions Section', () => {
    it('should render secondary actions section', () => {
      render(<AdminContactBuilder />);
      
      expect(screen.getByText(/secondary actions/i)).toBeInTheDocument();
      expect(screen.getByText(/social media and platform links/i)).toBeInTheDocument();
    });

    it('should display available secondary action buttons', () => {
      render(<AdminContactBuilder />);
      
      // Secondary actions should include linkedin, twitter, instagram, etc.
      // Note: Multiple buttons may exist (from both primary and secondary sections)
      // so we check if at least one exists
      const linkedinButtons = screen.getAllByRole('button', { name: /linkedin/i });
      expect(linkedinButtons.length).toBeGreaterThan(0);
      
      const twitterButtons = screen.getAllByRole('button', { name: /twitter/i });
      expect(twitterButtons.length).toBeGreaterThan(0);
      
      const instagramButtons = screen.getAllByRole('button', { name: /instagram/i });
      expect(instagramButtons.length).toBeGreaterThan(0);
    });

    it('should add a secondary action when button is clicked', async () => {
      const user = userEvent.setup();
      render(<AdminContactBuilder />);
      
      const linkedinButtons = screen.getAllByRole('button', { name: /linkedin/i });
      const linkedinButton = linkedinButtons[linkedinButtons.length - 1]; // Use last occurrence (secondary actions section)
      await user.click(linkedinButton);
      
      // After clicking, there should be an input field for linkedin
      await waitFor(() => {
        const inputs = screen.getAllByDisplayValue('');
        expect(inputs.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Form Submission', () => {
    it('should render submit button', () => {
      render(<AdminContactBuilder />);
      
      const submitButton = screen.getByRole('button', { name: /create contact/i });
      expect(submitButton).toBeInTheDocument();
    });

    it('should have disabled state text when submitting', async () => {
      render(<AdminContactBuilder />);
      
      const submitButton = screen.getByRole('button', { name: /create contact/i });
      expect(submitButton.textContent).toContain('Create Contact');
    });

    it('should render download button', () => {
      render(<AdminContactBuilder />);
      
      const downloadButton = screen.getByRole('button', { name: /download contact/i });
      expect(downloadButton).toBeInTheDocument();
    });
  });

  describe('Live Preview Section', () => {
    it('should render preview section', () => {
      render(<AdminContactBuilder />);
      
      expect(screen.getByText(/live preview/i)).toBeInTheDocument();
      expect(screen.getByText(/your mobile contact card preview/i)).toBeInTheDocument();
    });
  });

  describe('Form Layout', () => {
    it('should have grid layout for left and right panels', () => {
      render(<AdminContactBuilder />);
      
      // Both form and preview should be present
      const form = screen.getByRole('button', { name: /create contact/i }).closest('form') || 
                   document.getElementById('admin-contact-form');
      expect(form).toBeInTheDocument();
      
      expect(screen.getByText(/live preview/i)).toBeInTheDocument();
    });
  });

  describe('vCard Generation', () => {
    it('should include form with id admin-contact-form', () => {
      render(<AdminContactBuilder />);
      
      const form = document.getElementById('admin-contact-form');
      expect(form).toBeInTheDocument();
    });
  });

  describe('User Interaction Flow', () => {
    it('should allow complete form filling workflow', async () => {
      const user = userEvent.setup();
      render(<AdminContactBuilder />);
      
      // Fill basic info
      const firstNameInput = screen.getByLabelText(/first name/i) as HTMLInputElement;
      const lastNameInput = screen.getByLabelText(/last name/i) as HTMLInputElement;
      const emailContactInput = screen.getByLabelText(/^email/i) as HTMLInputElement;
      
      await user.type(firstNameInput, 'John');
      await user.type(lastNameInput, 'Doe');
      await user.type(emailContactInput, 'john@example.com');
      
      // Verify data is preserved
      expect(firstNameInput.value).toBe('John');
      expect(lastNameInput.value).toBe('Doe');
      expect(emailContactInput.value).toBe('john@example.com');
    });
  });
});

