// src/lib/observability/index.js — DEV/PROD facade (Vite eliminates dev impl in production)
import * as prodImpl from './index.prod.js';
import * as devImpl from './index.dev.js';

const impl = import.meta.env.DEV ? devImpl : prodImpl;

export const metrics                      = impl.metrics;
export const startFpsTracking             = impl.startFpsTracking;
export const stopFpsTracking              = impl.stopFpsTracking;
export const traceStage                   = impl.traceStage;
export const realtimeHealthScore          = impl.realtimeHealthScore;
export const mobileExperienceScore        = impl.mobileExperienceScore;
export const errorSummary                 = impl.errorSummary;
export const costSummary                  = impl.costSummary;
export const getObservabilityReport       = impl.getObservabilityReport;
export const logObservabilitySnapshot     = impl.logObservabilitySnapshot;
export const initObservability            = impl.initObservability;
export const captureMemorySnapshot        = impl.captureMemorySnapshot;
export const perfMark                     = impl.perfMark;
export const perfMeasure                  = impl.perfMeasure;
