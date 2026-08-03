"use client";

import { useCallback, useEffect, useRef } from "react";

const TELEMETRY_STORAGE_KEY = "adigator_route_telemetry_v1";
const MAX_TELEMETRY_ENTRIES = 250;

function canUseBrowserTelemetry() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function readTelemetryEntries() {
  if (!canUseBrowserTelemetry()) return [];

  try {
    const raw = localStorage.getItem(TELEMETRY_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeTelemetryEntry(entry) {
  if (!canUseBrowserTelemetry()) return;

  try {
    const nextEntries = [...readTelemetryEntries(), entry].slice(-MAX_TELEMETRY_ENTRIES);
    localStorage.setItem(TELEMETRY_STORAGE_KEY, JSON.stringify(nextEntries));
    window.dispatchEvent(new CustomEvent("adigator-route-telemetry", { detail: entry }));
  } catch {
    // Ignore telemetry persistence failures.
  }
}

function buildTelemetryEntry(type, surface, label, durationMs, ok = true, meta = {}) {
  return {
    id: `${type}:${surface}:${label}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`,
    type,
    surface,
    label,
    ok,
    durationMs: Math.max(0, Math.round(Number(durationMs) || 0)),
    meta,
    recordedAt: new Date().toISOString(),
  };
}

export function recordApiTelemetry(surface, label, durationMs, ok = true, meta = {}) {
  writeTelemetryEntry(buildTelemetryEntry("api", surface, label, durationMs, ok, meta));
}

export async function timeAsyncOperation(surface, label, task, meta = {}) {
  const startedAt = typeof performance !== "undefined" ? performance.now() : Date.now();
  try {
    const result = await task();
    const endedAt = typeof performance !== "undefined" ? performance.now() : Date.now();
    recordApiTelemetry(surface, label, endedAt - startedAt, true, meta);
    return result;
  } catch (error) {
    const endedAt = typeof performance !== "undefined" ? performance.now() : Date.now();
    recordApiTelemetry(surface, label, endedAt - startedAt, false, {
      ...meta,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

export function useRouteLoadTelemetry(surface) {
  const startedAtRef = useRef(0);
  const readyEventsRef = useRef(new Set());

  useEffect(() => {
    startedAtRef.current = typeof performance !== "undefined" ? performance.now() : Date.now();
    readyEventsRef.current = new Set();
  }, [surface]);

  return useCallback((phase = "ready", meta = {}) => {
    if (readyEventsRef.current.has(phase)) return;
    readyEventsRef.current.add(phase);

    const endedAt = typeof performance !== "undefined" ? performance.now() : Date.now();
    writeTelemetryEntry(buildTelemetryEntry("route", surface, phase, endedAt - startedAtRef.current, true, meta));
  }, [surface]);
}

export function getStoredRouteTelemetry() {
  return readTelemetryEntries();
}