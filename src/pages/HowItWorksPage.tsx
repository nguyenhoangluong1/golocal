import { Search, MessageCircle, ShieldCheck, CreditCard, FileText, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function HowItWorksPage() {
  const navigate = useNavigate();

  const renterSteps = [
    {
      icon: Search,
      title: 'Search & Discover',
      description: 'Browse thousands of vehicles across Vietnam. Filter by location, type, price, and availability to find your perfect ride.'
    },
    {
      icon: ShieldCheck,
      title: 'Choose & Verify',
      description: 'Review vehicle details, owner ratings, and insurance coverage. All vehicles are verified and owners are background-checked.'
    },
    {
      icon: CreditCard,
      title: 'Book & Pay',
      description: 'Select your dates, complete the booking with secure payment. Receive instant confirmation and trip details via email.'
    },
    {
      icon: FileText,
      title: 'Pick Up & Go',
      description: 'Meet the owner, complete a quick inspection, and hit the road. Digital keys and contracts make pickup seamless.'
    }
  ];

  const ownerSteps = [
    {
      icon: FileText,
      title: 'List Your Vehicle',
      description: 'Create a detailed listing with photos, description, and pricing. It takes less than 10 minutes to get started.'
    },
    {
      icon: MessageCircle,
      title: 'Receive Requests',
      description: 'Get notified when renters are interested. Review their profiles, ratings, and trip details before accepting.'
    },
    {
      icon: ShieldCheck,
      title: 'Meet & Handover',
      description: 'Meet your renter, complete a vehicle inspection together, and hand over the keys. Everything is documented digitally.'
    },
    {
      icon: CreditCard,
      title: 'Get Paid',
      description: 'Receive payment securely after the trip ends. Funds are transferred directly to your bank account within 24 hours.'
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors">
      {/* Hero Section */}
      <section className="w-full px-6 lg:px-12 xl:px-20 py-20 md:py-32 bg-white dark:bg-gray-900 transition-colors">
        <div className="max-w-[1920px] mx-auto text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight transition-colors">
            How GoLocal Works
          </h1>
          <p className="text-lg md:text-xl text-gray-500 dark:text-gray-400 font-light max-w-3xl mx-auto transition-colors">
            Simple, secure, and seamless vehicle sharing. Whether you're renting or hosting, we've got you covered.
          </p>
        </div>
      </section>

      {/* For Renters Section */}
      <section className="py-20 md:py-32 w-full bg-gray-50 dark:bg-gray-800 transition-colors">
        <div className="w-full px-6 lg:px-12 xl:px-20">
          <div className="text-center mb-16 md:mb-24 max-w-[1920px] mx-auto">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight transition-colors">
              For Renters
            </h2>
            <p className="text-lg md:text-xl text-gray-500 dark:text-gray-400 font-light transition-colors">
              Find and book the perfect vehicle in 4 easy steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-[1920px] mx-auto">
            {renterSteps.map((step, index) => (
              <div key={index} className="relative">
                <div className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-2xl transition-all duration-300 h-full">
                  <div className="w-14 h-14 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center mb-6">
                    <step.icon className="w-7 h-7 text-gray-900 dark:text-white" />
                  </div>
                  <div className="text-xs font-medium tracking-[0.3em] text-gray-500 dark:text-gray-400 uppercase mb-2">
                    Step {index + 1}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 tracking-tight">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed font-normal">
                    {step.description}
                  </p>
                </div>
                {index < renterSteps.length - 1 && (
                  <div className="hidden lg:block absolute top-16 -right-4 w-8 h-0.5 bg-gray-200 dark:bg-gray-700"></div>
                )}
              </div>
            ))}
          </div>

          <div className="text-center mt-16 md:mt-24 max-w-[1920px] mx-auto">
            <button
              onClick={() => navigate('/search')}
              className="px-12 py-4 text-sm font-medium tracking-widest text-white bg-gray-900 dark:bg-gray-100 dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200 transition-all rounded-xl shadow-lg hover:shadow-2xl"
            >
              START SEARCHING
            </button>
          </div>
        </div>
      </section>

      {/* For Owners Section */}
      <section className="py-20 md:py-32 w-full bg-white dark:bg-gray-900 transition-colors">
        <div className="w-full px-6 lg:px-12 xl:px-20">
          <div className="text-center mb-16 md:mb-24 max-w-[1920px] mx-auto">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight transition-colors">
              For Vehicle Owners
            </h2>
            <p className="text-lg md:text-xl text-gray-500 dark:text-gray-400 font-light transition-colors">
              Turn your vehicle into income in 4 simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-[1920px] mx-auto">
            {ownerSteps.map((step, index) => (
              <div key={index} className="relative">
                <div className="bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-2xl transition-all duration-300 h-full">
                  <div className="w-14 h-14 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center mb-6">
                    <step.icon className="w-7 h-7 text-gray-900 dark:text-white" />
                  </div>
                  <div className="text-xs font-medium tracking-[0.3em] text-gray-500 dark:text-gray-400 uppercase mb-2">
                    Step {index + 1}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 tracking-tight">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed font-normal">
                    {step.description}
                  </p>
                </div>
                {index < ownerSteps.length - 1 && (
                  <div className="hidden lg:block absolute top-16 -right-4 w-8 h-0.5 bg-gray-200 dark:bg-gray-700"></div>
                )}
              </div>
            ))}
          </div>

          <div className="text-center mt-16 md:mt-24 max-w-[1920px] mx-auto">
            <button
              onClick={() => navigate('/become-owner')}
              className="px-12 py-4 text-sm font-medium tracking-widest text-white bg-gray-900 dark:bg-gray-100 dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200 transition-all rounded-xl shadow-lg hover:shadow-2xl"
            >
              LIST YOUR VEHICLE
            </button>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 md:py-32 w-full bg-gray-50 dark:bg-gray-800 transition-colors">
        <div className="w-full px-6 lg:px-12 xl:px-20">
          <div className="text-center mb-16 md:mb-24 max-w-[1920px] mx-auto">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight transition-colors">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-[1920px] mx-auto">
            <div className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl transition-all">
              <div className="flex items-start gap-4">
                <HelpCircle className="w-6 h-6 text-gray-900 dark:text-white flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
                    Is insurance included?
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 font-normal">
                    Yes, all trips include comprehensive insurance coverage for both the vehicle and driver.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl transition-all">
              <div className="flex items-start gap-4">
                <HelpCircle className="w-6 h-6 text-gray-900 dark:text-white flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
                    What if there's an accident?
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 font-normal">
                    Contact our 24/7 support immediately. Insurance covers damages, and we'll guide you through the process.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl transition-all">
              <div className="flex items-start gap-4">
                <HelpCircle className="w-6 h-6 text-gray-900 dark:text-white flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
                    Can I cancel my booking?
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 font-normal">
                    Yes, cancellation policies vary by owner. Check the listing for specific terms and refund details.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl transition-all">
              <div className="flex items-start gap-4">
                <HelpCircle className="w-6 h-6 text-gray-900 dark:text-white flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
                    How does payment work?
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 font-normal">
                    Pay securely through our platform. Funds are held until trip completion, then released to the owner.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-16 md:mt-24 max-w-[1920px] mx-auto">
            <button
              onClick={() => navigate('/support')}
              className="px-12 py-4 text-sm font-medium tracking-widest text-white bg-gray-900 dark:bg-gray-100 dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200 transition-all rounded-xl shadow-lg hover:shadow-2xl"
            >
              VISIT HELP CENTER
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
