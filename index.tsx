
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI, Modality, Part } from "@google/genai";
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// --- TYPES & INTERFACES ---

interface HistoryItem {
    id: string;
    image: string;
    prompt: string;
    aspectRatio: string;
}

// --- LIB: TRANSLATIONS, CONSTANTS, UTILS ---

const translations = {
    en: {
        title: "Character Studio",
        landingTitle: "Character Studio",
        landingSubtitle: "Bring your characters to life. Generate beautiful, consistent images using your photos and the power of AI.",
        startCreating: "Start Creating",
        whatIsPossible: "What's Possible",
        uploadReference: "Upload Reference Images",
        dragAndDrop: "or drag & drop images here",
        draggingPrompt: "Release to Upload!",
        imageSlotLabel: "Image",
        removeImage: "Remove image",
        uploadImage: "Upload image",
        resultsPlaceholder: "Your results will appear here.",
        resultsInstructions: "Upload reference images and write a prompt to begin.",
        saveHD: "Save High Quality (JPEG)",
        saveMedium: "Save Medium Quality (JPEG)",
        saveLow: "Save Low Quality (JPEG)",
        share: "Share",
        edit: "Edit",
        upscale: "Upscale",
        upscaleComingSoon: "Upscale feature is coming soon!",
        generateEdit: "Generate Edit",
        cancel: "Cancel",
        resetMask: "Reset Mask",
        brushSize: "Brush Size",
        describeChanges: "Describe your changes...",
        editingInProgress: "Editing in progress...",
        noShareSupport: "Sharing is not available on this browser.",
        noFileShareSupport: "File sharing is not supported on this browser.",
        shareError: "Error sharing:",
        controls: "Controls",
        history: "History",
        prompt: "Prompt",
        savePreset: "Save current prompt as a preset",
        save: "Save",
        promptPlaceholder: "Describe your desired image here...",
        presets: "Presets",
        deletePreset: "Delete preset",
        selectPreset: "Select a preset...",
        defaultPresets: "Default Presets",
        yourPresets: "Your Presets",
        aspectRatio: "Aspect Ratio",
        generate: "Generate Image",
        generating: "Generating...",
        historyEmpty: "Your history is empty.",
        historyEmptySub: "Generated images will appear here.",
        view: "View",
        reuse: "Reuse",
        delete: "Delete",
        clearHistory: "Clear All History",
        errorOccurred: "An error occurred. Please check the console for details.",
        noImageGenerated: "No image was generated. Please try a different prompt.",
        loading1: "Preparing your canvas...",
        loading2: "Analyzing reference images...",
        loading3: "Mixing in some creativity...",
        loading4: "Almost there...",
        confirmDeleteHistory: "Are you sure you want to delete your entire history? This action cannot be undone.",
        confirmDeleteItem: "Are you sure you want to delete this history item?",
        promptCannotBeEmpty: "Prompt cannot be empty to save as a preset.",
        enterPresetName: "Please enter a name for this new preset:",
        presetNameExists: "This preset name already exists. Please choose another one.",
        presetSaved: 'Preset "{name}" saved!',
        confirmDeletePreset: 'Are you sure you want to delete the preset "{name}"?',
        settingsRestored: "Prompt and settings have been restored. Please upload new reference images.",
        imageSavedSuccess: 'Image saved successfully!',
        adjust: "Adjust",
        crop: "Crop",
        mask: "Mask (AI)",
        brightness: "Brightness",
        contrast: "Contrast",
        saturate: "Saturation",
        applyChanges: "Apply Changes",
        resetAdjustments: "Reset",
        upload: "Upload",
    },
    so: {
        title: "Character Studio",
        landingTitle: "Character Studio",
        landingSubtitle: "Noolayn jilayaashaada. Samee sawirro qurux badan oo isku mid ah adigoo isticmaalaya sawiradaada iyo awoodda AI.",
        startCreating: "Bilow Abuurista",
        whatIsPossible: "Waxa Suurtogalka ah",
        uploadReference: "Soo daji Sawir Tixraac ah",
        dragAndDrop: "Ama halkan ku soo jiid sawirada",
        draggingPrompt: "Hadda Soo Daadi Sawirada!",
        imageSlotLabel: "Sawirka",
        removeImage: "Ka saar sawirka",
        uploadImage: "Soo daji sawirka",
        resultsPlaceholder: "Natiijooyinkaaga halkan ayay ka soo muuqan doonaan.",
        resultsInstructions: "Buuxi sawirada tixraaca oo qor dardaaran si aad u bilowdo.",
        saveHD: "Keydi tayada sare (JPEG)",
        saveMedium: "Keydi tayada dhexe (JPEG)",
        saveLow: "Keydi tayada hoose (JPEG)",
        share: "Wadaag",
        edit: "Wax Ka Beddel",
        upscale: "Kordhi",
        upscaleComingSoon: "Astaanta Kordhinta dhawaan ayaa la heli doonaa!",
        generateEdit: "Abuur Wax Ka Beddel",
        cancel: "Jooji",
        resetMask: "Dib u deji Maaskarada",
        brushSize: "Cabbirka Burushka",
        describeChanges: "Sharrax isbeddelladaada...",
        editingInProgress: "Wax ka beddeliddu waa socotaa...",
        noShareSupport: "Wadaagista laguma heli karo biraawsarkan.",
        noFileShareSupport: "Wadaagista faylasha laguma taageero biraawsarkan.",
        shareError: "Cilad wadaagista:",
        controls: "Xakamaynta",
        history: "Taariikhda",
        prompt: "Dardaaran (Prompt)",
        savePreset: "Keydi dardaaranka hadda jira",
        save: "Keydi",
        promptPlaceholder: "Ku qor sharraxaadda sawirkaaga halkan...",
        presets: "Qaababka Horay Loo Diyaariyey",
        deletePreset: "Tirtir qaabka",
        selectPreset: "Dooro qaab...",
        defaultPresets: "Qaababka Asalka ah",
        yourPresets: "Qaababkaaga",
        aspectRatio: "Cabirka Sawirka (Aspect Ratio)",
        generate: "Abuur Sawir",
        generating: "Waa Socotaa...",
        historyEmpty: "Taariikhdaadu waa madhan tahay.",
        historyEmptySub: "Sawirada aad abuurto halkan ayay ka soo muuqan doonaan.",
        view: "Fiiri",
        reuse: "Dib u isticmaal",
        delete: "Tirtir",
        clearHistory: "Nadiifi Dhammaan Taariikhda",
        errorOccurred: "Cillad ayaa dhacday. Fadlan hubi konsoolka wixii faahfaahin ah.",
        noImageGenerated: "Lama soo saarin wax sawir ah. Fadlan isku day dardaaran kale.",
        loading1: "Waanu diyaarinaynaa sawirkaaga...",
        loading2: "Falanqaynta sawirada tixraaca...",
        loading3: "Isku darka hal-abuurka...",
        loading4: "Ku dhowaad dhammaad...",
        confirmDeleteHistory: "Ma hubtaa inaad tirtirto dhammaan taariikhdaada? Tallaabadan dib looma celin karo.",
        confirmDeleteItem: "Ma hubtaa inaad tirtirto shaygan taariikhda?",
        promptCannotBeEmpty: "Dardaaranku ma bannaanaan karo si loo keydiyo.",
        enterPresetName: "Fadlan geli magac qaabkan cusub:",
        presetNameExists: "Magacan horey ayaa loo isticmaalay. Fadlan dooro mid kale.",
        presetSaved: `Qaabka "{name}" waa la keydiyay!`,
        confirmDeletePreset: `Ma hubtaa inaad tirtirto qaabka "{name}"?`,
        settingsRestored: "Dardaaranka iyo goobaha waa la soo celiyay. Fadlan soo geli sawirro tixraac cusub.",
        imageSavedSuccess: 'Sawirka si guul leh ayaa loo keydiyay!',
        adjust: "Hagaaji",
        crop: "Jar",
        mask: "Maaskaro (AI)",
        brightness: "Iftiin",
        contrast: "Kala duwanaansho",
        saturate: "Midab",
        applyChanges: "Codso Isbedelada",
        resetAdjustments: "Dib u deji",
        upload: "Soo daji",
    }
};

const PRESETS: { [key: string]: { name: string; prompt: string } } = {
  'xeebta': { name: 'Xeebta (Golden Hour Coast)', prompt: 'Close-up portrait of the person, wearing simple traditional attire. Golden hour lighting, gentle breeze, with the ocean in the background.' },
  'dhulka': { name: 'Dhulka (Nomadic Dunes)', prompt: 'Shot of the person standing amidst vast sand dunes. Warm afternoon light, wearing a traditional macawis, creating a dramatic silhouette.' },
  'saqafka': { name: 'Saqafka Muqdisho (Mogadishu Rooftop)', prompt: 'Portrait of the person on a rooftop in Mogadishu, with the city skyline in the background. Late afternoon light, candid pose.' }
};

const ASPECT_RATIOS = ['1:1', '4:5', '16:9', '2.39:1'];

const GALLERY_IMAGES = [
    { src: 'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=600', alt: 'Man in a suit' },
    { src: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=600', alt: 'Woman smiling' },
    { src: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=600', alt: 'Man looking sideways' },
    { src: 'https://images.pexels.com/photos/1516680/pexels-photo-1516680.jpeg?auto=compress&cs=tinysrgb&w=600', alt: 'Man with glasses' },
    { src: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=600', alt: 'Woman with curly hair' },
    { src: 'https://images.pexels.com/photos/1310522/pexels-photo-1310522.jpeg?auto=compress&cs=tinysrgb&w=600', alt: 'Woman in an office' }
];

const fileToGenerativePart = async (file: File): Promise<Part> => {
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(file);
    });
    return { inlineData: { data: await base64EncodedDataPromise, mimeType: file.type } };
};

const dataURLToPart = (dataurl: string, mimeType: string): Part => {
    return { inlineData: { data: dataurl.split(',')[1], mimeType } };
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
    while (n--) { u8arr[n] = bstr.charCodeAt(n); }
    return new File([u8arr], filename, { type: mime });
};

// --- STORES (Zustand) ---

// UI Store
interface UiState {
  theme: 'light' | 'dark';
  language: 'en' | 'so';
  showLanding: boolean;
  isFadingOut: boolean;
  activeTab: 'controls' | 'history';
  toastMessage: string | null;
  isMobile: boolean;
  mobilePanel: 'upload' | 'controls' | null;
  setTheme: (theme: 'light' | 'dark') => void;
  setLanguage: (language: 'en' | 'so') => void;
  startApp: () => void;
  setActiveTab: (tab: 'controls' | 'history') => void;
  setToastMessage: (message: string | null) => void;
  setIsMobile: (isMobile: boolean) => void;
  setMobilePanel: (panel: 'upload' | 'controls' | null) => void;
}

const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      theme: 'light',
      language: 'so',
      showLanding: true,
      isFadingOut: false,
      activeTab: 'controls',
      toastMessage: null,
      isMobile: window.innerWidth <= 768,
      mobilePanel: null,
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      startApp: () => {
        set({ isFadingOut: true });
        setTimeout(() => set({ showLanding: false }), 500);
      },
      setActiveTab: (tab) => set({ activeTab: tab }),
      setToastMessage: (message) => set({ toastMessage: message }),
      setIsMobile: (isMobile) => set({ isMobile }),
      setMobilePanel: (panel) => set({ mobilePanel: panel }),
    }),
    {
      name: 'character-studio-ui-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ theme: state.theme, language: state.language }),
    }
  )
);

// Generation Store
interface GenerationState {
  referenceFiles: (File | null)[];
  prompt: string;
  aspectRatio: string;
  generatedContent: { text?: string; image?: string }[];
  isLoading: boolean;
  error: string | null;
  loadingMessage: string;
  setReferenceFiles: (files: (File | null)[]) => void;
  setPrompt: (prompt: string) => void;
  setAspectRatio: (ratio: string) => void;
  handleGenerate: () => Promise<void>;
}

const useGenerationStore = create<GenerationState>((set, get) => ({
  referenceFiles: Array(4).fill(null),
  prompt: '',
  aspectRatio: '1:1',
  generatedContent: [],
  isLoading: false,
  error: null,
  loadingMessage: '',
  setReferenceFiles: (files) => set({ referenceFiles: files }),
  setPrompt: (prompt) => set({ prompt }),
  setAspectRatio: (ratio) => set({ aspectRatio: ratio }),
  handleGenerate: async () => {
    const { referenceFiles, prompt, language } = get();
    const t = useTranslations.getState().t;

    if (!referenceFiles.some(f => f) || !prompt.trim()) return;

    set({ isLoading: true, error: null, generatedContent: [] });
    useUiStore.getState().setMobilePanel(null);

    // Loading messages
    const messages = [t('loading1'), t('loading2'), t('loading3'), t('loading4')];
    let i = 0;
    set({ loadingMessage: messages[i] });
    const interval = setInterval(() => { i = (i + 1) % 4; set({ loadingMessage: messages[i] }); }, 2500);
    
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
        const imageParts = await Promise.all(referenceFiles.filter((f): f is File => f !== null).map(fileToGenerativePart));
        const fullPrompt = language === 'en' ? `Maintain the facial features from these reference images. ${prompt}` : `Astaamaha wejiga ka ilaali sawiradan tixraaca ah. ${prompt}`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: { parts: [...imageParts, { text: fullPrompt }] },
            config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
        });

        const content: { text?: string; image?: string }[] = [];
        for (const part of response.candidates[0].content.parts) {
            if (part.text) { content.push({ text: part.text }); } 
            else if (part.inlineData) {
                const imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                content.push({ image: imageUrl });
                useHistoryStore.getState().addHistoryItem({ id: Date.now().toString(), image: imageUrl, prompt: get().prompt, aspectRatio: get().aspectRatio });
            }
        }
        if (content.find(c => c.image)) { set({ generatedContent: content }); } 
        else { set({ error: t('noImageGenerated') }); }
    } catch (e) { 
        console.error(e); 
        set({ error: t('errorOccurred') });
    } finally { 
        clearInterval(interval);
        set({ isLoading: false }); 
    }
  },
}));

// History Store
interface HistoryState {
  history: HistoryItem[];
  addHistoryItem: (item: HistoryItem) => void;
  deleteHistoryItem: (id: string) => void;
  clearHistory: () => void;
}

const useHistoryStore = create<HistoryState>()(
  persist(
    (set) => ({
      history: [],
      addHistoryItem: (item) => set((state) => ({ history: [item, ...state.history] })),
      deleteHistoryItem: (id) => {
        const t = useTranslations.getState().t;
        if (window.confirm(t('confirmDeleteItem'))) {
            set((state) => ({ history: state.history.filter((item) => item.id !== id) }));
        }
      },
      clearHistory: () => {
        const t = useTranslations.getState().t;
        if (window.confirm(t('confirmDeleteHistory'))) {
            set({ history: [] });
        }
      },
    }),
    {
      name: 'character-studio-history',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// Presets Store
interface PresetsState {
  customPresets: { [key: string]: string };
  selectedPreset: string;
  setSelectedPreset: (key: string) => void;
  savePreset: () => void;
  deletePreset: () => void;
}

const usePresetsStore = create<PresetsState>()(
  persist(
    (set, get) => ({
      customPresets: {},
      selectedPreset: '',
      setSelectedPreset: (key) => {
        set({ selectedPreset: key });
        const { customPresets } = get();
        if (key in PRESETS) useGenerationStore.getState().setPrompt(PRESETS[key as keyof typeof PRESETS].prompt);
        else if (key in customPresets) useGenerationStore.getState().setPrompt(customPresets[key]);
        else useGenerationStore.getState().setPrompt('');
      },
      savePreset: () => {
        const t = useTranslations.getState().t;
        const prompt = useGenerationStore.getState().prompt;
        if (!prompt.trim()) { alert(t('promptCannotBeEmpty')); return; }
        const name = window.prompt(t('enterPresetName'));
        if (name && name.trim()) {
            const trimmedName = name.trim();
            const { customPresets } = get();
            if (PRESETS[trimmedName.toLowerCase()] || customPresets[trimmedName]) {
                alert(t('presetNameExists')); return;
            }
            set({ customPresets: { ...customPresets, [trimmedName]: prompt }, selectedPreset: trimmedName });
            alert(t('presetSaved').replace('{name}', trimmedName));
        }
      },
      deletePreset: () => {
        const { selectedPreset, customPresets } = get();
        const t = useTranslations.getState().t;
        if (selectedPreset && customPresets[selectedPreset]) {
            if (window.confirm(t('confirmDeletePreset').replace('{name}', selectedPreset))) {
                const newPresets = { ...customPresets };
                delete newPresets[selectedPreset];
                set({ customPresets: newPresets, selectedPreset: '' });
                useGenerationStore.getState().setPrompt('');
            }
        }
      },
    }),
    {
      name: 'character-studio-user-presets',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// Editor Store
interface EditorState {
    editMode: 'mask' | 'adjust' | 'crop' | null;
    editPrompt: string;
    brushSize: number;
    adjustments: { brightness: number; contrast: number; saturate: number };
    cropRect: { x: number; y: number; width: number; height: number };
    setEditMode: (mode: 'mask' | 'adjust' | 'crop' | null) => void;
    setEditPrompt: (prompt: string) => void;
    setBrushSize: (size: number) => void;
    setAdjustments: (adjustments: { brightness: number; contrast: number; saturate: number }) => void;
    resetAdjustments: () => void;
    setCropRect: (rect: { x: number; y: number; width: number; height: number }) => void;
    handleApplyAIMaskEdit: (canvas: HTMLCanvasElement | null, originalImage: string) => Promise<void>;
    handleApplyClientEdits: () => void;
    cancelEditing: () => void;
}

const useEditorStore = create<EditorState>((set, get) => ({
    editMode: null,
    editPrompt: '',
    brushSize: 40,
    adjustments: { brightness: 100, contrast: 100, saturate: 100 },
    cropRect: { x: 10, y: 10, width: 80, height: 80 },
    setEditMode: (mode) => set({ editMode: mode }),
    setEditPrompt: (prompt) => set({ editPrompt: prompt }),
    setBrushSize: (size) => set({ brushSize: size }),
    setAdjustments: (adjustments) => set({ adjustments }),
    resetAdjustments: () => set({ adjustments: { brightness: 100, contrast: 100, saturate: 100 } }),
    setCropRect: (rect) => set({ cropRect: rect }),
    cancelEditing: () => {
        set({
            editMode: null,
            editPrompt: '',
            adjustments: { brightness: 100, contrast: 100, saturate: 100 },
            cropRect: { x: 10, y: 10, width: 80, height: 80 },
        });
    },
    handleApplyClientEdits: () => {
        const { editMode, adjustments, cropRect } = get();
        const { generatedContent, setGeneratedContent } = useGenerationStore.getState();
        const imageUrl = generatedContent.find(c => c.image)?.image;
        if (!imageUrl) return;

        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            if (editMode === 'adjust') {
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                ctx.filter = `brightness(${adjustments.brightness}%) contrast(${adjustments.contrast}%) saturate(${adjustments.saturate}%)`;
                ctx.drawImage(img, 0, 0);
            } else if (editMode === 'crop') {
                const sx = (cropRect.x / 100) * img.naturalWidth;
                const sy = (cropRect.y / 100) * img.naturalHeight;
                const sWidth = (cropRect.width / 100) * img.naturalWidth;
                const sHeight = (cropRect.height / 100) * img.naturalHeight;
                canvas.width = sWidth;
                canvas.height = sHeight;
                ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, sWidth, sHeight);
            }
            
            const newDataUrl = canvas.toDataURL('image/png');
            setGeneratedContent([{ ...generatedContent[0], image: newDataUrl }]);
            get().cancelEditing();
        };
        img.src = imageUrl;
    },
    handleApplyAIMaskEdit: async (canvas: HTMLCanvasElement | null, originalImage: string) => {
        const { editPrompt } = get();
        const { prompt, aspectRatio } = useGenerationStore.getState();
        const { setIsLoading, setError, setGeneratedContent } = useGenerationStore.getState();
        const { addHistoryItem } = useHistoryStore.getState();
        const t = useTranslations.getState().t;

        if (!originalImage || !canvas || !editPrompt.trim()) return;

        setIsLoading(true);
        setError(null);
        
        const interval = setInterval(() => { useGenerationStore.setState({ loadingMessage: t('editingInProgress') }) }, 2500);

        try {
            const maskCanvas = document.createElement('canvas');
            maskCanvas.width = canvas.width;
            maskCanvas.height = canvas.height;
            const maskCtx = maskCanvas.getContext('2d', { willReadFrequently: true });
            if (!maskCtx) throw new Error("Could not create mask context");

            const originalImageData = canvas.getContext('2d')?.getImageData(0, 0, canvas.width, canvas.height);
            if (!originalImageData) throw new Error("Could not get mask data");
            
            const newImageData = maskCtx.createImageData(canvas.width, canvas.height);
            for (let i = 0; i < originalImageData.data.length; i += 4) {
                if (originalImageData.data[i + 3] > 0) { // If pixel is drawn on
                    newImageData.data[i] = 255; newImageData.data[i + 1] = 255; newImageData.data[i + 2] = 255; newImageData.data[i + 3] = 255;
                } else { // If pixel is transparent
                    newImageData.data[i] = 0; newImageData.data[i + 1] = 0; newImageData.data[i + 2] = 0; newImageData.data[i + 3] = 255;
                }
            }
            maskCtx.putImageData(newImageData, 0, 0);
            const maskDataUrl = maskCanvas.toDataURL('image/png');

            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const originalImagePart = dataURLToPart(originalImage, 'image/png');
            const maskPart = dataURLToPart(maskDataUrl, 'image/png');
            const textPart = { text: editPrompt };
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image-preview',
                contents: { parts: [originalImagePart, maskPart, textPart] },
                config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
            });

            const content: { text?: string; image?: string }[] = [];
            for (const part of response.candidates[0].content.parts) {
                if (part.text) { content.push({ text: part.text }); } 
                else if (part.inlineData) {
                    const imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                    content.push({ image: imageUrl });
                    addHistoryItem({ id: Date.now().toString(), image: imageUrl, prompt: `${prompt} (edit: ${editPrompt})`, aspectRatio });
                }
            }
            if (content.find(c => c.image)) { setGeneratedContent(content); } 
            else { setError(t('noImageGenerated')); }
            
            get().cancelEditing();

        } catch (e) { console.error(e); setError(t('errorOccurred'));
        } finally { 
            clearInterval(interval);
            setIsLoading(false); 
        }
    }
}));


// --- HOOKS ---

const useTranslations = create<{ t: (key: string) => string }>(() => ({
    t: (key: string) => {
        const lang = useUiStore.getState().language;
        // FIX: The type assertion `keyof typeof translations[typeof lang]` was invalid because `lang` is a variable.
        // This was causing the index type to be treated as 'any', leading to a compile error.
        // The fix asserts `key` against a valid set of translation keys (from `translations['en']`),
        // assuming all languages share the same keys.
        return translations[lang][key as keyof typeof translations['en']] || key;
    }
}));

// Initialize stores
useUiStore.subscribe(
    (state) => state.theme,
    (theme) => {
        document.body.className = theme === 'dark' ? 'dark-mode' : '';
    },
    { fireImmediately: true }
);

// --- UI & ICON COMPONENTS ---
const UploadIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>);
const RemoveIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>);
const EmptyStateIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="empty-state-icon"><path d="M12 3c-1.2 0-2.4.6-3 1.7A3.2 3.2 0 0 0 6 8c0 1.7 1.3 3 3 3h6c1.7 0 3-1.3 3-3a3.2 3.2 0 0 0-3-3.3c-.6-1.1-1.8-1.7-3-1.7Z"></path><path d="M12 12v4"></path><path d="M10.5 15.5a1.5 1.5 0 0 1-3 0"></path><path d="m7.5 15.5 1.5-1.5"></path><path d="m13.5 15.5 1.5-1.5"></path><path d="M16.5 15.5a1.5 1.5 0 0 0-3 0"></path><path d="M12 21a9 9 0 0 0 9-9h-3a6 6 0 0 1-6 6v3Z"></path><path d="M3 12a9 9 0 0 0 9 9v-3a6 6 0 0 1-6-6H3Z"></path></svg>);
const HistoryViewIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>);
const HistoryReuseIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>);
const HistoryDeleteIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>);
const SunIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>;
const MoonIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>;
const UKFlagIcon = () => <svg width="24" height="24" viewBox="0 0 72 48"><path fill="#012169" d="M0 0h72v48H0z"/><path fill="#FFF" d="m72 0-36 24L0 0zm0 48 36-24L72 48z"/><path fill="#C8102E" d="M42 21V0h-12v21H0v6h30v21h12V27h30v-6z"/><path fill="#FFF" d="M10.002 4.001 0 9.173V3.17L5.001 0h3.17L0 5.001v3.17L8.173 0h3.654L0 11.827v3.654l15.48-11.827h3.04L0 18.52V24h5.48L24 10.002V0h-3.17L6 18.52H0v5.48L24 9.998V0h-9.998zm47.996 0L72 9.173V3.17L66.999 0h-3.17L72 5.001v3.17L63.827 0h-3.654L72 11.827v3.654L56.52 0h-3.04L72 18.52V24h-5.48L48 10.002V0h3.17L66 18.52H72v5.48L48 9.998V0h9.998zM12.173 48l-3.654-11.827L72 18.52v-3.04L58.002 24H48v9.998l18-13.48V24h-6L48 37.998V48h3.17L60 30h12v-2.173L56.52 48h3.654L72 36.173v-3.654L59.48 48h3.04L72 30v-6h-5.48L48 37.998V48h-5.48zm47.654-48-11.827 15.48v-3.04L66.52 0h-3.04L48 15.48v3.04L61.48 0h3.04L48 21.827v3.654L60 12.173V24h2.173l1.347-18L72 0v5.48L54 24h12v-9.998L52.52 0h5.48z"/></svg>;
const SOFlagIcon = () => <svg width="24" height="24" viewBox="0 0 72 48"><path fill="#4189DD" d="M0 0h72v48H0z"/><path fill="#FFF" d="m36 12-5.26 11.106L18 24l12.74 1.106L36 36l5.26-10.894L54 24l-12.74-1.106z"/></svg>;
const AdjustIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3.5"></circle><path d="M12 2v2"></path><path d="M12 20v2"></path><path d="m4.9 4.9 1.4 1.4"></path><path d="m17.7 17.7 1.4 1.4"></path><path d="M2 12h2"></path><path d="M20 12h2"></path><path d="m4.9 19.1 1.4-1.4"></path><path d="m17.7 6.3 1.4-1.4"></path></svg>;
const CropIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2v14a2 2 0 0 0 2 2h14"></path><path d="M18 22V8a2 2 0 0 0-2-2H2"></path></svg>;
const MaskIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6"></path><path d="M15 13.5a5.1 5.1 0 1 0-7.2-7.2"></path><path d="M3 21v-6h6"></path><path d="m21 3-9.5 9.5"></path></svg>;
const CloseIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>);
const ControlsIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 21v-7"></path><path d="M4 10V3"></path><path d="M12 21v-9"></path><path d="M12 8V3"></path><path d="M20 21v-5"></path><path d="M20 12V3"></path><line x1="2" y1="14" x2="6" y2="14"></line><line x1="10" y1="8" x2="14" y2="8"></line><line x1="18" y1="16" x2="22" y2="16"></line></svg>);
const UploadPanelIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>);

const Header: React.FC = () => {
    const { theme, setTheme, language, setLanguage } = useUiStore();
    const t = useTranslations.getState().t;
    return (
        <header>
            <h1>{t('title')}</h1>
            <div className="header-controls">
                <button className="icon-btn" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} aria-label="Toggle theme">
                    {theme === 'light' ? <MoonIcon /> : <SunIcon />}
                </button>
                <div className="language-switcher">
                     <button className={`icon-btn ${language === 'en' ? 'active' : ''}`} onClick={() => setLanguage('en')} aria-label="Switch to English"><UKFlagIcon/></button>
                     <button className={`icon-btn ${language === 'so' ? 'active' : ''}`} onClick={() => setLanguage('so')} aria-label="Switch to Somali"><SOFlagIcon/></button>
                </div>
            </div>
        </header>
    );
};

const LandingPage: React.FC = () => {
    const { isFadingOut, startApp } = useUiStore();
    const t = useTranslations.getState().t;
    return (
        <div className={`landing-page ${isFadingOut ? 'fade-out' : ''}`}>
            <div className="landing-content">
                <div className="landing-hero">
                    <h1>{t('landingTitle')}</h1>
                    <p>{t('landingSubtitle')}</p>
                    <button className="landing-cta" onClick={startApp}>{t('startCreating')}</button>
                </div>
                <div className="landing-gallery-wrapper">
                    <h2>{t('whatIsPossible')}</h2>
                    <div className="landing-gallery">
                        {GALLERY_IMAGES.map((img, index) => (
                            <div key={index} className="gallery-item"><img src={img.src} alt={img.alt} /></div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

interface ImageSlotProps {
    index: number;
    image: string | null;
    onFilesChange: (files: FileList | null) => void;
    isDraggedOver: boolean;
    onDragEnter: (e: React.DragEvent<HTMLLabelElement>) => void;
    onDragLeave: (e: React.DragEvent<HTMLLabelElement>) => void;
    onDrop: (e: React.DragEvent<HTMLLabelElement>) => void;
}

const ImageSlot: React.FC<ImageSlotProps> = ({ image, onFilesChange, index, isDraggedOver, onDragEnter, onDragLeave, onDrop }) => {
    const t = useTranslations.getState().t;
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) onFilesChange(e.target.files);
    };
    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation(); e.preventDefault();
        onFilesChange(null);
    };
    const inputId = `file-input-${index}`;
    return (
        <label htmlFor={inputId} className={`image-slot ${isDraggedOver ? 'dragged-over' : ''}`} style={{ backgroundImage: image ? `url(${image})` : 'none' }} onDragEnter={onDragEnter} onDragLeave={onDragLeave} onDragOver={(e) => e.preventDefault()} onDrop={onDrop}>
            {image ? (
                <button className="remove-btn" onClick={handleRemove} aria-label={t('removeImage')}><RemoveIcon /></button>
            ) : (
                <div className="image-slot-placeholder">
                    <UploadIcon />
                    <span>{t('imageSlotLabel')} {index + 1}</span>
                </div>
            )}
            <input id={inputId} type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} aria-label={`${t('uploadImage')} ${index + 1}`} multiple />
        </label>
    );
};

const ImageUploader: React.FC = () => {
    const t = useTranslations.getState().t;
    const { isMobile, setMobilePanel } = useUiStore();
    const { referenceFiles, setReferenceFiles } = useGenerationStore();
    const [imagePreviews, setImagePreviews] = useState<(string | null)[]>([]);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [draggedOverSlot, setDraggedOverSlot] = useState<number | null>(null);

    useEffect(() => {
        const urls = referenceFiles.map(file => file ? URL.createObjectURL(file) : null);
        setImagePreviews(urls);
        return () => { urls.forEach(url => { if (url) URL.revokeObjectURL(url); }); };
    }, [referenceFiles]);

    const handleFileChange = useCallback((startIndex: number, files: FileList | null) => {
        const newFiles = [...referenceFiles];
        if (files === null) { newFiles[startIndex] = null; setReferenceFiles(newFiles); return; }

        const filesToUpload = Array.from(files);
        let fileIndex = 0;
        newFiles[startIndex] = filesToUpload[fileIndex++];
        for (let i = startIndex + 1; i < newFiles.length && fileIndex < filesToUpload.length; i++) {
            if (newFiles[i] === null) newFiles[i] = filesToUpload[fileIndex++];
        }
        for (let i = 0; i < startIndex && fileIndex < filesToUpload.length; i++) {
            if (newFiles[i] === null) newFiles[i] = filesToUpload[fileIndex++];
        }
        setReferenceFiles(newFiles);
        if (isMobile) setMobilePanel(null);
    }, [referenceFiles, setReferenceFiles, isMobile, setMobilePanel]);

    const handleContainerDragEnter = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
    const handleContainerDragLeave = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); setDraggedOverSlot(null); };
    const handleContainerDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); };
    const handleContainerDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault(); e.stopPropagation();
        setIsDragging(false); setDraggedOverSlot(null);
        if (e.dataTransfer.files.length > 0) handleFileChange(0, e.dataTransfer.files);
    };
    const handleSlotDragEnter = (e: React.DragEvent<HTMLLabelElement>, index: number) => { e.preventDefault(); e.stopPropagation(); setDraggedOverSlot(index); };
    const handleSlotDragLeave = (e: React.DragEvent<HTMLLabelElement>) => { e.preventDefault(); e.stopPropagation(); setDraggedOverSlot(null); };
    const handleSlotDrop = (e: React.DragEvent<HTMLLabelElement>, index: number) => {
        e.preventDefault(); e.stopPropagation();
        setIsDragging(false); setDraggedOverSlot(null);
        if (e.dataTransfer.files.length > 0) handleFileChange(index, e.dataTransfer.files);
    };

    return (
        <>
            <div className="panel-header">{t('uploadReference')}</div>
            <div className="image-uploader" onDragEnter={handleContainerDragEnter} onDragLeave={handleContainerDragLeave} onDragOver={handleContainerDragOver} onDrop={handleContainerDrop} data-dragging={isDragging}>
                <div className="image-grid">
                    {imagePreviews.map((img, i) => (
                        <ImageSlot key={i} index={i} image={img} onFilesChange={(files) => handleFileChange(i, files)} isDraggedOver={draggedOverSlot === i} onDragEnter={(e) => handleSlotDragEnter(e, i)} onDragLeave={handleSlotDragLeave} onDrop={(e) => handleSlotDrop(e, i)} />
                    ))}
                </div>
                <div className="drop-prompt">{isDragging ? t('draggingPrompt') : t('dragAndDrop')}</div>
            </div>
        </>
    );
};

const ControlsPanel: React.FC = () => {
    const t = useTranslations.getState().t;
    const { prompt, setPrompt, aspectRatio, setAspectRatio, handleGenerate, isLoading, referenceFiles } = useGenerationStore();
    const { selectedPreset, setSelectedPreset, customPresets, savePreset, deletePreset } = usePresetsStore();
    const canGenerate = referenceFiles.some(file => file !== null) && prompt.trim() !== '';

    return (
        <div className="controls-form">
            <div className="form-group">
                <div className="label-group">
                    <label htmlFor="prompt-input">{t('prompt')}</label>
                    <button className="save-preset-btn" onClick={savePreset} title={t('savePreset')}>{t('save')}</button>
                </div>
                <textarea id="prompt-input" className="prompt-textarea" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder={t('promptPlaceholder')} rows={5}/>
            </div>
            <div className="form-group">
                <label htmlFor="presets-select">{t('presets')}</label>
                <div className="preset-controls">
                    <div className="select-wrapper">
                        <select id="presets-select" className="presets-select" onChange={(e) => setSelectedPreset(e.target.value)} value={selectedPreset}>
                            <option value="" disabled>{t('selectPreset')}</option>
                            <optgroup label={t('defaultPresets')}>
                            {Object.entries(PRESETS).map(([key, { name }]) => (<option key={key} value={key}>{name}</option>))}
                            </optgroup>
                            {Object.keys(customPresets).length > 0 && (
                                <optgroup label={t('yourPresets')}>
                                    {Object.entries(customPresets).map(([name]) => (<option key={name} value={name}>{name}</option>))}
                                </optgroup>
                            )}
                        </select>
                    </div>
                    {selectedPreset && customPresets[selectedPreset] && (
                        <button onClick={deletePreset} className="delete-preset-btn" title={`${t('deletePreset')} ${selectedPreset}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                        </button>
                    )}
                </div>
            </div>
            <div className="form-group">
                 <label>{t('aspectRatio')}</label>
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
                {isLoading ? t('generating') : t('generate')}
            </button>
        </div>
    );
};

const HistoryPanel: React.FC = () => {
    const t = useTranslations.getState().t;
    const { history, deleteHistoryItem, clearHistory } = useHistoryStore();
    const { setAspectRatio, setPrompt, setGeneratedContent } = useGenerationStore();
    const { isMobile, setMobilePanel, setActiveTab } = useUiStore();

    const viewHistoryItem = (item: HistoryItem) => {
        setGeneratedContent([{ image: item.image }]);
        setAspectRatio(item.aspectRatio);
        if (isMobile) setMobilePanel(null);
    };
    const reuseHistoryItem = (item: HistoryItem) => {
        setPrompt(item.prompt);
        setAspectRatio(item.aspectRatio);
        setActiveTab('controls');
        alert(t('settingsRestored'));
        if (isMobile) setMobilePanel(null);
    };

    return (
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
                                        <button onClick={() => viewHistoryItem(item)} title={t('view')}><HistoryViewIcon /></button>
                                        <button onClick={() => reuseHistoryItem(item)} title={t('reuse')}><HistoryReuseIcon /></button>
                                        <button onClick={() => deleteHistoryItem(item.id)} title={t('delete')}><HistoryDeleteIcon /></button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button onClick={clearHistory} className="clear-history-btn">{t('clearHistory')}</button>
                </>
            ) : (
                <div className="history-empty-state">
                    <p>{t('historyEmpty')}</p>
                    <span>{t('historyEmptySub')}</span>
                </div>
            )}
        </div>
    );
};

const RightPanel: React.FC = () => {
    const t = useTranslations.getState().t;
    const { activeTab, setActiveTab } = useUiStore();
    const { history } = useHistoryStore();
    
    return (
        <>
            <div className="panel-tabs">
                <button className={`tab-btn ${activeTab === 'controls' ? 'active' : ''}`} onClick={() => setActiveTab('controls')}>{t('controls')}</button>
                <button className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
                    {t('history')}
                    <span className="history-count">{history.length}</span>
                </button>
            </div>
            {activeTab === 'controls' ? <ControlsPanel /> : <HistoryPanel />}
        </>
    );
};

const MobilePanel: React.FC<{
    type: 'upload' | 'controls', 
    title: string, 
    children: React.ReactNode 
}> = ({ type, title, children }) => {
    const { mobilePanel, setMobilePanel } = useUiStore();
    return (
        <div className={`panel mobile-panel ${mobilePanel === type ? 'visible' : ''}`}>
            <div className="mobile-panel-header">
                <div className="mobile-panel-handle" />
                <h3>{title}</h3>
                <button onClick={() => setMobilePanel(null)} className="mobile-panel-close"><CloseIcon /></button>
            </div>
            {children}
        </div>
    );
}

const MobileNav: React.FC = () => {
    const t = useTranslations.getState().t;
    const { setMobilePanel } = useUiStore();
    return (
        <div className="mobile-nav">
            <button className="mobile-nav-btn" onClick={() => setMobilePanel('upload')}>
                <UploadPanelIcon />
                <span>{t('upload')}</span>
            </button>
            <button className="mobile-nav-btn" onClick={() => setMobilePanel('controls')}>
                 <ControlsIcon />
                 <span>{t('controls')}</span>
            </button>
        </div>
    );
};

const Toast: React.FC = () => {
    const { toastMessage, setToastMessage } = useUiStore();
    useEffect(() => {
        if (toastMessage) {
            const timer = setTimeout(() => { setToastMessage(null); }, 3000);
            return () => clearTimeout(timer);
        }
    }, [toastMessage, setToastMessage]);
    if (!toastMessage) return null;
    return <div className="toast-notification">{toastMessage}</div>;
};

const ResultDisplay: React.FC = () => {
    const t = useTranslations.getState().t;
    const { isLoading, error, generatedContent, loadingMessage, aspectRatio } = useGenerationStore();
    const { editMode, setEditMode } = useEditorStore();
    const { setToastMessage } = useUiStore();
    
    const currentImage = generatedContent.find(c => c.image)?.image;
    
    const handleSave = (quality: number) => {
        if (!currentImage) return;
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0);
            const dataUrl = canvas.toDataURL('image/jpeg', quality);
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = `character-studio-${Date.now()}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setToastMessage(t('imageSavedSuccess'));
        };
        img.src = currentImage;
    };

    const handleShare = async () => {
        if (!currentImage || !navigator.share) { alert(t('noShareSupport')); return; }
        try {
            const file = dataURLtoFile(currentImage, `character-studio-${Date.now()}.png`);
            if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({ files: [file], title: 'My Character Studio Creation', text: 'Check out this image I created!' });
            } else { alert(t('noFileShareSupport')); }
        } catch (error) { console.error('Error sharing:', error); alert(`${t('shareError')} ${error}`);}
    };

    const handleUpscale = () => {
        setToastMessage(t('upscaleComingSoon'));
    };
    
    return (
        <div className="panel result-display" id="center-panel">
            <div className="result-content">
            {isLoading ? (
                <>
                    <div className="loader"><div></div><div></div><div></div></div>
                    <p className="loading-message">{loadingMessage}</p>
                </>
            ) : error ? (
                 <p className="error-message">{error}</p>
            ) : currentImage ? (
                editMode ? (
                    <ImageEditor />
                ) : (
                    <>
                    <div className={`generated-image-wrapper aspect-${aspectRatio.replace(':', '-').replace('.', '-')}`}>
                        <img src={currentImage} alt="Generated content" className="generated-image" />
                    </div>
                    <div className="result-actions">
                        <div className="save-group">
                            <button onClick={() => handleSave(0.95)} title={t('saveHD')}>HD</button>
                            <button onClick={() => handleSave(0.75)} title={t('saveMedium')}>SD</button>
                            <button onClick={() => handleSave(0.5)} title={t('saveLow')}>Low</button>
                        </div>
                        <button className="edit-btn" onClick={() => setEditMode('mask')}>{t('edit')}</button>
                        <button className="upscale-btn" onClick={handleUpscale}>{t('upscale')}</button>
                        {navigator.share && <button className="share-btn" onClick={handleShare}>{t('share')}</button>}
                    </div>
                    {generatedContent.find(c => c.text) && <p className="generated-text">{generatedContent.find(c => c.text)?.text}</p>}
                    </>
                )
            ) : (
                <div className="result-placeholder">
                   <EmptyStateIcon />
                   <p>{t('resultsPlaceholder')}</p>
                   <span>{t('resultsInstructions')}</span>
                </div>
            )}
            </div>
        </div>
    );
};

const ImageEditor: React.FC = () => {
    const t = useTranslations.getState().t;
    const { editMode, setEditMode, editPrompt, setEditPrompt, brushSize, setBrushSize, adjustments, setAdjustments, resetAdjustments, cropRect, setCropRect, handleApplyAIMaskEdit, handleApplyClientEdits, cancelEditing } = useEditorStore();
    const { theme } = useUiStore();
    const { generatedContent, aspectRatio } = useGenerationStore();

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imageWrapperRef = useRef<HTMLDivElement>(null);
    const dragHandleRef = useRef<{ handle: string; startX: number; startY: number; startRect: typeof cropRect } | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    
    const currentImage = generatedContent.find(c => c.image)?.image;
    if (!currentImage) return null;

    useEffect(() => {
        if (editMode === 'mask' && canvasRef.current) {
            const canvas = canvasRef.current;
            const imgElement = imageWrapperRef.current?.querySelector('img');
            if (imgElement) {
                const setCanvasSize = () => { canvas.width = imgElement.clientWidth; canvas.height = imgElement.clientHeight; };
                if (imgElement.complete) setCanvasSize(); else imgElement.onload = setCanvasSize;
                const resizeObserver = new ResizeObserver(setCanvasSize);
                resizeObserver.observe(imgElement);
                return () => resizeObserver.disconnect();
            }
        }
    }, [editMode]);

    const handleResetMask = () => {
        const canvas = canvasRef.current;
        if (canvas) canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
    };

    const getEventPosition = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
        const rect = canvas.getBoundingClientRect();
        const touch = (e as React.TouchEvent).touches?.[0];
        const clientX = touch ? touch.clientX : (e as React.MouseEvent).clientX;
        const clientY = touch ? touch.clientY : (e as React.MouseEvent).clientY;
        return { x: clientX - rect.left, y: clientY - rect.top };
    };

    const handleDrawStart = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas || editMode !== 'mask') return;
        e.preventDefault();
        setIsDrawing(true);
        const ctx = canvas.getContext('2d');
        const pos = getEventPosition(e, canvas);
        if (!ctx) return;
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
    };

    const handleDrawMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing || editMode !== 'mask') return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        e.preventDefault();
        
        const ctx = canvas.getContext('2d');
        const currentPos = getEventPosition(e, canvas);
        if (!ctx) return;
        ctx.strokeStyle = theme === 'dark' ? 'rgba(255, 100, 100, 0.7)' : 'rgba(255, 82, 82, 0.7)';
        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineTo(currentPos.x, currentPos.y);
        ctx.stroke();
    };

    const handleDrawEnd = (e: React.MouseEvent | React.TouchEvent) => {
        if (editMode !== 'mask') return;
        e.preventDefault();
        setIsDrawing(false);
    };

    const getClientCoords = (e: MouseEvent | TouchEvent) => 'touches' in e ? { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY } : { clientX: e.clientX, clientY: e.clientY };
    const handleCropDragStart = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>, handle: string) => {
        e.preventDefault(); e.stopPropagation();
        const { clientX, clientY } = getClientCoords(e.nativeEvent);
        dragHandleRef.current = { handle, startX: clientX, startY: clientY, startRect: { ...cropRect } };
    };
    const handleCropDragMove = useCallback((e: MouseEvent | TouchEvent) => {
        if (!dragHandleRef.current || !imageWrapperRef.current) return;
        e.preventDefault();
        const { handle, startX, startY, startRect } = dragHandleRef.current;
        const { clientX, clientY } = getClientCoords(e);
        const dx = clientX - startX; const dy = clientY - startY;
        const wrapperBounds = imageWrapperRef.current.getBoundingClientRect();
        const dxPercent = (dx / wrapperBounds.width) * 100; const dyPercent = (dy / wrapperBounds.height) * 100;
        let { x, y, width, height } = startRect;
        if (handle.includes('right')) width += dxPercent;
        if (handle.includes('left')) { x += dxPercent; width -= dxPercent; }
        if (handle.includes('bottom')) height += dyPercent;
        if (handle.includes('top')) { y += dyPercent; height -= dyPercent; }
        if (handle === 'move') { x += dxPercent; y += dyPercent; }
        width = Math.max(10, Math.min(width, 100 - x)); height = Math.max(10, Math.min(height, 100 - y));
        x = Math.max(0, Math.min(x, 100 - width)); y = Math.max(0, Math.min(y, 100 - height));
        if (handle.includes('left')) x = startRect.x + startRect.width - width;
        if (handle.includes('top')) y = startRect.y + startRect.height - height;
        setCropRect({ x, y, width, height });
    }, [setCropRect]);
    const handleCropDragEnd = useCallback(() => { dragHandleRef.current = null; }, []);
    useEffect(() => {
        if (editMode === 'crop') {
            document.addEventListener('mousemove', handleCropDragMove); document.addEventListener('mouseup', handleCropDragEnd);
            document.addEventListener('touchmove', handleCropDragMove); document.addEventListener('touchend', handleCropDragEnd);
        }
        return () => {
            document.removeEventListener('mousemove', handleCropDragMove); document.removeEventListener('mouseup', handleCropDragEnd);
            document.removeEventListener('touchmove', handleCropDragMove); document.removeEventListener('touchend', handleCropDragEnd);
        };
    }, [editMode, handleCropDragMove, handleCropDragEnd]);

    return (
        <div className="image-editor-container">
            <div className="editor-toolbar">
                <button className={`tool-btn ${editMode === 'adjust' ? 'active' : ''}`} onClick={() => setEditMode('adjust')} title={t('adjust')}><AdjustIcon /></button>
                <button className={`tool-btn ${editMode === 'crop' ? 'active' : ''}`} onClick={() => setEditMode('crop')} title={t('crop')}><CropIcon /></button>
                <button className={`tool-btn ${editMode === 'mask' ? 'active' : ''}`} onClick={() => setEditMode('mask')} title={t('mask')}><MaskIcon /></button>
            </div>
            <div ref={imageWrapperRef} className={`generated-image-wrapper aspect-${aspectRatio.replace(':', '-').replace('.', '-')}`}>
                <img src={currentImage} alt="Editing content" className="generated-image" style={{ filter: `brightness(${adjustments.brightness}%) contrast(${adjustments.contrast}%) saturate(${adjustments.saturate}%)` }}/>
                {editMode === 'mask' && ( <canvas ref={canvasRef} className="editor-canvas" onMouseDown={handleDrawStart} onMouseMove={handleDrawMove} onMouseUp={handleDrawEnd} onMouseLeave={handleDrawEnd} onTouchStart={handleDrawStart} onTouchMove={handleDrawMove} onTouchEnd={handleDrawEnd} /> )}
                {editMode === 'crop' && (
                    <div className="crop-box-container">
                        <div className="crop-box" style={{ top: `${cropRect.y}%`, left: `${cropRect.x}%`, width: `${cropRect.width}%`, height: `${cropRect.height}%` }} onMouseDown={(e) => handleCropDragStart(e, 'move')} onTouchStart={(e) => handleCropDragStart(e, 'move')}>
                            {['tl', 'tm', 'tr', 'ml', 'mr', 'bl', 'bm', 'br'].map(h => <div key={h} className={`crop-handle handle-${h}`} onMouseDown={(e) => handleCropDragStart(e, h)} onTouchStart={(e) => handleCropDragStart(e, h)}></div>)}
                        </div>
                    </div>
                )}
            </div>
            <div className="editor-controls">
                {editMode === 'mask' && (<>
                    <div className="brush-control">
                        <label htmlFor="brush-size">{t('brushSize')}</label>
                        <input type="range" id="brush-size" min="5" max="100" value={brushSize} onChange={e => setBrushSize(Number(e.target.value))} />
                        <div className="brush-preview" style={{ width: brushSize, height: brushSize }}></div>
                    </div>
                    <textarea className="edit-prompt-textarea" value={editPrompt} onChange={e => setEditPrompt(e.target.value)} placeholder={t('describeChanges')} rows={2}/>
                    <div className="editor-actions">
                        <button onClick={handleResetMask} className="editor-btn-secondary">{t('resetMask')}</button>
                        <button onClick={() => handleApplyAIMaskEdit(canvasRef.current, currentImage)} className="editor-btn-primary" disabled={!editPrompt.trim()}>{t('generateEdit')}</button>
                    </div>
                </>)}
                {editMode === 'adjust' && (
                    <div className="adjustment-controls">
                        <div className="slider-group"><label>{t('brightness')}</label><input type="range" min="0" max="200" value={adjustments.brightness} onChange={e => setAdjustments({...adjustments, brightness: +e.target.value})}/><span>{adjustments.brightness}%</span></div>
                        <div className="slider-group"><label>{t('contrast')}</label><input type="range" min="0" max="200" value={adjustments.contrast} onChange={e => setAdjustments({...adjustments, contrast: +e.target.value})}/><span>{adjustments.contrast}%</span></div>
                        <div className="slider-group"><label>{t('saturate')}</label><input type="range" min="0" max="200" value={adjustments.saturate} onChange={e => setAdjustments({...adjustments, saturate: +e.target.value})}/><span>{adjustments.saturate}%</span></div>
                        <button onClick={resetAdjustments} className="editor-btn-secondary">{t('resetAdjustments')}</button>
                    </div>
                )}
            </div>
            {(editMode === 'adjust' || editMode === 'crop') && ( <div className="editor-main-actions"><button onClick={cancelEditing} className="editor-btn-secondary">{t('cancel')}</button><button onClick={handleApplyClientEdits} className="editor-btn-primary">{t('applyChanges')}</button></div> )}
            {editMode === 'mask' && ( <div className="editor-main-actions"><button onClick={cancelEditing} className="editor-btn-secondary">{t('cancel')}</button></div> )}
        </div>
    );
};

// --- MAIN APP COMPONENT ---

const App = () => {
    const { showLanding, isMobile, setIsMobile } = useUiStore();
    const t = useTranslations.getState().t;

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [setIsMobile]);

    if (showLanding) {
        return <LandingPage />;
    }

    return (
        <div className="app-container fade-in">
            <Header />
            <main className="main-content">
                {!isMobile && (
                    <div className="panel" id="left-panel">
                        <ImageUploader />
                    </div>
                )}

                <ResultDisplay />

                {!isMobile && (
                    <div className="panel" id="right-panel">
                        <RightPanel />
                    </div>
                )}
            </main>

            {isMobile && (
                <>
                    <MobilePanel type="upload" title={t('uploadReference')}>
                        <ImageUploader />
                    </MobilePanel>
                    <MobilePanel type="controls" title={t('controls')}>
                        <RightPanel />
                    </MobilePanel>
                    <MobileNav />
                </>
            )}
            <Toast />
        </div>
    );
};

const container = document.getElementById('root');
if (container) {
    const root = createRoot(container);
    root.render(<React.StrictMode><App /></React.StrictMode>);
}
