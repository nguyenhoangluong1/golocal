import { Shield, Phone, Mail, MessageCircle, Clock, MapPin } from 'lucide-react';

export default function SupportPage() {
  const contactMethods = [
    {
      icon: Phone,
      title: '24/7 Phone Support',
      description: 'Call us anytime for urgent assistance',
      action: '+84 353 906 610',
      link: 'tel:+84353906610'
    },
    {
      icon: Mail,
      title: 'Email Support',
      description: 'Get help via email within 24 hours',
      action: 'support@golocal.vn',
      link: 'mailto:support@golocal.vn'
    },
    {
      icon: MessageCircle,
      title: 'Live Chat',
      description: 'Chat with our support team instantly',
      action: 'Start Chat',
      link: '#'
    }
  ];

  const faqCategories = [
    {
      title: 'Booking & Rentals',
      questions: [
        {
          q: 'How do I book a vehicle?',
          a: 'Search for vehicles, select your dates, and click "Book Now". Complete payment to confirm your reservation.'
        },
        {
          q: 'Can I modify my booking?',
          a: 'Yes, go to "My Trips", select your booking, and click "Modify". Changes are subject to vehicle availability and owner approval.'
        },
        {
          q: 'What documents do I need?',
          a: 'You need a valid driver\'s license, national ID or passport, and a credit/debit card for payment and deposit.'
        }
      ]
    },
    {
      title: 'Payment & Pricing',
      questions: [
        {
          q: 'What payment methods do you accept?',
          a: 'We accept Visa, Mastercard, domestic bank cards, and popular e-wallets like MoMo and ZaloPay.'
        },
        {
          q: 'When will I be charged?',
          a: 'Payment is processed immediately upon booking confirmation. Refunds for cancellations follow the owner\'s cancellation policy.'
        },
        {
          q: 'Are there any additional fees?',
          a: 'The price includes basic insurance. Optional extras like GPS, child seats, or additional drivers may incur extra charges.'
        }
      ]
    },
    {
      title: 'Insurance & Safety',
      questions: [
        {
          q: 'Is insurance included?',
          a: 'Yes, all rentals include comprehensive insurance covering vehicle damage, theft, and third-party liability.'
        },
        {
          q: 'What happens in case of an accident?',
          a: 'Contact us immediately at +84 353 906 610. Document the incident, exchange information, and we\'ll guide you through the claims process.'
        },
        {
          q: 'Who is liable for traffic violations?',
          a: 'The renter is responsible for all traffic violations, fines, and penalties incurred during the rental period.'
        }
      ]
    },
    {
      title: 'For Vehicle Owners',
      questions: [
        {
          q: 'How do I list my vehicle?',
          a: 'Click "Host Your Vehicle", create an account, and follow the step-by-step process to add your vehicle details and photos.'
        },
        {
          q: 'How much can I earn?',
          a: 'Earnings vary by vehicle type, location, and demand. On average, owners earn ₫5-15 million per month.'
        },
        {
          q: 'When do I get paid?',
          a: 'Payments are transferred to your bank account within 24 hours after each trip ends successfully.'
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-cyan-600 to-blue-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 text-center">
          <Shield className="w-16 h-16 mx-auto mb-6" />
          <h1 className="text-5xl lg:text-6xl font-bold mb-6">
            Help Center
          </h1>
          <p className="text-xl lg:text-2xl text-cyan-50 max-w-3xl mx-auto">
            We're here to help 24/7. Find answers to common questions or contact our support team.
          </p>
        </div>
      </div>

      {/* Contact Methods */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Get in Touch
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Choose your preferred way to reach us
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {contactMethods.map((method, index) => (
            <a
              key={index}
              href={method.link}
              className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition text-center group"
            >
              <div className="w-16 h-16 bg-cyan-100 dark:bg-cyan-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition">
                <method.icon className="w-8 h-8 text-cyan-600 dark:text-cyan-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {method.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {method.description}
              </p>
              <p className="text-cyan-600 dark:text-cyan-400 font-semibold">
                {method.action}
              </p>
            </a>
          ))}
        </div>

        {/* Office Location */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-12 text-white mb-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <MapPin className="w-12 h-12 mb-6" />
              <h3 className="text-3xl font-bold mb-4">Visit Our Office</h3>
              <p className="text-gray-300 text-lg mb-6">
                36 Le Loi, District 1, Ho Chi Minh City
              </p>
              <div className="space-y-3 text-gray-300">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5" />
                  <span>Monday - Friday: 8:00 AM - 8:00 PM</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5" />
                  <span>Saturday - Sunday: 9:00 AM - 6:00 PM</span>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <h4 className="text-xl font-bold mb-4">Quick Response</h4>
              <p className="text-gray-300 mb-6">
                Our support team typically responds within:
              </p>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <span>Phone Support</span>
                  <span className="font-bold">Immediate</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <span>Live Chat</span>
                  <span className="font-bold">1-2 minutes</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <span>Email</span>
                  <span className="font-bold">24 hours</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-white dark:bg-gray-800 py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Find quick answers to common questions
            </p>
          </div>

          <div className="space-y-12">
            {faqCategories.map((category, index) => (
              <div key={index}>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  {category.title}
                </h3>
                <div className="space-y-4">
                  {category.questions.map((item, qIndex) => (
                    <details
                      key={qIndex}
                      className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700 group"
                    >
                      <summary className="font-semibold text-gray-900 dark:text-white cursor-pointer list-none flex items-center justify-between">
                        <span>{item.q}</span>
                        <span className="text-cyan-600 dark:text-cyan-400 group-open:rotate-180 transition">
                          ▼
                        </span>
                      </summary>
                      <p className="mt-4 text-gray-600 dark:text-gray-400 leading-relaxed">
                        {item.a}
                      </p>
                    </details>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
