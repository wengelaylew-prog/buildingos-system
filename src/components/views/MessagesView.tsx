import React, { useEffect, useState } from 'react';
import { api } from '../../api/client.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { Send, Bell, Check, Clock, AlertCircle, Info, MessageSquare } from 'lucide-react';

export const MessagesView: React.FC = () => {
  const { roleCode } = useAuth();
  const { t } = useLanguage();
  
  const [messages, setMessages] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<'messages' | 'notifications'>('messages');
  const [newMessage, setNewMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [msgData, notifData] = await Promise.all([
        api.getMessages(),
        api.getNotifications()
      ]);
      setMessages(msgData);
      setNotifications(notifData);
    } catch (err) {
      console.error('Failed to load messaging data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      setSubmitting(true);
      setError(null);
      await api.sendMessage({ content: newMessage });
      setNewMessage('');
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'SUCCESS': return <Check className="w-4 h-4 text-emerald-500" />;
      case 'WARNING': return <Clock className="w-4 h-4 text-amber-500" />;
      case 'ALERT': return <AlertCircle className="w-4 h-4 text-rose-500" />;
      default: return <Info className="w-4 h-4 text-indigo-500" />;
    }
  };

  return (
    <div id="messages-view" className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200">
        <div className="flex gap-4">
          <button
            className={`text-sm font-bold pb-1 border-b-2 transition-colors ${activeTab === 'messages' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            onClick={() => setActiveTab('messages')}
          >
            {t('messageCenter')}
          </button>
          <button
            className={`text-sm font-bold pb-1 border-b-2 transition-colors ${activeTab === 'notifications' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            onClick={() => setActiveTab('notifications')}
          >
            {t('notificationsTitle')} {notifications.filter(n => !n.isRead).length > 0 && `(${notifications.filter(n => !n.isRead).length})`}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">Loading messaging center...</div>
      ) : activeTab === 'messages' ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col h-[600px]">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <MessageSquare className="w-12 h-12 mb-3 text-slate-200" />
                <p className="text-sm">{t('noMessages')}</p>
              </div>
            ) : (
              messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.sender.id === roleCode ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${msg.sender.id === roleCode ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-slate-100 text-slate-800 rounded-bl-none'}`}>
                    <div className="text-[10px] font-medium opacity-70 mb-1">
                      {msg.sender.fullName} • {new Date(msg.createdAt).toLocaleTimeString()}
                    </div>
                    <p className="text-sm">{msg.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="p-4 border-t border-slate-200 bg-slate-50 rounded-b-xl">
            {error && <p className="text-xs text-rose-500 mb-2">{error}</p>}
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={t('typeMessagePlaceholder')}
                className="flex-1 px-4 py-2 text-sm border border-slate-300 rounded-full focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
              <button
                type="submit"
                disabled={submitting || !newMessage.trim()}
                className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs">
          {notifications.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-slate-400">
              <Bell className="w-12 h-12 mb-3 text-slate-200" />
              <p className="text-sm">{t('noNotifications')}</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {notifications.map(notif => (
                <div key={notif.id} className={`p-4 flex items-start justify-between gap-4 transition-colors hover:bg-slate-50 ${!notif.isRead ? 'bg-indigo-50/30' : ''}`}>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 p-1.5 rounded-full bg-white shadow-xs border border-slate-100">
                      {getNotifIcon(notif.type)}
                    </div>
                    <div>
                      <h4 className={`text-sm ${!notif.isRead ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>
                        {notif.title}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">{notif.message}</p>
                      <span className="text-[10px] text-slate-400 block mt-1">
                        {new Date(notif.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  {!notif.isRead && (
                    <button
                      onClick={() => handleMarkAsRead(notif.id)}
                      className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-md transition-colors whitespace-nowrap"
                    >
                      {t('markAsRead')}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

