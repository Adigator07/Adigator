"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import {
  Trash2, Edit2, Wand2, CheckCircle2, AlertTriangle,
} from "lucide-react";

const cardVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.9, y: -20 },
};

function CreativeCard({
  creative,
  onEdit,
  onRemove,
  compact = false,
  disableLayoutAnimation = false,
}) {
  const validationStatus = creative?.validation?.status || (creative.valid ? "PASS" : "CRITICAL");
  const readinessScore = creative?.auctionReadiness?.score ?? creative?.validation?.intelligence?.auctionReadiness?.score ?? 0;
  const readinessClass = readinessScore >= 85
    ? "text-emerald-300"
    : readinessScore >= 70
      ? "text-cyan-300"
      : readinessScore >= 55
        ? "text-amber-300"
        : "text-red-300";

  return (
    <motion.div
      layout={!disableLayoutAnimation}
      layoutId={disableLayoutAnimation ? undefined : `creative-card-${creative.id}`}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={{ type: "spring", damping: 20, stiffness: 300 }}
      className={`relative group rounded-xl overflow-hidden border-2 transition-all ${
        creative.valid
          ? "border-green-500/30 bg-linear-to-br from-green-500/10 to-emerald-500/10 hover:border-green-500/60 hover:shadow-lg hover:shadow-green-500/10"
          : "border-red-500/30 bg-linear-to-br from-red-500/10 to-rose-500/10 hover:border-red-500/60 hover:shadow-lg hover:shadow-red-500/10"
      }`}
    >
      {/* Image */}
      <div className={`relative overflow-hidden bg-black/20 ${compact ? "h-32" : "h-40"}`}>
        <img
          src={creative.url}
          alt={creative.name}
          loading="lazy"
          decoding="async"
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
            <CheckCircle2 size={12} /> {validationStatus}
          </motion.div>
        )}

        {/* Invalid warning */}
        {!creative.valid && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute top-2 right-2 flex items-center gap-1 bg-red-600/90 backdrop-blur-sm text-white px-2 py-1 rounded-full text-[11px] font-bold shadow-lg shadow-red-500/20"
          >
            <AlertTriangle size={12} /> {validationStatus}
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
        <p className="text-[10px] text-gray-400 mt-1 font-medium">
          File Size: {formatFileSize(creative.fileSizeKB)}
        </p>

        <div className="mt-2 space-y-1.5 text-[10px]">
          <InfoRow label="Placement" value={formatLabel(creative.placementType)} />
          <InfoRow label="Device" value={creative.deviceClassification || "Unknown"} />
          <InfoRow
            label="IAB"
            value={creative.iabCompatibility?.compatible ? "Compatible" : "Not Compatible"}
            valueClass={creative.iabCompatibility?.compatible ? "text-emerald-300" : "text-red-300"}
          />
          <InfoRow
            label="DSP"
            value={`${creative.dspCompatibility?.count || 0} / 7`}
            valueClass={(creative.dspCompatibility?.count || 0) >= 6 ? "text-emerald-300" : "text-amber-300"}
          />
          <InfoRow
            label="Inventory"
            value={creative.inventoryAvailability?.category || "Unclassified"}
          />
          <InfoRow
            label="Auction"
            value={`${readinessScore}/100`}
            valueClass={readinessClass}
          />
          <InfoRow
            label="Premium"
            value={creative.premiumPlacementPotential?.eligible ? "Eligible" : "Standard"}
            valueClass={creative.premiumPlacementPotential?.eligible ? "text-fuchsia-300" : "text-gray-300"}
          />
        </div>
      </div>
    </motion.div>
  );
}

function InfoRow({ label, value, valueClass = "text-gray-200" }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="uppercase tracking-wide text-gray-500">{label}</span>
      <span className={`font-semibold text-right ${valueClass}`}>{value}</span>
    </div>
  );
}

function formatLabel(value) {
  if (!value) return "Unknown";
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

const formatFileSize = (kb) => {
  if (!kb || kb <= 0) return "0 KB";
  if (kb < 1024) return `${kb} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
};

export default memo(CreativeCard);
