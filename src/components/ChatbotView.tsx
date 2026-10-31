/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, ChatMessage, WorkoutExerciseCard } from '../types';
import { 
  Send, 
  Sparkles, 
  User, 
  MessageSquare, 
  Bot, 
  ArrowRight, 
  Loader2, 
  RefreshCw, 
  Dumbbell, 
  Maximize2, 
  X, 
  Camera, 
  PlayCircle,
  ExternalLink,
  Target,
  Repeat
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ChatbotViewProps {
  profile: UserProfile | null;
  chatMessages: ChatMessage[];
  onSendMessage: (text: string) => Promise<void>;
  isResponding: boolean;
  onClearChat: () => void;
  onNavigateTab?: (tab: 'dashboard' | 'planner' | 'vision' | 'tracker' | 'chatbot' | 'workout-session') => void;
}

export default function ChatbotView({
  profile,
  chatMessages,
  onSendMessage,
  isResponding,
  onClearChat,
  onNavigateTab,
}: ChatbotViewProps) {
  const [inputText, setInputText] = useState('');
  const [selectedPhotoExercise, setSelectedPhotoExercise] = useState<WorkoutExerciseCard | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isResponding]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const textToSend = inputText;
    setInputText('');
    await onSendMessage(textToSend);
  };

  const suggestedPrompts = [
    'Send me a Chest & Triceps workout with exercise images',
    'Show me a complete Leg day routine with photos',
    'Best Back & Bicep exercises with visual guides',
    'Core and Ab workout with form images',
    'Full body bodyweight workout routine with photos',
  ];

  // Helper to parse and render formatted markdown text, including embedded markdown images ![alt](url)
  const renderFormattedContent = (content: string) => {
    const lines = content.split('\n');

    return (
      <div className="space-y-2 text-xs leading-relaxed">
        {lines.map((line, idx) => {
          const trimmed = line.trim();

          // Markdown Image format: ![Alt](url)
          const imgMatch = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/);
          if (imgMatch) {
            const altText = imgMatch[1] || 'Exercise Demonstration';
            const imgUrl = imgMatch[2];

            return (
              <div 
                key={idx} 
                className="my-3 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/80 shadow-lg group relative cursor-pointer"
                onClick={() => setSelectedPhotoExercise({
                  name: altText,
                  imageUrl: imgUrl,
                  targetMuscle: 'Target Muscle Activation',
                  setsReps: '3-4 sets × 8-12 reps',
                  instructions: 'Maintain proper alignment, full range of motion, and controlled tempo.'
                })}
              >
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-900">
                  <img
                    src={imgUrl}
                    alt={altText}
                    className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
                    loading="lazy"
                    onError={(e) => {
                      // Fallback image in case of CDN glitch
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent opacity-90 group-hover:opacity-95 transition" />
                  
                  {/* Badge & Zoom trigger */}
                  <div className="absolute top-2.5 right-2.5 p-1.5 bg-slate-950/70 hover:bg-slate-900 backdrop-blur-md rounded-lg text-slate-300 border border-slate-700/60 transition shadow">
                    <Maximize2 className="w-3.5 h-3.5" />
                  </div>

                  <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white">
                    <span className="font-black text-xs tracking-wide flex items-center gap-1.5 text-indigo-300 drop-shadow">
                      <Dumbbell className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      {altText}
                    </span>
                    <span className="text-[10px] bg-indigo-500/30 border border-indigo-400/40 px-2 py-0.5 rounded-full font-mono text-indigo-200">
                      View Demo
                    </span>
                  </div>
                </div>
              </div>
            );
          }

          // Headers
          if (trimmed.startsWith('### ')) {
            return (
              <h4 key={idx} className="text-sm font-black text-indigo-300 mt-3 mb-1.5 flex items-center gap-1.5 border-b border-indigo-950/50 pb-1">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                {trimmed.replace('### ', '')}
              </h4>
            );
          }
          if (trimmed.startsWith('#### ')) {
            return (
              <h5 key={idx} className="text-xs font-bold text-slate-200 mt-2 mb-1 flex items-center gap-1.5 text-amber-300">
                <Dumbbell className="w-3 h-3 text-amber-400" />
                {trimmed.replace('#### ', '')}
              </h5>
            );
          }

          // Bullet points
          if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
            const rawText = trimmed.substring(2);
            return (
              <div key={idx} className="flex items-start gap-2 ml-1 text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0 mt-1.5" />
                <span>{renderInlineBold(rawText)}</span>
              </div>
            );
          }

          // Numbered items (1. 2.)
          if (/^\d+\.\s/.test(trimmed)) {
            const dotIdx = trimmed.indexOf('.');
            const num = trimmed.substring(0, dotIdx + 1);
            const textPart = trimmed.substring(dotIdx + 1).trim();
            return (
              <div key={idx} className="flex items-start gap-2 ml-1 text-slate-300">
                <span className="font-mono text-[10px] text-indigo-400 font-bold shrink-0 mt-0.5">{num}</span>
                <span>{renderInlineBold(textPart)}</span>
              </div>
            );
          }

          // Empty line
          if (!trimmed) {
            return <div key={idx} className="h-1" />;
          }

          // Normal paragraph line
          return (
            <p key={idx} className="text-slate-300">
              {renderInlineBold(trimmed)}
            </p>
          );
        })}
      </div>
    );
  };

  // Helper to render **bold text**
  const renderInlineBold = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-bold text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[650px]" id="chatbot-view-container">
      {/* Suggestions and Coach Card (Left Col) */}
      <div 
        className="lg:col-span-4 bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 flex flex-col justify-between h-full backdrop-blur-xl shadow-xl shadow-slate-950/15" 
        id="chatbot-profile-panel"
      >
        <div className="overflow-y-auto pr-1 space-y-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Coach GenieCoach</h2>
              <p className="text-[10px] font-bold font-mono text-indigo-400 uppercase tracking-widest">
                AI Athletic Trainer & Visuals
              </p>
            </div>
          </div>

          <div className="bg-slate-950/50 p-4 border border-slate-850 rounded-2xl text-xs text-slate-400 leading-relaxed shadow-inner">
            <p className="font-bold text-slate-200 mb-1.5 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              Visual Workout Dispatcher
            </p>
            {profile ? (
              <span>
                GenieCoach delivers personalized exercise regimens with <span className="text-indigo-400 font-bold">demonstration photos and form cues</span> tailored for <span className="text-indigo-400 font-bold">{profile.name}</span>'s {profile.goal.replace('_', ' ')} program.
              </span>
            ) : (
              <span>
                Ask for any workout split (Chest, Back, Legs, Core, Arms, Full Body) to receive full exercise names along with high-resolution visual demonstration cards.
              </span>
            )}
          </div>

          {/* Quick start tags */}
          <div>
            <span className="block text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider mb-2.5">
              Suggested Visual Inquiries:
            </span>
            <div className="space-y-2" id="suggested-prompts-list">
              {suggestedPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => setInputText(prompt)}
                  className="w-full text-left p-3 bg-slate-950/45 hover:bg-slate-900/60 border border-slate-850 hover:border-indigo-500/30 rounded-xl text-slate-400 hover:text-slate-200 text-xs transition duration-300 leading-normal flex justify-between items-center group cursor-pointer"
                >
                  <span className="line-clamp-2">{prompt}</span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-indigo-400 transition duration-300 shrink-0 ml-2" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {chatMessages.length > 0 && (
          <button
            onClick={onClearChat}
            className="w-full mt-4 py-2.5 border border-slate-800 hover:bg-slate-950/80 text-slate-400 hover:text-slate-200 text-xs font-bold rounded-xl transition duration-300 flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            id="clear-chat-btn"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Restart Conversation
          </button>
        )}
      </div>

      {/* Messaging Stream Window (Right Col) */}
      <div 
        className="lg:col-span-8 bg-slate-900/40 border border-slate-800/80 rounded-3xl flex flex-col justify-between overflow-hidden h-full backdrop-blur-xl shadow-xl shadow-slate-950/15" 
        id="chatbot-stream-panel"
      >
        {/* Messages feed stream */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5" id="messages-scroller">
          {chatMessages.length === 0 ? (
            /* Empty state chat starter */
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
              <div className="p-4 bg-slate-950/80 border border-slate-850 rounded-full text-indigo-400 mb-3 animate-pulse shadow-inner">
                <Dumbbell className="w-8 h-8" />
              </div>
              <h3 className="text-base font-black text-slate-300">Ready for Your Workout Consultation</h3>
              <p className="text-xs text-slate-400 max-w-sm mt-1.5 leading-relaxed">
                "Hello! Ask me for any workout routine (e.g. <em>'Give me a chest and tricep workout'</em> or <em>'Show me leg exercises with images'</em>), and I will send you the exercise names, high-res photos, and biomechanical form guidance!"
              </p>
            </div>
          ) : (
            chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3.5 text-xs max-w-3xl ${
                  msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''
                }`}
              >
                {/* Avatar icon */}
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${
                    msg.role === 'user' 
                      ? 'bg-indigo-600 border-indigo-500/55 text-white' 
                      : 'bg-slate-950 border-slate-850 text-indigo-400 shadow-inner'
                  }`}
                >
                  {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Message Bubble content */}
                <div 
                  className={`p-4 rounded-2xl ${
                    msg.role === 'user'
                      ? 'bg-indigo-600/15 border border-indigo-500/25 text-slate-200 rounded-tr-none shadow-sm max-w-md whitespace-pre-wrap'
                      : 'bg-slate-950/70 border border-slate-850 text-slate-300 rounded-tl-none shadow-inner w-full'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <div>{msg.content}</div>
                  ) : (
                    <div className="space-y-4">
                      {/* Render text with Markdown & Images */}
                      {renderFormattedContent(msg.content)}

                      {/* Structured Exercise Cards Gallery (if available on the message) */}
                      {msg.exercises && msg.exercises.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-slate-850/80">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-[11px] font-bold font-mono uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                              <Dumbbell className="w-3.5 h-3.5" />
                              Visual Exercise Demonstration Cards ({msg.exercises.length})
                            </span>
                            <span className="text-[10px] text-slate-500">Tap photo to enlarge</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            {msg.exercises.map((ex, exIdx) => (
                              <div
                                key={exIdx}
                                className="bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800/90 hover:border-indigo-500/40 rounded-2xl overflow-hidden transition duration-300 shadow-md group flex flex-col justify-between"
                              >
                                <div>
                                  {/* Exercise Photo with Hover Zoom */}
                                  <div 
                                    className="relative h-36 w-full overflow-hidden bg-slate-950 cursor-pointer"
                                    onClick={() => setSelectedPhotoExercise(ex)}
                                  >
                                    <img
                                      src={ex.imageUrl}
                                      alt={ex.name}
                                      className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
                                      loading="lazy"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80';
                                      }}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
                                    
                                    {/* Enlarge badge */}
                                    <div className="absolute top-2 right-2 p-1.5 bg-slate-950/70 backdrop-blur-md rounded-lg text-slate-300 group-hover:text-white transition">
                                      <Maximize2 className="w-3.5 h-3.5" />
                                    </div>

                                    {/* Sets/Reps Pill */}
                                    <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-800 text-[10px] font-bold text-amber-400 font-mono flex items-center gap-1">
                                      <Repeat className="w-3 h-3 text-amber-400" />
                                      {ex.setsReps}
                                    </div>
                                  </div>

                                  {/* Details */}
                                  <div className="p-3.5 space-y-1.5">
                                    <h5 className="font-bold text-white text-xs leading-snug group-hover:text-indigo-300 transition">
                                      {ex.name}
                                    </h5>
                                    
                                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-indigo-400">
                                      <Target className="w-3 h-3 shrink-0" />
                                      <span className="truncate">{ex.targetMuscle}</span>
                                    </div>

                                    {ex.instructions && (
                                      <p className="text-[11px] text-slate-400 leading-normal line-clamp-2">
                                        {ex.instructions}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                {/* Quick Action Triggers */}
                                <div className="p-3 pt-0 flex gap-2">
                                  {onNavigateTab && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => onNavigateTab('vision')}
                                        className="flex-1 py-1.5 px-2 bg-indigo-600/15 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-[10px] font-bold rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
                                        title="Check form in real-time on webcam"
                                      >
                                        <Camera className="w-3 h-3" />
                                        Pose Form
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => onNavigateTab('workout-session')}
                                        className="flex-1 py-1.5 px-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-200 text-[10px] font-bold rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
                                        title="Start live workout session"
                                      >
                                        <PlayCircle className="w-3 h-3 text-emerald-400" />
                                        Workout
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}

          {/* Assistant responder skeleton load */}
          {isResponding && (
            <div className="flex gap-3.5 text-xs">
              <div className="w-8 h-8 rounded-full bg-slate-950 border border-slate-850 text-indigo-400 flex items-center justify-center shrink-0 shadow-inner">
                <Bot className="w-4 h-4 animate-spin" />
              </div>
              <div className="p-4 bg-slate-950/50 border border-slate-850 text-slate-400 rounded-2xl rounded-tl-none flex items-center gap-2 shadow-inner animate-pulse">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                <span>Coach is compiling your workout & fetching demonstration images...</span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input Text box bar */}
        <form onSubmit={handleSend} className="p-4 bg-slate-950/50 border-t border-slate-850 flex gap-3 shadow-inner" id="chat-input-form">
          <input
            type="text"
            className="flex-1 bg-slate-900 border border-slate-850 focus:border-indigo-500/50 rounded-xl px-4 text-slate-200 text-sm outline-none transition duration-300 placeholder:text-slate-500"
            placeholder="Ask for any workout (e.g., 'Give me a chest workout with images')..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isResponding}
            id="chat-message-textbox"
          />
          <button
            type="submit"
            disabled={isResponding || !inputText.trim()}
            className="p-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl transition duration-300 flex items-center justify-center font-bold active:scale-95 cursor-pointer shadow shadow-indigo-900/20"
            id="chat-send-btn"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Full Resolution Exercise Image Lightbox Modal */}
      <AnimatePresence>
        {selectedPhotoExercise && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setSelectedPhotoExercise(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden max-w-xl w-full shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setSelectedPhotoExercise(null)}
                className="absolute top-4 right-4 z-10 p-2 bg-slate-950/80 hover:bg-slate-950 text-white rounded-full border border-slate-700/80 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Large Image */}
              <div className="relative aspect-[16/10] w-full bg-slate-950">
                <img
                  src={selectedPhotoExercise.imageUrl}
                  alt={selectedPhotoExercise.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-90" />
              </div>

              {/* Card Details */}
              <div className="p-6 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-indigo-400 block mb-1">
                      {selectedPhotoExercise.targetMuscle}
                    </span>
                    <h3 className="text-xl font-black text-white flex items-center gap-2">
                      <Dumbbell className="w-5 h-5 text-indigo-400" />
                      {selectedPhotoExercise.name}
                    </h3>
                  </div>
                  <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold rounded-xl whitespace-nowrap">
                    {selectedPhotoExercise.setsReps}
                  </span>
                </div>

                {selectedPhotoExercise.instructions && (
                  <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 text-xs text-slate-300 leading-relaxed">
                    <p className="font-bold text-indigo-300 text-[11px] mb-1 uppercase font-mono tracking-wider">
                      Biomechanical Form Coaching:
                    </p>
                    {selectedPhotoExercise.instructions}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  {onNavigateTab && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPhotoExercise(null);
                          onNavigateTab('vision');
                        }}
                        className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-900/30"
                      >
                        <Camera className="w-4 h-4" />
                        Check Form in Vision Lab
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPhotoExercise(null);
                          onNavigateTab('workout-session');
                        }}
                        className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <PlayCircle className="w-4 h-4 text-emerald-400" />
                        Start Live Session
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
