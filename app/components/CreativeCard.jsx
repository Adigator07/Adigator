"use client";

import { motion } from "framer-motion";
import {
  Trash2, Edit2, Wand2, CheckCircle2, AlertTriangle,
} from "lucide-react";

const cardVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.9, y: -20 },
};

export default function CreativeCard({
  creative,
  onEdit,
  onAutoFix,
  onRemove,
  showFixButton = false,
  compact = false,
}) {
  return (
    <motion.div
      layout
      layoutId={`creative-card-${creative.id}`}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={{ type: "spring", damping: 20, stiffness: 300 }}
      className={`relative group rounded-xl overflow-hidden border-2 transition-all ${
        creative.valid
          ? "border-green-500/30 bg-gradient-to-br from-green-500/10 to-emerald-500/10 hover:border-green-500/60 hover:shadow-lg hover:shadow-green-500/10"
          : "border-red-500/30 bg-gradient-to-br from-red-500/10 to-rose-500/10 hover:border-red-500/60 hover:shadow-lg hover:shadow-red-500/10"
      }`}
    >
      {/* Image */}
      <div className={`relative overflow-hidden bg-black/20 ${compact ? "h-32" : "h-40"}`}>
        <img
          src={creative.url}
          alt={creative.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {/* Hover overlay with action buttons */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end justify-center pb-3 gap-2">
          {onEdit && (
            <motion.button
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => { e.stopPropagation(); onEdit(creative); }}
              className="p-2 rounded-lg bg-purple-600/90 backdrop-blur-sm text-white shadow-lg shadow-purple-500/30 hover:bg-purple-500 transition"
              title="Edit Creative"
            >
              <Edit2 size={16} />
            </motion.button>
          )}
          {showFixButton && !creative.valid && onAutoFix && (
            <motion.button
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => { e.stopPropagation(); onAutoFix(creative.id); }}
              className="p-2 rounded-lg bg-amber-600/90 backdrop-blur-sm text-white shadow-lg shadow-amber-500/30 hover:bg-amber-500 transition"
              title="Fix Automatically"
            >
              <Wand2 size={16} />
            </motion.button>
          )}
          {onRemove && (
            <motion.button
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => { e.stopPropagation(); onRemove(creative.id); }}
              className="p-2 rounded-lg bg-red-600/90 backdrop-blur-sm text-white shadow-lg shadow-red-500/30 hover:bg-red-500 transition"
              title="Remove"
            >
              <Trash2 size={16} />
            </motion.button>
          )}
        </div>

        {/* Valid badge */}
        {creative.valid && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute top-2 right-2 flex items-center gap-1 bg-green-600/90 backdrop-blur-sm text-white px-2 py-1 rounded-full text-[11px] font-bold shadow-lg shadow-green-500/20"
          >
            <CheckCircle2 size={12} /> Valid
          </motion.div>
        )}

        {/* Invalid warning */}
        {!creative.valid && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute top-2 right-2 flex items-center gap-1 bg-red-600/90 backdrop-blur-sm text-white px-2 py-1 rounded-full text-[11px] font-bold shadow-lg shadow-red-500/20"
          >
            <AlertTriangle size={12} /> Invalid
          </motion.div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 bg-black/20">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold text-white truncate flex-1">
            {creative.name}
          </p>
          <span
            className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
              creative.valid
                ? "bg-green-500/20 text-green-400"
                : "bg-red-500/20 text-red-400"
            }`}
          >
            {creative.size}
          </span>
        </div>

        {/* One-click fix for invalid - visible without hover on list view */}
        {showFixButton && !creative.valid && onAutoFix && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={(e) => { e.stopPropagation(); onAutoFix(creative.id); }}
            className="w-full mt-2 py-1.5 rounded-lg bg-gradient-to-r from-amber-600/60 to-orange-500/60 border border-amber-400/20 text-amber-200 text-[11px] font-semibold flex items-center justify-center gap-1.5 hover:from-amber-600/80 hover:to-orange-500/80 transition"
          >
            <Wand2 size={12} /> Fix Automatically
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
