import React, { useState, useCallback, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI, Modality, Part } from "@google/genai";
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// --- TYPES & INTERFACES ---

interface HistoryItem {
    id: string;
    image: string | null;
    prompt: string;
    aspectRatio: string;
    status: 'generating' | 'completed' | 'error';
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
        strictConsistency: "Strict Character Consistency",
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
        safetyBlocked: "Your request was blocked for safety reasons. Please adjust your prompt and try again.",
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
        title: "Isteediyo Jilaa",
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
        strictConsistency: "Isku Ekeysiin Adag",
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
        safetyBlocked: "Codsigaaga waa la xannibay sababo la xiriira badbaadada. Fadlan wax ka beddel dardaarankaaga oo mar kale isku day.",
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
        midab: "Midab",
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
    while (n--) { u8arr[n