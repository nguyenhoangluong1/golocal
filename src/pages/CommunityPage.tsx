import { Users, Heart, MessageCircle, Star, AlertTriangle, ThumbsUp } from 'lucide-react';

export default function CommunityPage() {
  const guidelines = [
    {
      icon: Heart,
      title: 'Be Respectful',
      description: 'Treat everyone with courtesy and kindness. Discrimination, harassment, or hate speech will not be tolerated.'
    },
    {
      icon: MessageCircle,
      title: 'Communicate Clearly',
      description: 'Respond promptly to messages. Set clear expectations about vehicle condition, pickup/dropoff, and policies.'
    },
    {
      icon: ThumbsUp,
      title: 'Honor Commitments',
      description: 'Follow through on bookings. Cancellations should be rare and done with proper notice and communication.'
    },
    {
      icon: Star,
      title: 'Leave Honest Reviews',
      description: 'Write truthful, constructive reviews. Focus on facts and your experience to help other community members.'
    },
    {
      icon: AlertTriangle,
      title: 'Report Issues',
      description: 'If you encounter problems or policy violations, report them immediately so we can take appropriate action.'
    },
    {
      icon: Users,
      title: 'Build Trust',
      description: 'Verify your identity, maintain accurate listings, and be transparent about vehicle condition and requirements.'
    }
  ];

  const expectedBehaviors = [
    {
      category: 'For Renters',
      dos: [
        'Return vehicles clean and with the agreed fuel level',
        'Report any damages or issues immediately',
        'Respect the owner\'s property and rules',
        'Drive safely and follow all traffic laws',
        'Be punctual for pickup and return times'
      ],
      donts: [
        'Smoke in vehicles (unless explicitly allowed)',
        'Allow unauthorized drivers to use the vehicle',
        'Exceed mileage limits or take vehicles out of approved areas',
        'Delay reporting accidents or damages',
        'Leave personal belongings in the vehicle'
      ]
    },
    {
      category: 'For Owners',
      dos: [
        'Maintain vehicles in excellent working condition',
        'Provide accurate descriptions and photos',
        'Be available and responsive to renter questions',
        'Conduct thorough inspections before and after trips',
        'Keep insurance and registration current'
      ],
      donts: [
        'Cancel confirmed bookings without valid reason',
        'Misrepresent vehicle condition or features',
        'Deny refunds when required by policy',
        'Discriminate based on personal characteristics',
        'Pressure renters for positive reviews'
      ]
    }
  ];

  const violations = [
    {
      type: 'Minor Violations',
      examples: 'Late response, unclear communication, minor cleanliness issues',
      action: 'Warning and education on community standards'
    },
    {
      type: 'Moderate Violations',
      examples: 'Repeated cancellations, inaccurate listings, unprofessional behavior',
      action: 'Temporary suspension and required compliance training'
    },
    {
      type: 'Severe Violations',
      examples: 'Fraud, safety violations, harassment, discrimination, illegal activity',
      action: 'Immediate permanent ban from the platform'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-purple-600 to-pink-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 text-center">
          <Users className="w-16 h-16 mx-auto mb-6" />
          <h1 className="text-5xl lg:text-6xl font-bold mb-6">
            Community Guidelines
          </h1>
          <p className="text-xl lg:text-2xl text-purple-50 max-w-3xl mx-auto">
            GoLocal thrives because of our amazing community. These guidelines help keep our platform safe, respectful, and enjoyable for everyone.
          </p>
        </div>
      </div>

      {/* Core Guidelines */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Our Core Values
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Principles that guide our community
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {guidelines.map((guideline, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition"
            >
              <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mb-6">
                <guideline.icon className="w-7 h-7 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                {guideline.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {guideline.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Expected Behaviors */}
      <div className="bg-white dark:bg-gray-800 py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Expected Behaviors
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Do's and don'ts for our community members
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {expectedBehaviors.map((behavior, index) => (
              <div key={index}>
                <div className="bg-gradient-to-br from-purple-600 to-pink-600 text-white rounded-2xl p-6 mb-6">
                  <h3 className="text-2xl font-bold">{behavior.category}</h3>
                </div>

                <div className="space-y-6">
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <ThumbsUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                      <h4 className="text-lg font-bold text-gray-900 dark:text-white">Do's</h4>
                    </div>
                    <div className="space-y-3">
                      {behavior.dos.map((item, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
                          <p className="text-gray-700 dark:text-gray-300">{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                      <h4 className="text-lg font-bold text-gray-900 dark:text-white">Don'ts</h4>
                    </div>
                    <div className="space-y-3">
                      {behavior.donts.map((item, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <span className="text-red-600 dark:text-red-400 font-bold">✗</span>
                          <p className="text-gray-700 dark:text-gray-300">{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Enforcement */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Enforcement & Consequences
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            How we handle guideline violations
          </p>
        </div>

        <div className="space-y-6">
          {violations.map((violation, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-2xl p-8 border-l-4 border-purple-600 dark:border-purple-400"
            >
              <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
                <div className="md:w-1/4">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {violation.type}
                  </h3>
                </div>
                <div className="md:w-2/5">
                  <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                    Examples
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">{violation.examples}</p>
                </div>
                <div className="md:w-1/3">
                  <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                    Action Taken
                  </p>
                  <p className="text-gray-900 dark:text-white font-semibold">{violation.action}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-2xl p-8 border border-orange-200 dark:border-orange-800">
          <div className="flex items-start gap-4">
            <AlertTriangle className="w-8 h-8 text-orange-600 dark:text-orange-400 flex-shrink-0" />
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Zero Tolerance Policy
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We have zero tolerance for fraud, harassment, discrimination, or any behavior that compromises safety. Such violations result in immediate permanent removal from the platform and may be reported to law enforcement.
              </p>
              <p className="text-gray-600 dark:text-gray-400 italic">
                If you witness or experience any serious violations, please report them immediately to support@golocal.vn
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-gradient-to-br from-purple-900 to-pink-900 text-white py-20">
        <div className="max-w-4xl mx-auto px-6 lg:px-12 text-center">
          <Heart className="w-16 h-16 mx-auto mb-6" />
          <h2 className="text-4xl font-bold mb-6">Together We Build Trust</h2>
          <p className="text-xl text-purple-100 leading-relaxed mb-8">
            Every interaction on GoLocal is an opportunity to build trust and strengthen our community. By following these guidelines, you help create a platform where everyone feels safe, respected, and valued. Thank you for being part of our journey.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:nghoangluong28092004@gmail.com"
              className="px-8 py-4 bg-white text-purple-600 rounded-xl font-bold hover:bg-gray-100 transition"
            >
              Contact Community Team
            </a>
            <a
              href="/support"
              className="px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-xl font-semibold hover:bg-white/20 transition"
            >
              Report an Issue
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
