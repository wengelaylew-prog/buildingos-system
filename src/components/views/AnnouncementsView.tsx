import React, { useState, useEffect } from 'react';
import { api } from '../../api/client.ts';
import { Bell, Plus, AlertCircle } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.tsx';

export function AnnouncementsView() {
  const { locale } = useLanguage();
  const isAmharic = locale === 'am';
  
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ title: '', content: '', priority: 'NORMAL' });

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      const res = await api.getAnnouncements();
      setAnnouncements(res || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createAnnouncement(formData);
      setIsModalOpen(false);
      setFormData({ title: '', content: '', priority: 'NORMAL' });
      loadAnnouncements();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="bg-white px-6 py-4 border-b flex justify-between items-center sticky top-0 z-10">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Bell className="text-indigo-600" />
            {isAmharic ? 'ማስታወቂያዎች (Announcements)' : 'Announcements'}
          </h1>
          <p className="text-sm text-slate-500">
            {isAmharic ? 'ለተከራዮች አጠቃላይ መረጃ እና ማስታወቂያ ያስተላልፉ' : 'Broadcast information to all tenants'}
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
        >
          <Plus size={18} />
          {isAmharic ? 'አዲስ ማስታወቂያ (New)' : 'New Announcement'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="text-center py-10">Loading...</div>
        ) : announcements.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <Bell size={48} className="mx-auto mb-4 opacity-20" />
            <p>{isAmharic ? 'ምንም ማስታወቂያ የለም' : 'No announcements yet'}</p>
          </div>
        ) : (
          <div className="grid gap-4 max-w-4xl">
            {announcements.map((a: any) => (
              <div key={a.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex gap-4">
                <div className={`p-3 rounded-full shrink-0 h-fit ${a.priority === 'URGENT' ? 'bg-red-100 text-red-600' : a.priority === 'HIGH' ? 'bg-orange-100 text-orange-600' : 'bg-indigo-100 text-indigo-600'}`}>
                   {a.priority === 'URGENT' ? <AlertCircle size={24}/> : <Bell size={24}/>}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-lg text-slate-800">{a.title}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                      {new Date(a.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-slate-600 whitespace-pre-wrap">{a.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-xl">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg">{isAmharic ? 'ማስታወቂያ መፃፊያ' : 'Write Announcement'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input required type="text" className="w-full border p-2 rounded-lg" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Priority</label>
                <select className="w-full border p-2 rounded-lg" value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})}>
                  <option value="NORMAL">Normal</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent 🚨</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Message Content</label>
                <textarea required rows={5} className="w-full border p-2 rounded-lg" value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})}></textarea>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded-lg font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700">Publish</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

