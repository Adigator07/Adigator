"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";

import TemplateRenderer from "./TemplateRenderer";
import { templates } from "../templates/newsTemplates";

import {
  UploadCloud,
  CheckCircle2,
  XCircle,
} from "lucide-react";

// 🎯 PROGRAMMATIC SIZES
const ALLOWED_SIZES = [
  "300x250",
  "728x90",
  "160x600",
  "300x600",
  "320x50",
  "970x250",
  "300x1050",
];

export default function PreviewTool() {
  const [step, setStep] = useState(1);
  const [drag, setDrag] = useState(false);
  const [creatives, setCreatives] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState("news");

  const fileRef = useRef(null);

  // Rename
  const updateName = (index, value) => {
    const updated = [...creatives];
    updated[index].name = value;
    setCreatives(updated);
  };

  // Upload
  const handleFiles = (files) => {
    Array.from(files).forEach((file) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const img = new Image();

        img.onload = () => {
          const size = `${img.width}x${img.height}`;

          setCreatives((prev) => [
            ...prev,
            {
              name: file.name,
              url: e.target.result,
              size,
              valid: ALLOWED_SIZES.includes(size),
            },
          ]);
        };

        img.src = e.target.result;
      };

      reader.readAsDataURL(file);
    });
  };

  const validCreatives = creatives.filter((c) => c.valid);
  const invalidCreatives = creatives.filter((c) => !c.valid);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-black text-white">

      {/* HEADER */}
      <header className="px-10 py-6">
        <h1 className="text-3xl font-semibold">
          Adigator Creative Studio
        </h1>
        <p className="text-sm text-white/60 mt-1">
          Programmatic Creative Validator (DV360 / TTD)
        </p>
      </header>

      {/* STEP 1 — UPLOAD */}
      {step === 1 && (
        <main className="px-10 py-16 flex justify-center">
          <motion.div
            className={`w-full max-w-3xl rounded-2xl border-2 border-dashed p-14 text-center ${
              drag
                ? "border-purple-400 bg-white/10"
                : "border-white/20 bg-white/5"
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              handleFiles(e.dataTransfer.files);
            }}
          >
            <UploadCloud size={48} className="mx-auto mb-4 text-purple-400" />

            <h3 className="text-xl font-medium">Upload Creatives</h3>

            <p className="text-sm text-white/60 mt-2">
              Drag & drop or browse files
            </p>

            <p className="mt-3 text-xs text-white/50">
              {creatives.length} uploaded
            </p>

            <input
              ref={fileRef}
              type="file"
              multiple
              accept="image/*"
              hidden
              onChange={(e) => handleFiles(e.target.files)}
            />

            <button
              onClick={() => fileRef.current.click()}
              className="mt-6 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500"
            >
              Browse Files
            </button>

            {creatives.length > 0 && (
              <button
                onClick={() => setStep(2)}
                className="mt-8 px-6 py-2 bg-white/10 rounded-lg"
              >
                Next →
              </button>
            )}
          </motion.div>
        </main>
      )}

      {/* STEP 2 — VALIDATION */}
      {step === 2 && (
        <main className="px-10 py-12 max-w-5xl mx-auto">
          <h2 className="text-2xl mb-6">Validation Results</h2>

          {invalidCreatives.length > 0 && (
            <div className="mb-6">
              <h3 className="text-red-400 mb-3">Invalid</h3>
              {invalidCreatives.map((c, i) => (
                <div key={i} className="mb-2 p-4 bg-red-500/10 border border-red-400/30 rounded-xl flex justify-between">
                  <div>
                    <p>{c.name}</p>
                    <p className="text-sm text-red-300">{c.size}</p>
                  </div>
                  <XCircle className="text-red-400" />
                </div>
              ))}
            </div>
          )}

          <h3 className="text-green-400 mb-3">Valid</h3>
          {validCreatives.map((c, i) => (
            <div key={i} className="mb-2 p-4 bg-white/10 border border-white/20 rounded-xl flex justify-between">
              <div>
                <p>{c.name}</p>
                <p className="text-sm text-white/60">{c.size}</p>
              </div>
              <CheckCircle2 className="text-green-400" />
            </div>
          ))}

          <button
            onClick={() => setStep(3)}
            className="mt-8 px-6 py-2 bg-white/10 rounded-lg"
          >
            Continue →
          </button>
        </main>
      )}

      {/* STEP 3 — GRID */}
      {step === 3 && (
        <main className="px-10 py-12 max-w-6xl mx-auto">
          <h2 className="mb-6">Creative Library</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {validCreatives.map((c, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.05 }}
                className="rounded-2xl bg-white/5 border border-white/10 p-4 shadow-lg"
              >
                <div className="relative w-full h-52 flex items-center justify-center bg-black/30 rounded-xl overflow-hidden">
                  <div className="absolute top-2 right-2 text-xs bg-black/60 px-2 py-1 rounded">
                    {c.size}
                  </div>

                  <img
                    src={c.url}
                    alt=""
                    className="max-h-[90%] max-w-[90%] object-contain"
                  />
                </div>

                <input
                  value={c.name}
                  onChange={(e) => updateName(i, e.target.value)}
                  className="w-full mt-2 bg-transparent border-b border-white/20 text-sm outline-none"
                />
              </motion.div>
            ))}
          </div>

          <button
            onClick={() => setStep(4)}
            className="mt-10 px-6 py-2 bg-white/10 rounded-lg"
          >
            Select Template →
          </button>
        </main>
      )}

      {/* STEP 4 — TEMPLATE SELECTION */}
      {step === 4 && (
        <main className="px-10 py-12 max-w-6xl mx-auto">

          <h2 className="text-2xl mb-6 text-center">
            Select Template
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {["news", "gaming", "ecommerce"].map((type) => (
              <div
                key={type}
                onClick={() => setSelectedTemplate(type)}
                className={`cursor-pointer p-6 rounded-2xl border text-center ${
                  selectedTemplate === type
                    ? "border-purple-400 bg-purple-500/20"
                    : "border-white/20 bg-white/5"
                }`}
              >
                <div className="h-32 bg-gray-800 rounded mb-4" />
                <p className="capitalize font-semibold">{type}</p>
              </div>
            ))}

          </div>

          <div className="text-center mt-10">
            <button
              onClick={() => setStep(5)}
              className="px-8 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl"
            >
              Preview →
            </button>
          </div>

        </main>
      )}

      {/* STEP 5 — PREVIEW */}
      {step === 5 && (
        <main className="py-16 space-y-16">

          {templates.map((tpl, i) => {
            const matchedCreative = validCreatives.find(
              (c) => c.size === tpl.size
            );

            return (
              <div key={i}>
                <h2 className="text-white mb-4 text-center">
                  Slide {i + 1} — {tpl.size}
                </h2>

                <TemplateRenderer
                  template={tpl}
                  creative={matchedCreative}
                />
              </div>
            );
          })}

          <div className="text-center mt-10">
            <button
              onClick={() => window.print()}
              className="px-8 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl"
            >
              Download Deck
            </button>
          </div>

        </main>
      )}

    </div>
  );
}