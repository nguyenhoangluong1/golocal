import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { vehiclesAPI, imagesAPI } from '../utils/api';
import { validateImageFile, resizeImage } from '../utils/imageUtils';
import { Car, MapPin, DollarSign, Image, FileText, CheckCircle, ArrowRight, Upload, Star, X, AlertCircle, Sparkles } from 'lucide-react';

interface VehicleForm {
  name: string;
  type: string;
  brand: string;
  year: number;
  pricePerDay: number;
  address: string;
  district: string;
  city: string;
  description: string;
  features: string[];
  licensePlate: string;
  images: File[];
}

export default function HostYourVehiclePage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { showError, showWarning } = useToast();
  const [step, setStep] = useState(1);
  const formRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState<VehicleForm>({
    name: '',
    type: '',
    brand: '',
    year: new Date().getFullYear(),
    pricePerDay: 0,
    address: '',
    district: '',
    city: '',
    description: '',
    features: [],
    licensePlate: '',
    images: [],
  });
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showKYCModal, setShowKYCModal] = useState(false);

  const cities = ['Ho Chi Minh City', 'Hanoi', 'Da Nang', 'Hoi An', 'Nha Trang', 'Can Tho'];
  const commonFeatures = [
    'ABS', 'Smart Key', 'USB Charging', 'LED Lights', 'Bluetooth',
    'Air Conditioning', 'GPS', 'Backup Camera', 'Sunroof', 'Leather Seats'
  ];

  const handleGetStarted = () => {
    setStep(2);
    // Scroll to form section smoothly after a brief delay to allow state to update
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    // Convert numeric fields to numbers
    if (name === 'year' || name === 'pricePerDay') {
      setFormData(prev => ({ ...prev, [name]: Number(value) || 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFeatureToggle = (feature: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const files = Array.from(e.target.files);
    const validFiles: File[] = [];
    const newPreviews: string[] = [];

    for (const file of files) {
      const validation = validateImageFile(file);
      if (!validation.valid) {
        showError(validation.error || 'Invalid image file');
        continue;
      }

      try {
        // Resize image
        const resized = await resizeImage(file, 1920, 1920, 0.9);
        validFiles.push(resized);
        
        // Create preview
        const preview = URL.createObjectURL(resized);
        newPreviews.push(preview);
      } catch (error) {
        console.error('Error processing image:', error);
        showError(`Error processing image: ${file.name}`);
      }
    }

    if (validFiles.length > 0) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...validFiles]
      }));
      setImagePreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
    setImagePreviews(prev => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const geocodeAddress = async (address: string, city: string): Promise<{ lat: number; lng: number } | null> => {
    try {
      const fullAddress = `${address}, ${city}, Vietnam`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}&limit=1`,
        {
          headers: { 'Accept-Language': 'vi' },
          signal: controller.signal
        }
      );
      clearTimeout(timeoutId);
      const data = await response.json();
      
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        };
      }
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 2) {
      if (!formData.name.trim()) newErrors.name = 'Vehicle name is required';
      if (!formData.type) newErrors.type = 'Vehicle type is required';
      if (!formData.brand.trim()) newErrors.brand = 'Brand is required';
      if (!formData.year || formData.year < 1990 || formData.year > new Date().getFullYear() + 1) {
        newErrors.year = 'Invalid year';
      }
      if (!formData.pricePerDay || formData.pricePerDay <= 0) {
        newErrors.pricePerDay = 'Price must be greater than 0';
      }
      if (!formData.description.trim()) newErrors.description = 'Description is required';
      if (!formData.licensePlate.trim()) newErrors.licensePlate = 'License plate is required';
    }

    if (step === 3) {
      if (!formData.address.trim()) newErrors.address = 'Address is required';
      if (!formData.district.trim()) newErrors.district = 'District is required';
      if (!formData.city) newErrors.city = 'City is required';
    }

    if (step === 4) {
      if (formData.images.length < 3) {
        newErrors.images = 'Please upload at least 3 photos';
      }
      if (formData.images.length > 10) {
        newErrors.images = 'Maximum 10 photos allowed';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    // Check KYC verification
    if (!user || !user.kyc_status || user.kyc_status.toUpperCase() !== 'VERIFIED') {
      setShowKYCModal(true);
      return;
    }

    if (!validateForm()) {
      showWarning('Please fill in all required information');
      return;
    }

    try {
      setLoading(true);

      // Get coordinates from address
      if (!lat || !lng) {
        const coords = await geocodeAddress(formData.address, formData.city);
        if (!coords) {
          showError('Could not find coordinates for the address. Please check the address.');
          setLoading(false);
          return;
        }
        setLat(coords.lat);
        setLng(coords.lng);
      }

      // Upload images
      const imageUrls: string[] = [];
      for (const image of formData.images) {
        try {
          const response = await imagesAPI.uploadVehicleImage(image);
          if (response.data?.url) {
            imageUrls.push(response.data.url);
          }
        } catch (error) {
          console.error('Error uploading image:', error);
          showError('Error uploading image. Please try again.');
          setLoading(false);
          return;
        }
      }

      // Create vehicle
      const vehicleData = {
        name: formData.name,
        type: formData.type,
        brand: formData.brand,
        year: Number(formData.year), // Ensure it's a number
        price_per_day: Number(formData.pricePerDay), // Ensure it's a number
        address: formData.address,
        district: formData.district,
        city: formData.city,
        lat: Number(lat!), // Ensure it's a number
        lng: Number(lng!), // Ensure it's a number
        description: formData.description,
        images: imageUrls,
        features: formData.features,
        license_plate: formData.licensePlate,
        available: true,
        verified: false,
      };

      const response = await vehiclesAPI.create(vehicleData);
      
      if (response.data) {
        setShowSuccessModal(true);
      }
    } catch (error: any) {
      console.error('Error creating vehicle:', error);
      showError(error.response?.data?.detail || 'Error creating vehicle. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const benefits = [
    {
      icon: <DollarSign className="w-8 h-8" />,
      title: 'Earn Extra Income',
      description: 'Make money from your vehicle when you\'re not using it'
    },
    {
      icon: <CheckCircle className="w-8 h-8" />,
      title: 'Full Insurance Coverage',
      description: 'Your vehicle is protected with comprehensive insurance'
    },
    {
      icon: <Star className="w-8 h-8" />,
      title: 'Verified Renters',
      description: 'All renters are verified and background checked'
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors">
      {/* Hero Section */}
      <section className="w-full px-6 lg:px-12 xl:px-20 py-20 md:py-32 bg-white dark:bg-gray-900 transition-colors">
        <div className="max-w-[1920px] mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight transition-colors">
                Share Your Vehicle, Earn Money
              </h1>
              <p className="text-lg md:text-xl text-gray-500 dark:text-gray-400 font-light mb-12 transition-colors">
                Join thousands of hosts earning extra income by sharing their vehicles with travelers.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={handleGetStarted}
                  className="px-12 py-4 text-sm font-medium tracking-widest text-white bg-gray-900 dark:bg-gray-100 dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200 transition-all rounded-xl shadow-lg hover:shadow-2xl flex items-center gap-2"
                >
                  GET STARTED
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button className="px-12 py-4 text-sm font-medium tracking-widest border-2 border-gray-900 dark:border-gray-100 dark:text-gray-100 text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all rounded-xl">
                  LEARN MORE
                </button>
              </div>
            </div>
            <div className="hidden md:block">
              <img
                src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800"
                alt="Share your vehicle"
                className="rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 md:py-32 w-full bg-gray-50 dark:bg-gray-800 transition-colors">
        <div className="w-full px-6 lg:px-12 xl:px-20">
          <div className="text-center mb-16 md:mb-24 max-w-[1920px] mx-auto">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight transition-colors">
              Why Host with GoLocal?
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-[1920px] mx-auto">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-2xl transition-all duration-300"
              >
                <div className="bg-gray-100 dark:bg-gray-800 w-16 h-16 rounded-xl flex items-center justify-center text-gray-900 dark:text-white mb-4">
                  {benefit.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
                  {benefit.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 font-normal">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Form Section */}
      {step >= 2 && (
        <section ref={formRef} className="py-20 md:py-32 w-full bg-white dark:bg-gray-900 transition-colors">
          <div className="w-full px-6 lg:px-12 xl:px-20">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-2xl p-8">
            {/* Progress Steps */}
            <div className="flex items-center justify-between mb-12">
              {[
                { num: 1, label: 'Info', icon: <FileText className="w-5 h-5" /> },
                { num: 2, label: 'Vehicle', icon: <Car className="w-5 h-5" /> },
                { num: 3, label: 'Location', icon: <MapPin className="w-5 h-5" /> },
                { num: 4, label: 'Photos', icon: <Image className="w-5 h-5" /> },
              ].map((s, i) => (
                <div key={i} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                        step >= s.num
                          ? 'bg-gray-900 dark:bg-gray-100 dark:text-gray-900 text-white shadow-lg'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                      }`}
                    >
                      {s.icon}
                    </div>
                    <span className="text-sm mt-2 text-gray-600 dark:text-gray-400 font-normal">{s.label}</span>
                  </div>
                  {i < 3 && (
                    <div
                      className={`h-1 w-20 mx-4 transition-all ${
                        step > s.num ? 'bg-gray-900 dark:bg-gray-100' : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Step 2: Vehicle Details */}
            {step === 2 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
                  Vehicle Details
                </h2>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Vehicle Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="e.g., Honda SH 150i 2023"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent bg-white dark:bg-gray-800 dark:text-white transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Vehicle Type *
                    </label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent bg-white dark:bg-gray-800 dark:text-white transition-colors"
                    >
                      <option value="">Select type</option>
                      <option value="MOTORBIKE">Motorbike</option>
                      <option value="CAR">Car</option>
                      <option value="BICYCLE">Bicycle</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Brand *
                    </label>
                    <input
                      type="text"
                      name="brand"
                      value={formData.brand}
                      onChange={handleInputChange}
                      placeholder="e.g., Honda"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent bg-white dark:bg-gray-800 dark:text-white transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Year *
                    </label>
                    <input
                      type="number"
                      name="year"
                      value={formData.year}
                      onChange={handleInputChange}
                      min="1990"
                      max={new Date().getFullYear() + 1}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent bg-white dark:bg-gray-800 dark:text-white transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      License Plate *
                    </label>
                    <input
                      type="text"
                      name="licensePlate"
                      value={formData.licensePlate}
                      onChange={handleInputChange}
                      placeholder="e.g., 59-X1 12345"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent bg-white dark:bg-gray-800 dark:text-white transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Price per Day (VND) *
                    </label>
                    <input
                      type="number"
                      name="pricePerDay"
                      value={formData.pricePerDay}
                      onChange={handleInputChange}
                      placeholder="150000"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent bg-white dark:bg-gray-800 dark:text-white transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    placeholder="Describe your vehicle, its condition, and any special features..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Features
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {commonFeatures.map((feature) => (
                      <button
                        key={feature}
                        type="button"
                        onClick={() => handleFeatureToggle(feature)}
                        className={`px-4 py-2 rounded-xl border-2 transition-all font-normal ${
                          formData.features.includes(feature)
                            ? 'border-gray-900 dark:border-gray-100 bg-gray-900 dark:bg-gray-100 dark:text-gray-900 text-white'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-900 dark:hover:border-gray-100'
                        }`}
                      >
                        {feature}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-4 pt-6">
                  <button
                    onClick={() => {
                      if (validateForm()) {
                        setStep(3);
                      }
                    }}
                    className="px-12 py-4 text-sm font-medium tracking-widest text-white bg-gray-900 dark:bg-gray-100 dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200 transition-all rounded-xl shadow-lg hover:shadow-2xl flex items-center gap-2"
                  >
                    NEXT: LOCATION
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
                {Object.keys(errors).length > 0 && (
                  <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                      <span className="font-semibold text-red-800 dark:text-red-300">Please fix the following errors:</span>
                    </div>
                    <ul className="list-disc list-inside text-sm text-red-700 dark:text-red-400 space-y-1">
                      {Object.values(errors).map((error, i) => (
                        <li key={i}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Location */}
            {step === 3 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
                  Vehicle Location
                </h2>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Full Address *
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="e.g., 214 Lê Hồng Phong"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent bg-white dark:bg-gray-800 dark:text-white transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      District *
                    </label>
                    <input
                      type="text"
                      name="district"
                      value={formData.district}
                      onChange={handleInputChange}
                      placeholder="e.g., Quận 1"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent bg-white dark:bg-gray-800 dark:text-white transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      City *
                    </label>
                    <select
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent bg-white dark:bg-gray-800 dark:text-white transition-colors"
                    >
                      <option value="">Select city</option>
                      {cities.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-between pt-6">
                  <button
                    onClick={() => setStep(2)}
                    className="px-12 py-4 text-sm font-medium tracking-widest border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all rounded-xl"
                  >
                    BACK
                  </button>
                  <button
                    onClick={() => {
                      if (validateForm()) {
                        setStep(4);
                      }
                    }}
                    className="px-12 py-4 text-sm font-medium tracking-widest text-white bg-gray-900 dark:bg-gray-100 dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200 transition-all rounded-xl shadow-lg hover:shadow-2xl flex items-center gap-2"
                  >
                    NEXT: PHOTOS
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
                {Object.keys(errors).length > 0 && (
                  <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                      <span className="font-semibold text-red-800 dark:text-red-300">Please fix the following errors:</span>
                    </div>
                    <ul className="list-disc list-inside text-sm text-red-700 dark:text-red-400 space-y-1">
                      {Object.values(errors).map((error, i) => (
                        <li key={i}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Photos */}
            {step === 4 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
                  Upload Photos
                </h2>

                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-12 text-center">
                  <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Drag and drop photos or click to browse
                  </p>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="inline-block px-12 py-4 text-sm font-medium tracking-widest text-white bg-gray-900 dark:bg-gray-100 dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200 transition-all rounded-xl shadow-lg hover:shadow-2xl cursor-pointer"
                  >
                    CHOOSE PHOTOS
                  </label>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                    Upload at least 3 photos. Maximum 10 photos.
                  </p>
                </div>

                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative">
                        <img
                          src={preview}
                          alt={`Upload ${index + 1}`}
                          className="w-full h-32 object-cover rounded-xl"
                        />
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center hover:bg-red-700 transition"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-between pt-6">
                  <button
                    onClick={() => setStep(3)}
                    className="px-12 py-4 text-sm font-medium tracking-widest border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all rounded-xl"
                  >
                    BACK
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={formData.images.length < 3 || loading}
                    className="px-12 py-4 text-sm font-medium tracking-widest text-white bg-gray-900 dark:bg-gray-100 dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200 transition-all rounded-xl shadow-lg hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        SUBMITTING...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        SUBMIT LISTING
                      </>
                    )}
                  </button>
                </div>
                {errors.images && (
                  <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                      <span className="text-sm text-red-700 dark:text-red-400">{errors.images}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
            </div>
          </div>
        </div>
      </section>
      )}

      {/* FAQ Section */}
      <section className="py-20 md:py-32 w-full bg-gray-50 dark:bg-gray-800 transition-colors">
        <div className="w-full px-6 lg:px-12 xl:px-20">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-center text-gray-900 dark:text-white mb-16 tracking-tight transition-colors">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {[
                {
                  q: 'How much can I earn?',
                  a: 'Average hosts earn 100,000 - 500,000 VND per day depending on vehicle type and location.'
                },
                {
                  q: 'Is my vehicle insured?',
                  a: 'Yes, all rentals are covered by comprehensive insurance during the rental period.'
                },
                {
                  q: 'Who can rent my vehicle?',
                  a: 'Only verified users with valid licenses and positive reviews can rent your vehicle.'
                },
              ].map((faq, index) => (
                <div
                  key={index}
                  className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition-all"
                >
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2 tracking-tight">
                    {faq.q}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 font-normal">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full p-8 text-center animate-scaleIn">
            <div className="mb-6 flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping"></div>
                <div className="relative bg-gradient-to-br from-green-500 to-emerald-600 rounded-full p-4">
                  <CheckCircle className="w-16 h-16 text-white" />
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                🎉 Congratulations!
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-2">
                Your vehicle listing has been created successfully!
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Your listing is now pending admin approval. We'll notify you once it's been reviewed and approved.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 mb-6 text-sm text-gray-500 dark:text-gray-400">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>You're one step closer to earning extra income!</span>
              <Sparkles className="w-4 h-4 text-amber-500" />
            </div>

            <button
              onClick={() => {
                setShowSuccessModal(false);
                navigate('/profile');
              }}
              className="w-full bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white font-semibold py-3 px-6 rounded-xl transition-all transform hover:scale-105 shadow-lg"
            >
              View My Profile
            </button>
          </div>
        </div>
      )}

      {/* KYC Requirement Modal */}
      {showKYCModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full p-8 animate-scaleIn">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-full">
                  <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  KYC Verification Required
                </h2>
              </div>
              <button
                onClick={() => setShowKYCModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                To host your vehicle, you need to complete KYC (Know Your Customer) verification first. This helps us ensure a safe and secure platform for all users.
              </p>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800 dark:text-blue-300 font-semibold mb-2">
                  What you'll need:
                </p>
                <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1 list-disc list-inside">
                  <li>Valid ID card, driver's license, or passport</li>
                  <li>Front and back photos of your document</li>
                  <li>Optional: Selfie photo for verification</li>
                </ul>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                The verification process usually takes 1-2 business days. You'll receive a notification once your KYC is approved.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowKYCModal(false)}
                className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowKYCModal(false);
                  navigate('/kyc');
                }}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-rose-600 to-pink-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
              >
                Verify Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
