import { Shield, CheckCircle, FileText, DollarSign, AlertCircle, Phone } from 'lucide-react';

export default function InsurancePage() {
  const coverageTypes = [
    {
      icon: Shield,
      title: 'Collision Coverage',
      description: 'Covers damage to the rental vehicle in case of accidents, regardless of fault.',
      included: true
    },
    {
      icon: Shield,
      title: 'Third-Party Liability',
      description: 'Protects against claims from other parties for property damage or injuries.',
      included: true
    },
    {
      icon: Shield,
      title: 'Theft Protection',
      description: 'Full coverage if the vehicle is stolen during the rental period.',
      included: true
    },
    {
      icon: Shield,
      title: 'Personal Injury',
      description: 'Medical expenses for driver and passengers in case of accidents.',
      included: true
    }
  ];

  const partners = [
    {
      name: 'Bao Viet Insurance',
      logo: '🛡️',
      description: 'Vietnam\'s largest insurance provider with 50+ years of experience'
    },
    {
      name: 'Bao Minh Insurance',
      logo: '🏛️',
      description: 'Trusted nationwide coverage with 24/7 claims support'
    },
    {
      name: 'PTI Insurance',
      logo: '⚡',
      description: 'Specialized in vehicle and travel insurance solutions'
    }
  ];

  const claims = [
    {
      step: '1',
      title: 'Report Immediately',
      description: 'Contact our 24/7 support hotline as soon as an incident occurs. Do not leave the scene.'
    },
    {
      step: '2',
      title: 'Document Everything',
      description: 'Take photos/videos of all damages, get police report if required, exchange information with other parties.'
    },
    {
      step: '3',
      title: 'File Your Claim',
      description: 'Submit your claim through the app or website with all supporting documents within 24 hours.'
    },
    {
      step: '4',
      title: 'Get Resolution',
      description: 'Our insurance team will review, process your claim, and coordinate repairs or compensation.'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 text-center">
          <Shield className="w-16 h-16 mx-auto mb-6" />
          <h1 className="text-5xl lg:text-6xl font-bold mb-6">
            Insurance Coverage
          </h1>
          <p className="text-xl lg:text-2xl text-blue-50 max-w-3xl mx-auto">
            Every rental on GoLocal includes comprehensive insurance protection. Drive with confidence knowing you're fully covered.
          </p>
        </div>
      </div>

      {/* What's Covered */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            What's Included
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Comprehensive protection at no extra cost
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {coverageTypes.map((coverage, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-2xl p-8 border-2 border-blue-200 dark:border-blue-800"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                  <coverage.icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      {coverage.title}
                    </h3>
                    {coverage.included && (
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                    )}
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">
                    {coverage.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-8 border border-green-200 dark:border-green-800">
          <div className="flex items-start gap-4">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400 flex-shrink-0" />
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                All Coverage Included in Your Rental
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                Unlike traditional rental companies, we don't charge extra for insurance. Every booking automatically includes full coverage with zero deductible for eligible claims.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Insurance Partners */}
      <div className="bg-white dark:bg-gray-800 py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Our Insurance Partners
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Working with Vietnam's most trusted insurance providers
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {partners.map((partner, index) => (
              <div
                key={index}
                className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-8 text-center border border-gray-200 dark:border-gray-700 hover:shadow-xl transition"
              >
                <div className="text-6xl mb-4">{partner.logo}</div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  {partner.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {partner.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Claims Process */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            How to File a Claim
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Quick and simple claims process
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {claims.map((claim, index) => (
            <div key={index} className="relative">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 h-full">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center font-bold text-xl mb-4">
                  {claim.step}
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                  {claim.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                  {claim.description}
                </p>
              </div>
              {index < claims.length - 1 && (
                <div className="hidden lg:block absolute top-6 -right-4 w-8 h-0.5 bg-blue-200 dark:bg-blue-800"></div>
              )}
            </div>
          ))}
        </div>

        <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                Important: Time Limits
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                All incidents must be reported within 24 hours to be eligible for insurance coverage. Late reporting may result in claim denial or reduced compensation.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Coverage Details */}
      <div className="bg-gray-900 text-white py-20">
        <div className="max-w-4xl mx-auto px-6 lg:px-12">
          <h2 className="text-3xl font-bold mb-8 text-center">Coverage Details</h2>
          
          <div className="space-y-6">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="flex items-center gap-3 mb-3">
                <DollarSign className="w-6 h-6 text-blue-400" />
                <h3 className="text-xl font-bold">Deductible</h3>
              </div>
              <p className="text-gray-300">
                Zero deductible for most claims. Owner assumes first ₫2,000,000 for minor damages under ₫5,000,000.
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="flex items-center gap-3 mb-3">
                <FileText className="w-6 h-6 text-blue-400" />
                <h3 className="text-xl font-bold">Coverage Limit</h3>
              </div>
              <p className="text-gray-300">
                Up to ₫500,000,000 per incident for vehicle damage and third-party liability. Medical coverage up to ₫100,000,000 per person.
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="flex items-center gap-3 mb-3">
                <AlertCircle className="w-6 h-6 text-blue-400" />
                <h3 className="text-xl font-bold">Exclusions</h3>
              </div>
              <p className="text-gray-300">
                Not covered: DUI/DWI incidents, racing, off-road use, intentional damage, unlisted drivers, expired documentation.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Support */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-20">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl p-12 text-white text-center">
          <Phone className="w-16 h-16 mx-auto mb-6" />
          <h2 className="text-4xl font-bold mb-4">Have Questions About Coverage?</h2>
          <p className="text-xl text-blue-50 mb-8 max-w-2xl mx-auto">
            Our insurance specialists are available 24/7 to answer your questions and help with claims.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a
              href="tel:+84353906610"
              className="px-8 py-4 bg-white text-blue-600 rounded-xl font-bold hover:bg-gray-100 transition text-lg"
            >
              📞 +84 353 906 610
            </a>
            <a
              href="mailto:insurance@golocal.vn"
              className="px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-xl font-semibold hover:bg-white/20 transition"
            >
              ✉️ insurance@golocal.vn
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
