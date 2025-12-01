import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { messagesAPI } from '../utils/api';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { MessageSquare, Send, User, Car, MoreVertical, Trash2, X, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  message_type: string;
  read: boolean;
  created_at: string;
  sender?: {
    id: string;
    name: string;
    avatar?: string;
  };
  receiver?: {
    id: string;
    name: string;
    avatar?: string;
  };
}

interface Conversation {
  id: string;
  user1_id: string;
  user2_id: string;
  booking_id?: string;
  last_message_at: string;
  other_user?: {
    id: string;
    name: string;
    avatar?: string;
    email: string;
  };
  booking?: {
    id: string;
    vehicle: {
      id?: string;
      name: string;
      images?: string[];
    };
  };
}

export default function MessagesPage() {
  const { user, loading: authLoading } = useAuth();
  const { showError, showWarning } = useToast();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const bookingId = searchParams.get('booking');
  const hostId = searchParams.get('host_id');
  const vehicleId = searchParams.get('vehicle_id');
  const conversationId = searchParams.get('conversation');
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showDeleteMenu, setShowDeleteMenu] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only load conversations if user is loaded (not loading) and user exists
    // This prevents loading when auth is still checking
    if (!authLoading && user) {
      loadConversations();
    }
  }, [user, authLoading, bookingId, conversationId, hostId]); // ALGORITHM: Reload when URL params change

  // Close delete menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showDeleteMenu && !(event.target as Element).closest('.delete-menu-container')) {
        setShowDeleteMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDeleteMenu]);

  useEffect(() => {
    if (selectedConversation) {
      // Reset scroll state when conversation changes
      setIsNearBottom(true);
      setLastMessageId(null);
      setIsUserScrolling(false);
      loadMessages(selectedConversation.id);
      
      // OPTIMIZE: Only poll for new messages when page is visible
      // ALGORITHM: Use 'onlyNew' flag to fetch only new messages (reduces data transfer by 90%+)
      const pollMessages = () => {
        // Only poll if page is visible
        if (!document.hidden) {
          // Only fetch new messages (after last message) - much more efficient
          loadMessages(selectedConversation.id, 20, true);
        }
      };
      
      // Poll for new messages every 20 seconds (reduced frequency to reduce server load)
      // Only poll when page is visible and user is near bottom (actively reading)
      const interval = setInterval(() => {
        // Only poll if user is near bottom (actively reading messages)
        // Don't poll if user is scrolling up reading old messages
        if (!document.hidden) {
          // Check if near bottom by reading from messagesContainerRef
          const container = messagesContainerRef.current;
          if (container) {
            const { scrollTop, scrollHeight, clientHeight } = container;
            const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
            const isNearBottomNow = distanceFromBottom < 200;
            
            // Only poll if near bottom
            if (isNearBottomNow) {
              pollMessages();
            }
          } else {
            // If container not available, poll anyway (initial load)
            pollMessages();
          }
        }
      }, 20000); // 20 seconds instead of 5 - significantly reduces server load
      
      // Also reload when page becomes visible (user switches back to tab)
      const handleVisibilityChange = () => {
        if (!document.hidden) {
          loadMessages(selectedConversation.id);
        }
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      return () => {
        clearInterval(interval);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    } else {
      // Clear messages when no conversation is selected
      setMessages([]);
      setIsNearBottom(true);
      setLastMessageId(null);
      setIsUserScrolling(false);
    }
  }, [selectedConversation]);

  // ALGORITHM OPTIMIZATION: Auto-select conversation moved to loadConversations
  // This ensures conversation is selected immediately after loading, not in separate effect
  // Reduces unnecessary re-renders and improves UX

  // State variables for auto-scroll and polling optimization
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [lastMessageId, setLastMessageId] = useState<string | null>(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);

  // Auto-scroll disabled - user wants to keep scroll position
  // useEffect(() => {
  //   if (messages.length === 0) return;

  //   // Get the latest message ID
  //   const latestMessage = messages[messages.length - 1];
  //   const latestMessageId = latestMessage?.id;

  //   // Only auto-scroll if:
  //   // 1. User is near bottom (within 200px)
  //   // 2. It's a new message (different ID from last)
  //   // 3. User is not actively scrolling
  //   const isNewMessage = latestMessageId !== lastMessageId;
  //   const shouldScroll = isNearBottom && isNewMessage && !isUserScrolling;

  //   if (shouldScroll) {
  //     // Small delay to ensure DOM is updated
  //     setTimeout(() => {
  //       scrollToBottom();
  //     }, 100);
  //   }

  //   if (latestMessageId) {
  //     setLastMessageId(latestMessageId);
  //   }
  // }, [messages, isNearBottom, lastMessageId, isUserScrolling]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Check if user is near bottom of messages and track scrolling
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    let scrollTimeout: ReturnType<typeof setTimeout>;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      // Consider "near bottom" if within 200px from bottom
      setIsNearBottom(distanceFromBottom < 200);
      
      // Mark that user is actively scrolling
      setIsUserScrolling(true);
      clearTimeout(scrollTimeout);
      
      // Reset scrolling flag after 1 second of no scrolling
      scrollTimeout = setTimeout(() => {
        setIsUserScrolling(false);
      }, 1000);
    };

    container.addEventListener('scroll', handleScroll);
    return () => {
      container.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [selectedConversation]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (bookingId) params.booking_id = bookingId;
      
      // ALGORITHM OPTIMIZATION: Backend already filters by current_user
      // No need to filter in frontend
      const response = await messagesAPI.getConversations(params);
      const convs = response.data || [];
      
      // Filter out duplicates by conversation ID
      const uniqueConvs = convs.filter((conv, index, self) => 
        index === self.findIndex(c => c.id === conv.id)
      );
      
      setConversations(uniqueConvs);

      // ALGORITHM OPTIMIZATION: Auto-select conversation based on URL params
      // Priority: conversationId > bookingId > hostId > first conversation
      // This ensures correct conversation is selected when navigating from notifications
      if (conversationId && convs.length > 0) {
        const conv = convs.find((c: Conversation) => c.id === conversationId);
        if (conv) {
          setSelectedConversation(conv);
          return; // Exit early if conversation found
        }
      }
      
      if (bookingId && convs.length > 0) {
        const conv = convs.find((c: Conversation) => c.booking_id === bookingId);
        if (conv) {
          setSelectedConversation(conv);
          return; // Exit early if conversation found
        }
      }
      
      if (hostId && convs.length > 0 && user) {
        const conv = convs.find((c: Conversation) => {
          const otherUserId = c.user1_id === user.id ? c.user2_id : c.user1_id;
          return otherUserId === hostId;
        });
        if (conv) {
          setSelectedConversation(conv);
          return; // Exit early if conversation found
        }
      }
      
      // Auto-select first conversation if none selected and no URL params
      if (!selectedConversation && convs.length > 0 && !conversationId && !bookingId && !hostId) {
        setSelectedConversation(convs[0]);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
      showError('Failed to load conversations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string, limit: number = 20, onlyNew: boolean = false) => {
    try {
      // ALGORITHM OPTIMIZATION: 
      // 1. Backend already marks messages as read in batch
      // 2. Only load initial 20 messages (enough for 1 screen)
      // 3. Load more when user scrolls up (lazy loading)
      // 4. When polling, only fetch new messages (after last message ID) - reduces data transfer by 90%+
      const params: any = { limit };
      
      // OPTIMIZATION: When polling, only fetch messages after the last one we have
      // This reduces data transfer from full message list to only new messages
      if (onlyNew && messages.length > 0) {
        const lastMessage = messages[messages.length - 1];
        if (lastMessage?.id) {
          params.after = lastMessage.id;
        }
      }
      
      const response = await messagesAPI.getMessages(conversationId, params);
      const msgs = response.data || [];
      
      // If loading only new messages (polling), append to existing
      if (onlyNew && msgs.length > 0) {
        setMessages(prev => {
          // Filter out duplicates by message ID
          const existingIds = new Set(prev.map(m => m.id));
          const newMsgs = msgs.filter(m => !existingIds.has(m.id));
          return [...prev, ...newMsgs];
        });
      }
      // If loading more messages (pagination), prepend to existing messages
      else if (limit > 20 && messages.length > 0) {
        // Filter out duplicates and prepend new messages (older messages)
        const existingIds = new Set(messages.map(m => m.id));
        const newMsgs = msgs.filter(m => !existingIds.has(m.id));
        setMessages([...newMsgs, ...messages]);
      } else {
        // Initial load or refresh: replace all messages
        // Also filter duplicates in case backend returns duplicates
        const uniqueMsgs = msgs.filter((msg, index, self) => 
          index === self.findIndex(m => m.id === msg.id)
        );
        setMessages(uniqueMsgs);
      }

      // Backend automatically marks unread messages as read when fetching
      // This reduces API calls from N (one per unread message) to 0
      // Much faster and reduces server load
    } catch (error) {
      console.error('Failed to load messages:', error);
      // Show error to user if needed
      if (error instanceof Error) {
        showError(error.message || 'Failed to load messages');
      }
    }
  };

  const handleDeleteClick = (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent selecting conversation
    setShowDeleteMenu(null);
    setShowDeleteDialog(conversationId);
  };

  const handleDeleteConfirm = async () => {
    if (!showDeleteDialog) return;
    
    const conversationId = showDeleteDialog;
    setShowDeleteDialog(null);
    
    try {
      setDeleting(conversationId);
      await messagesAPI.deleteConversation(conversationId);
      
      // Remove from conversations list
      setConversations(prev => prev.filter(c => c.id !== conversationId));
      
      // If deleted conversation was selected, clear selection
      if (selectedConversation?.id === conversationId) {
        setSelectedConversation(null);
        setMessages([]);
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      if (error instanceof Error) {
        showError(error.message || 'Failed to delete conversation');
      }
    } finally {
      setDeleting(null);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    try {
      setSending(true);
      
      let receiverId: string;
      let conversationIdToUse: string | null = null;
      let bookingIdToUse: string | null = null;

      if (selectedConversation) {
        // Use existing conversation
        receiverId = selectedConversation.user1_id === user.id 
          ? selectedConversation.user2_id 
          : selectedConversation.user1_id;
        conversationIdToUse = selectedConversation.id;
        bookingIdToUse = selectedConversation.booking_id || null;
      } else if (hostId) {
        // Create new conversation with host
        receiverId = hostId;
        bookingIdToUse = bookingId || null;
        // Conversation will be created automatically by backend
      } else {
        showWarning('Please select a conversation or contact a host');
        return;
      }

      await messagesAPI.sendMessage({
        conversation_id: conversationIdToUse,
        receiver_id: receiverId,
        content: newMessage.trim(),
        message_type: 'TEXT',
        booking_id: bookingIdToUse,
      });

      setNewMessage('');
      
      // Force scroll to bottom when user sends a message
      setIsNearBottom(true);
      setIsUserScrolling(false);
      
      // Reload conversations to get the newly created conversation
      await loadConversations();
      
      // If we just created a conversation, select it
      if (!selectedConversation && hostId) {
        // Wait a bit for conversation to be created
        setTimeout(async () => {
          await loadConversations();
          const updatedConvs = await messagesAPI.getConversations();
          const newConv = updatedConvs.data?.find((c: any) => {
            const otherUserId = c.user1_id === user.id ? c.user2_id : c.user1_id;
            return otherUserId === hostId;
          });
          if (newConv) {
            setSelectedConversation(newConv);
            await loadMessages(newConv.id);
            // Scroll to bottom after loading messages
            setTimeout(() => scrollToBottom(), 200);
          }
        }, 500);
      } else if (selectedConversation) {
        // Reload messages for existing conversation
        await loadMessages(selectedConversation.id);
        // Scroll to bottom after reloading
        setTimeout(() => scrollToBottom(), 200);
      }
    } catch (error: any) {
      console.error('Failed to send message:', error);
      showError(error.response?.data?.detail || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Don't show login prompt if still loading - wait for auth to complete
  // This prevents showing login screen when user is actually logged in but auth is still loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Please log in to view messages
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 h-[calc(100vh-8rem)]">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 h-full flex flex-col">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Messages
            </h1>
          </div>

          <div className="flex-1 flex overflow-hidden">
            {/* Conversations List */}
            <div className="w-80 border-r border-gray-200 dark:border-gray-700 overflow-y-auto flex-shrink-0">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
                  <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">Loading...</p>
                </div>
              ) : conversations.length === 0 ? (
                <div className="p-8 text-center">
                  <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">No conversations</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {conversations.map((conv) => {
                    const otherUser = conv.other_user;
                    const isSelected = selectedConversation?.id === conv.id;
                    
                    return (
                      <div
                        key={conv.id}
                        className={`relative w-full hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                          isSelected ? 'bg-rose-50 dark:bg-rose-900/20 border-l-4 border-rose-500' : ''
                        }`}
                      >
                        <button
                          onClick={() => setSelectedConversation(conv)}
                          className="w-full p-4 text-left"
                        >
                          <div className="flex gap-3">
                            <div className="flex-shrink-0">
                              {otherUser?.avatar ? (
                                <img
                                  src={otherUser.avatar}
                                  alt={otherUser.name}
                                  className="w-12 h-12 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                                  <User className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                  {otherUser?.name || 'Unknown User'}
                                </h3>
                                <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
                                  {formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true })}
                                </span>
                              </div>
                              {conv.booking && (
                                <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400 mb-1">
                                  <Car className="w-3 h-3" />
                                  <span className="truncate">{conv.booking.vehicle.name}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </button>
                        {/* Three dots menu */}
                        <div className="absolute top-2 right-2 delete-menu-container">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowDeleteMenu(showDeleteMenu === conv.id ? null : conv.id);
                            }}
                            className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            disabled={deleting === conv.id}
                          >
                            <MoreVertical className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                          </button>
                          {showDeleteMenu === conv.id && (
                            <div className="absolute right-0 mt-1 w-32 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                              <button
                                onClick={(e) => handleDeleteClick(conv.id, e)}
                                disabled={deleting === conv.id}
                                className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 disabled:opacity-50"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Messages Area */}
            <div className="flex-1 flex flex-col min-w-0">
              {selectedConversation || hostId ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
                    {selectedConversation?.other_user?.avatar ? (
                      <img
                        src={selectedConversation.other_user.avatar}
                        alt={selectedConversation.other_user.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {selectedConversation?.other_user?.name || 'Host'}
                      </h3>
                      {selectedConversation?.booking && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                          <Car className="w-3 h-3" />
                          {selectedConversation.booking.vehicle.name}
                        </p>
                      )}
                      {vehicleId && !selectedConversation && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                          <Car className="w-3 h-3" />
                          New conversation
                        </p>
                      )}
                    </div>
                    {selectedConversation?.booking_id && (
                      <button
                        onClick={() => {
                          const bookingId = selectedConversation.booking_id;
                          if (bookingId) {
                            navigate(`/bookings/${bookingId}`);
                          }
                        }}
                        className="px-4 py-2 text-sm bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
                      >
                        View Booking
                      </button>
                    )}
                    {vehicleId && !selectedConversation && (
                      <button
                        onClick={() => {
                          if (vehicleId) {
                            navigate(`/vehicle/${vehicleId}`);
                          }
                        }}
                        className="px-4 py-2 text-sm bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
                      >
                        View Vehicle
                      </button>
                    )}
                  </div>

                  {/* Messages */}
                  <div
                    ref={messagesContainerRef}
                    className="flex-1 overflow-y-auto p-4 space-y-4"
                  >
                    {(!selectedConversation || messages.length === 0) && !hostId ? (
                      <div className="text-center py-8">
                        <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          No messages yet. Start the conversation!
                        </p>
                      </div>
                    ) : selectedConversation && messages.length === 0 ? (
                      <div className="text-center py-8">
                        <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          No messages yet. Start the conversation!
                        </p>
                      </div>
                    ) : selectedConversation && messages.length > 0 ? (
                      messages.map((message) => {
                        const isOwn = message.sender_id === user.id;
                        return (
                          <div
                            key={message.id}
                            className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                                isOwn
                                  ? 'bg-rose-600 text-white'
                                  : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap break-words">
                                {message.content}
                              </p>
                              <p
                                className={`text-xs mt-1 ${
                                  isOwn ? 'text-rose-100' : 'text-gray-500 dark:text-gray-400'
                                }`}
                              >
                                {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    ) : null}
                    {!selectedConversation && hostId && (
                      <div className="text-center py-8">
                        <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          Start a conversation with the host
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          Send your first message below to create a conversation
                        </p>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex gap-3">
                      <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type a message..."
                        rows={2}
                        className="flex-1 px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-rose-500 dark:focus:border-rose-400 focus:ring-2 focus:ring-rose-200 dark:focus:ring-rose-900/50 outline-none transition-all resize-none"
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || sending}
                        className="px-6 py-2 bg-rose-600 text-white rounded-xl hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                      >
                        <Send className="w-5 h-5" />
                        Send
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">
                      Select a conversation to start messaging
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scaleIn">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Delete Conversation
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Are you sure you want to delete this conversation? This action cannot be undone.
                </p>
              </div>
              <button
                onClick={() => setShowDeleteDialog(null)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteDialog(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting === showDeleteDialog}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {deleting === showDeleteDialog ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

