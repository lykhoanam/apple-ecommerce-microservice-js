import { useEffect, useState, useRef } from 'react';
import { IoClose } from 'react-icons/io5';
import { PiRobotDuotone } from 'react-icons/pi';
import { FiSend } from 'react-icons/fi';
// import { generateBotResponse } from '../../utils/generateBotResponse';
import './ChatBox.css';

const defaultOptions = [
  'Tìm nước hoa theo tên',
  'Tìm sản phẩm dưới 2 triệu',
  'Tư vấn mùi hương yêu thích',
  'Xem sản phẩm bán chạy',
];

const ChatBox = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [showOptions, setShowOptions] = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const toggleChat = () => setIsOpen((prev) => !prev);

  const createMessage = (from, text) => ({
    from,
    text,
    timestamp: new Date().toISOString(),
  });

  const streamBotReply = (text, delayPerChar = 10) => {
    return new Promise((resolve) => {
      if (typeof text !== 'string') return resolve();

      let i = 0;
      setMessages((prev) => [...prev, createMessage('bot', '')]);

      const stream = () => {
        setMessages((prev) => {
          const updated = [...prev];
          const lastMsg = { ...updated[updated.length - 1] };
          lastMsg.text = text.slice(0, i);
          updated[updated.length - 1] = lastMsg;
          return updated;
        });

        i++;
        if (i <= text.length) {
          setTimeout(stream, delayPerChar);
        } else {
          resolve();
        }
      };

      stream();
    });
  };

  const handleSend = async (text) => {
    if (!text.trim()) return;

    const userMsg = createMessage('user', text);
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setShowOptions(false);

    // Loading effect
    const loadingMsg = createMessage('bot-loading', '');
    setMessages((prev) => [...prev, loadingMsg]);

    // Fake loading delay
    await new Promise((res) => setTimeout(res, 3000));

    const response = await generateBotResponse(text);

    // Remove loading indicator
    setMessages((prev) => prev.filter((msg) => msg.from !== 'bot-loading'));

    // Stream or render bot response
    if (response.type === 'text') {
      await streamBotReply(response.data);
    } else if (response.type === 'products') {
      if (response.message) await streamBotReply(response.message);

      setMessages((prev) => [
        ...prev,
        {
          from: 'bot',
          products: response.data,
          timestamp: new Date().toISOString(),
        },
      ]);
    }
  };

  const formatTime = (ts) =>
    new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcome = createMessage('bot', 'Bạn cần hỗ trợ gì?');
      setMessages([welcome]);
      setShowOptions(true);
    }
  }, [isOpen]);

  return (
    <div className="chatbox-container">
      {isOpen && (
        <div className="chatbox">
          <div className="chatbox-header">
            <img src="/lkn.png" alt="Logo" className="chatbox-logo" />
            <span>AI Agent Assistant</span>
            <IoClose onClick={toggleChat} className="close-btn" />
          </div>

          <div className="chatbox-body">
            {messages.map((msg, idx) => (
              <div key={idx} className={`chat-msg-wrapper ${msg.from}`}>
                {msg.from === 'bot' && (
                  <img src="/lkn.png" alt="Bot" className="chatbox-logo" />
                )}

                <div className={`chat-msg ${msg.from}`}>
                  {msg.products ? (
                    <div className="product-grid">
                      {msg.products.map((prod, i) => {
                        const { title, images, variants } = prod;
                        const price = variants[0].price;
                        return (
                          <div className="chat-product-card" key={i}>
                            <img src={images} alt={title} />
                            <div className="chat-product-info">
                              <strong title={title}>{title}</strong>
                              <p title={price.toLocaleString() + 'đ'}>
                                {price.toLocaleString()}đ
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : msg.from === 'bot-loading' ? (
                    <div className="loading-dots">
                      <span />
                      <span />
                      <span />
                    </div>
                  ) : (
                    <>
                      <div className="msg-text">{msg.text}</div>
                      <div className="timestamp">{formatTime(msg.timestamp)}</div>
                    </>
                  )}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {showOptions && (
            <div className="chatbox-options">
              {defaultOptions.map((opt, i) => (
                <button key={i} onClick={() => handleSend(opt)}>
                  {opt}
                </button>
              ))}
            </div>
          )}

          <div className="chatbox-footer">
            <textarea
              placeholder="Nhập tin nhắn..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(input);
                }
              }}
              rows={2}
            />
            <button onClick={() => handleSend(input)} title="Gửi">
              <FiSend size={25} style={{ transform: 'rotate(45deg)' }} />
            </button>
          </div>
        </div>
      )}

      {!isOpen && (
        <div className="chat-toggle-btn shake" onClick={toggleChat}>
          <PiRobotDuotone size={26} />
        </div>
      )}
    </div>
  );
};

export default ChatBox;
