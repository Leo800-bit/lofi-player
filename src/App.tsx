import React, { useState, useRef, useEffect } from 'react';

const SONG_LIST = [
  { id: 1, title: "喜欢两个人", artist: "彭佳慧", cover: "https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=500&h=500&fit=crop", file: "1.mp3", lrc: "1.txt" },
  { id: 2, title: "解脱", artist: "张惠妹", cover: "https://images.unsplash.com/photo-1453090927415-5f45085b6aeb?w=500&h=500&fit=crop", file: "2.mp3", lrc: "2.txt" },
  { id: 3, title: "关于郑州的记忆", artist: "Live Version", cover: "https://images.unsplash.com/photo-1446057032654-9d8885bb76c6?w=500&h=500&fit=crop", file: "3.mp3", lrc: "3.txt" },
  { id: 4, title: "Me & U", artist: "邓福如", cover: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=500&h=500&fit=crop", file: "4.mp3", lrc: "4.txt" },
  { id: 5, title: "年少有为", artist: "JJ20", cover: "https://images.unsplash.com/photo-1514525253361-bee8a48740ad?w=500&h=500&fit=crop", file: "5.mp3", lrc: "5.txt" }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('首页');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showLyrics, setShowLyrics] = useState(false);
  const [playMode, setPlayMode] = useState<'sequence' | 'random'>('sequence');
  const [parsedLyrics, setParsedLyrics] = useState<{ time: number; text: string }[]>([]);
  
  const [favorites, setFavorites] = useState<number[]>(() => JSON.parse(localStorage.getItem('leo_fav_final') || '[]'));
  const [history, setHistory] = useState<number[]>(() => JSON.parse(localStorage.getItem('leo_hist_final') || '[]'));

  const audioRef = useRef<HTMLAudioElement>(null);
  const lrcRef = useRef<HTMLDivElement>(null);
  const currentTrack = SONG_LIST[currentIndex];

  const parseLRC = (lrcText: string) => {
    const lines = lrcText.split('\n');
    const result: { time: number; text: string }[] = [];
    const timeReg = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;
    lines.forEach(line => {
      const match = timeReg.exec(line);
      if (match) {
        const time = parseInt(match[1]) * 60 + parseInt(match[2]) + parseInt(match[3]) / 100;
        const text = line.replace(timeReg, '').trim();
        if (text) result.push({ time, text });
      }
    });
    return result.sort((a, b) => a.time - b.time);
  };

  useEffect(() => {
    const fetchLrc = async () => {
      try {
        const response = await fetch(`/${currentTrack.lrc}`);
        const text = await response.text();
        setParsedLyrics(parseLRC(text));
      } catch { setParsedLyrics([{ time: 0, text: "正在读取txt..." }]); }
    };
    fetchLrc();
    setHistory(prev => [currentTrack.id, ...prev.filter(id => id !== currentTrack.id)].slice(0, 10));
    if (audioRef.current) {
      audioRef.current.load();
      if (isPlaying) audioRef.current.play().catch(() => {});
    }
  }, [currentIndex]);

  useEffect(() => {
    localStorage.setItem('leo_fav_final', JSON.stringify(favorites));
    localStorage.setItem('leo_hist_final', JSON.stringify(history));
  }, [favorites, history]);

  const lyricIndex = parsedLyrics.findIndex((l, i) => {
    const next = parsedLyrics[i + 1];
    return currentTime >= l.time && (!next || currentTime < next.time);
  });

  useEffect(() => {
    if (lrcRef.current && lyricIndex !== -1) {
      const activeLine = lrcRef.current.childNodes[lyricIndex] as HTMLElement;
      if (activeLine) lrcRef.current.scrollTo({ top: activeLine.offsetTop - 120, behavior: 'smooth' });
    }
  }, [lyricIndex]);

  const handleNext = () => {
    if (playMode === 'random') {
      setCurrentIndex(Math.floor(Math.random() * SONG_LIST.length));
    } else {
      setCurrentIndex(prev => (prev + 1) % SONG_LIST.length);
    }
  };

  const formatTime = (time: number) => {
    const m = Math.floor(time / 60).toString().padStart(2, '0');
    const s = Math.floor(time % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const renderContent = () => {
    if (activeTab === '曲库') {
      return (
        <div className="p-8 pt-20 pb-40 h-full overflow-y-auto animate-[fadeIn_0.5s]">
          <h2 className="text-3xl font-black mb-8">曲库</h2>
          <div className="space-y-3">
            {SONG_LIST.map((s, idx) => (
              <div key={s.id} onClick={() => { setCurrentIndex(idx); setActiveTab('首页'); setIsPlaying(true); }} 
                   className={`flex items-center gap-4 p-4 rounded-3xl transition-all ${currentIndex === idx ? 'bg-blue-600 text-white' : 'bg-white shadow-sm'}`}>
                <img src={s.cover} className="w-10 h-10 rounded-xl object-cover" />
                <div className="flex-1 font-bold text-sm truncate">{s.title}</div>
                {favorites.includes(s.id) && <span className="text-xs">❤️</span>}
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (activeTab === '我的') {
      const favItems = SONG_LIST.filter(s => favorites.includes(s.id));
      const historyItems = history.map(id => SONG_LIST.find(s => s.id === id)).filter(Boolean);
      return (
        <div className="p-8 pt-20 pb-40 h-full overflow-y-auto animate-[fadeIn_0.5s]">
          <h2 className="text-2xl font-black mb-8">你好 Leo</h2>
          <div className="mb-8">
            <h3 className="text-xs font-black text-blue-600 mb-4 tracking-widest uppercase">我的收藏</h3>
            <div className="space-y-2">
              {favItems.map(t => (
                <div key={`fav-${t.id}`} onClick={() => { setCurrentIndex(SONG_LIST.indexOf(t)); setActiveTab('首页'); setIsPlaying(true); }} className="p-4 bg-white rounded-2xl flex justify-between items-center shadow-sm">
                  <span className="text-sm font-bold">{t.title}</span>
                  <span className="text-blue-600 text-xs">❤️</span>
                </div>
              ))}
            </div>
          </div>
          <h3 className="text-xs font-black text-zinc-400 mb-4 tracking-widest uppercase">最近播放</h3>
          <div className="grid grid-cols-2 gap-3">
            {historyItems.map((t: any) => (
              <div key={`hist-${t.id}`} onClick={() => { setCurrentIndex(SONG_LIST.indexOf(t)); setActiveTab('首页'); setIsPlaying(true); }} className="p-3 bg-white/60 rounded-2xl border border-white flex items-center gap-2">
                <img src={t.cover} className="w-6 h-6 rounded-md" />
                <span className="text-[10px] font-bold truncate">{t.title}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-24 animate-[fadeIn_0.5s]">
        {/* 具象化圆形唱片 - 缩小至 w-64 */}
        <div className="relative group mb-16">
          <div className={`absolute -inset-6 bg-white/40 backdrop-blur-3xl rounded-full border border-white shadow-[0_20px_50px_rgba(0,0,0,0.05)] transition-all duration-1000 ${isPlaying ? 'scale-105' : 'scale-100'}`}></div>
          <div className="relative w-64 h-64 rounded-full p-1 bg-zinc-100 shadow-inner flex items-center justify-center overflow-hidden cursor-pointer" onClick={() => setShowLyrics(!showLyrics)}>
              <div className={`absolute inset-0 transition-all duration-700 ${showLyrics ? 'opacity-0 scale-50' : 'opacity-100 scale-100'} ${isPlaying ? 'animate-[spin_20s_linear_infinite]' : ''}`}>
                <img src={currentTrack.cover} className="w-full h-full object-cover" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-[#F8F9FA] rounded-full border-4 border-black/5 shadow-inner"></div>
              </div>
              <div ref={lrcRef} className={`absolute inset-0 flex flex-col items-center overflow-y-auto no-scrollbar py-28 px-10 bg-white/90 backdrop-blur-md transition-all duration-500 ${showLyrics ? 'opacity-100' : 'opacity-0 scale-90 pointer-events-none'}`}>
                {parsedLyrics.map((l, i) => (
                  <p key={i} className={`text-center py-4 transition-all duration-500 font-black ${lyricIndex === i ? 'text-blue-600 text-lg scale-110' : 'text-zinc-300 text-xs'}`}>{l.text}</p>
                ))}
              </div>
          </div>
          <div className={`absolute -top-2 -right-1 w-20 h-1.5 shadow-sm bg-zinc-200 rounded-full origin-right transition-transform duration-700 z-20 ${isPlaying ? 'rotate-[25deg]' : 'rotate-0'}`} style={{ right: '8%', top: '8%' }}>
              <div className="absolute left-0 w-3 h-3 bg-zinc-400 rounded-sm -top-1 shadow-md"></div>
          </div>
        </div>

        <div className="text-center mb-10">
          <h1 className="text-2xl font-black text-zinc-900 tracking-tight">{currentTrack.title}</h1>
          <p className="text-blue-600 font-bold text-[10px] mt-2 tracking-widest uppercase">{currentTrack.artist}</p>
        </div>

        <div className="w-full max-w-xs mb-10">
          <input type="range" min={0} max={duration || 100} value={currentTime} onChange={(e) => { if (audioRef.current) audioRef.current.currentTime = Number(e.target.value); }} 
                 className="w-full h-1 bg-zinc-200 rounded-full appearance-none cursor-pointer accent-blue-600" />
          <div className="flex justify-between mt-3 text-[10px] font-bold text-zinc-400">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* 核心控制栏：图标化按钮组 */}
        <div className="w-full max-w-sm flex items-center justify-between px-2">
          {/* 播放模式 */}
          <button onClick={() => setPlayMode(m => m === 'sequence' ? 'random' : 'sequence')} className="w-10 h-10 flex items-center justify-center">
            {playMode === 'sequence' ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D4D4D8" strokeWidth="2.5"><path d="M4 9h16l-4-4M20 15H4l4 4"/></svg>
            ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5"><path d="M2 18L22 6M2 6l20 12"/></svg>
            )}
          </button>

          {/* 上一首 */}
          <button onClick={() => setCurrentIndex(prev => (prev - 1 + SONG_LIST.length) % SONG_LIST.length)} className="w-10 h-10 flex items-center justify-center active:scale-90 transition-all">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#18181b"><path d="M6 6h2v12H6zm3.5 6L18 18V6z"/></svg>
          </button>

          {/* 播放/暂停 大圆键 */}
          <button onClick={() => setIsPlaying(!isPlaying)} className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-blue-200 active:scale-90 transition-all">
            {isPlaying ? (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
            ) : (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" className="ml-1"><path d="M8 5v14l11-7z"/></svg>
            )}
          </button>

          {/* 下一首 */}
          <button onClick={handleNext} className="w-10 h-10 flex items-center justify-center active:scale-90 transition-all">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#18181b"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
          </button>

          {/* 收藏 心形 */}
          <button onClick={() => setFavorites(f => f.includes(currentTrack.id) ? f.filter(i => i !== currentTrack.id) : [...f, currentTrack.id])} className="w-10 h-10 flex items-center justify-center">
            <svg width="22" height="22" viewBox="0 0 24 24" fill={favorites.includes(currentTrack.id) ? "#2563eb" : "none"} stroke={favorites.includes(currentTrack.id) ? "#2563eb" : "#D4D4D8"} strokeWidth="2.5"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="relative min-h-screen bg-[#F8F9FA] text-zinc-900 flex flex-col font-sans select-none overflow-hidden transition-colors duration-1000">
      <div className="relative z-10 flex-1 flex flex-col overflow-hidden">{renderContent()}</div>
      <nav className="fixed bottom-8 left-6 right-6 z-50 bg-white/80 backdrop-blur-2xl border border-white rounded-[2.5rem] flex justify-around py-5 shadow-xl shadow-black/5">
        {['首页', '曲库', '我的'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`text-xs font-black transition-all duration-300 ${activeTab === tab ? 'text-blue-600 scale-110' : 'text-zinc-300'}`}>{tab}</button>
        ))}
      </nav>
      <audio ref={audioRef} src={`/${currentTrack.file}`} onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)} onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)} onEnded={handleNext} />
      <style dangerouslySetInnerHTML={{ __html: `@keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } } .no-scrollbar::-webkit-scrollbar { display: none; }`}} />
    </div>
  );
}