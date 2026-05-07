"use client";

import React, { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface AnalysisResult {
  success: boolean;
  data?: {
    image: {
      width: number;
      height: number;
      format: string;
      size: number;
    };
    ocr: {
      text: string;
      confidence: number;
      blocksCount: number;
      cleanedText: string;
    };
    analysis: {
      summary: string;
      classification: string;
      keyPoints: string[];
      entities: Array<{
        name: string;
        type: string;
        value: string;
      }>;
      sentiment: "positive" | "negative" | "neutral";
      confidence: number;
      structuredData: Record<string, unknown>;
    };
    metrics: {
      processingTime: number;
      ocrConfidence: number;
      aiConfidence: number;
      overallQuality: number;
    };
  };
  error?: {
    message: string;
    stage: string;
    details?: string;
  };
}

interface UploadState {
  isLoading: boolean;
  preview: string | null;
  result: AnalysisResult | null;
  error: string | null;
}

export default function OCRAnalyzerUpload() {
  const [state, setState] = useState<UploadState>({
    isLoading: false,
    preview: null,
    result: null,
    error: null,
  });

  const [context, setContext] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  /**
   * Handle file selection
   */
  const handleFileSelect = useCallback(async (file: File) => {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      setState((prev) => ({
        ...prev,
        error: "Please select a valid image file",
      }));
      return;
    }

    // Validate file size (20MB max)
    if (file.size > 20 * 1024 * 1024) {
      setState((prev) => ({
        ...prev,
        error: "File size exceeds 20MB limit",
      }));
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setState((prev) => ({
        ...prev,
        preview: e.target?.result as string,
        error: null,
      }));
    };
    reader.readAsDataURL(file);

    // Process file
    await processImage(file);
  }, []);

  /**
   * Process image through pipeline
   */
  const processImage = useCallback(async (file: File) => {
    setState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      const formData = new FormData();
      formData.append("image", file);
      if (context) {
        formData.append("context", context);
      }

      const response = await fetch("/api/process", {
        method: "POST",
        body: formData,
      });

      const result: AnalysisResult = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || "Processing failed");
      }

      setState((prev) => ({
        ...prev,
        result,
        isLoading: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Unknown error",
        isLoading: false,
      }));
    }
  }, [context]);

  /**
   * Handle drag and drop
   */
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current++;
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current--;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current = 0;

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  /**
   * Reset state
   */
  const handleReset = () => {
    setState({
      isLoading: false,
      preview: null,
      result: null,
      error: null,
    });
    setContext("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">OCR & AI Analyzer</h2>
        <p className="text-gray-400">
          Upload an image to extract text and get AI-powered analysis
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Upload Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl p-6 backdrop-blur-sm"
          style={{
            background: "rgba(10,15,42,0.6)",
            border: "1px solid rgba(168,85,247,0.15)",
          }}
        >
          <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className="rounded-xl border-2 border-dashed border-purple-500/30 p-8 text-center cursor-pointer transition-all hover:border-purple-500/60"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
              }}
              className="hidden"
            />

            <div className="flex flex-col items-center gap-3">
              <div className="text-4xl">📸</div>
              <div>
                <p className="text-white font-semibold">Drop image here</p>
                <p className="text-sm text-gray-400">or click to browse</p>
              </div>
            </div>
          </div>

          {/* Context Input */}
          <div className="mt-6">
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Context (optional)
            </label>
            <input
              type="text"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="e.g., 'Invoice', 'Receipt', 'Document'"
              className="w-full rounded-lg px-4 py-2 bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
            />
          </div>

          {/* Image Preview */}
          <AnimatePresence>
            {state.preview && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-6"
              >
                <p className="text-sm text-gray-400 mb-3">Preview</p>
                <img
                  src={state.preview}
                  alt="Preview"
                  className="w-full h-64 object-cover rounded-lg"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Actions */}
          <div className="mt-6 flex gap-3">
            {state.preview && (
              <button
                onClick={handleReset}
                className="flex-1 rounded-lg px-4 py-2 bg-white/10 hover:bg-white/15 text-white font-semibold transition-colors"
              >
                Clear
              </button>
            )}
            {state.isLoading && (
              <button
                disabled
                className="flex-1 rounded-lg px-4 py-2 bg-purple-600/50 text-white font-semibold flex items-center justify-center gap-2"
              >
                <span className="animate-spin">⟳</span>
                Processing...
              </button>
            )}
          </div>

          {/* Error Display */}
          <AnimatePresence>
            {state.error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-4 rounded-lg p-4 bg-red-500/10 border border-red-500/30 text-red-400 text-sm"
              >
                {state.error}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Results Section */}
        <AnimatePresence>
          {state.result?.success && state.result.data && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Metrics */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  {
                    label: "OCR Confidence",
                    value: `${(state.result.data.metrics.ocrConfidence * 100).toFixed(1)}%`,
                    color: "purple",
                  },
                  {
                    label: "AI Confidence",
                    value: `${(state.result.data.metrics.aiConfidence * 100).toFixed(1)}%`,
                    color: "blue",
                  },
                  {
                    label: "Overall Quality",
                    value: `${(state.result.data.metrics.overallQuality * 100).toFixed(1)}%`,
                    color: "emerald",
                  },
                  {
                    label: "Processing Time",
                    value: `${state.result.data.metrics.processingTime}ms`,
                    color: "amber",
                  },
                ].map((metric) => (
                  <div
                    key={metric.label}
                    className={`rounded-lg p-4 bg-${metric.color}-500/10 border border-${metric.color}-500/20`}
                  >
                    <p className={`text-xs text-${metric.color}-400 mb-1`}>{metric.label}</p>
                    <p className="text-lg font-bold text-white">{metric.value}</p>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div
                className="rounded-lg p-4 backdrop-blur-sm"
                style={{
                  background: "rgba(10,15,42,0.6)",
                  border: "1px solid rgba(168,85,247,0.15)",
                }}
              >
                <h4 className="font-semibold text-white mb-2">Summary</h4>
                <p className="text-gray-300 text-sm">{state.result.data.analysis.summary}</p>
              </div>

              {/* Classification */}
              <div
                className="rounded-lg p-4 backdrop-blur-sm"
                style={{
                  background: "rgba(10,15,42,0.6)",
                  border: "1px solid rgba(168,85,247,0.15)",
                }}
              >
                <h4 className="font-semibold text-white mb-2">Classification</h4>
                <p className="text-purple-300 text-sm font-mono uppercase">
                  {state.result.data.analysis.classification}
                </p>
              </div>

              {/* Sentiment */}
              <div
                className="rounded-lg p-4 backdrop-blur-sm"
                style={{
                  background: "rgba(10,15,42,0.6)",
                  border: "1px solid rgba(168,85,247,0.15)",
                }}
              >
                <h4 className="font-semibold text-white mb-2">Sentiment</h4>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                    state.result.data.analysis.sentiment === "positive"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : state.result.data.analysis.sentiment === "negative"
                        ? "bg-red-500/20 text-red-400"
                        : "bg-amber-500/20 text-amber-400"
                  }`}
                >
                  {state.result.data.analysis.sentiment}
                </span>
              </div>

              {/* Key Points */}
              {state.result.data.analysis.keyPoints.length > 0 && (
                <div
                  className="rounded-lg p-4 backdrop-blur-sm"
                  style={{
                    background: "rgba(10,15,42,0.6)",
                    border: "1px solid rgba(168,85,247,0.15)",
                  }}
                >
                  <h4 className="font-semibold text-white mb-3">Key Points</h4>
                  <ul className="space-y-2">
                    {state.result.data.analysis.keyPoints.map((point, i) => (
                      <li key={i} className="text-sm text-gray-300 flex gap-2">
                        <span className="text-purple-400">•</span>
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Extracted Text */}
              <div
                className="rounded-lg p-4 backdrop-blur-sm"
                style={{
                  background: "rgba(10,15,42,0.6)",
                  border: "1px solid rgba(168,85,247,0.15)",
                }}
              >
                <h4 className="font-semibold text-white mb-2">Extracted Text</h4>
                <p className="text-gray-300 text-sm font-mono whitespace-pre-wrap max-h-48 overflow-y-auto">
                  {state.result.data.ocr.cleanedText}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
