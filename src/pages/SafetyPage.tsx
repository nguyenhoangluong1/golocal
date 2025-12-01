import { Shield, CheckCircle, AlertTriangle, Users, FileCheck, Lock } from 'lucide-react';

export default function SafetyPage() {
  const safetyFeatures = [
    {
      icon: Shield,
      title: 'Verified Identity',
      description: 'All users undergo identity verification with government-issued ID and background checks before joining our platform.'
    },
    {
      icon: CheckCircle,
      title: 'Vehicle Inspections',
      description: 'Every listed vehicle passes our safety inspection checklist. Only roadworthy vehicles are approved for rental.'
    },
    {
      icon: Lock,
      title: 'Secure Payments',
      description: 'All transactions are encrypted and processed through secure payment gateways. Your financial data is never stored.'
    },
    {
      icon: Users,
      title: 'Community Reviews',
      description: 'Read verified reviews from real renters and owners. Our two-way review system ensures accountability.'
    },
    {
      icon: FileCheck,
      title: 'Digital Contracts',
      description: 'Every rental includes a legally-binding digital contract with clear terms, responsibilities, and insurance coverage.'
    },
    {
      icon: AlertTriangle,
      title: '24/7 Emergency Support',
      description: 'Access immediate help anytime. Our emergency hotline connects you to support and roadside assistance.'
    }
  ];

  const renterGuidelines = [
    'Always inspect the vehicle thoroughly before accepting the keys',
    'Take photos/videos of any existing damage and report it immediately',
    'Verify insurance coverage and understand the deductible amount',
    'Keep emergency contact numbers saved in your phone',
    'Never drive under the influence of alcohol or drugs',
    'Follow all traffic laws and speed limits',
    'Return the vehicle on time with the same fuel level',
    'Report any incidents or accidents immediately'
  ];

  const ownerGuidelines = [
    'Ensure your vehicle meets all safety and maintenance standards',
    'Keep insurance and registration documents up to date',
    'Provide accurate vehicle descriptions and clear photos',
    'Meet renters in safe, public locations for key handover',
    'Conduct thorough vehicle inspections before and after trips',
    'Set clear rules and expectations in your listing',
    'Report suspicious behavior or policy violations',
    'Respond promptly to renter questions and concerns'
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors">
      {/* Hero Section */}
      <section className="w-full px-6 lg:px-12 xl:px-20 py-20 md:py-32 bg-white dark:bg-gray-900 transition-colors">
        <div className="max-w-[1920px] mx-auto text-center">
          <Shield className="w-16 h-16 mx-auto mb-6 text-gray-900 dark:text-white" />
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight transition-colors">
            Safety Standards
          </h1>
          <p className="text-lg md:text-xl text-gray-500 dark:text-gray-400 font-light max-w-3xl mx-auto transition-colors">
            Your safety is our top priority. Learn about the measures we take to ensure every trip is secure and worry-free.
          </p>
        </div>
      </section>

      {/* Safety Features */}
      <section className="py-20 md:py-32 w-full bg-gray-50 dark:bg-gray-800 transition-colors">
        <div className="w-full px-6 lg:px-12 xl:px-20">
          <div className="text-center mb-16 md:mb-24 max-w-[1920px] mx-auto">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight transition-colors">
              Our Safety Measures
            </h2>
            <p className="text-lg md:text-xl text-gray-500 dark:text-gray-400 font-light transition-colors">
              Multiple layers of protection for peace of mind
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-[1920px] mx-auto">
            {safetyFeatures.map((feature, index) => (
              <div
                key={index}
                className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-2xl transition-all duration-300"
              >
                <div className="w-14 h-14 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center mb-6">
                  <feature.icon className="w-7 h-7 text-gray-900 dark:text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 tracking-tight">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed font-normal">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Guidelines Section */}
      <section className="py-20 md:py-32 w-full bg-white dark:bg-gray-900 transition-colors">
        <div className="w-full px-6 lg:px-12 xl:px-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-[1920px] mx-auto">
            {/* For Renters */}
            <div>
              <div className="bg-gray-900 dark:bg-gray-100 dark:text-gray-900 text-white rounded-2xl p-8 mb-8">
                <h3 className="text-3xl font-bold mb-2 tracking-tight">For Renters</h3>
                <p className="text-gray-300 dark:text-gray-600 font-light">Essential safety tips for your trip</p>
              </div>
              <div className="space-y-4">
                {renterGuidelines.map((guideline, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl"
                  >
                    <CheckCircle className="w-6 h-6 text-cyan-600 dark:text-cyan-400 flex-shrink-0 mt-0.5" />
                    <p className="text-gray-700 dark:text-gray-300">{guideline}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* For Owners */}
            <div>
              <div className="bg-gray-900 dark:bg-gray-100 dark:text-gray-900 text-white rounded-2xl p-8 mb-8">
                <h3 className="text-3xl font-bold mb-2 tracking-tight">For Owners</h3>
                <p className="text-gray-300 dark:text-gray-600 font-light">Best practices for hosting safely</p>
              </div>
              <div className="space-y-4">
                {ownerGuidelines.map((guideline, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl"
                  >
                    <CheckCircle className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <p className="text-gray-700 dark:text-gray-300">{guideline}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Emergency Contact */}
      <section className="py-24 md:py-32 bg-gray-900 dark:bg-gray-800 text-white transition-colors w-full">
        <div className="w-full px-6 lg:px-12 xl:px-20 text-center">
          <div className="max-w-[1000px] mx-auto">
            <AlertTriangle className="w-16 h-16 mx-auto mb-6" />
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-8 tracking-tight">Emergency Support</h2>
            <p className="text-lg md:text-xl text-gray-400 dark:text-gray-300 mb-12 font-light max-w-2xl mx-auto transition-colors">
              If you experience an emergency or safety concern during your trip, contact us immediately.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <a
                href="tel:+84353906610"
                className="px-12 py-4 text-sm font-medium tracking-widest text-gray-900 bg-white hover:bg-gray-100 transition-all rounded-xl shadow-lg hover:shadow-2xl"
              >
                📞 +84 353 906 610
              </a>
              <span className="text-gray-400 dark:text-gray-300">Available 24/7</span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              For non-emergency support, visit our Help Center or email support@golocal.vn
            </p>
          </div>
        </div>
      </section>

      {/* Trust & Safety Commitment */}
      <section className="py-20 md:py-32 w-full bg-white dark:bg-gray-900 transition-colors">
        <div className="w-full px-6 lg:px-12 xl:px-20 text-center">
          <div className="max-w-[1000px] mx-auto">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-8 tracking-tight transition-colors">Our Commitment to Safety</h2>
            <p className="text-lg md:text-xl text-gray-500 dark:text-gray-400 leading-relaxed mb-8 font-light transition-colors">
              At GoLocal, we're constantly improving our safety measures and learning from our community. We invest in technology, training, and partnerships to make every rental as safe as possible. Your feedback helps us identify risks and implement better protections.
            </p>
            <p className="text-gray-600 dark:text-gray-400 italic font-normal">
              "Safety isn't just a feature—it's the foundation of everything we do."
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
