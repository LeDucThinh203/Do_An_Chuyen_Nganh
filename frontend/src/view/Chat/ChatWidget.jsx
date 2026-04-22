import React, { useState, useRef, useEffect } from 'react';
import Session from '../../Session/session';
import { clearMyAiHistory } from '../../api';
import './ChatWidget.css';

const API_BASE_URL = process.env.NODE_ENV === 'development'
  ? ''
  : (process.env.REACT_APP_API_URL || '').replace(/\/$/, '');
const AI_CHAT_API_URL = `${API_BASE_URL}/ai/chat`;

// Resolve image URL for products
const resolveImage = (img) => {
  if (!img) return '/images/placeholder.png';
  const trimmed = String(img).trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  if (trimmed.startsWith('/')) {
    const parts = trimmed.split('/');
    return parts.map((part, idx) => idx === 0 ? part : encodeURIComponent(part)).join('/');
  }
  return `/images/${encodeURIComponent(trimmed)}`;
};

const ChatWidget = ({ onModeChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      text: 'Xin chào! Tôi là trợ lý AI. Tôi có thể giúp gì cho bạn?',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [sessionId, setSessionId] = useState(() => `chat-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const messagesEndRef = useRef(null);

  const initialBotMessage = {
    type: 'bot',
    text: 'Xin chào! Tôi là trợ lý AI. Tôi có thể giúp gì cho bạn?',
    timestamp: new Date()
  };

  // Auto scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Scroll to bottom when chat is opened
  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [isOpen]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setIsMinimized(false);
    }
  };

  // Reset chat - create new session and clear all messages
  const handleNewChat = () => {
    const newSessionId = `chat-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setSessionId(newSessionId);
    setMessages([{ ...initialBotMessage, timestamp: new Date() }]);
    setInputMessage('');
    console.log(`[Chat] New chat session started: ${newSessionId}`);
  };

  const handleClearHistory = async () => {
    if (isClearing) return;
    if (!Session.isLoggedIn()) {
      alert('Bạn cần đăng nhập để xóa lịch sử chat AI.');
      return;
    }

    const ok = window.confirm('Bạn có chắc muốn xóa toàn bộ lịch sử chat AI của tài khoản này?');
    if (!ok) return;

    setIsClearing(true);
    try {
      await clearMyAiHistory();
      const newSessionId = `chat-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setSessionId(newSessionId);
      setMessages([{ ...initialBotMessage, timestamp: new Date() }]);
      setInputMessage('');
      alert('Đã xóa lịch sử chat AI thành công.');
    } catch (error) {
      alert(error.message || 'Xóa lịch sử chat AI thất bại.');
    } finally {
      setIsClearing(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      type: 'user',
      text: inputMessage,
      timestamp: new Date()
    };

    setMessages([...messages, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Get user info if logged in
      const user = Session.getUser();
      const userId = user?.id || null;

      // Call AI API via configurable backend URL for local/dev/prod environments.
      const response = await fetch(AI_CHAT_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage,
          userId: userId,
          sessionId: sessionId,
          fast: true // Enable fast mode for better response time
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('API Response:', data); // Debug log

      const botMessage = {
        type: 'bot',
        text: data.text || data.response || 'Xin lỗi, tôi không thể trả lời lúc này.',
        timestamp: new Date(),
        products: data.context?.products || [] // Lưu thông tin sản phẩm
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        type: 'bot',
        text: 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="fixed right-3 md:right-24 bottom-6 z-[1200]">
      {!isOpen && onModeChange && (
        <div className="absolute right-16 bottom-1 flex items-center gap-1 rounded-full border border-slate-200 bg-white/95 p-1 shadow-lg backdrop-blur">
          <button
            type="button"
            className="rounded-full bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white"
            onClick={() => onModeChange('ai')}
            aria-pressed
          >
            AI Chat
          </button>
          <button
            type="button"
            className="rounded-full px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            onClick={() => onModeChange('support')}
          >
            CSKH
          </button>
        </div>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className={`chat-window ${isMinimized ? 'minimized' : ''}`}>
          {/* Header */}
          <div className="chat-header">
            <div className="chat-header-content">
              <div className="chat-avatar">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                  <circle cx="8.5" cy="10.5" r="1.5"/>
                  <circle cx="15.5" cy="10.5" r="1.5"/>
                  <path d="M12 17.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
                </svg>
              </div>
              <div className="chat-title">
                <h3>Chat AI</h3>
                <span className="chat-status">Online</span>
              </div>
            </div>
            <div className="chat-actions">
              <button
                className="chat-action-btn"
                onClick={handleClearHistory}
                title="Xóa lịch sử chat AI"
                disabled={isClearing}
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 3h6l1 2h4v2H4V5h4l1-2zm1 6h2v9h-2V9zm4 0h2v9h-2V9zM8 9h2v9H8V9z" />
                </svg>
              </button>
              <button 
                className="chat-action-btn" 
                onClick={handleNewChat}
                title="Tạo đoạn chat mới"
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                </svg>
              </button>
              <button 
                className="chat-action-btn" 
                onClick={toggleChat}
                title="Đóng"
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Messages Container */}
          {!isMinimized && (
            <>
              <div className="chat-messages">
                {messages.map((message, index) => (
                  <div key={index} className={`message ${message.type}`}>
                    <div className="message-content">
                      <p style={{ whiteSpace: 'pre-line' }}>{message.text}</p>
                      
                      {/* Hiển thị hình ảnh sản phẩm nếu có */}
                      {message.products && message.products.length > 0 && (
                        <div className="message-products">
                          {message.products.map((product, pIndex) => (
                            <div key={pIndex} className="product-card">
                              {product.image && (
                                <img 
                                  src={resolveImage(product.image)} 
                                  alt={product.name}
                                  className="product-image"
                                  onError={(e) => {
                                    console.error('Image load error:', product.image);
                                    e.target.style.display = 'none';
                                  }}
                                />
                              )}
                              <div className="product-info">
                                <h4 style={{ 
                                  margin: '0 0 8px 0',
                                  fontSize: '0.95em',
                                  color: '#333',
                                  lineHeight: '1.3'
                                }}>{product.name}</h4>
                                <div className="product-price" style={{ marginTop: '6px' }}>
                                  {product.discount_percent > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span style={{ 
                                          textDecoration: 'line-through', 
                                          color: '#999', 
                                          fontSize: '0.85em'
                                        }}>
                                          {product.price?.toLocaleString('vi-VN')}đ
                                        </span>
                                        <span style={{ 
                                          backgroundColor: '#ff4444', 
                                          color: 'white', 
                                          padding: '2px 8px', 
                                          borderRadius: '12px',
                                          fontSize: '0.8em',
                                          fontWeight: 'bold'
                                        }}>
                                          -{product.discount_percent}%
                                        </span>
                                      </div>
                                      <span style={{ 
                                        color: '#ff4444', 
                                        fontWeight: 'bold',
                                        fontSize: '1.15em'
                                      }}>
                                        {Math.round(product.price * (100 - product.discount_percent) / 100).toLocaleString('vi-VN')}đ
                                      </span>
                                    </div>
                                  ) : (
                                    <span style={{ 
                                      fontWeight: 'bold',
                                      fontSize: '1.1em',
                                      color: '#333'
                                    }}>
                                      {product.price?.toLocaleString('vi-VN')}đ
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <span className="message-time">
                        {formatTime(message.timestamp)}
                      </span>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="message bot">
                    <div className="message-content">
                      <div className="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="chat-input-container">
                <textarea
                  className="chat-input"
                  placeholder="Nhập tin nhắn..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  rows="1"
                  disabled={isLoading}
                />
                <button 
                  className="chat-send-btn" 
                  onClick={handleSendMessage}
                  disabled={isLoading || !inputMessage.trim()}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                  </svg>
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Floating Chat Button */}
      <button
        type="button"
        className="group relative w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-[0_12px_28px_rgba(37,99,235,0.42)] ring-4 ring-white hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center"
        onClick={toggleChat}
        title={isOpen ? 'Đóng chat AI' : 'Mở chat AI'}
        aria-expanded={isOpen}
      >
        <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-white" aria-hidden="true" />
        <span className="flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 opacity-95" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8L12 3z" />
          </svg>
          <span className="text-xs font-extrabold tracking-wide leading-none">AI</span>
        </span>
      </button>
    </div>
  );
};

export default ChatWidget;
