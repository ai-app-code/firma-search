import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, MapPin, Globe, Star, Info, Loader2, Filter, Database, Cpu, 
  LineChart, ChevronRight, ExternalLink, Activity, SearchIcon, 
  MessageSquare, Settings, Users, Save, Trash2, Send, X, Plus, Terminal,
  Navigation,
  Layers, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { searchVIPConversionFirms, Firm } from './services/gemini';
import { auth, db, handleFirestoreError, OperationType } from './lib/firebase';
import { collection, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { saveFirm, addTask, addNote } from './lib/db';
import axios from 'axios';
import { APIProvider, useMapsLibrary, useMap } from '@vis.gl/react-google-maps';

const GOOGLE_MAPS_ENV_KEY = 
  process.env.GOOGLE_MAPS_PLATFORM_KEY || 
  process.env.VITE_GOOGLE_MAPS_PLATFORM_KEY || 
  '';

const GEMINI_ENV_KEY = process.env.GEMINI_API_KEY || '';

type Tab = 'arastirma' | 'rehber' | 'otomasyon' | 'ayarlar';
type SearchMode = 'text' | 'radius';

function SettingsView({ 
  mapsKey, 
  setMapsKey, 
  geminiKey, 
  setGeminiKey 
}: { 
  mapsKey: string, 
  setMapsKey: (v: string) => void, 
  geminiKey: string, 
  setGeminiKey: (v: string) => void 
}) {
  const [localMapsKey, setLocalMapsKey] = useState(mapsKey);
  const [localGeminiKey, setLocalGeminiKey] = useState(geminiKey);
  const [mapsSavedAt, setMapsSavedAt] = useState<string | null>(() => localStorage.getItem('elitevan_maps_key_time'));
  const [geminiSavedAt, setGeminiSavedAt] = useState<string | null>(() => localStorage.getItem('elitevan_gemini_key_time'));

  const handleSaveMaps = () => {
    setMapsKey(localMapsKey);
    if (localMapsKey) {
      localStorage.setItem('elitevan_maps_key', localMapsKey);
      const time = new Date().toLocaleString('tr-TR');
      localStorage.setItem('elitevan_maps_key_time', time);
      setMapsSavedAt(time);
    } else {
      localStorage.removeItem('elitevan_maps_key');
      localStorage.removeItem('elitevan_maps_key_time');
      setMapsSavedAt(null);
    }
  };

  const handleSaveGemini = () => {
    setGeminiKey(localGeminiKey);
    if (localGeminiKey) {
      localStorage.setItem('elitevan_gemini_key', localGeminiKey);
      const time = new Date().toLocaleString('tr-TR');
      localStorage.setItem('elitevan_gemini_key_time', time);
      setGeminiSavedAt(time);
    } else {
      localStorage.removeItem('elitevan_gemini_key');
      localStorage.removeItem('elitevan_gemini_key_time');
      setGeminiSavedAt(null);
    }
  };

  const isMapsChanged = localMapsKey !== mapsKey;
  const isGeminiChanged = localGeminiKey !== geminiKey;

  return (
    <div className="max-w-2xl mx-auto py-12 space-y-8">
      <header>
        <h2 className="text-3xl font-black tracking-tighter uppercase mb-2">Sistem Ayarları</h2>
        <p className="text-xs text-slate-500">API anahtarlarınızı buradan yönetebilir ve manuel olarak eşitleyebilirsiniz.</p>
      </header>

      <div className="space-y-6">
        {/* Maps Key Section */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400">
                <MapPin size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold uppercase tracking-widest text-slate-300">Google Maps Platform</h4>
                <p className="text-[10px] text-slate-500">Radius araması ve adres doğrulama için gereklidir.</p>
              </div>
            </div>
            {mapsSavedAt && !isMapsChanged && (
              <div className="flex items-center gap-1.5 text-green-500 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">
                <Check size={12} />
                <span className="text-[10px] font-bold">KAYITLI ({mapsSavedAt})</span>
              </div>
            )}
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">API Key</label>
              <input 
                type="password" 
                value={localMapsKey}
                onChange={(e) => setLocalMapsKey(e.target.value)}
                placeholder="AI Studio Secrets'dan otomatik alınır veya manuel girin..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs focus:ring-1 focus:ring-blue-500 font-mono"
              />
            </div>
            <button
              onClick={handleSaveMaps}
              disabled={!isMapsChanged}
              className={`w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                isMapsChanged ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Save size={16} /> {isMapsChanged ? 'Kaydet' : 'Kayıtlı'}
            </button>
          </div>
        </div>

        {/* Gemini Key Section */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-400">
                <Cpu size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold uppercase tracking-widest text-slate-300">Gemini AI (Google GenAI)</h4>
                <p className="text-[10px] text-slate-500">Pazar araştırması ve Akıllı Asistan için gereklidir.</p>
              </div>
            </div>
            {geminiSavedAt && !isGeminiChanged && (
              <div className="flex items-center gap-1.5 text-green-500 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">
                <Check size={12} />
                <span className="text-[10px] font-bold">KAYITLI ({geminiSavedAt})</span>
              </div>
            )}
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">API Key</label>
              <input 
                type="password" 
                value={localGeminiKey}
                onChange={(e) => setLocalGeminiKey(e.target.value)}
                placeholder="AI Studio Secrets'dan otomatik alınır veya manuel girin..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs focus:ring-1 focus:ring-orange-500 font-mono"
              />
            </div>
            <button
              onClick={handleSaveGemini}
              disabled={!isGeminiChanged}
              className={`w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                isGeminiChanged ? 'bg-orange-600 text-white hover:bg-orange-500' : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Save size={16} /> {isGeminiChanged ? 'Kaydet' : 'Kayıtlı'}
            </button>
          </div>
        </div>

        <div className="p-4 bg-blue-600/5 border border-blue-500/20 rounded-xl text-[10px] text-blue-400 leading-relaxed italic flex gap-3">
          <Info size={16} className="shrink-0" />
          <span>Not: Anahtarlar sadece bu tarayıcıda (localStorage) saklanır. Dashboard ayarlarınızda "Secrets" kısmına eklerseniz otomatik olarak algılanacaktır.</span>
        </div>
      </div>
    </div>
  );
}

function RadiusSearch({ onResults, onLoading, onError }: { onResults: (results: Firm[]) => void, onLoading: (loading: boolean) => void, onError: (err: string) => void }) {
  const [address, setAddress] = useState('');
  const [radius, setRadius] = useState(5000); // 5km
  const [cachedCenter, setCachedCenter] = useState<google.maps.LatLng | null>(null);
  const [lastSearchedAddress, setLastSearchedAddress] = useState('');
  const placesLib = useMapsLibrary('places');

  const executeSearch = async (center: any, searchRadius: number) => {
    try {
      const lat = typeof center.lat === 'function' ? center.lat() : center.lat;
      const lng = typeof center.lng === 'function' ? center.lng() : center.lng;

      const latMeters = 111320;
      const latDiff = searchRadius / latMeters;
      // Prevent division by zero or negative bounds near poles by clamping or ensuring positive lngMeters
      const cosLat = Math.cos(lat * Math.PI / 180);
      const lngMeters = 111320 * (cosLat < 0.001 ? 0.001 : cosLat);
      const lngDiff = searchRadius / lngMeters;

      const bounds = {
        north: lat + latDiff,
        south: lat - latDiff,
        east: lng + lngDiff,
        west: lng - lngDiff,
      };

      const { places: nearbyFirms } = await placesLib!.Place.searchByText({
        textQuery: 'vip van conversion sprinter custom luxury oto dizayn',
        fields: ['id', 'displayName', 'formattedAddress', 'websiteURI', 'rating', 'userRatingCount', 'nationalPhoneNumber', 'reviews'],
        locationRestriction: bounds,
        maxResultCount: 20,
      });

      const mappedFirms: Firm[] = nearbyFirms.map(p => ({
        name: p.displayName || 'İsimsiz Firma',
        website: p.websiteURI || 'Web sitesi yok',
        location: p.formattedAddress || 'Adres yok',
        specialization: 'Yakın Mesafe VIP Dönüşüm Firması',
        popularity: `${p.rating || 0}/5 (${p.userRatingCount || 0} yorum)`,
        characteristics: 'Google Maps verisi ile konum bazlı bulundu.',
        phone: p.nationalPhoneNumber, // We'll add this to Firm interface
        rawDetails: p // Store raw details for the viewer
      }));
      
      if (mappedFirms.length === 0) {
        onError('Belirtilen konumda ve yarıçapta uygun firma bulunamadı.');
      } else {
        onError('');
      }
      
      onResults(mappedFirms);
    } catch (err: any) {
      console.error("Radius search error:", err);
      if (err.message && err.message.includes('Places API (New) has not been used')) {
        onError('Google Cloud Console üzerinden "Places API (New)" servisi etkinleştirilmemiş. Lütfen etkinleştirin.');
      } else {
        onError(err.message || 'Radius araması sırasında Google Maps API hatası oluştu.');
      }
    } finally {
      onLoading(false);
    }
  };

  const handleRadiusSearch = async () => {
    if (!placesLib || !address) {
      onError('Lütfen adres girin.');
      return;
    }
    onLoading(true);
    onError('');
    
    let center: any = cachedCenter;
    
    // Check if the input is a coordinate using regex
    const coordMatch = address.match(/^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?)\s*,\s*[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/);
    
    if (coordMatch) {
      const [latStr, lngStr] = address.split(',');
      center = { lat: parseFloat(latStr.trim()), lng: parseFloat(lngStr.trim()) };
      setCachedCenter(center);
      setLastSearchedAddress(address);
    } else if (address !== lastSearchedAddress || !center) {
      // Only geocode if the address changed
      try {
        const { places: geocodeResults } = await placesLib.Place.searchByText({
          textQuery: address,
          fields: ['location'],
          maxResultCount: 1
        });
        if (geocodeResults.length > 0 && geocodeResults[0].location) {
          center = geocodeResults[0].location as google.maps.LatLng;
          setCachedCenter(center);
          setLastSearchedAddress(address);
        } else {
          onError('Girdiğiniz adres bulunamadı.');
          onLoading(false);
          return;
        }
      } catch (err: any) {
        onError('Adres çevirisi yapılamadı: ' + err.message);
        onLoading(false);
        return;
      }
    }
    
    await executeSearch(center, radius);
  };

  // Debounced search when radius changes (only if we already have a cached center for the current address)
  useEffect(() => {
    if (cachedCenter && address === lastSearchedAddress) {
      const timer = setTimeout(() => {
        onLoading(true);
        executeSearch(cachedCenter, radius);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [radius, cachedCenter, address, lastSearchedAddress]);

  return (
    <div className="flex flex-col gap-4 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
      <div className="flex gap-4 items-end">
        <div className="flex-1 space-y-2">
          <label className="text-[10px] uppercase font-bold text-slate-500">Hedef Adres / Şehir</label>
          <input 
            type="text" 
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Örn: Stuttgart, Germany"
            onKeyDown={(e) => e.key === 'Enter' && handleRadiusSearch()}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-xs focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="w-32 space-y-2">
          <label className="text-[10px] uppercase font-bold text-slate-500">Yarıçap (Metre)</label>
          <input 
            type="number" 
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-xs"
          />
        </div>
        <button 
          onClick={handleRadiusSearch}
          className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-lg transition-colors"
        >
          <Navigation size={18} />
        </button>
      </div>
      <div className="flex items-center gap-4 px-2">
        <input 
          type="range" 
          min="1000" 
          max="1000000" 
          step="5000" 
          value={radius} 
          onChange={(e) => setRadius(Number(e.target.value))}
          className="flex-1 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
        <span className="text-[10px] font-mono text-slate-400">{(radius/1000).toFixed(1)} km</span>
      </div>
    </div>
  );
}

function GlobalAddressGuide() {
  const regions = [
    { name: 'Avrupa (Almanya)', format: 'Straße Nr., PLZ Stadt', example: 'Hauptstr. 12, 10115 Berlin' },
    { name: 'ABD', format: 'Nr Street, City, State ZIP', example: '1600 Amphitheatre Pkwy, Mountain View, CA 94043' },
    { name: 'Birleşik Krallık', format: 'Nr Street, City, Postcode', example: '10 Downing St, London SW1A 2AA' },
    { name: 'Japonya', format: 'Prefecture, City, Ward, Block', example: 'Tokyo, Shinjuku, Nishishinjuku, 2-8-1' },
    { name: 'BAE', format: 'Bldg, Street, Area, City', example: 'Burj Khalifa, Sheikh Zayed Rd, Dubai' }
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 h-full overflow-auto">
      <h3 className="text-sm font-bold uppercase tracking-widest text-blue-400 mb-4 flex items-center gap-2">
        <Globe size={16} /> Küresel Adres Formatı Rehberi
      </h3>
      <div className="space-y-4">
        {regions.map((r, i) => (
          <div key={i} className="group">
            <p className="text-[10px] font-bold text-slate-500 mb-1">{r.name}</p>
            <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 group-hover:border-blue-500/30 transition-colors">
              <p className="text-[11px] font-mono text-slate-300">{r.format}</p>
              <p className="text-[9px] text-slate-500 mt-1 italic">{r.example}</p>
            </div>
          </div>
        ))}
        <p className="text-[9px] text-slate-600 leading-relaxed mt-4">
          * Sistem 150+ ülke adres yapısını Google Maps entegrasyonu ile otomatik tanır. Bölgesel aramalar için yerel formatları kullanmanız doğruluğu artırır.
        </p>
      </div>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('arastirma');
  const [mapsKey, setMapsKey] = useState(() => localStorage.getItem('elitevan_maps_key') || GOOGLE_MAPS_ENV_KEY);
  const [geminiKey, setGeminiKey] = useState(() => localStorage.getItem('elitevan_gemini_key') || GEMINI_ENV_KEY);

  const activeMapsKey = mapsKey || GOOGLE_MAPS_ENV_KEY;

  const [searchMode, setSearchMode] = useState<SearchMode>('text');
  const [query, setQuery] = useState('Küresel VIP Van Dönüşüm Firmaları');
  const [firms, setFirms] = useState<Firm[]>([]);
  const [selectedResearchFirm, setSelectedResearchFirm] = useState<Firm | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // CRM State
  const [savedFirms, setSavedFirms] = useState<any[]>([]);
  const [selectedFirm, setSelectedFirm] = useState<any>(null);
  const [noteContent, setNoteContent] = useState('');

  // Automation State
  const [tasks, setTasks] = useState<any[]>([]);
  const [newCity, setNewCity] = useState('');

  // Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{role: string, content: string}[]>([
    { role: 'assistant', content: 'Merhaba! EliteVan sistem asistanıyım. VIP van pazarı veya sistem kullanımı hakkında size nasıl yardımcı olabilirim?' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Listen to saved firms
    const unsubscribeFirms = onSnapshot(collection(db, "firms"), (snapshot) => {
      setSavedFirms(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "firms");
    });
    // Listen to tasks
    const unsubscribeTasks = onSnapshot(collection(db, "tasks"), (snapshot) => {
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "tasks");
    });
    return () => {
      unsubscribeFirms();
      unsubscribeTasks();
    };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const results = await searchVIPConversionFirms(query, geminiKey);
      setFirms(results);
    } catch (err: any) {
      setError(err.message || 'Arama sırasında bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFirm = async (firm: Firm) => {
    try {
      const { rawDetails, ...firmDataToSave } = firm;
      await saveFirm(firmDataToSave);
      alert('Firma başarıyla rehbere kaydedildi.');
    } catch (err) {
      alert('Kaydetme hatası.');
    }
  };

  const handleSendChat = async () => {
    if (!chatInput.trim()) return;
    const newMessages = [...chatMessages, { role: 'user', content: chatInput }];
    setChatMessages(newMessages);
    setChatInput('');
    setIsChatLoading(true);
    try {
      const response = await axios.post('/api/chat', { 
        messages: newMessages,
        apiKey: geminiKey,
        context: {
          searchResults: firms
        }
      });
      setChatMessages([...newMessages, { role: 'assistant', content: response.data.content }]);
    } catch (err) {
      setChatMessages([...newMessages, { role: 'assistant', content: 'Üzgünüm, bir hata oluştu.' }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleAddTask = async () => {
    if (!newCity.trim()) return;
    // Support bulk add (comma separated)
    const cities = newCity.split(',').map(s => s.trim()).filter(Boolean);
    for (const city of cities) {
      await addTask(city);
    }
    setNewCity('');
  };

  const hasAnyMapsKey = Boolean(activeMapsKey) && activeMapsKey !== 'YOUR_API_KEY';

  return (
    <APIProvider apiKey={activeMapsKey} version="weekly">
      <div className="flex h-screen w-full bg-[#020617] text-slate-200 font-sans overflow-hidden">
        {/* Sidebar Navigation */}
        <aside className="w-16 lg:w-64 bg-[#0f172a] border-r border-slate-800 flex flex-col shrink-0">
          <div className="h-16 flex items-center px-4 border-b border-slate-800 shrink-0">
            <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center shrink-0">
               <Cpu size={18} className="text-white" />
            </div>
            <span className="ml-3 font-bold uppercase tracking-tighter text-sm hidden lg:block">Elite<span className="text-blue-400">Van</span> Hub</span>
          </div>
          
          <nav className="flex-1 p-2 space-y-1">
            {[
              { id: 'arastirma', label: 'Araştırma', icon: <Search size={20} /> },
              { id: 'rehber', label: 'Rehber (CRM)', icon: <Users size={20} /> },
              { id: 'otomasyon', label: 'Otomasyon', icon: <Terminal size={20} /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`w-full flex items-center p-3 rounded-lg transition-all ${
                  activeTab === tab.id ? 'bg-blue-600/20 text-blue-400 border border-blue-500/20' : 'text-slate-500 hover:bg-slate-800/50 hover:text-slate-300'
                }`}
              >
                {tab.icon}
                <span className="ml-3 font-medium text-xs hidden lg:block">{tab.label}</span>
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-slate-800">
             <button 
              onClick={() => setActiveTab('ayarlar')}
              className={`w-full flex items-center gap-3 p-2 rounded-lg transition-all ${
                activeTab === 'ayarlar' ? 'bg-blue-600/20 text-blue-400' : 'text-slate-500 hover:bg-slate-800/50'
              }`}
             >
               <div className={`w-8 h-8 rounded-full flex items-center justify-center border transition-colors ${
                 activeTab === 'ayarlar' ? 'bg-blue-500 border-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'bg-slate-800 border-slate-700'
               }`}>
                 <Settings size={14} className={activeTab === 'ayarlar' ? 'text-white' : 'text-slate-500'} />
               </div>
               <div className="hidden lg:block text-left overflow-hidden">
                 <p className="text-[10px] font-bold truncate">GEN-AI PANEL</p>
                 <p className="text-[9px] text-slate-500 truncate">Sürüm 2.0-Alpha</p>
               </div>
             </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="h-16 bg-[#1e293b]/50 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-6 shrink-0 relative z-20">
             <div className="flex items-center space-x-2">
               <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">
                 {activeTab === 'arastirma' && 'Pazar Araştırması'}
                 {activeTab === 'rehber' && 'Firma Rehberi & CRM'}
                 {activeTab === 'otomasyon' && 'Sistem Otomasyonları'}
                 {activeTab === 'ayarlar' && 'Sistem & API Yönetimi'}
               </h2>
             </div>
             <div className="flex items-center gap-3">
               <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 px-3 py-1 rounded-full">
                 <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                 <span className="text-[10px] font-bold text-green-500 uppercase tracking-tighter">Sistem Çevrimiçi</span>
               </div>
             </div>
          </header>

          <main className="flex-1 overflow-hidden relative">
            <AnimatePresence mode="wait">
               {activeTab === 'ayarlar' && (
                <motion.div 
                  key="ayarlar"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="h-full overflow-auto"
                >
                  <SettingsView 
                    mapsKey={mapsKey} 
                    setMapsKey={setMapsKey} 
                    geminiKey={geminiKey} 
                    setGeminiKey={setGeminiKey} 
                  />
                </motion.div>
              )}

              {activeTab === 'arastirma' && (
                <motion.div 
                  key="arastirma"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="h-full flex flex-col"
                >
                  {/* Map Warning inside Research if key empty */}
                  {!hasAnyMapsKey && searchMode === 'radius' && (
                    <div className="m-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-4 text-red-500">
                      <MapPin size={20} />
                      <div className="flex-1">
                        <p className="text-xs font-bold">Harita özelliği için API anahtarı girilmedi.</p>
                        <p className="text-[10px] opacity-70">Gerekli özelliği kullanmak için Ayarlar sekmesine gidin.</p>
                      </div>
                      <button 
                        onClick={() => setActiveTab('ayarlar')}
                        className="px-4 py-1.5 bg-red-500 text-white rounded-lg text-[10px] font-bold uppercase"
                      >
                        Ayarlar'a Git
                      </button>
                    </div>
                  )}

                  {/* Research Sub-Nav */}
                  <div className="flex px-6 pt-4 gap-4 bg-[#020617]">
                    <button 
                      onClick={() => setSearchMode('text')}
                      className={`text-[10px] font-bold uppercase tracking-widest pb-2 border-b-2 transition-colors ${searchMode === 'text' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-600 hover:text-slate-400'}`}
                    >
                      Metin Tabanlı Arama
                    </button>
                    <button 
                      onClick={() => setSearchMode('radius')}
                      className={`text-[10px] font-bold uppercase tracking-widest pb-2 border-b-2 transition-colors ${searchMode === 'radius' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-600 hover:text-slate-400'}`}
                    >
                      Konum & Yarıçap (Radius)
                    </button>
                  </div>

                  {/* Search Bar Container */}
                  <div className="p-4 border-b border-slate-800 bg-[#020617]/50">
                    {error && (
                      <div className="max-w-4xl mx-auto mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-[10px] font-bold flex items-center gap-2">
                        <Info size={14} /> {error}
                      </div>
                    )}
                    <div className="max-w-4xl mx-auto flex gap-6">
                      <div className="flex-1">
                        {searchMode === 'text' ? (
                          <form onSubmit={handleSearch} className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                            <input 
                              type="text"
                              value={query}
                              onChange={(e) => setQuery(e.target.value)}
                              placeholder="Konum veya firma tipi ile araştır..."
                              className="w-full bg-slate-900/80 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-xs focus:ring-1 focus:ring-blue-500/50 transition-all"
                            />
                            {loading && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400 animate-spin" />}
                          </form>
                        ) : (
                          <RadiusSearch onResults={setFirms} onLoading={setLoading} onError={setError} />
                        )}
                      </div>
                      
                      <div className="w-64 hidden xl:block shrink-0 h-[200px]">
                         <GlobalAddressGuide />
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 overflow-auto p-6 relative">
                    {selectedResearchFirm && (
                      <motion.div 
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="absolute inset-0 z-50 bg-[#020617] p-8 overflow-auto"
                      >
                         <button 
                           onClick={() => setSelectedResearchFirm(null)}
                           className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8"
                         >
                           <ChevronRight className="rotate-180" size={16} /> Geri Dön
                         </button>
                         
                         <div className="max-w-4xl mx-auto space-y-8">
                            <header className="flex justify-between items-start border-b border-slate-800 pb-8">
                               <div>
                                 <h2 className="text-4xl font-black uppercase tracking-tighter mb-4 text-white">{selectedResearchFirm.name}</h2>
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-400">
                                   <span className="flex items-center gap-2"><MapPin size={16} className="text-blue-400" /> {selectedResearchFirm.location}</span>
                                   <span className="flex items-center gap-2">
                                     <Globe size={16} className="text-blue-400" /> 
                                     <a href={selectedResearchFirm.website.startsWith('http') ? selectedResearchFirm.website : `https://${selectedResearchFirm.website}`} target="_blank" className="hover:text-blue-400 transition-colors">{selectedResearchFirm.website}</a>
                                   </span>
                                   {selectedResearchFirm.phone && (
                                     <span className="flex items-center gap-2"><MessageSquare size={16} className="text-green-400" /> {selectedResearchFirm.phone}</span>
                                   )}
                                   <span className="flex items-center gap-2"><Star size={16} className="text-yellow-500 fill-yellow-500" /> {selectedResearchFirm.popularity}</span>
                                 </div>
                               </div>
                               <button 
                                 onClick={() => {
                                   handleSaveFirm(selectedResearchFirm);
                                   setSelectedResearchFirm(null);
                                 }}
                                 className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold uppercase tracking-widest text-xs transition-all flex items-center gap-2"
                               >
                                 <Save size={16} /> CRM'e Kaydet
                               </button>
                            </header>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                              <div className="space-y-8">
                                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                                  <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-400 mb-4 flex items-center gap-2"><Layers size={14} /> Uzmanlık Alanı</h4>
                                  <p className="text-sm leading-relaxed text-slate-300">{selectedResearchFirm.specialization}</p>
                                </div>
                                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                                  <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-400 mb-4 flex items-center gap-2"><Activity size={14} /> Karakteristik ve Analiz</h4>
                                  <p className="text-sm text-slate-300 leading-relaxed italic">{selectedResearchFirm.characteristics}</p>
                                </div>
                              </div>

                              <div className="space-y-8">
                                {selectedResearchFirm.rawDetails && selectedResearchFirm.rawDetails.reviews && selectedResearchFirm.rawDetails.reviews.length > 0 && (
                                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                                    <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-400 mb-4 flex items-center gap-2"><Users size={14} /> Son Google Yorumları</h4>
                                    <div className="space-y-4 max-h-[400px] overflow-auto pr-2">
                                      {selectedResearchFirm.rawDetails.reviews.slice(0, 5).map((review: any, idx: number) => (
                                        <div key={idx} className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                                          <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-bold text-slate-300">{review.authorAttribution?.displayName || 'Kullanıcı'}</span>
                                            <span className="text-[10px] text-slate-500">{review.relativePublishTimeDescription}</span>
                                          </div>
                                          <div className="flex items-center gap-1 mb-2">
                                            {[...Array(review.rating)].map((_, i) => <Star key={i} size={10} className="text-yellow-500 fill-yellow-500" />)}
                                          </div>
                                          <p className="text-xs text-slate-400 italic line-clamp-4">{review.originalText?.text || review.text?.text}</p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                         </div>
                      </motion.div>
                    )}

                    {firms.length > 0 ? (
                      <div className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 ${selectedResearchFirm ? 'hidden' : ''}`}>
                        {firms.map((firm, i) => (
                          <div 
                            key={i} 
                            onClick={() => setSelectedResearchFirm(firm)}
                            className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-blue-500/50 hover:shadow-[0_0_30px_rgba(59,130,246,0.1)] transition-all flex flex-col group cursor-pointer"
                          >
                            <div className="flex justify-between items-start mb-4">
                              <h3 className="font-bold text-lg group-hover:text-blue-400 transition-colors pr-4">{firm.name}</h3>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSaveFirm(firm);
                                }}
                                className="p-2 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500 hover:text-white transition-all shrink-0"
                              >
                                <Save size={16} />
                              </button>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 mb-4 line-clamp-1">
                              <MapPin size={12} className="shrink-0" /> <span className="truncate">{firm.location}</span>
                            </div>
                            {firm.phone && (
                              <div className="flex items-center gap-2 text-[10px] text-slate-400 mb-4 line-clamp-1">
                                <MessageSquare size={12} className="shrink-0 text-green-400" /> <span className="truncate">{firm.phone}</span>
                              </div>
                            )}
                            <div className="space-y-3 flex-1 flex flex-col">
                               <div className="text-xs text-slate-300 line-clamp-2">{firm.specialization}</div>
                               <div className="flex items-center gap-2 mt-auto">
                                  <Star size={12} className="text-yellow-500 fill-yellow-500" />
                                  <span className="text-[10px] text-slate-400 font-bold">{firm.popularity}</span>
                               </div>
                            </div>
                            <div className="mt-4 flex gap-2">
                               <a 
                                 href={firm.website.startsWith('http') ? firm.website : `https://${firm.website}`}
                                 target="_blank"
                                 onClick={(e) => e.stopPropagation()}
                                 className="flex-1 py-2 bg-slate-800 rounded-xl text-[10px] font-bold uppercase tracking-widest text-center hover:bg-slate-700 transition-all text-slate-300 hover:text-white"
                               >
                                 Website <ExternalLink size={10} className="inline ml-1" />
                               </a>
                               <div className="flex-[2] py-2 bg-blue-600/10 text-blue-400 rounded-xl text-[10px] font-bold uppercase tracking-widest text-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                                 Detay Tablosu
                               </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center opacity-30">
                         <LineChart size={80} className="mb-4" />
                         <p className="text-sm font-medium">Büyük bir araştırma için yukarıya veri girin.</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

            {activeTab === 'rehber' && (
              <motion.div 
                key="rehber"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full flex"
              >
                {/* Firm List */}
                <div className="w-80 border-r border-slate-800 flex flex-col shrink-0 bg-[#0f172a]/30">
                   <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                     <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{savedFirms.length} Kayıtlı Firma</span>
                   </div>
                   <div className="flex-1 overflow-auto p-2 space-y-2">
                     {savedFirms.map(firm => (
                       <button 
                         key={firm.id}
                         onClick={() => setSelectedFirm(firm)}
                         className={`w-full text-left p-3 rounded-xl transition-all ${
                            selectedFirm?.id === firm.id ? 'bg-blue-600/10 border border-blue-500/30' : 'hover:bg-slate-800/50'
                         }`}
                       >
                         <p className="font-bold text-xs">{firm.name}</p>
                         <p className="text-[10px] text-slate-500 mt-1">{firm.location}</p>
                       </button>
                     ))}
                   </div>
                </div>

                {/* Detail Area */}
                <div className="flex-1 overflow-auto p-12">
                   {selectedFirm ? (
                     <div className="max-w-3xl mx-auto space-y-8">
                        <header className="flex justify-between items-end border-b border-slate-800 pb-8">
                           <div>
                             <h2 className="text-3xl font-black uppercase tracking-tighter mb-2">{selectedFirm.name}</h2>
                             <div className="flex items-center gap-4 text-xs text-slate-400">
                               <span className="flex items-center gap-1.5"><MapPin size={14} /> {selectedFirm.location}</span>
                               <span className="flex items-center gap-1.5"><Globe size={14} /> {selectedFirm.website}</span>
                             </div>
                           </div>
                           <button 
                             onClick={async () => {
                               if(confirm('Firmayı silmek istediğinize emin misiniz?')) {
                                 await deleteDoc(doc(db, "firms", selectedFirm.id));
                                 setSelectedFirm(null);
                               }
                             }}
                             className="p-3 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                           >
                             <Trash2 size={18} />
                           </button>
                        </header>

                        <div className="grid grid-cols-2 gap-8">
                           <div className="space-y-6">
                              <div>
                                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-400 mb-2">Uzmanlık & Pazar</h4>
                                <p className="text-sm leading-relaxed text-slate-300">{selectedFirm.specialization}</p>
                              </div>
                              <div>
                                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-400 mb-2">Genel Karakteristik</h4>
                                <p className="text-xs text-slate-500 leading-relaxed italic">{selectedFirm.characteristics}</p>
                              </div>
                           </div>

                           <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col">
                              <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-400 mb-4">Görüşme Notları</h4>
                              <div className="flex-1 space-y-2 mb-4 overflow-auto max-h-40 text-[11px]">
                                {selectedFirm.notes?.map((n: any, idx: number) => (
                                  <div key={idx} className="bg-slate-800/50 p-2 rounded-lg border border-slate-700">
                                    {n.content}
                                  </div>
                                ))}
                                {!selectedFirm.notes?.length && <p className="text-slate-600 italic">Henüz not eklenmemiş.</p>}
                              </div>
                              <div className="relative">
                                <textarea 
                                  value={noteContent}
                                  onChange={(e) => setNoteContent(e.target.value)}
                                  placeholder="Yeni not ekle..."
                                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs focus:ring-1 focus:ring-blue-500/50"
                                  rows={3}
                                />
                                <button 
                                  onClick={async () => {
                                    if(!noteContent.trim()) return;
                                    await addNote(selectedFirm.id, noteContent);
                                    setNoteContent('');
                                    alert('Not eklendi! (Sayfa yenilendiğinde görünecek)');
                                  }}
                                  className="absolute bottom-2 right-2 p-2 bg-blue-500 text-white rounded-lg"
                                >
                                  <Plus size={16} />
                                </button>
                              </div>
                           </div>
                        </div>
                     </div>
                   ) : (
                     <div className="h-full flex flex-col items-center justify-center opacity-20 text-center">
                        <Users size={64} className="mb-4" />
                        <h4 className="text-xl font-bold">CRM MERKEZİ</h4>
                        <p className="text-sm">Sol listeden bir firma seçerek detayları ve notları inceleyin.</p>
                     </div>
                   )}
                </div>
              </motion.div>
            )}

            {activeTab === 'otomasyon' && (
              <motion.div 
                key="otomasyon"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full p-12 overflow-auto"
              >
                <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
                   <div className="space-y-8">
                     <header>
                       <h3 className="text-2xl font-black tracking-tighter uppercase mb-2">Otomatik Tarama Gorevleri</h3>
                       <p className="text-xs text-slate-500 leading-relaxed">
                         Cronjob sistemimiz belirlediğiniz şehirleri periyodik olarak Google Maps üzerinde tarar ve yeni firmaları bulur.
                       </p>
                     </header>

                     <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#F27D26] mb-4">Yeni Sehir Ekle</h4>
                        <div className="flex gap-2">
                           <input 
                             type="text" 
                             value={newCity}
                             onChange={(e) => setNewCity(e.target.value)}
                             placeholder="Sehir ismi (Tr/En)..."
                             className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs focus:ring-1 focus:ring-[#F27D26]"
                           />
                           <button 
                             onClick={handleAddTask}
                             className="bg-[#F27D26] text-black font-bold uppercase px-6 rounded-xl text-xs"
                           >
                             Ekle
                           </button>
                        </div>
                     </div>

                     <div className="space-y-3">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Mevcut Gorevler</h4>
                        {tasks.map(task => (
                          <div key={task.id} className="flex items-center justify-between p-4 bg-slate-900/50 border border-slate-800 rounded-xl">
                             <div className="flex items-center gap-3">
                               <div className={`w-2 h-2 rounded-full ${task.status === 'isleniyor' ? 'bg-orange-500 animate-pulse' : 'bg-green-500'}`} />
                               <span className="text-xs font-bold uppercase">{task.city}</span>
                             </div>
                             <button onClick={() => deleteDoc(doc(db, "tasks", task.id))} className="text-slate-600 hover:text-red-400 transition-colors">
                               <Trash2 size={14} />
                             </button>
                          </div>
                        ))}
                     </div>
                   </div>

                   <div className="bg-slate-900/30 border border-slate-800 border-dashed rounded-3xl p-8 flex flex-col justify-center items-center text-center">
                      <div className="w-16 h-16 bg-blue-500/10 text-blue-400 rounded-full flex items-center justify-center mb-6">
                         <Activity size={32} />
                      </div>
                      <h4 className="text-lg font-bold uppercase mb-2 text-blue-400">Veri Wordlistesi</h4>
                      <p className="text-xs text-slate-500 leading-relaxed mb-6">
                        Sistem su anda global "VIP Van" pazarindaki 40+ anahtar kelimeyi ve 12 farkli dildeki firma turlerini otomatik eslestirebiliyor.
                      </p>
                      <div className="grid grid-cols-2 gap-2 w-full">
                         {['Luxury', 'VIP', 'V-Class', 'Sprinter', 'Modification', 'Bespoke'].map(w => (
                           <span key={w} className="bg-slate-800 text-[10px] py-1 rounded border border-slate-700">{w}</span>
                         ))}
                      </div>
                   </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Floating Chatbot */}
      <div className="fixed bottom-6 right-6 z-50">
        <button 
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-blue-500 transition-all border border-blue-400/30 group"
        >
          {isChatOpen ? <X size={24} /> : <MessageSquare size={24} className="group-hover:scale-110 transition-transform" />}
        </button>

        <AnimatePresence>
          {isChatOpen && (
            <motion.div 
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              className="absolute bottom-16 right-0 w-[400px] h-[550px] bg-[#0f172a] border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            >
              <header className="p-4 bg-blue-600/10 border-b border-slate-800 flex justify-between items-center">
                 <div className="flex items-center gap-3">
                   <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                     <Cpu size={16} />
                   </div>
                   <div>
                     <h4 className="text-[11px] font-bold uppercase tracking-widest leading-none">EliteVan AI</h4>
                     <p className="text-[9px] text-blue-400 mt-1 uppercase tracking-tighter">Ready with Grounding</p>
                   </div>
                 </div>
                 <div className="flex items-center gap-2">
                   <select className="bg-slate-900 border border-slate-800 text-[9px] rounded px-1 py-0.5 outline-none font-bold">
                     <option>Google Gemini</option>
                     <option>OpenRouter</option>
                   </select>
                 </div>
              </header>

              <div className="flex-1 overflow-auto p-4 space-y-4">
                 {chatMessages.map((msg, i) => (
                   <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                     <div className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${
                       msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-200 rounded-tl-none'
                     }`}>
                       {msg.content}
                     </div>
                   </div>
                 ))}
                 {isChatLoading && (
                   <div className="flex justify-start">
                      <div className="bg-slate-800 p-3 rounded-2xl rounded-tl-none flex gap-1">
                        <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" />
                        <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.1s]" />
                        <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.2s]" />
                      </div>
                   </div>
                 )}
                 <div ref={chatEndRef} />
              </div>

              <div className="p-4 border-t border-slate-800 bg-slate-900/50">
                 <div className="flex gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800">
                    <input 
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendChat()}
                      placeholder="Soru sorun..."
                      className="flex-1 bg-transparent border-none outline-none text-xs px-2"
                    />
                    <button 
                      onClick={handleSendChat}
                      className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-all"
                    >
                      <Send size={14} />
                    </button>
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      </div>
    </APIProvider>
  );
}
