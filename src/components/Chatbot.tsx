import { useState, useRef, useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';
import { chatbotAPI } from '../utils/api';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { buildChatbotContext, formatContextForAPI, type ChatbotContext } from '../utils/chatbotContext';
import claudeLogo from '../assets/img/claude_logo.png';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  source?: 'gemini-api' | 'rule-based';
}

export default function Chatbot() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const location = useLocation();
  const params = useParams();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! 👋 I\'m the GoLocal assistant powered by Gemini AI. I can help you:\n\n✅ Find suitable rental vehicles\n✅ Suggest tourist destinations\n✅ Create detailed itineraries\n✅ Advise on prices and promotions\n\nWhat would you like me to help with? 🚗🗺️',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{ city: string; lat: number; lng: number } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get user's geolocation on component mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          console.log('📍 User location:', latitude, longitude);
          
          // Try to get city name from coordinates with timeout and retry
          try {
            // OPTIMIZATION: Add timeout and retry logic
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout
            
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
              { 
                headers: { 'Accept-Language': 'vi' },
                signal: controller.signal
              }
            );
            clearTimeout(timeoutId);
            
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            const city = data.address?.city || data.address?.town || data.address?.province || 'Unknown';
            
            setUserLocation({
              city: city,
              lat: latitude,
              lng: longitude
            });
            console.log('🏙️ Detected city:', city);
          } catch (error) {
            // Silently fail - don't log to console to reduce noise
            // Fallback to coordinates only
            setUserLocation({
              city: 'Current Location',
              lat: latitude,
              lng: longitude
            });
          }
        },
        (error) => {
          console.log('📍 Geolocation denied, using default:', error);
          // Fallback to default location (Ho Chi Minh City)
          setUserLocation({
            city: 'Ho Chi Minh City',
            lat: 10.7769,
            lng: 106.7009
          });
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 }
      );
    } else {
      console.log('Geolocation not supported, using default location');
      setUserLocation({
        city: 'Thành phố Hồ Chí Minh',
        lat: 10.7769,
        lng: 106.7009
      });
    }
  }, []);

  // Auto-scroll disabled - user wants to keep scroll position
  // const scrollToBottom = () => {
  //   messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  // };

  // useEffect(() => {
  //   scrollToBottom();
  // }, [messages]);

  const handleClearChat = async () => {
    // Clear frontend messages
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: '✨ Chat and cache cleared! 🔄\n\nHello! 👋 I\'m the GoLocal assistant powered by Gemini AI. I can help you:\n\n✅ Find suitable rental vehicles\n✅ Suggest tourist destinations\n✅ Create detailed itineraries\n✅ Advise on prices and promotions\n\nWhat would you like me to help with? 🚗🗺️',
        timestamp: new Date(),
      },
    ]);

    // Clear backend cache/conversation
    try {
      await chatbotAPI.clearConversation();
      console.log('✅ Backend conversation cache cleared');
    } catch (error) {
      console.error('Failed to clear backend cache:', error);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    // Check for /clear command
    if (input.trim().toLowerCase() === '/clear') {
      handleClearChat();
      setInput('');
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Build comprehensive context
      const context = buildChatbotContext(
        user,
        location,
        params,
        messages,
        {
          // Could add viewingVehicle/viewingPlace here if needed
        }
      );
      
      // Add user location to context
      context.user_location = userLocation || { 
        city: 'Ho Chi Minh City', 
        lat: 10.7769, 
        lng: 106.7009 
      };
      
      // Format context for API
      const apiContext = formatContextForAPI(context);
      
      // Call backend v2 chatbot endpoint with comprehensive context
      const response = await chatbotAPI.chat(input, apiContext);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data.response,
        timestamp: new Date(),
        source: response.data.source, // 'gemini-api' or 'rule-based'
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '😅 Sorry, I encountered an issue. Please try asking again!',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickReplies = [
    '🏍️ Find cheap motorbikes',
    '🏖️ Suggest beautiful beaches',
    '🍜 Good restaurants',
    '📅 Create 3-day itinerary',
  ];

  return (
    <>
      {/* Floating Button - Tesla style */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-[100] bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-full p-4 shadow-2xl transition-all duration-300 hover:scale-110 hover:bg-gray-800 dark:hover:bg-gray-200"
          aria-label="Open chatbot"
        >
          <MessageCircle size={28} />
          <span className="absolute -top-1 -right-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold">
            AI
          </span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className={`fixed bottom-6 right-6 z-[100] w-96 h-[600px] rounded-2xl shadow-2xl flex flex-col overflow-hidden ${
          theme === 'dark' ? 'bg-gray-800' : 'bg-white'
        }`}>
          {/* Header - Tesla style */}
          <div className="bg-gray-900 dark:bg-gray-100 dark:text-gray-900 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center overflow-hidden p-1">
                  <img src={claudeLogo} alt="Claude AI" className="w-full h-full object-contain" />
                </div>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
              </div>
              <div>
                <h3 className="font-semibold">NHLuong Bot - GoLocal</h3>
                <p className="text-xs text-gray-300 dark:text-gray-600">Always ready to help</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleClearChat}
                className="hover:bg-white/20 p-2 rounded-lg transition-colors"
                title="Xóa lịch sử chat"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18"></path>
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                </svg>
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="hover:bg-white/20 p-2 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${
            theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
          }`}>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-gray-900 dark:bg-gray-100 dark:text-gray-900 text-white'
                      : theme === 'dark'
                      ? 'bg-gray-800 text-gray-100 shadow-md border border-gray-700'
                      : 'bg-white text-gray-800 shadow-md border border-gray-200'
                  }`}
                >
                  <p className="text-sm whitespace-pre-line">{message.content}</p>
                  <span
                    className={`text-xs mt-1 block ${
                      message.role === 'user' ? 'text-gray-300 dark:text-gray-600' : 'text-gray-500'
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className={`rounded-2xl px-4 py-3 shadow-md flex items-center gap-2 ${
                  theme === 'dark' ? 'bg-gray-800 text-gray-100 border border-gray-700' : 'bg-white text-gray-800 border border-gray-200'
                }`}>
                  <Loader2 size={16} className="animate-spin" />
                  <span className="text-sm">Thinking...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Replies */}
          {messages.length <= 2 && (
            <div className={`px-4 py-2 border-t ${
              theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
            }`}>
              <p className={`text-xs mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Gợi ý nhanh:</p>
              <div className="flex flex-wrap gap-2">
                {quickReplies.map((reply, index) => (
                  <button
                    key={index}
                    onClick={() => setInput(reply)}
                    className={`text-xs px-3 py-1 rounded-full transition-colors font-normal ${
                      theme === 'dark' 
                        ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                    }`}
                  >
                    {reply}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className={`p-4 border-t ${
            theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
          }`}>
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter message..."
                className={`flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 text-sm ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="bg-gray-900 dark:bg-gray-100 dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-white p-2 rounded-full transition-colors"
              >
                <Send size={20} />
              </button>
            </div>
            <p className={`text-xs mt-2 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
              💡 Tips: Type <span className={`font-mono ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>/clear</span> to clear chat history
            </p>
          </div>
        </div>
      )}
    </>
  );
}
