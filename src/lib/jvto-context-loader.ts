import { readFileSync, existsSync } from "fs";
import { join } from "path";

const DIR = join(process.cwd(), "compiled", "jvto-context");

export interface IndexItem {
  id: string;
  title: string;
  summary: string;
  fields: Record<string, unknown>;
  sourceRefs: string[];
  riskNotes?: string[];
}

// Module-scope cache — loaded once per process, never re-reads files at runtime
let _packages: IndexItem[] | null = null;
let _itineraries: IndexItem[] | null = null;
let _opFacts: IndexItem[] | null = null;
let _cannedResponses: IndexItem[] | null = null;
let _replyGuards: IndexItem[] | null = null;
let _brandVoice: Record<string, unknown> | null = null;

function load<T>(filename: string): T {
  const path = join(DIR, filename);
  if (!existsSync(path)) {
    throw new Error(
      `Context index missing: ${filename}\nRun: npm run build:context`
    );
  }
  return JSON.parse(readFileSync(path, "utf-8")) as T;
}

export function getPackages(): IndexItem[] {
  return (_packages ??= load<IndexItem[]>("packages.index.json"));
}

export function getItineraries(): IndexItem[] {
  return (_itineraries ??= load<IndexItem[]>("itineraries.index.json"));
}

export function getOperationalFacts(): IndexItem[] {
  return (_opFacts ??= load<IndexItem[]>("operational-facts.index.json"));
}

export function getCannedResponses(): IndexItem[] {
  return (_cannedResponses ??= load<IndexItem[]>("canned-responses.index.json"));
}

export function getReplyGuards(): IndexItem[] {
  return (_replyGuards ??= load<IndexItem[]>("reply-guards.index.json"));
}

export function getBrandVoice(): Record<string, unknown> {
  return (_brandVoice ??= load<Record<string, unknown>>("brand-voice.index.json"));
}

export function clearCache(): void {
  _packages = _itineraries = _opFacts = _cannedResponses = _replyGuards = _brandVoice = null;
}
