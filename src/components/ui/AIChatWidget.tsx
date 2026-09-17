import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, RefreshCw } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.tsx';

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
}

export default function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'ai', content: 'ሰላም! እኔ የ BuildingOS ረዳት ነኝ። ስለ ህንፃዎ ክፍያ፣ የጥበቃ ሪፖርት ወይም ስለ ተከራዮች ምን ልርዳዎ?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { t, locale } = useLanguage();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const token = localStorage.getItem('buildingos_token');
      const res = await fetch('/api/v1/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ query: userMsg.content })
      });

      const data = await res.json();
      if (data.success) {
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'ai', content: data.data.reply }]);
      } else {
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'ai', content: 'ይቅርታ፣ አሁን ላይ ሲስተሙ አልሰራም። እባክዎ እንደገና ይሞክሩ።' }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'ai', content: 'ይቅርታ፣ አሁን ላይ የኢንተርኔት ችግር አጋጥሟል። እባክዎ ትንሽ ቆይተው ይሞክሩ።' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105 z-40 ${isOpen ? 'hidden' : ''}`}
      >
        <Sparkles className="w-6 h-6" />
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[350px] md:w-[400px] h-[500px] max-h-[80vh] bg-white rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden border border-slate-200">
          {/* Header */}
          <div className="bg-indigo-600 px-4 py-3 flex items-center justify-between text-white shrink-0">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-200" />
              <h3 className="font-semibold">{locale === 'en' ? 'AI Assistant' : 'AI ረዳት'}</h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-indigo-200 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto bg-slate-50 flex flex-col gap-3">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                  msg.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-sm' 
                    : 'bg-white text-slate-800 border border-slate-200 rounded-tl-sm shadow-sm'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin" />
                  <span className="text-xs text-slate-500">በማሰብ ላይ...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 bg-white border-t border-slate-100 shrink-0">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={locale === 'en' ? 'Ask a question...' : 'ጥያቄዎን ያስገቡ...'}
                className="flex-1 px-4 py-2 text-sm bg-slate-100 border-transparent rounded-full focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="w-10 h-10 flex items-center justify-center bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

