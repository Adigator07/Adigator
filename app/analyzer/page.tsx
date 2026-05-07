"use client";

import { motion } from "framer-motion";
import OCRAnalyzerUpload from "@/app/components/OCRAnalyzerUpload";

export default function AnalyzerPage() {
  return (
    <main className="relative min-h-screen bg-[#020617] text-white overflow-hidden">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div
          className="absolute top-0 left-1/4 w-96 h-96 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(168,85,247,0.15) 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />
        <div
          className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />
      </div>

      {/* Grain */}
      <div className="grain" />

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <section className="pt-20 pb-12">
          <div className="landing-container">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-8"
            >
              <h1 className="font-display text-5xl md:text-6xl font-bold mb-4">
                <span className="gradient-text">OCR & AI Analyzer</span>
              </h1>
              <p className="text-lg text-gray-400 max-w-2xl">
                Extract text from images with precision OCR, then leverage AI to understand,
                classify, and extract structured insights automatically.
              </p>
            </motion.div>

            {/* Features Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12"
            >
              {[
                { icon: "🖼️", title: "Image Upload", desc: "Drag & drop or click to upload" },
                { icon: "📝", title: "Text Extraction", desc: "Google Cloud Vision OCR" },
                { icon: "🤖", title: "AI Analysis", desc: "OpenAI powered insights" },
              ].map((item, i) => (
                <div
                  key={i}
                  className="rounded-lg p-4 backdrop-blur-sm"
                  style={{
                    background: "rgba(10,15,42,0.4)",
                    border: "1px solid rgba(168,85,247,0.1)",
                  }}
                >
                  <div className="text-2xl mb-2">{item.icon}</div>
                  <h3 className="font-semibold text-white mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-400">{item.desc}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-12 pb-20">
          <div className="landing-container">
            <OCRAnalyzerUpload />
          </div>
        </section>

        {/* Info Section */}
        <section className="py-12 border-t border-white/5">
          <div className="landing-container">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="grid lg:grid-cols-3 gap-8"
            >
              {[
                {
                  title: "How it Works",
                  points: [
                    "Upload image (JPEG, PNG, WebP, TIFF)",
                    "System validates and preprocesses",
                    "Google Vision extracts text",
                    "AI analyzes and classifies",
                    "View results & structured data",
                  ],
                },
                {
                  title: "Supported Formats",
                  points: [
                    "Images: JPEG, PNG, WebP, GIF, TIFF",
                    "Max file size: 20MB",
                    "Resolution: 200px - 3000px optimal",
                    "Aspect ratio: 0.3 - 3.0",
                    "Auto-optimized for OCR",
                  ],
                },
                {
                  title: "Results Include",
                  points: [
                    "Extracted text with confidence",
                    "Document classification",
                    "Key points & summary",
                    "Named entity recognition",
                    "Sentiment analysis",
                  ],
                },
              ].map((section, i) => (
                <div
                  key={i}
                  className="rounded-lg p-6 backdrop-blur-sm"
                  style={{
                    background: "rgba(10,15,42,0.4)",
                    border: "1px solid rgba(168,85,247,0.1)",
                  }}
                >
                  <h3 className="font-semibold text-white mb-4">{section.title}</h3>
                  <ul className="space-y-3">
                    {section.points.map((point, j) => (
                      <li key={j} className="flex gap-3 text-sm text-gray-300">
                        <span className="text-purple-400 shrink-0">✓</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </motion.div>
          </div>
        </section>
      </div>
    </main>
  );
}
