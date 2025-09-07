import React, { useState, useCallback, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI, Modality, Part } from "@google/genai";

// --- TYPES & INTERFACES ---

interface HistoryItem {
    id: string;
    image: string;
    prompt: string;
    aspectRatio: string;
}

// --- CONSTANTS & CONFIGURATION ---

const PRESETS: { [key: string]: { name: string; prompt: string } } = {
  'xeebta': {
    name: 'Xeebta (Golden Hour Coast)',
    prompt: 'Sawir madax dhow oo qofka ka muuqda, xiran dhar dhaqameed fudud. Iftiinka dahabiga ah ee qorrax-dhaca, neecaw fudud, oo badda gadaal ka muuqato.',
  },
  'dhulka': {
    name: 'Dhulka (Nomadic Dunes)',
    prompt: 'Sawir qofka oo dhex taagan ciid bacaad ah oo ballaaran. Iftiinka diirran ee galabnimada, xiran macawis, oo muuqaal cajiib ah.',
  },
  'saqafka': {
    name: 'Saqafka Muqdisho (Mogadishu Rooftop)',
    prompt: 'Sawirka qofka oo saqafka sare ee dhismo ku yaal Muqdisho, oo magaalada gadaal ka muuqato. Iftiinka dambe ee galabta, qaab dabiici ah.',
  }
};

const ASPECT_RATIOS = ['1:1', '4:5', '16:9', '2.39:1'];

const fileToGenerativePart = async (file: File): Promise<Part> => {
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(file);
    });
    return {
        inlineData: {
            data: await base64EncodedDataPromise,
            mimeType: file.type,
        },
    };
};

const dataURLtoFile = (dataurl: string, filename: string): File | null => {
    const arr = dataurl.split(',');
    if (arr.length < 2) { return null; }
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) { return null; }
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
};


// --- HELPER & UI COMPONENTS ---
const UploadIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>);
const RemoveIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>);
const EmptyStateIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="empty-state-icon"><path d="M12 3c-1.2 0-2.4.6-3 1.7A3.2 3.2 0 0 0 6 8c0 1.7 1.3 3 3 3h6c1.7 0 3-1.3 3-3a3.2 3.2 0 0 0-3-3.3c-.6-1.1-1.8-1.7-3-1.7Z"></path><path d="M12 12v4"></path><path d="M10.5 15.5a1.5 1.5 0 0 1-3 0"></path><path d="m7.5 15.5 1.5-1.5"></path><path d="m13.5 15.5 1.5-1.5"></path><path d="M16.5 15.5a1.5 1.5 0 0 0-3 0"></path><path d="M12 21a9 9 0 0 0 9-9h-3a6 6 0 0 1-6 6v3Z"></path><path d="M3 12a9 9 0 0 0 9 9v-3a6 6 0 0 1-6-6H3Z"></path></svg>);
const HistoryViewIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>);
const HistoryReuseIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>);
const HistoryDeleteIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>);

interface ImageSlotProps {
    image: string | null;
    onFilesChange: (files: FileList | null) => void;
    index: number;
}


const ImageSlot: React.FC<ImageSlotProps> = ({ image, onFilesChange, index }) => {
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            onFilesChange(e.target.files);
        }
    };

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        onFilesChange(null);
    };

    const inputId = `file-input-${index}`;

    return (
        <label htmlFor={inputId} className="image-slot" style={{ backgroundImage: image ? `url(${image})` : 'none' }}>
            {image ? (
                <button className="remove-btn" onClick={handleRemove} aria-label="Ka saar sawirka"><RemoveIcon /></button>
            ) : (
                <div className="image-slot-placeholder">
                    <UploadIcon />
                    <span>Sawirka {index + 1}</span>
                </div>
            )}
            <input
                id={inputId}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
                aria-label={`Soo daji sawirka ${index + 1}`}
                multiple
            />
        </label>
    );
};


// --- MAIN APP COMPONENT ---

const App = () => {
    // Core state
    const [referenceFiles, setReferenceFiles] = useState<(File | null)[]>(Array(4).fill(null));
    const [imagePreviews, setImagePreviews] = useState<(string | null)[]>(Array(4).fill(null));
    const [prompt, setPrompt] = useState<string>('');
    const [generatedContent, setGeneratedContent] = useState<{ text?: string; image?: string }[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [aspectRatio, setAspectRatio] = useState<string>('1:1');
    
    // UI state
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [loadingMessage, setLoadingMessage] = useState<string>('');
    const [activeTab, setActiveTab] = useState('controls');
    
    // Presets and History state
    const [customPresets, setCustomPresets] = useState<{ [key: string]: string }>({});
    const [selectedPreset, setSelectedPreset] = useState<string>('');
    const [history, setHistory] = useState<HistoryItem[]>([]);

    const canGenerate = referenceFiles.some(file => file !== null) && prompt.trim() !== '';

    // --- LOCALSTORAGE EFFECTS ---
    useEffect(() => {
        try {
            const savedPresets = localStorage.getItem('characterStudioUserPresets');
            if (savedPresets) setCustomPresets(JSON.parse(savedPresets));
            const savedHistory = localStorage.getItem('characterStudioHistory');
            if (savedHistory) setHistory(JSON.parse(savedHistory));
        } catch (e) {
            console.error("Failed to load data from localStorage.", e);
        }
    }, []);
    
    useEffect(() => {
        try {
            localStorage.setItem('characterStudioUserPresets', JSON.stringify(customPresets));
        } catch (e) { console.error("Failed to save presets to localStorage.", e); }
    }, [customPresets]);

    useEffect(() => {
        try {
            localStorage.setItem('characterStudioHistory', JSON.stringify(history));
        } catch (e) { console.error("Failed to save history to localStorage.", e); }
    }, [history]);

    // --- UI & DATA HANDLING EFFECTS ---
    useEffect(() => {
        const urls = referenceFiles.map(file => file ? URL.createObjectURL(file) : null);
        setImagePreviews(urls);
        return () => { urls.forEach(url => { if (url) URL.revokeObjectURL(url); }); };
    }, [referenceFiles]);
    
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isLoading) {
            const messages = ['Waanu diyaarinaynaa sawirkaaga...', 'Falanqaynta sawirada tixraaca...', 'Isku darka hal-abuurka...', 'Ku dhowaad dhammaad...'];
            let i = 0;
            setLoadingMessage(messages[i]);
            interval = setInterval(() => {
                i = (i + 1) % messages.length;
                setLoadingMessage(messages[i]);
            }, 2500);
        }
        return () => clearInterval(interval);
    }, [isLoading]);

    const handleFileChange = useCallback((startIndex: number, files: FileList | null) => {
        setReferenceFiles(prev => {
            const newFiles = [...prev];
            if (files === null) {
                newFiles[startIndex] = null;
                return newFiles;
            }
            const filesToUpload = Array.from(files);
            let fileIndex = 0;
            newFiles[startIndex] = filesToUpload[fileIndex++];
            if (fileIndex >= filesToUpload.length) return newFiles;
            for (let i = startIndex + 1; i < newFiles.length && fileIndex < filesToUpload.length; i++) {
                if (newFiles[i] === null) newFiles[i] = filesToUpload[fileIndex++];
            }
            if (fileIndex >= filesToUpload.length) return newFiles;
            for (let i = 0; i < startIndex && fileIndex < filesToUpload.length; i++) {
                 if (newFiles[i] === null) newFiles[i] = filesToUpload[fileIndex++];
            }
            return newFiles;
        });
    }, []);

    // --- PRESET HANDLERS ---
    const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const key = e.target.value;
        setSelectedPreset(key);
        if (key in PRESETS) setPrompt(PRESETS[key as keyof typeof PRESETS].prompt);
        else if (key in customPresets) setPrompt(customPresets[key]);
        else setPrompt('');
    };
    
    const handleSavePreset = () => {
        if (!prompt.trim()) { alert("Dardaaranku ma bannaanaan karo si loo keydiyo."); return; }
        const name = window.prompt("Fadlan geli magac qaabkan cusub:");
        if (name && name.trim()) {
            const trimmedName = name.trim();
            if (PRESETS[trimmedName.toLowerCase()] || customPresets[trimmedName]) {
                alert("Magacan horey ayaa loo isticmaalay. Fadlan dooro mid kale."); return;
            }
            setCustomPresets(prev => ({ ...prev, [trimmedName]: prompt }));
            setSelectedPreset(trimmedName);
            alert(`Qaabka "${trimmedName}" waa la keydiyay!`);
        }
    };
    
    const handleDeletePreset = () => {
        if (selectedPreset && customPresets[selectedPreset]) {
            if (window.confirm(`Ma hubtaa inaad tirtirto qaabka "${selectedPreset}"?`)) {
                setCustomPresets(prev => {
                    const newPresets = { ...prev };
                    delete newPresets[selectedPreset];
                    return newPresets;
                });
                setPrompt('');
                setSelectedPreset('');
            }
        }
    };
    
    // --- DRAG AND DROP HANDLERS ---
    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); };
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
        if (files.length > 0) {
            handleFileChange(0, e.dataTransfer.files);
        }
    };
    
    // --- HISTORY HANDLERS ---
    const viewHistoryItem = (item: HistoryItem) => {
        setGeneratedContent([{ image: item.image }]);
        setAspectRatio(item.aspectRatio);
    };

    const reuseHistoryItem = (item: HistoryItem) => {
        setPrompt(item.prompt);
        setAspectRatio(item.aspectRatio);
        setActiveTab('controls');
        alert("Dardaaranka iyo goobaha waa la soo celiyay. Fadlan soo geli sawirro tixraac cusub.");
    };

    const deleteHistoryItem = (idToDelete: string) => {
        if (window.confirm("Ma hubtaa inaad tirtirto shaygan taariikhda?")) {
            setHistory(prev => prev.filter(item => item.id !== idToDelete));
        }
    };

    const clearHistory = () => {
        if (window.confirm("Ma hubtaa inaad tirtirto dhammaan taariikhdaada? Tallaabadan dib looma celin karo.")) {
            setHistory([]);
        }
    };

    // --- SAVE & SHARE HANDLERS ---
    const handleSave = (quality: number) => {
        const imageUrl = generatedContent.find(c => c.image)?.image;
        if (!imageUrl) return;

        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0);
            const dataUrl = canvas.toDataURL('image/jpeg', quality);
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = `character-studio-${Date.now()}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        };
        img.src = imageUrl;
    };

    const handleShare = async () => {
        const imageUrl = generatedContent.find(c => c.image)?.image;
        if (!imageUrl || !navigator.share) {
            alert("Wadaagista laguma heli karo biraawsarkan.");
            return;
        }

        try {
            const file = dataURLtoFile(imageUrl, `character-studio-${Date.now()}.png`);
            if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: 'Hal-abuurkayga Character Studio',
                    text: 'Fiiri sawirkan aan abuuray!',
                });
            } else {
                alert("Wadaagista faylasha laguma taageero biraawsarkan.");
            }
        } catch (error) {
            console.error('Cilad wadaagista:', error);
        }
    };

    // --- CORE GENERATION LOGIC ---
    const handleGenerate = async () => {
        if (!canGenerate) return;
        setIsLoading(true);
        setError(null);
        setGeneratedContent([]);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const imageParts = await Promise.all(
                referenceFiles.filter((f): f is File => f !== null).map(fileToGenerativePart)
            );

            const allParts: Part[] = [...imageParts, { text: `Astaamaha wejiga ka ilaali sawiradan tixraaca ah. ${prompt}` }];
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image-preview',
                contents: { parts: allParts },
                config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
            });

            const content: { text?: string; image?: string }[] = [];
            for (const part of response.candidates[0].content.parts) {
                if (part.text) {
                    content.push({ text: part.text });
                } else if (part.inlineData) {
                    const imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                    content.push({ image: imageUrl });
                    const newHistoryItem: HistoryItem = {
                        id: Date.now().toString(),
                        image: imageUrl,
                        prompt: prompt,
                        aspectRatio: aspectRatio
                    };
                    setHistory(prev => [newHistoryItem, ...prev]);
                }
            }
            if (content.find(c => c.image)) {
                setGeneratedContent(content);
            } else {
                 setError("Lama soo saarin wax sawir ah. Fadlan isku day dardaaran kale.");
            }
        } catch (e) {
            console.error(e);
            setError("Cillad ayaa dhacday. Fadlan hubi konsoolka wixii faahfaahin ah.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="app-container">
            <header>
                <h1>Character Studio — Somali Edition</h1>
            </header>
            <main className="main-content">
                <div className="panel" id="left-panel">
                    <div className="panel-header">Soo daji Sawir Tixraac ah</div>
                    <div className="image-uploader" onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop} data-dragging={isDragging}>
                        <div className="image-grid">
                            {imagePreviews.map((img, i) => (
                                <ImageSlot key={i} index={i} image={img} onFilesChange={(files) => handleFileChange(i, files)} />
                            ))}
                        </div>
                         <div className="drop-prompt">{isDragging ? 'Hadda Soo Daadi Sawirada!' : 'Ama halkan ku soo jiid sawirada'}</div>
                    </div>
                </div>

                <div className="panel result-display" id="center-panel">
                  <div className="result-content">
                    {isLoading ? (
                        <>
                            <div className="loader"><div></div><div></div><div></div></div>
                            <p className="loading-message">{loadingMessage}</p>
                        </>
                    ) : error ? (
                         <p className="error-message">{error}</p>
                    ) : generatedContent.find(c => c.image) ? (
                        <>
                        {generatedContent.map((content, index) => (
                            content.image && 
                            <div key={index} className={`generated-image-wrapper aspect-${aspectRatio.replace(':', '-').replace('.', '-')}`}>
                                <img src={content.image} alt="Generated content" className="generated-image" />
                            </div>
                        ))}
                        <div className="result-actions">
                            <div className="save-group">
                                <button onClick={() => handleSave(0.95)} title="Keydi tayada sare (JPEG)">HD</button>
                                <button onClick={() => handleSave(0.75)} title="Keydi tayada dhexe (JPEG)">Dhexe</button>
                                <button onClick={() => handleSave(0.5)} title="Keydi tayada hoose (JPEG)">Hoose</button>
                            </div>
                            {navigator.share && <button className="share-btn" onClick={handleShare}>Wadaag</button>}
                        </div>
                        {generatedContent.find(c => c.text) && <p className="generated-text">{generatedContent.find(c => c.text)?.text}</p>}
                        </>
                    ) : (
                        <div className="result-placeholder">
                           <EmptyStateIcon />
                           <p>Natiijooyinkaaga halkan ayay ka soo muuqan doonaan.</p>
                           <span>Buuxi sawirada tixraaca oo qor dardaaran si aad u bilowdo.</span>
                        </div>
                    )}
                  </div>
                </div>

                <div className="panel" id="right-panel">
                     <div className="panel-tabs">
                        <button className={`tab-btn ${activeTab === 'controls' ? 'active' : ''}`} onClick={() => setActiveTab('controls')}>Xakamaynta</button>
                        <button className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
                            Taariikhda 
                            <span className="history-count">{history.length}</span>
                        </button>
                     </div>
                     {activeTab === 'controls' ? (
                        <div className="controls-form">
                            <div className="form-group">
                                <div className="label-group">
                                    <label htmlFor="prompt-input">Dardaaran (Prompt)</label>
                                    <button className="save-preset-btn" onClick={handleSavePreset} title="Keydi dardaaranka hadda jira">Keydi</button>
                                </div>
                                <textarea id="prompt-input" className="prompt-textarea" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Ku qor sharraxaadda sawirkaaga halkan..." rows={5}/>
                            </div>
                            <div className="form-group">
                                <label htmlFor="presets-select">Qaababka Horay Loo Diyaariyey</label>
                                <div className="preset-controls">
                                    <div className="select-wrapper">
                                        <select id="presets-select" className="presets-select" onChange={handlePresetChange} value={selectedPreset}>
                                            <option value="" disabled>Dooro qaab...</option>
                                            <optgroup label="Qaababka Asalka ah">
                                            {Object.entries(PRESETS).map(([key, { name }]) => (<option key={key} value={key}>{name}</option>))}
                                            </optgroup>
                                            {Object.keys(customPresets).length > 0 && (
                                                <optgroup label="Qaababkaaga">
                                                    {Object.entries(customPresets).map(([name]) => (<option key={name} value={name}>{name}</option>))}
                                                </optgroup>
                                            )}
                                        </select>
                                    </div>
                                    {selectedPreset && customPresets[selectedPreset] && (
                                        <button onClick={handleDeletePreset} className="delete-preset-btn" title={`Tirtir qaabka ${selectedPreset}`}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="form-group">
                                 <label>Cabirka Sawirka (Aspect Ratio)</label>
                                 <div className="aspect-ratio-group">
                                    {ASPECT_RATIOS.map((ratio) => (
                                        <label key={ratio} className="aspect-ratio-label">
                                            <input type="radio" name="aspect-ratio" value={ratio} checked={aspectRatio === ratio} onChange={(e) => setAspectRatio(e.target.value)} className="aspect-ratio-input"/>
                                            <span className="aspect-ratio-button">{ratio}</span>
                                        </label>
                                    ))}
                                 </div>
                            </div>
                            <button className="generate-btn" onClick={handleGenerate} disabled={!canGenerate || isLoading}>
                                {isLoading ? 'Waa Socotaa...' : 'Abuur Sawir'}
                            </button>
                        </div>
                     ) : (
                        <div className="history-view">
                            {history.length > 0 ? (
                                <>
                                    <div className="history-grid">
                                        {history.map(item => (
                                            <div key={item.id} className="history-item">
                                                <img src={item.image} alt={item.prompt} className="history-thumbnail"/>
                                                <div className="history-item-overlay">
                                                    <p className="history-item-prompt">{item.prompt}</p>
                                                    <div className="history-item-actions">
                                                        <button onClick={() => viewHistoryItem(item)} title="Fiiri"><HistoryViewIcon /></button>
                                                        <button onClick={() => reuseHistoryItem(item)} title="Dib u isticmaal"><HistoryReuseIcon /></button>
                                                        <button onClick={() => deleteHistoryItem(item.id)} title="Tirtir"><HistoryDeleteIcon /></button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <button onClick={clearHistory} className="clear-history-btn">Nadiifi Dhammaan Taariikhda</button>
                                </>
                            ) : (
                                <div className="history-empty-state">
                                    <p>Taariikhdaadu waa madhan tahay.</p>
                                    <span>Sawirada aad abuurto halkan ayay ka soo muuqan doonaan.</span>
                                </div>
                            )}
                        </div>
                     )}
                </div>
            </main>
        </div>
    );
};

const container = document.getElementById('root');
if (container) {
    const root = createRoot(container);
    root.render(<React.StrictMode><App /></React.StrictMode>);
}
