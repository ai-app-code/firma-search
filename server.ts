import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import axios from "axios";
import { GoogleGenAI } from "@google/genai";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, where, limit, getDocs, updateDoc, serverTimestamp, Firestore } from "firebase/firestore";
import firebaseConfig from "./firebase-applet-config.json";

// AI Chat Proxy
async function startServer() {
  console.log("Starting EliteVan Server...");
  console.log("Environment Keys Present:", {
    GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
    GOOGLE_MAPS_PLATFORM_KEY: !!process.env.GOOGLE_MAPS_PLATFORM_KEY,
  });

  const app = express();
  const PORT = 3000;

  let db: Firestore | null = null;
  try {
    const firebaseApp = initializeApp(firebaseConfig);
    
    // If you need a specific database, it is usually configured in initializeApp
    db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== "(default)" ? firebaseConfig.firestoreDatabaseId : undefined);
    
    console.log("Firebase Client initialized successfully on server");
  } catch (err) {
    console.error("Firebase Client Init Error:", err);
    // Even if DB fails, we want the server to start so the UI can show an error or at least load
  }

  app.use(cors());
  app.use(express.json({ limit: "50mb" }));

  const ELITEVAN_CONTEXT = `
EliteVan Research Hub, VIP van donusum (Mercedes Sprinter, VW Crafter vb.) sektoru icin bir pazar analiz platformudur.
Google Maps ve Gemini AI kullanarak dunya capindaki butik ve buyuk olcekli donusum firmalarini bulur.
Kullanicilar bu firmalari takip edebilir, iletisim notlari alabilir ve otomatik sehir taramalari (cronjob) ayarlayabilir.
Uygulama Turkiye, Avrupa, ABD ve Korfez bolgelerini hedefler.
`;

  app.post("/api/chat", async (req, res) => {
    const { messages, apiKey, provider, context } = req.body;
    const userApiKey = apiKey || process.env.GEMINI_API_KEY;

    try {
      if (provider === "google" || !provider) {
        const ai = new GoogleGenAI({ apiKey: userApiKey as string });
        
        let systemPrompt = `EliteVan Sistem Yardimcisi olarak cevap ver. Asagidaki sistem bilgisini kullan: ${ELITEVAN_CONTEXT}`;
        
        if (context && context.searchResults && context.searchResults.length > 0) {
          systemPrompt += `\n\nEkstra Baglam: Su anda kullanicinin ekraninda asagidaki arama sonuclari var:\n${JSON.stringify(context.searchResults, null, 2)}`;
        }

        const result = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          systemInstruction: systemPrompt,
          contents: messages.map((m: any) => ({
            role: m.role,
            parts: [{ text: m.content }]
          }))
        });
        res.json({ content: result.text });
      } else if (provider === "openrouter") {
        let systemPrompt = `EliteVan Sistem Yardimcisi olarak cevap ver. Sistem bilgisi: ${ELITEVAN_CONTEXT}`;
        
        if (context && context.searchResults && context.searchResults.length > 0) {
          systemPrompt += `\n\nEkstra Baglam: Su anda kullanicinin ekraninda asagidaki arama sonuclari var:\n${JSON.stringify(context.searchResults, null, 2)}`;
        }
        
        const response = await axios.post("https://openrouter.ai/api/v1/chat/completions", {
          model: "google/gemini-flash-1.5",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages
          ]
        }, {
          headers: {
            "Authorization": `Bearer ${userApiKey}`,
            "Content-Type": "application/json"
          }
        });
        res.json({ content: response.data.choices[0].message.content });
      }
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: "Sohbet sirasinda bir hata olustu." });
    }
  });

  // Background Task Processor (Cronjob Simulator)
  setInterval(async () => {
    try {
      if (!db) return;
      const tasksQuery = query(collection(db, "tasks"), where("status", "==", "bekliyor"), limit(1));
      const snapshot = await getDocs(tasksQuery);
      if (!snapshot.empty) {
        const taskDoc = snapshot.docs[0];
        const { city } = taskDoc.data();
        
        await updateDoc(taskDoc.ref, { status: "isleniyor" });
        
        // Simulating AI Search (In a real app, we'd call the AI to find firms in 'city')
        // We'll wait 10 seconds to simulate work
        setTimeout(async () => {
          await updateDoc(taskDoc.ref, { 
            status: "tamamlandi", 
            lastChecked: serverTimestamp() 
          });
          // In a real implementation, we would add the found firms to the 'firms' collection here
        }, 10000);
      }
    } catch (err) {
      console.error("Cron Error:", err);
    }
  }, 15000); // Check every 15 seconds

  // Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
