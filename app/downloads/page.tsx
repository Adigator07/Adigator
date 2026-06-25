"use client";

import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";
import { motion } from "framer-motion";

export default function DownloadsPage() {
  return (
    <div className="min-h-screen bg-[#0a0a12] text-white">
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-white/50 hover:text-white transition">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Downloads</h1>
            <p className="text-sm text-white/40 mt-1">Exported reports and creative decks</p>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center"
        >
          <Download size={40} className="mx-auto text-purple-400 mb-4" />
          <p className="text-white font-semibold mb-2">No downloads yet</p>
          <p className="text-sm text-white/40 mb-6">
            Export a PPTX deck from Step 4 (Preview Studio) or download a PDF report from Step 3.
          </p>
          <Link
            href="/preview-tool?step=1"
            className="inline-flex px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-semibold"
          >
            Open Preview Tool
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
