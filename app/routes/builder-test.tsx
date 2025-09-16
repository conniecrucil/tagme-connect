import { useState, useRef } from "react";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Textarea } from "../components/ui/textarea";

interface VCardData {
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

interface Action {
  name: string;
  value: string;
  type: string;
  color?: string;
  placeholder?: string;
}

interface ImageData {
  url: string | null;
  blob: string | null;
  ext: string | null;
  mime: string | null;
  resized: string | null;
}

export function meta() {
  return [
    { title: "vCard Builder Test" },
    { name: "description", content: "Build your digital business card with our vCard builder" },
  ];
}

export default function BuilderTest() {
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
  }>({
    logo: { url: null, blob: null, ext: null, mime: null, resized: null },
    photo: { url: null, blob: null, ext: null, mime: null, resized: null },
    cover: { url: null, blob: null, ext: null, mime: null, resized: null },
  });

  const [primaryActions, setPrimaryActions] = useState<Action[]>([]);
  const [secondaryActions, setSecondaryActions] = useState<Action[]>([]);
  const [logoOrHeader, setLogoOrHeader] = useState(false);
  const [filterPrimary, setFilterPrimary] = useState("");
  const [filterSecondary, setFilterSecondary] = useState("");

  const fileInputRefs = {
    logo: useRef<HTMLInputElement>(null),
    photo: useRef<HTMLInputElement>(null),
    cover: useRef<HTMLInputElement>(null),
  };

  const handleInputChange = (field: keyof VCardData, value: string) => {
    setVCardData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageUpload = (type: 'logo' | 'photo' | 'cover', file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataURI = e.target?.result as string;
      const ext = dataURI.split(',')[0].split(':')[1].split('/')[1];
      
      setImages(prev => ({
        ...prev,
        [type]: {
          url: dataURI,
          blob: dataURI,
          ext: ext,
          mime: file.type,
          resized: null
        }
      }));

      if (type === 'photo') {
        setVCardData(prev => ({ ...prev, photo: dataURI }));
      }
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (type: 'logo' | 'photo' | 'cover') => {
    setImages(prev => ({
      ...prev,
      [type]: { url: null, blob: null, ext: null, mime: null, resized: null }
    }));
    
    if (type === 'photo') {
      setVCardData(prev => ({ ...prev, photo: "" }));
    }
  };

  const addAction = (type: 'primary' | 'secondary', actionName: string) => {
    const actionConfig = availableActions.find(a => a.name === actionName);
    const newAction: Action = {
      name: actionName,
      value: "",
      type: actionName,
      color: actionConfig?.color || '#374151',
      placeholder: actionConfig?.placeholder || `Enter ${actionName}`
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

  const generateVCard = () => {
    const fullName = `${vCardData.prefix ? vCardData.prefix + ' ' : ''}${vCardData.fname} ${vCardData.lname}`.trim();
    const address = `${vCardData.street};${vCardData.city};${vCardData.state};${vCardData.postal};${vCardData.country}`;
    
    const vcard = `BEGIN:VCARD
VERSION:3.0
N;CHARSET=UTF-8:${vCardData.lname};${vCardData.fname};;${vCardData.prefix};
FN:${fullName}
ORG:${vCardData.biz}
COMPANY:${vCardData.biz}
TITLE:${vCardData.title}
ADR;CHARSET=UTF-8;TYPE=WORK:;;${address.replace(/,/g, "")}
TEL;TYPE=Work,pref:${vCardData.phone}
TEL;CELL;TYPE=Mobile,VOICE:${vCardData.mobile}
EMAIL;TYPE=Email:${vCardData.email}
URL;TYPE=Website:${vCardData.website}
PHOTO;ENCODING=b:${vCardData.photo}
NOTE;CHARSET=UTF-8:${vCardData.desc}
END:VCARD`;

    return vcard;
  };

  const downloadVCard = () => {
    const vcard = generateVCard();
    const blob = new Blob([vcard], { type: 'text/vcard' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${vCardData.fname}-${vCardData.lname}.vcf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const availableActions = [
    { name: 'email', label: 'Email', color: '#374151', placeholder: 'Enter email address' },
    { name: 'call', label: 'Phone', color: '#374151', placeholder: 'Enter phone number' },
    { name: 'Mobile', label: 'Mobile', color: '#374151', placeholder: 'Enter mobile number' },
    { name: 'website', label: 'Website', color: '#374151', placeholder: 'Enter website URL' },
    { name: 'location', label: 'Location', color: '#374151', placeholder: 'Enter location' },
    { name: 'calendar', label: 'Calendar', color: '#374151', placeholder: 'Enter calendar link' },
    { name: 'whatsApp', label: 'WhatsApp', color: '#25D366', placeholder: 'Enter WhatsApp number' },
    { name: 'WeChat', label: 'WeChat', color: '#07C160', placeholder: 'Enter WeChat ID' },
    { name: 'messenger', label: 'Messenger', color: '#0084FF', placeholder: 'Enter Messenger username' },
    { name: 'signal', label: 'Signal', color: '#3A76F0', placeholder: 'Enter Signal number' },
    { name: 'fax', label: 'Fax', color: '#374151', placeholder: 'Enter fax number' },
    { name: 'Home', label: 'Home', color: '#374151', placeholder: 'Enter home phone' },
    { name: 'Office', label: 'Office', color: '#374151', placeholder: 'Enter office phone' },
  ];

  const filteredPrimaryActions = availableActions.filter(action =>
    action.label.toLowerCase().includes(filterPrimary.toLowerCase())
  );

  const filteredSecondaryActions = availableActions.filter(action =>
    action.label.toLowerCase().includes(filterSecondary.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <Header />
      
      <div className="container mx-auto px-4" style={{ maxWidth: '960px' }}>
        <div className="flex items-start justify-between pt-8">
          <div className="w-24 h-24 bg-gray-800 rounded flex items-center justify-center">
            <span className="text-gray-400 text-sm">LOGO</span>
          </div>
          <div className="flex gap-4">
            <Button 
              onClick={downloadVCard}
              className="font-extrabold leading-none text-lg tracking-wide flex-shrink-0 p-5 mt-2 text-white bg-green-500 rounded hover:bg-green-600 focus:bg-green-600 transition-colors duration-200 focus:outline-none"
            >
              Download vCard
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mt-16">
          {/* Left Panel - Form */}
          <div className="px-4">
            {/* Header Image Section */}
            <div className="pt-8">
              <div className="mt-16">
                <h2 className="font-extrabold text-2xl">Header Image</h2>
                
                <div className="mt-6">
                  <p>Select between a logo or cover photo</p>
                  <br />
                  <div className="flex items-center">
                    <div
                      className={`relative group inline-block w-24 h-12 mr-3 align-middle select-none transition duration-200 ease-in bg-gray-700 rounded hover:bg-gray-600 focus:bg-gray-600 cursor-pointer focus:outline-none ${
                        logoOrHeader ? 'bg-green-600 hover:bg-green-500 focus:bg-green-500' : ''
                      }`}
                      onClick={() => setLogoOrHeader(!logoOrHeader)}
                    >
                      <input
                        type="checkbox"
                        checked={logoOrHeader}
                        onChange={() => setLogoOrHeader(!logoOrHeader)}
                        className="toggle-switch absolute block w-10 h-10 m-1 rounded border-4 border-transparent appearance-none cursor-pointer transition-colors duration-200 focus:outline-none bg-white"
                      />
                    </div>
                    <p>{logoOrHeader ? 'Cover Photo' : 'Brand Logo'}</p>
                  </div>

                  {logoOrHeader ? (
                    <div className="flex flex-col">
                      <div className="mt-6">
                        <div className="flex flex-wrap items-center">
                          {images.cover.url ? (
                            <img
                              className="w-12 h-12 rounded object-contain"
                              src={images.cover.url}
                              alt="Cover image"
                            />
                          ) : (
                            <button
                              className="p-3 rounded bg-gray-700 cursor-pointer hover:bg-gray-600 focus:bg-gray-600 transition-colors duration-200 focus:outline-none"
                              onClick={() => fileInputRefs.cover.current?.click()}
                            >
                              <div className="w-6 h-6 pointer-events-none text-white">+</div>
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
                          {!images.cover.url && (
                            <p className="ml-3 leading-none">
                              Add cover photo<br />
                              <span className="text-sm text-gray-400">suggested format: svg, jpeg, png or gif</span>
                            </p>
                          )}
                          {images.cover.url && (
                            <button
                              className="p-1 m-2 shrink-0 focus:outline-none rounded hover:bg-gray-700 focus:bg-gray-700 transition-colors duration-200"
                              onClick={() => removeImage('cover')}
                            >
                              <div className="w-6 h-6 text-white">×</div>
                            </button>
                          )}
                        </div>
                        <p className="mt-6 border p-4 rounded border-gray-700 text-gray-400">
                          Recommended cover size is 960 x 640 pixels, with an expect ratio of 3:2.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      <div className="mt-6">
                        <div className="flex flex-wrap items-center">
                          {images.logo.url ? (
                            <img
                              className="w-12 h-12 rounded object-contain"
                              src={images.logo.url}
                              alt="Brand logo"
                            />
                          ) : (
                            <button
                              className="p-3 rounded bg-gray-700 cursor-pointer hover:bg-gray-600 focus:bg-gray-600 transition-colors duration-200 focus:outline-none"
                              onClick={() => fileInputRefs.logo.current?.click()}
                            >
                              <div className="w-6 h-6 pointer-events-none text-white">+</div>
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
                          {!images.logo.url && (
                            <p className="ml-3 leading-none">
                              Upload your brand logo<br />
                              <span className="text-sm text-gray-400">suggested format: svg, png or gif</span>
                            </p>
                          )}
                          {images.logo.url && (
                            <button
                              className="p-1 m-2 shrink-0 focus:outline-none rounded hover:bg-gray-700 focus:bg-gray-700 transition-colors duration-200"
                              onClick={() => removeImage('logo')}
                            >
                              <div className="w-6 h-6 text-white">×</div>
                            </button>
                          )}
                        </div>
                        <p className="mt-6 border p-4 rounded border-gray-700 text-gray-400">
                          Recommended brand logo size is 350 x 100 pixels.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* vCard Information */}
            <div className="mt-16">
              <h2 className="font-extrabold text-2xl">vCard information</h2>
              
              <div className="mt-6">
                <div className="flex flex-wrap items-center">
                  {images.photo.url ? (
                    <img
                      className="w-12 h-12 rounded object-contain"
                      src={images.photo.url}
                      alt="Card holder's photo"
                    />
                  ) : (
                    <button
                      className="p-3 rounded bg-gray-700 cursor-pointer hover:bg-gray-600 focus:bg-gray-600 transition-colors duration-200 focus:outline-none"
                      onClick={() => fileInputRefs.photo.current?.click()}
                    >
                      <div className="w-6 h-6 pointer-events-none text-white">+</div>
                    </button>
                  )}
                  <input
                    ref={fileInputRefs.photo}
                    type="file"
                    accept=".png,.jpg,.jpeg,.gif,.webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload('photo', file);
                    }}
                  />
                  {!images.photo.url && (
                    <p className="ml-3 leading-none">
                      Upload your headshot<br />
                      <span className="text-sm text-gray-400">suggested format: jpeg, png or gif</span>
                    </p>
                  )}
                  {images.photo.url && (
                    <button
                      className="p-1 m-2 shrink-0 focus:outline-none rounded hover:bg-gray-700 focus:bg-gray-700 transition-colors duration-200"
                      onClick={() => removeImage('photo')}
                    >
                      <div className="w-6 h-6 text-white">×</div>
                    </button>
                  )}
                </div>
                <p className="mt-6 border p-4 rounded border-gray-700 text-gray-400">
                  Recommended headshot is 300 x 300 pixels.
                </p>
              </div>

              <div className="mt-6">
                <div>
                  <label className="ml-4">Prefix</label>
                  <Input
                    placeholder="Dr./Mr./Prof."
                    value={vCardData.prefix}
                    onChange={(e) => handleInputChange('prefix', e.target.value)}
                    className="mt-2 px-4 w-full h-12 bg-black rounded border border-transparent transition-colors duration-200 focus:outline-none focus:border-gray-600 hover:border-gray-600"
                  />
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4">
                <div>
                  <label className="ml-4">First name</label>
                  <Input
                    value={vCardData.fname}
                    onChange={(e) => handleInputChange('fname', e.target.value)}
                    className="mt-2 px-4 w-full h-12 bg-black rounded border border-transparent transition-colors duration-200 focus:outline-none focus:border-gray-600 hover:border-gray-600"
                  />
                </div>
                <div>
                  <label className="ml-4">Last name</label>
                  <Input
                    value={vCardData.lname}
                    onChange={(e) => handleInputChange('lname', e.target.value)}
                    className="mt-2 px-4 w-full h-12 bg-black rounded border border-transparent transition-colors duration-200 focus:outline-none focus:border-gray-600 hover:border-gray-600"
                  />
                </div>
              </div>

              <div className="mt-6">
                <label className="ml-4">Gender pronouns</label>
                <Input
                  placeholder="He/Him/His"
                  value={vCardData.pronouns}
                  onChange={(e) => handleInputChange('pronouns', e.target.value)}
                  className="mt-2 px-4 w-full h-12 bg-black placeholder-gray-600 rounded border border-transparent transition-colors duration-200 focus:outline-none focus:border-gray-600 hover:border-gray-600"
                />
              </div>

              <div className="mt-6">
                <label className="ml-4">Job title</label>
                <Input
                  value={vCardData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="mt-2 px-4 w-full h-12 bg-black rounded border border-transparent transition-colors duration-200 focus:outline-none focus:border-gray-600 hover:border-gray-600"
                />
              </div>

              <div className="mt-6">
                <label className="ml-4">Business name</label>
                <Input
                  value={vCardData.biz}
                  onChange={(e) => handleInputChange('biz', e.target.value)}
                  className="mt-2 px-4 w-full h-12 bg-black rounded border border-transparent transition-colors duration-200 focus:outline-none focus:border-gray-600 hover:border-gray-600"
                />
              </div>

              <div className="mt-6">
                <label className="ml-4">Business address</label>
                <Input
                  placeholder="Street Address"
                  value={vCardData.street}
                  onChange={(e) => handleInputChange('street', e.target.value)}
                  className="mt-2 px-4 py-3 w-full bg-black rounded border border-transparent transition-colors duration-200 focus:outline-none focus:border-gray-600 resize-none hover:border-gray-600"
                />
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4">
                <Input
                  placeholder="City"
                  value={vCardData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  className="mt-2 px-4 w-full h-12 bg-black rounded border border-transparent transition-colors duration-200 focus:outline-none focus:border-gray-600 hover:border-gray-600"
                />
                <Input
                  placeholder="State"
                  value={vCardData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  className="mt-2 px-4 w-full h-12 bg-black rounded border border-transparent transition-colors duration-200 focus:outline-none focus:border-gray-600 hover:border-gray-600"
                />
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4">
                <Input
                  placeholder="Postal Code"
                  value={vCardData.postal}
                  onChange={(e) => handleInputChange('postal', e.target.value)}
                  className="mt-2 px-4 w-full h-12 bg-black rounded border border-transparent transition-colors duration-200 focus:outline-none focus:border-gray-600 hover:border-gray-600"
                />
                <Input
                  placeholder="Country"
                  value={vCardData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  className="mt-2 px-4 w-full h-12 bg-black rounded border border-transparent transition-colors duration-200 focus:outline-none focus:border-gray-600 hover:border-gray-600"
                />
              </div>

              <div className="mt-6">
                <label className="ml-4">Business description</label>
                <Textarea
                  value={vCardData.desc}
                  onChange={(e) => handleInputChange('desc', e.target.value)}
                  className="mt-2 px-4 py-3 w-full bg-black rounded border border-transparent transition-colors duration-200 focus:outline-none focus:border-gray-600 resize-none hover:border-gray-600"
                  rows={4}
                />
              </div>
            </div>

            {/* Primary Actions */}
            <div className="mt-16">
              <h2 className="font-extrabold text-2xl">Primary actions</h2>
              
              <div className="space-y-4">
                {primaryActions.map((action, index) => (
                  <div key={index} className="flex mt-6">
                    <button className="p-1 flex-shrink-0 focus:outline-none cursor-move">
                      <div className="w-6 h-6 text-gray-400">⋮⋮</div>
                    </button>
                    <div
                      className="p-3 flex-shrink-0 mr-3 rounded-full"
                      style={{ background: action.color }}
                    >
                      <div className="w-6 h-6 text-white">
                        {action.name === 'email' && '✉'}
                        {action.name === 'call' && '📞'}
                        {action.name === 'Mobile' && '📱'}
                        {action.name === 'website' && '🌐'}
                        {action.name === 'location' && '📍'}
                        {action.name === 'calendar' && '📅'}
                        {action.name === 'whatsApp' && '💬'}
                        {action.name === 'WeChat' && '💬'}
                        {action.name === 'messenger' && '💬'}
                        {action.name === 'signal' && '📡'}
                        {action.name === 'fax' && '📠'}
                        {action.name === 'Home' && '🏠'}
                        {action.name === 'Office' && '🏢'}
                      </div>
                    </div>
                    <div className="w-full">
                      <Input
                        className="px-4 w-full h-12 bg-black placeholder-gray-600 rounded border border-transparent transition-colors duration-200 focus:outline-none focus:border-gray-600 hover:border-gray-600"
                        type="text"
                        value={action.value}
                        onChange={(e) => updateActionValue('primary', index, e.target.value)}
                        placeholder={action.placeholder}
                      />
                    </div>
                    <button
                      className="p-1 m-2 flex-shrink-0 focus:outline-none rounded hover:bg-gray-700 focus:bg-gray-700 transition-colors duration-200"
                      onClick={() => removeAction('primary', index)}
                    >
                      <div className="w-6 h-6 text-white">×</div>
                    </button>
                  </div>
                ))}
              </div>
              
              <br />
              <Input
                className="px-4 mb-2 w-full h-12 bg-black placeholder-gray-600 rounded border border-transparent transition-colors duration-200 focus:outline-none focus:border-gray-600 hover:border-gray-600"
                type="text"
                value={filterPrimary}
                onChange={(e) => setFilterPrimary(e.target.value)}
                placeholder="Search an action"
              />

              <div className={`mt-6 ${primaryActions.length ? 'border-t pt-6' : ''}`}>
                <div className="grid grid-gap-6 justify-between grid-cols-[repeat(auto-fill,minmax(3rem,auto))]">
                  {filteredPrimaryActions.map((action) => (
                    <button
                      key={action.name}
                      onClick={() => addAction('primary', action.name)}
                      className="p-3 flex-shrink-0 rounded-full hover:scale-125 focus:scale-125 transform transition-transform duration-200 focus:outline-none"
                      style={{ backgroundColor: action.color }}
                      title={action.label}
                    >
                      <div className="w-6 h-6 text-white">
                        {action.name === 'email' && '✉'}
                        {action.name === 'call' && '📞'}
                        {action.name === 'Mobile' && '📱'}
                        {action.name === 'website' && '🌐'}
                        {action.name === 'location' && '📍'}
                        {action.name === 'calendar' && '📅'}
                        {action.name === 'whatsApp' && '💬'}
                        {action.name === 'WeChat' && '💬'}
                        {action.name === 'messenger' && '💬'}
                        {action.name === 'signal' && '📡'}
                        {action.name === 'fax' && '📠'}
                        {action.name === 'Home' && '🏠'}
                        {action.name === 'Office' && '🏢'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Secondary Actions */}
            <div className="mt-16">
              <h2 className="font-extrabold text-2xl">Secondary actions</h2>
              
              <div className="space-y-4">
                {secondaryActions.map((action, index) => (
                  <div key={index} className="flex mt-6">
                    <button className="p-1 flex-shrink-0 focus:outline-none cursor-move">
                      <div className="w-6 h-6 text-gray-400">⋮⋮</div>
                    </button>
                    <div
                      className="p-3 flex-shrink-0 mr-3 rounded-full"
                      style={{ background: action.color }}
                    >
                      <div className="w-6 h-6 text-white">
                        {action.name === 'email' && '✉'}
                        {action.name === 'call' && '📞'}
                        {action.name === 'Mobile' && '📱'}
                        {action.name === 'website' && '🌐'}
                        {action.name === 'location' && '📍'}
                        {action.name === 'calendar' && '📅'}
                        {action.name === 'whatsApp' && '💬'}
                        {action.name === 'WeChat' && '💬'}
                        {action.name === 'messenger' && '💬'}
                        {action.name === 'signal' && '📡'}
                        {action.name === 'fax' && '📠'}
                        {action.name === 'Home' && '🏠'}
                        {action.name === 'Office' && '🏢'}
                      </div>
                    </div>
                    <div className="w-full">
                      <Input
                        className="px-4 w-full h-12 bg-black placeholder-gray-600 rounded border border-transparent transition-colors duration-200 focus:outline-none focus:border-gray-600 hover:border-gray-600"
                        type="text"
                        value={action.value}
                        onChange={(e) => updateActionValue('secondary', index, e.target.value)}
                        placeholder={action.placeholder}
                      />
                    </div>
                    <button
                      className="p-1 m-2 flex-shrink-0 focus:outline-none rounded hover:bg-gray-700 focus:bg-gray-700 transition-colors duration-200"
                      onClick={() => removeAction('secondary', index)}
                    >
                      <div className="w-6 h-6 text-white">×</div>
                    </button>
                  </div>
                ))}
              </div>
              
              <br />
              <Input
                className="px-4 mb-2 w-full h-12 bg-black placeholder-gray-600 rounded border border-transparent transition-colors duration-200 focus:outline-none focus:border-gray-600 hover:border-gray-600"
                type="text"
                value={filterSecondary}
                onChange={(e) => setFilterSecondary(e.target.value)}
                placeholder="Search an action"
              />

              <div className={`mt-6 ${secondaryActions.length ? 'border-t pt-6' : ''}`}>
                <div className="grid grid-gap-6 justify-between grid-cols-[repeat(auto-fill,minmax(3rem,auto))]">
                  {filteredSecondaryActions.map((action) => (
                    <button
                      key={action.name}
                      onClick={() => addAction('secondary', action.name)}
                      className="p-3 flex-shrink-0 rounded-full hover:scale-125 focus:scale-125 transform transition-transform duration-200 focus:outline-none"
                      style={{ background: action.color }}
                      title={action.label}
                    >
                      <div className="w-6 h-6 text-white">
                        {action.name === 'email' && '✉'}
                        {action.name === 'call' && '📞'}
                        {action.name === 'Mobile' && '📱'}
                        {action.name === 'website' && '🌐'}
                        {action.name === 'location' && '📍'}
                        {action.name === 'calendar' && '📅'}
                        {action.name === 'whatsApp' && '💬'}
                        {action.name === 'WeChat' && '💬'}
                        {action.name === 'messenger' && '💬'}
                        {action.name === 'signal' && '📡'}
                        {action.name === 'fax' && '📠'}
                        {action.name === 'Home' && '🏠'}
                        {action.name === 'Office' && '🏢'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Visual Preview */}
          <div className="px-4">
            <div className="sticky top-8">
              <h2 className="font-extrabold text-2xl mb-2">Your Business Card</h2>
              <p className="text-gray-400 text-sm mb-6">Preview updates as you type</p>
              
              {/* Mobile Preview */}
              <div className="bg-white text-black rounded-lg shadow-lg overflow-hidden" style={{ maxWidth: '375px', margin: '0 auto' }}>
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
                <div className="p-6 text-center">
                  {/* Profile Photo */}
                  <div className="relative -mt-16 mb-4">
                    <div className="w-24 h-24 bg-gray-300 rounded-full mx-auto flex items-center justify-center overflow-hidden">
                      {images.photo.url ? (
                        <img src={images.photo.url} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-gray-600 text-sm">Photo</span>
                      )}
                    </div>
                  </div>

                  {/* Name and Title */}
                  <h1 className="text-xl font-bold mb-2">
                    {vCardData.prefix && `${vCardData.prefix} `}{vCardData.fname} {vCardData.lname}
                  </h1>
                  {vCardData.title && (
                    <p className="text-gray-600 mb-1">{vCardData.title}</p>
                  )}
                  {vCardData.biz && (
                    <p className="text-gray-600 mb-4">{vCardData.biz}</p>
                  )}

                  {/* Contact Information */}
                  <div className="space-y-3 text-left">
                    {vCardData.email && (
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 text-gray-500">✉</span>
                        <span className="text-sm">{vCardData.email}</span>
                      </div>
                    )}
                    {vCardData.phone && (
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 text-gray-500">📞</span>
                        <span className="text-sm">{vCardData.phone}</span>
                      </div>
                    )}
                    {vCardData.mobile && (
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 text-gray-500">📱</span>
                        <span className="text-sm">{vCardData.mobile}</span>
                      </div>
                    )}
                    {vCardData.website && (
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 text-gray-500">🌐</span>
                        <a href={vCardData.website} className="text-sm text-blue-600 hover:underline">{vCardData.website}</a>
                      </div>
                    )}
                    
                    {/* Primary Actions */}
                    {primaryActions.filter(action => action.value).map((action, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <span className="w-6 h-6 text-gray-500">
                          {action.name === 'email' && '✉'}
                          {action.name === 'call' && '📞'}
                          {action.name === 'Mobile' && '📱'}
                          {action.name === 'website' && '🌐'}
                          {action.name === 'location' && '📍'}
                          {action.name === 'calendar' && '📅'}
                          {action.name === 'whatsApp' && '💬'}
                          {action.name === 'WeChat' && '💬'}
                          {action.name === 'messenger' && '💬'}
                          {action.name === 'signal' && '📡'}
                          {action.name === 'fax' && '📠'}
                          {action.name === 'Home' && '🏠'}
                          {action.name === 'Office' && '🏢'}
                        </span>
                        <span className="text-sm">{action.value}</span>
                      </div>
                    ))}
                    
                    {/* Secondary Actions */}
                    {secondaryActions.filter(action => action.value).map((action, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <span className="w-6 h-6 text-gray-500">
                          {action.name === 'email' && '✉'}
                          {action.name === 'call' && '📞'}
                          {action.name === 'Mobile' && '📱'}
                          {action.name === 'website' && '🌐'}
                          {action.name === 'location' && '📍'}
                          {action.name === 'calendar' && '📅'}
                          {action.name === 'whatsApp' && '💬'}
                          {action.name === 'WeChat' && '💬'}
                          {action.name === 'messenger' && '💬'}
                          {action.name === 'signal' && '📡'}
                          {action.name === 'fax' && '📠'}
                          {action.name === 'Home' && '🏠'}
                          {action.name === 'Office' && '🏢'}
                        </span>
                        <span className="text-sm">{action.value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Description */}
                  {vCardData.desc && (
                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-600 text-left">{vCardData.desc}</p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
