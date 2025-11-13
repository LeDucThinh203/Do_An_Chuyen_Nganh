import React, { useState, useRef, useEffect } from 'react';
import Session from '../../Session/session';
import './ChatWidget.css';

const ChatWidget = () => {
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
  const [sessionId] = useState(() => `chat-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const messagesEndRef = useRef(null);

  // Auto scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setIsMinimized(false);
    }
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
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

      // Call AI API (Backend runs on port 3006, route is /ai/chat not /api/ai/chat)
      const response = await fetch('http://localhost:3006/ai/chat', {
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
    <div className="chat-widget-container">
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
                <h3>AI Trợ Lý</h3>
                <span className="chat-status">Online</span>
              </div>
            </div>
            <div className="chat-actions">
              <button 
                className="chat-action-btn" 
                onClick={toggleMinimize}
                title={isMinimized ? "Phóng to" : "Thu nhỏ"}
              >
                {isMinimized ? (
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 13H5v-2h14v2z"/>
                  </svg>
                )}
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
                      <p>{message.text}</p>
                      
                      {/* Hiển thị hình ảnh sản phẩm nếu có */}
                      {message.products && message.products.length > 0 && (
                        <div className="message-products">
                          {message.products.map((product, pIndex) => (
                            <div key={pIndex} className="product-card" style={{ 
                              display: 'flex', 
                              flexDirection: 'column',
                              gap: '8px',
                              padding: '12px',
                              border: '1px solid #e0e0e0',
                              borderRadius: '8px',
                              backgroundColor: '#fff'
                            }}>
                              {product.image && (
                                <img 
                                  src={product.image} 
                                  alt={product.name}
                                  className="product-image"
                                  style={{
                                    width: '100%',
                                    height: 'auto',
                                    borderRadius: '6px',
                                    objectFit: 'cover'
                                  }}
                                  onError={(e) => {
                                    console.error('Image load error:', product.image);
                                    e.target.style.display = 'none';
                                  }}
                                />
                              )}
                              <div className="product-info" style={{ padding: '4px 0' }}>
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
      {!isOpen && (
        <button className="chat-toggle-btn" onClick={toggleChat}>
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
            <path d="M7 9h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z"/>
          </svg>
          <span className="chat-badge">AI</span>
        </button>
      )}
    </div>
  );
};

export default ChatWidget;
