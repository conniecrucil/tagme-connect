import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { useParams } from "react-router";
import { toast } from "sonner";
import { primaryActionsConfig, secondaryActionsConfig, allAvailableActions } from "~/lib/actions-config";
import { configurationDB } from "~/lib/indexedDB";
import { PostHogProvider } from 'posthog-js/react';

// Types for the configuration
export interface VCardData {
  prefix: string;
  fname: string;
  lname: string;
  pronouns: string;
  title: string;
  biz: string;
  desc: string;
  street: string;
  city: string;
  state: string;
  postal: string;
  country: string;
  email: string;
  phone: string;
  mobile: string;
  website: string;
  photo: string;
}

export interface Action {
  name: string;
  value: string;
  type: string;
  color?: string;
  placeholder?: string;
  label?: string;
}

export interface ImageData {
  url: string | null;
  blob: string | null;
  ext: string | null;
  mime: string | null;
  resized: string | null;
}

// Product data type
export type ProductData = {
  id: string;
  name: string;
  price: string;
  description: string;
  image: string;
};

export interface ConfigurationContextType {
  // VCard data
  vCardData: VCardData;
  setVCardData: React.Dispatch<React.SetStateAction<VCardData>>;
  updateVCardField: (field: keyof VCardData, value: string) => void;

  // Images
  images: {
    logo: ImageData;
    photo: ImageData;
    cover: ImageData;
    cardDesign: ImageData;
  };
  setImages: React.Dispatch<React.SetStateAction<{
    logo: ImageData;
    photo: ImageData;
    cover: ImageData;
    cardDesign: ImageData;
  }>>;
  updateImage: (type: 'logo' | 'photo' | 'cover' | 'cardDesign', imageData: ImageData) => void;

  // Actions
  primaryActions: Action[];
  secondaryActions: Action[];
  setPrimaryActions: React.Dispatch<React.SetStateAction<Action[]>>;
  setSecondaryActions: React.Dispatch<React.SetStateAction<Action[]>>;
  addAction: (type: 'primary' | 'secondary', actionName: string) => void;
  removeAction: (type: 'primary' | 'secondary', index: number) => void;
  updateActionValue: (type: 'primary' | 'secondary', index: number, value: string) => void;
  reorderActions: (type: 'primary' | 'secondary', fromIndex: number, toIndex: number) => void;
  moveAction: (type: 'primary' | 'secondary', activeId: string, overId: string) => void;

  // UI state
  logoOrHeader: boolean;
  setLogoOrHeader: React.Dispatch<React.SetStateAction<boolean>>;
  filterPrimary: string;
  setFilterPrimary: React.Dispatch<React.SetStateAction<string>>;
  filterSecondary: string;
  setFilterSecondary: React.Dispatch<React.SetStateAction<string>>;

  // Form state
  isSubmitting: boolean;
  setIsSubmitting: React.Dispatch<React.SetStateAction<boolean>>;

  // Product info
  product: ProductData | null;

  // Configuration methods
  saveConfiguration: () => Promise<void>;
  loadConfiguration: () => Promise<void>;
  clearConfiguration: () => Promise<void>;
}

// Create the context
const ConfigurationContext = createContext<ConfigurationContextType | null>(null);

// Custom hook to use the configuration context
export const useConfiguration = () => {
  const context = useContext(ConfigurationContext);
  if (!context) {
    throw new Error('useConfiguration must be used within a ConfigurationProvider');
  }
  return context;
};

// Export shared action configurations for backward compatibility
export const primaryActions = primaryActionsConfig;
export const secondaryActions = secondaryActionsConfig;
export const availableActions = allAvailableActions;

interface ConfigurationProviderProps {
  children: ReactNode;
  product?: ProductData | null;
}

// Configuration Provider Component
export function ConfigurationProvider({
  children,
  product: providedProduct
}: ConfigurationProviderProps) {
  const { productId } = useParams();

  const products: Record<string, ProductData> = {
    "tag-basic-card": {
      id: "tag-basic-card",
      name: "TAG Basic Card",
      price: "$50.00",
      description: "One Link. Endless Possibilities.",
      image: "/sample-tag-basic-card.webp"
    },
    "tag-core-card": {
      id: "tag-core-card",
      name: "TAG Core Card",
      price: "$57.00",
      description: "Instant Connection. Full Profile. One Tap.",
      image: "/sample-tag-core-card.webp"
    }
  };

  const product = providedProduct || products[productId as keyof typeof products] || null;

  // Initialize state
  const [vCardData, setVCardData] = useState<VCardData>({
    prefix: "",
    fname: "",
    lname: "",
    pronouns: "",
    title: "",
    biz: "",
    desc: "",
    street: "",
    city: "",
    state: "",
    postal: "",
    country: "",
    email: "",
    phone: "",
    mobile: "",
    website: "",
    photo: "",
  });

  const [images, setImages] = useState<{
    logo: ImageData;
    photo: ImageData;
    cover: ImageData;
    cardDesign: ImageData;
  }>({
    logo: { url: null, blob: null, ext: null, mime: null, resized: null },
    photo: { url: null, blob: null, ext: null, mime: null, resized: null },
    cover: { url: null, blob: null, ext: null, mime: null, resized: null },
    cardDesign: { url: null, blob: null, ext: null, mime: null, resized: null },
  });

  const [primaryActions, setPrimaryActions] = useState<Action[]>([]);
  const [secondaryActions, setSecondaryActions] = useState<Action[]>([]);
  const [logoOrHeader, setLogoOrHeader] = useState(true);
  const [filterPrimary, setFilterPrimary] = useState("");
  const [filterSecondary, setFilterSecondary] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load configuration from localStorage on mount
  useEffect(() => {
    if (productId && productId !== 'admin-edit') {
      loadConfiguration();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const updateVCardField = (field: keyof VCardData, value: string) => {
    setVCardData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateImage = (type: 'logo' | 'photo' | 'cover' | 'cardDesign', imageData: ImageData) => {
    setImages(prev => ({
      ...prev,
      [type]: imageData
    }));
  };

  const addAction = (type: 'primary' | 'secondary', actionName: string) => {
    const actionConfig = availableActions.find(a => a.name === actionName);
    const newAction: Action = {
      name: actionName,
      value: "",
      type: actionName,
      color: actionConfig?.color || '#6B7280',
      placeholder: actionConfig?.placeholder || `Enter ${actionName}`,
      label: actionConfig?.label || actionName
    };

    if (type === 'primary') {
      setPrimaryActions(prev => [...prev, newAction]);
    } else {
      setSecondaryActions(prev => [...prev, newAction]);
    }
  };

  const removeAction = (type: 'primary' | 'secondary', index: number) => {
    if (type === 'primary') {
      setPrimaryActions(prev => prev.filter((_, i) => i !== index));
    } else {
      setSecondaryActions(prev => prev.filter((_, i) => i !== index));
    }
  };

  const updateActionValue = (type: 'primary' | 'secondary', index: number, value: string) => {
    if (type === 'primary') {
      setPrimaryActions(prev => prev.map((action, i) =>
        i === index ? { ...action, value } : action
      ));
    } else {
      setSecondaryActions(prev => prev.map((action, i) =>
        i === index ? { ...action, value } : action
      ));
    }
  };

  const reorderActions = (type: 'primary' | 'secondary', fromIndex: number, toIndex: number) => {
    if (type === 'primary') {
      setPrimaryActions(prev => {
        const newActions = [...prev];
        const [movedAction] = newActions.splice(fromIndex, 1);
        newActions.splice(toIndex, 0, movedAction);
        return newActions;
      });
    } else {
      setSecondaryActions(prev => {
        const newActions = [...prev];
        const [movedAction] = newActions.splice(fromIndex, 1);
        newActions.splice(toIndex, 0, movedAction);
        return newActions;
      });
    }
  };

  const moveAction = (type: 'primary' | 'secondary', activeId: string, overId: string) => {
    if (type === 'primary') {
      setPrimaryActions(prev => {
        const oldIndex = prev.findIndex(action => `${action.name}-${prev.indexOf(action)}` === activeId);
        const newIndex = prev.findIndex(action => `${action.name}-${prev.indexOf(action)}` === overId);
        
        if (oldIndex === -1 || newIndex === -1) return prev;
        
        const newActions = [...prev];
        const [movedAction] = newActions.splice(oldIndex, 1);
        newActions.splice(newIndex, 0, movedAction);
        return newActions;
      });
    } else {
      setSecondaryActions(prev => {
        const oldIndex = prev.findIndex(action => `${action.name}-${prev.indexOf(action)}` === activeId);
        const newIndex = prev.findIndex(action => `${action.name}-${prev.indexOf(action)}` === overId);
        
        if (oldIndex === -1 || newIndex === -1) return prev;
        
        const newActions = [...prev];
        const [movedAction] = newActions.splice(oldIndex, 1);
        newActions.splice(newIndex, 0, movedAction);
        return newActions;
      });
    }
  };

  const saveConfiguration = async (): Promise<void> => {
    if (!productId) {
      toast.error("Configuration Error", {
        description: "Product ID is missing. Please refresh the page and try again.",
      });
      return;
    }

    try {
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

      console.log('Saving configuration with images:', images);

      // Save to IndexedDB (which supports large data like images)
      await configurationDB.saveConfiguration(productId, configuration);

      toast.success("Configuration Saved", {
        description: "Your card configuration has been saved successfully.",
      });
    } catch (error) {
      console.error('Error saving configuration:', error);
      toast.error("Save Failed", {
        description: "Unable to save your configuration. Please try again.",
        action: {
          label: "Retry",
          onClick: () => saveConfiguration(),
        },
      });
    }
  };

  const loadConfiguration = async (): Promise<void> => {
    if (!productId) {
      console.warn('Cannot load configuration: Product ID is missing');
      return;
    }

    try {
      // Load from IndexedDB
      const stored = await configurationDB.getConfiguration(productId);

      if (stored) {
        const { configuration, timestamp } = stored;

        // Check if configuration has expired (1 hour = 3600000 ms)
        const oneHour = 60 * 60 * 1000;
        const isExpired = timestamp && (Date.now() - timestamp) > oneHour;
        
        if (isExpired) {
          console.log('Configuration expired, clearing stored data');
          await configurationDB.removeConfiguration(productId);
          toast.info("Configuration Expired", {
            description: "Your saved configuration has expired. Please configure your card again.",
          });
          return;
        }

        // Validate configuration structure
        if (!configuration || typeof configuration !== 'object') {
          throw new Error('Invalid configuration format');
        }

        // Restore vCard data
        setVCardData(prev => ({
          ...prev,
          fname: configuration.fname ?? prev.fname,
          lname: configuration.lname ?? prev.lname,
          prefix: configuration.prefix ?? prev.prefix,
          pronouns: configuration.pronouns ?? prev.pronouns,
          title: configuration.title ?? prev.title,
          biz: configuration.company ?? prev.biz,
          desc: configuration.customMessage ?? prev.desc,
          email: configuration.email ?? prev.email,
          phone: configuration.phone ?? prev.phone,
          mobile: configuration.mobile ?? prev.mobile,
          website: configuration.website ?? prev.website,
          photo: configuration.photo ?? prev.photo
        }));

        // Restore images if they exist, otherwise keep defaults
        if (configuration.images) {
          setImages({
            logo: configuration.images.logo || { url: null, blob: null, ext: null, mime: null, resized: null },
            photo: configuration.images.photo || { url: null, blob: null, ext: null, mime: null, resized: null },
            cover: configuration.images.cover || { url: null, blob: null, ext: null, mime: null, resized: null },
            cardDesign: configuration.images.cardDesign || { url: null, blob: null, ext: null, mime: null, resized: null }
          });
        }

        // Restore actions
        if (configuration.primaryActions) setPrimaryActions(configuration.primaryActions);
        if (configuration.secondaryActions) setSecondaryActions(configuration.secondaryActions);

        // Restore UI state
        if (configuration.logoOrHeader !== undefined) setLogoOrHeader(configuration.logoOrHeader);

        toast.success("Configuration Loaded", {
          description: "Your saved configuration has been restored.",
        });
      }
    } catch (error) {
      console.error('Error loading configuration:', error);
      toast.error("Load Failed", {
        description: "Unable to load your saved configuration. Starting with a fresh configuration.",
      });
    }
  };

  const clearConfiguration = async () => {
    if (!productId) {
      toast.error("Clear Failed", {
        description: "Product ID is missing. Unable to clear configuration.",
      });
      return;
    }

    try {
      await configurationDB.removeConfiguration(productId);

      // Reset all state to initial values
      setVCardData({
        prefix: "",
        fname: "",
        lname: "",
        pronouns: "",
        title: "",
        biz: "",
        desc: "",
        street: "",
        city: "",
        state: "",
        postal: "",
        country: "",
        email: "",
        phone: "",
        mobile: "",
        website: "",
        photo: "",
      });

      setImages({
        logo: { url: null, blob: null, ext: null, mime: null, resized: null },
        photo: { url: null, blob: null, ext: null, mime: null, resized: null },
        cover: { url: null, blob: null, ext: null, mime: null, resized: null },
        cardDesign: { url: null, blob: null, ext: null, mime: null, resized: null },
      });

      setPrimaryActions([]);
      setSecondaryActions([]);
      setLogoOrHeader(false);
      setFilterPrimary("");
      setFilterSecondary("");

      toast.success("Configuration Cleared", {
        description: "All configuration data has been reset to defaults.",
      });
    } catch (error) {
      console.error('Error clearing configuration:', error);
      toast.error("Clear Failed", {
        description: "Unable to clear your configuration. Please try again.",
      });
    }
  };

  const contextValue: ConfigurationContextType = {
    vCardData,
    setVCardData,
    updateVCardField,
    images,
    setImages,
    updateImage,
    primaryActions,
    secondaryActions,
    setPrimaryActions,
    setSecondaryActions,
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
    loadConfiguration,
    clearConfiguration,
  };

  return (
    <PostHogProvider
      apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_KEY}
      options={{
        api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
        defaults: '2025-05-24',
        capture_exceptions: true,
        debug: import.meta.env.MODE === "development",
      }}
    >
      <ConfigurationContext.Provider value={contextValue}>
        {children}
      </ConfigurationContext.Provider>
    </PostHogProvider>
  );
}