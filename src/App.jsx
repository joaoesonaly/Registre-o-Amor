import { useState, useEffect, useRef } from 'react';
import { Upload, Image as ImageIcon, ChevronLeft, Heart, Camera, Check, Lock, Download, Trash2, Award, X } from 'lucide-react';
import { db } from './firebase';
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc } from 'firebase/firestore';

// Cole aqui a sua chave gratuita gerada no site api.imgbb.com
const IMGBB_API_KEY = "e32044365e6484130b3c4ade10a4b20d";

export default function App() {
  const [view, setView] = useState('home');
  const [guestName, setGuestName] = useState('');
  const [message, setMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  
  const [adminPin, setAdminPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [photos, setPhotos] = useState([]);

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const challenges = [
    "Uma foto em grupo da sua mesa",
    "Um momento engraçado do casal",
    "Os noivos se beijando",
    "Sorrisos espontâneos",
    "Alguém fazendo um brinde",
    "Os mais velhos se divertindo",
    "O melhor momento na pista de dança",
    "Uma selfie divertida com a noiva ou noivo"
  ];

  // LEITURA EM TEMPO REAL DAS FOTOS DO FIRESTORE
  useEffect(() => {
    const q = query(collection(db, "photos"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedPhotos = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPhotos(fetchedPhotos);
    });

    return () => unsubscribe();
  }, []);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // ENVIO DA FOTO E GUARDAR NO FIRESTORE
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsUploading(true);

    try {
      // 1. Upload da foto para o servidor de imagens ImgBB
      const formData = new FormData();
      formData.append('image', selectedFile);

      const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        const imageUrl = data.data.url;

        // 2. Grava os dados da foto no banco de dados em tempo real (Firestore)
        await addDoc(collection(db, "photos"), {
          url: imageUrl,
          author: guestName || 'Anônimo',
          message: message,
          date: new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }),
          timestamp: Date.now()
        });

        setIsUploading(false);
        setUploadSuccess(true);
        
        setTimeout(() => {
          setUploadSuccess(false);
          setGuestName('');
          setMessage('');
          setSelectedFile(null);
          setPreviewUrl(null);
          setView('gallery');
        }, 1500);
      } else {
        alert("Erro ao enviar a imagem. Verifique a chave do ImgBB.");
        setIsUploading(false);
      }
    } catch (error) {
      console.error("Erro no envio:", error);
      alert("Falha no envio da foto. Tente novamente.");
      setIsUploading(false);
    }
  };

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminPin === '1234') {
      setIsAdminLoggedIn(true);
      setPinError(false);
      setAdminPin('');
      setView('admin');
    } else {
      setPinError(true);
    }
  };

  const handleDeletePhoto = async (id) => {
    if (confirm('Tem certeza que deseja remover esta foto?')) {
      await deleteDoc(doc(db, "photos", id));
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] font-serif text-stone-800 selection:bg-rose-100 selection:text-stone-900">
      
      {/* HEADER FIXO */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-stone-200/80 px-4 py-3 shadow-sm">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          {view !== 'home' ? (
            <button 
              onClick={() => {
                setView('home');
                setUploadSuccess(false);
                setSelectedFile(null);
              }}
              className="flex items-center text-xs font-sans uppercase tracking-wider text-stone-600 hover:text-stone-900 transition-colors bg-stone-100 px-3 py-1.5 rounded-full"
            >
              <ChevronLeft size={14} className="mr-1" /> Voltar
            </button>
          ) : (
            <span className="text-xs uppercase tracking-widest text-stone-500 font-sans font-medium">João & Débora</span>
          )}

          <button 
            onClick={() => setView(isAdminLoggedIn ? 'admin' : 'admin-login')}
            className="flex items-center gap-1.5 text-xs font-sans text-amber-800 bg-amber-50 border border-amber-200/70 px-3.5 py-1.5 rounded-full transition-all hover:bg-amber-100/60 shadow-sm"
          >
            <Lock size={12} />
            <span>{isAdminLoggedIn ? 'Painel dos Noivos' : 'Área dos Noivos'}</span>
          </button>
        </div>
      </header>

      <div className="pt-16">
        
        {/* VISTA 1: HOME */}
        {view === 'home' && (
          <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-between p-6 text-center">
            <div className="my-auto flex flex-col items-center max-w-md w-full pt-4">
              <div className="w-20 h-20 bg-rose-50 border border-rose-100 rounded-full flex items-center justify-center mb-6 shadow-sm">
                <Heart className="text-rose-400 fill-rose-100" size={32} />
              </div>

              <span className="text-xs font-sans uppercase tracking-widest text-amber-700 font-semibold mb-2">Desafio: Capture o Amor</span>
              <h1 className="text-4xl sm:text-5xl font-serif text-stone-900 tracking-tight mb-2">
                João & Débora
              </h1>
              
              <p className="text-stone-500 font-sans text-xs sm:text-sm tracking-widest uppercase mb-6">
                21 . 11 . 2026
              </p>

              <div className="w-12 h-px bg-rose-200 mb-6"></div>

              <p className="text-base sm:text-lg italic text-stone-600 mb-10 max-w-sm font-light leading-relaxed">
                "Use a câmera sem medo, capture o amor em segredo! Envie suas fotos para eternizarmos este dia juntos."
              </p>
              
              <div className="flex flex-col w-full gap-3">
                <button 
                  onClick={() => setView('upload')}
                  className="w-full bg-stone-900 hover:bg-stone-800 text-white font-medium py-4 px-6 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-md active:scale-95 text-base"
                >
                  <Upload size={20} />
                  Enviar Foto & Mensagem
                </button>

                <div className="grid grid-cols-2 gap-3 w-full">
                  <button 
                    onClick={() => setView('gallery')}
                    className="bg-white hover:bg-stone-50 border border-stone-200 text-stone-800 py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-sm text-sm"
                  >
                    <ImageIcon size={17} />
                    Ver Galeria ({photos.length})
                  </button>
                  <button 
                    onClick={() => setView('challenges')}
                    className="bg-rose-50 hover:bg-rose-100/70 border border-rose-100 text-rose-800 py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 transition-all text-sm font-sans font-medium"
                  >
                    <Award size={17} />
                    Desafios da Mesa
                  </button>
                </div>
              </div>
            </div>

            <footer className="py-4 text-stone-400 text-xs uppercase tracking-widest font-sans">
              Escaneou, enviou. Sem baixar aplicativo.
            </footer>
          </div>
        )}

        {/* VISTA 2: DESAFIOS */}
        {view === 'challenges' && (
          <div className="max-w-xl mx-auto p-6 animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/80 shadow-sm">
              <div className="text-center mb-6">
                <span className="text-amber-700 text-xs font-sans tracking-widest uppercase font-bold">Ideias de Fotos</span>
                <h2 className="text-3xl text-stone-900 font-serif mt-1">Desafios da Festa</h2>
                <p className="text-stone-500 text-sm mt-2 italic">
                  Encontre momentos incríveis que talvez ninguém mais veja!
                </p>
              </div>

              <div className="space-y-3 mb-8">
                {challenges.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 bg-stone-50 p-3.5 rounded-2xl border border-stone-100">
                    <div className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center text-xs font-bold shrink-0">
                      ✓
                    </div>
                    <span className="text-stone-700 text-sm">{item}</span>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => setView('upload')}
                className="w-full bg-stone-900 hover:bg-stone-800 text-white py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all font-medium"
              >
                <Camera size={18} />
                Tirar e Enviar Foto
              </button>
            </div>
          </div>
        )}

        {/* VISTA 3: UPLOAD */}
        {view === 'upload' && (
          <div className="max-w-xl mx-auto p-6 animate-in fade-in duration-300">
            <div className="mb-6 text-center">
              <h2 className="text-3xl text-stone-900">Partilhe o seu olhar</h2>
              <p className="text-stone-500 text-sm mt-1">Envie suas fotos diretamente para João & Débora</p>
            </div>

            <form onSubmit={handleUpload} className="space-y-5">
              <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-sm space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-stone-500 mb-2 font-sans">Seu Nome</label>
                  <input 
                    type="text" 
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Ex: Júlia"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-200 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-stone-500 mb-2 font-sans">Deixe uma mensagem aos noivos (opcional)</label>
                  <textarea 
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Felicidades aos noivos! 🥰"
                    maxLength={200}
                    rows={3}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-200 transition-all resize-none"
                  />
                  <div className="text-right text-xs text-stone-400 mt-1 font-sans">
                    {message.length}/200
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-sm">
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  ref={fileInputRef}
                />
                <input 
                  type="file" 
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileSelect}
                  className="hidden"
                  ref={cameraInputRef}
                />
                
                {!selectedFile ? (
                  <div className="flex flex-col gap-3">
                    <button 
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="border-2 border-dashed border-rose-200 bg-rose-50/40 hover:bg-rose-50 rounded-2xl p-6 text-center transition-all flex flex-col items-center justify-center gap-2 cursor-pointer group"
                    >
                      <div className="w-12 h-12 bg-rose-100/80 rounded-full flex items-center justify-center text-rose-600 group-hover:scale-110 transition-transform">
                        <Camera size={24} />
                      </div>
                      <p className="text-stone-800 font-medium">Tirar Foto Agora</p>
                      <span className="text-xs text-stone-500 font-sans">Abre a câmera do celular</span>
                    </button>

                    <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="border border-stone-200 bg-stone-50 hover:bg-stone-100 rounded-xl p-4 text-center transition-all flex items-center justify-center gap-2 text-stone-700 text-sm font-sans"
                    >
                      <ImageIcon size={18} />
                      Escolher foto da Galeria
                    </button>
                  </div>
                ) : (
                  <div className="relative rounded-2xl overflow-hidden border border-stone-200">
                    <img 
                      src={previewUrl} 
                      alt="Preview" 
                      className="w-full h-64 object-cover"
                    />
                    <button 
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        setPreviewUrl(null);
                      }}
                      className="absolute top-3 right-3 bg-stone-900/80 text-white p-2 rounded-full hover:bg-stone-900 transition-colors"
                    >
                      <X size={18} />
                    </button>
                  </div>
                )}
              </div>

              <button 
                type="submit"
                disabled={!selectedFile || isUploading}
                className={`w-full py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md font-medium text-lg ${
                  !selectedFile 
                    ? 'bg-stone-200 text-stone-400 cursor-not-allowed' 
                    : uploadSuccess
                      ? 'bg-emerald-600 text-white'
                      : 'bg-stone-900 hover:bg-stone-800 text-white active:scale-95'
                }`}
              >
                {isUploading ? (
                  <span className="animate-pulse">Enviando foto...</span>
                ) : uploadSuccess ? (
                  <>
                    <Check size={20} /> Enviado com Sucesso!
                  </>
                ) : (
                  'Confirmar e Enviar'
                )}
              </button>
            </form>
          </div>
        )}

        {/* VISTA 4: GALERIA EM TEMPO REAL */}
        {view === 'gallery' && (
          <div className="max-w-4xl mx-auto p-6 animate-in fade-in duration-300">
            <div className="mb-8 text-center">
              <h2 className="text-3xl text-stone-900">Galeria de Amor</h2>
              <p className="text-stone-500 text-sm mt-1">Fotos enviadas pelos convidados ao vivo</p>
            </div>

            {photos.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-3xl border border-stone-200/80">
                <p className="text-stone-500 font-sans">Nenhuma foto enviada ainda. Seja o primeiro!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {photos.map((photo) => (
                  <div key={photo.id} className="bg-white rounded-2xl p-3 border border-stone-200/80 shadow-sm flex flex-col justify-between">
                    <div className="aspect-[4/5] rounded-xl overflow-hidden bg-stone-100 mb-3 relative group">
                      <img 
                        src={photo.url} 
                        alt={`Foto de ${photo.author}`}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="px-1 pb-1">
                      <p className="font-medium text-stone-800 text-sm">{photo.author}</p>
                      {photo.message && (
                        <p className="text-xs text-stone-500 italic mt-1 font-light">"{photo.message}"</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VISTA 5: LOGIN NOIVOS */}
        {view === 'admin-login' && (
          <div className="max-w-md mx-auto p-6 animate-in fade-in duration-300">
            <div className="bg-white p-8 rounded-3xl border border-stone-200/80 shadow-md text-center space-y-6">
              <div className="w-16 h-16 bg-amber-50 border border-amber-200/80 rounded-full flex items-center justify-center mx-auto text-amber-700">
                <Lock size={28} />
              </div>

              <div>
                <h2 className="text-2xl text-stone-900 font-serif">Área dos Noivos</h2>
                <p className="text-xs text-stone-500 mt-1">Acesso exclusivo para João & Débora baixarem as fotos.</p>
              </div>

              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div>
                  <input 
                    type="password"
                    value={adminPin}
                    onChange={(e) => {
                      setAdminPin(e.target.value);
                      setPinError(false);
                    }}
                    placeholder="Senha de acesso"
                    className="w-full bg-stone-50 border border-stone-200 text-center text-xl tracking-widest rounded-xl py-3 text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-300"
                    autoFocus
                  />
                  {pinError && (
                    <p className="text-rose-500 text-xs mt-2">Senha incorreta. (Senha padrão: 1234)</p>
                  )}
                </div>

                <button 
                  type="submit"
                  className="w-full bg-amber-800 hover:bg-amber-900 text-white font-medium py-3 rounded-xl transition-all shadow-sm"
                >
                  Entrar no Painel
                </button>
              </form>
            </div>
          </div>
        )}

        {/* VISTA 6: PAINEL DOS NOIVOS */}
        {view === 'admin' && (
          <div className="max-w-5xl mx-auto p-6 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 bg-white p-6 rounded-3xl border border-amber-200/60 shadow-sm">
              <div>
                <span className="text-amber-800 text-xs font-sans uppercase tracking-widest font-bold">Painel de Download</span>
                <h2 className="text-3xl text-stone-900 font-serif mt-1">Fotos dos Convidados</h2>
                <p className="text-stone-500 text-sm mt-1">Total acumulado: <span className="text-amber-800 font-bold">{photos.length} fotos</span></p>
              </div>

              <button 
                onClick={() => {
                  setIsAdminLoggedIn(false);
                  setView('home');
                }}
                className="self-start sm:self-auto bg-stone-100 border border-stone-200 text-stone-600 px-4 py-2 rounded-xl text-xs font-sans hover:text-stone-900"
              >
                Sair do Painel
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {photos.map((photo) => (
                <div key={photo.id} className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-sm flex flex-col justify-between space-y-4">
                  <div className="relative aspect-[4/5] rounded-xl overflow-hidden bg-stone-100">
                    <img 
                      src={photo.url} 
                      alt={`Foto de ${photo.author}`}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <p className="font-medium text-stone-900 text-base">{photo.author}</p>
                      <span className="text-[10px] text-stone-400 font-sans">{photo.date}</span>
                    </div>

                    {photo.message ? (
                      <p className="text-stone-600 text-sm bg-stone-50 p-3 rounded-xl border border-stone-100 italic">
                        "{photo.message}"
                      </p>
                    ) : (
                      <p className="text-stone-400 text-xs italic">Sem mensagem.</p>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-stone-100">
                    <a 
                      href={photo.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex-1 bg-stone-900 hover:bg-stone-800 text-white py-2 rounded-xl text-xs font-sans flex items-center justify-center gap-1 transition-colors"
                    >
                      <Download size={14} /> Download
                    </a>
                    <button 
                      onClick={() => handleDeletePhoto(photo.id)}
                      className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 px-3 py-2 rounded-xl text-xs flex items-center justify-center transition-colors"
                      title="Excluir foto"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}