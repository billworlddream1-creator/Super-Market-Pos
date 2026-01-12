
import React, { useState, useEffect, useRef } from 'react';
import { UserAccount, ChatMessage, ChatRoom } from '../types';
import { Send, Users, Search, MoreVertical, X, MessageSquare, Paperclip, Smile, Sparkles, Languages, Video, Mic, StopCircle, Phone, Globe, Wand2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { suggestReply, translateMessage, autocorrectText } from '../services/geminiService';

interface ChatProps {
  currentUser: UserAccount;
  users: UserAccount[];
  messages: ChatMessage[];
  onSendMessage: (message: ChatMessage) => void;
}

const EMOJIS = ['😊', '👍', '🔥', '😂', '👋', '🚀', '✅', '📦', '🛒', '💡'];

const Chat: React.FC<ChatProps> = ({ currentUser, users, messages, onSendMessage }) => {
  const [selectedRoomId, setSelectedRoomId] = useState<string>('general');
  const [inputText, setInputText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isCorrecting, setIsCorrecting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const rooms: ChatRoom[] = [
    { id: 'general', name: 'General Staff', type: 'GROUP', participants: users.map(u => u.id) },
    ...users
      .filter(u => u.id !== currentUser.id)
      .map(u => ({
        id: [currentUser.id, u.id].sort().join('-'),
        name: u.name,
        type: 'DIRECT' as const,
        participants: [currentUser.id, u.id]
      }))
  ];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, selectedRoomId]);

  const handleSend = (text: string = inputText, attachment?: any, isAudio: boolean = false) => {
    if (!text.trim() && !attachment) return;

    const newMessage: ChatMessage = {
      id: uuidv4(),
      senderId: currentUser.id,
      text: text,
      timestamp: Date.now(),
      roomId: selectedRoomId,
      attachment: attachment,
      isAudio: isAudio
    };

    onSendMessage(newMessage);
    setInputText('');
    setShowEmojiPicker(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleSend(`Shared a file: ${file.name}`, {
        name: file.name,
        type: file.type,
        url: URL.createObjectURL(file)
      });
    }
  };

  const handleAiSuggest = async () => {
    setIsAiLoading(true);
    const roomMessages = messages.filter(m => m.roomId === selectedRoomId).slice(-5);
    const context = roomMessages.map(m => m.text).join(' | ');
    const suggestion = await suggestReply(context);
    setInputText(suggestion);
    setIsAiLoading(false);
  };

  const handleAutocorrect = async () => {
    if (!inputText.trim()) return;
    setIsCorrecting(true);
    const corrected = await autocorrectText(inputText);
    setInputText(corrected);
    setIsCorrecting(false);
  };

  const handleTranslate = async (msg: ChatMessage) => {
    const translated = await translateMessage(msg.text);
    alert(`Translation (to Spanish): ${translated}`);
  };

  const toggleRecording = () => {
    if (isRecording) {
      handleSend("Audio message sent 🎤", undefined, true);
    }
    setIsRecording(!isRecording);
  };

  const filteredRooms = rooms.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const currentRoom = rooms.find(r => r.id === selectedRoomId);
  const currentMessages = messages.filter(m => m.roomId === selectedRoomId);

  const getSender = (id: string) => users.find(u => u.id === id) || { name: 'Unknown', avatarColor: '#94a3b8' };

  return (
    <div className="flex h-full bg-white animate-in fade-in duration-500 overflow-hidden relative">
      <div className="w-80 border-r flex flex-col bg-slate-50">
        <div className="p-4 border-b bg-white">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" placeholder="Search..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredRooms.map(room => (
            <button
              key={room.id}
              onClick={() => setSelectedRoomId(room.id)}
              className={`w-full p-4 flex items-center gap-3 transition-colors border-b border-slate-100 ${
                selectedRoomId === room.id ? 'bg-indigo-50 border-r-4 border-r-indigo-600' : 'hover:bg-white'
              }`}
            >
              <div 
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold shadow-sm"
                style={{ backgroundColor: room.type === 'GROUP' ? '#4f46e5' : (users.find(u => u.name === room.name)?.avatarColor || '#4f46e5') }}
              >
                {room.type === 'GROUP' ? <Users size={20} /> : room.name.charAt(0)}
              </div>
              <div className="text-left flex-1 min-w-0">
                <p className="font-bold text-slate-800 truncate">{room.name}</p>
                <p className="text-xs text-slate-500 truncate">{room.type === 'GROUP' ? 'Group Chat' : 'Direct'}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="p-4 border-b flex justify-between items-center bg-white shadow-sm z-10">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: currentRoom?.type === 'GROUP' ? '#4f46e5' : (users.find(u => u.name === currentRoom?.name)?.avatarColor || '#4f46e5') }}
            >
              {currentRoom?.type === 'GROUP' ? <Users size={18} /> : currentRoom?.name.charAt(0)}
            </div>
            <div>
              <h3 className="font-bold text-slate-900">{currentRoom?.name}</h3>
              <p className="text-xs text-green-500 font-bold uppercase">Active</p>
            </div>
          </div>
          <div className="flex gap-1">
            <button onClick={() => setShowVideoCall(true)} className="p-2 hover:bg-slate-100 rounded-full text-indigo-600" title="Video Call"><Video size={20}/></button>
            <button className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><MoreVertical size={20}/></button>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
          {currentMessages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-2">
              <MessageSquare size={48} className="opacity-20" />
              <p className="font-medium text-sm">No history yet</p>
            </div>
          )}
          {currentMessages.map(msg => {
            const isMe = msg.senderId === currentUser.id;
            const sender = getSender(msg.senderId);
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex gap-3 max-w-[70%] ${isMe ? 'flex-row-reverse' : ''}`}>
                  <div className="space-y-1">
                    {!isMe && <p className="text-[10px] font-bold text-slate-400 uppercase ml-1">{sender.name}</p>}
                    <div className={`p-4 rounded-2xl shadow-sm group relative ${
                      isMe ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none'
                    }`}>
                      {msg.isAudio ? (
                        <div className="flex items-center gap-2">
                          <Mic size={16}/>
                          <span className="h-1 w-16 bg-white/20 rounded-full overflow-hidden">
                            <span className="block h-full w-1/2 bg-white animate-pulse"></span>
                          </span>
                          <span className="text-xs">0:04</span>
                        </div>
                      ) : (
                        <p className="text-sm leading-relaxed">{msg.text}</p>
                      )}
                      {msg.attachment && (
                        <div className="mt-2 p-2 bg-black/10 rounded-lg flex items-center gap-2 text-xs">
                          <Paperclip size={14}/>
                          <span className="truncate">{msg.attachment.name}</span>
                        </div>
                      )}
                      
                      <button 
                        onClick={() => handleTranslate(msg)}
                        className={`absolute -bottom-6 ${isMe ? 'right-0' : 'left-0'} opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold text-indigo-500 flex items-center gap-1 bg-white px-2 py-1 rounded-full shadow-sm border border-indigo-100 z-10`}
                      >
                        <Languages size={10}/> Translate
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-4 bg-white border-t space-y-2">
          {showEmojiPicker && (
            <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner animate-in slide-in-from-bottom duration-200">
              {EMOJIS.map(e => (
                <button key={e} onClick={() => setInputText(prev => prev + e)} className="text-2xl hover:scale-125 transition-transform p-1">{e}</button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2">
            <button onClick={() => fileInputRef.current?.click()} className="p-2 text-slate-400 hover:text-indigo-600" title="Attach File"><Paperclip size={20}/></button>
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
            
            <div className="flex-1 flex items-center gap-1 bg-slate-100 rounded-2xl p-1 pr-2">
              <input 
                type="text" placeholder="Type a message..." 
                className="flex-1 bg-transparent border-none focus:ring-0 px-4 py-3 text-sm"
                value={inputText} onChange={e => setInputText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
              />
              <button 
                onClick={handleAutocorrect} 
                className={`p-2 transition-all ${isCorrecting ? 'animate-spin text-indigo-600' : 'text-slate-400 hover:text-indigo-600'}`} 
                title="AI Autocorrect"
              >
                <Wand2 size={18}/>
              </button>
              <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-2 text-slate-400 hover:text-indigo-600"><Smile size={20}/></button>
              <button onClick={handleAiSuggest} disabled={isAiLoading} className={`p-2 ${isAiLoading ? 'animate-pulse text-indigo-400' : 'text-indigo-600'}`} title="AI Suggest Reply"><Sparkles size={20}/></button>
            </div>

            <button onClick={toggleRecording} className={`p-3 rounded-xl transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>
              {isRecording ? <StopCircle size={20}/> : <Mic size={20}/>}
            </button>
            
            <button onClick={() => handleSend()} className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100">
              <Send size={20}/>
            </button>
          </div>
        </div>
      </div>

      {showVideoCall && (
        <div className="fixed inset-0 bg-slate-900 z-[100] flex flex-col animate-in zoom-in duration-300">
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-5xl h-[500px]">
              <div className="bg-slate-800 rounded-[2rem] relative overflow-hidden flex items-center justify-center border-2 border-slate-700 shadow-2xl">
                <p className="text-slate-600 font-black tracking-widest uppercase">Your Camera (Muted)</p>
                <div className="absolute bottom-6 left-6 bg-black/40 backdrop-blur-md px-4 py-2 rounded-xl text-xs font-bold text-white border border-white/10">You</div>
              </div>
              <div className="bg-slate-800 rounded-[2rem] relative overflow-hidden flex items-center justify-center border-2 border-indigo-500/30 shadow-2xl">
                <div 
                  className="w-32 h-32 rounded-[2.5rem] flex items-center justify-center text-5xl text-white font-black animate-pulse shadow-2xl"
                  style={{ backgroundColor: users.find(u => u.name === currentRoom?.name)?.avatarColor || '#4f46e5' }}
                >
                  {currentRoom?.name.charAt(0)}
                </div>
                <div className="absolute bottom-6 left-6 bg-black/40 backdrop-blur-md px-4 py-2 rounded-xl text-xs font-bold text-white border border-white/10">{currentRoom?.name}</div>
              </div>
            </div>
          </div>
          <div className="p-12 flex justify-center gap-8 bg-gradient-to-t from-black/20 to-transparent">
            <button className="w-16 h-16 rounded-2xl bg-slate-800 text-white flex items-center justify-center hover:bg-slate-700 transition-all border border-slate-700"><Mic size={24}/></button>
            <button onClick={() => setShowVideoCall(false)} className="w-20 h-20 rounded-[2rem] bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-all shadow-xl shadow-red-500/40 ring-4 ring-red-500/20"><Phone size={32} className="rotate-[135deg]"/></button>
            <button className="w-16 h-16 rounded-2xl bg-slate-800 text-white flex items-center justify-center hover:bg-slate-700 transition-all border border-slate-700"><Video size={24}/></button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
