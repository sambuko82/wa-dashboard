"use client";

import { Image, FileText, Video, X } from "lucide-react";

export type MediaType = "image" | "file" | "video";

interface Props {
  mediaType: MediaType | null;
  mediaUrl: string;
  mediaFilename: string;
  onMediaTypeChange: (v: MediaType | null) => void;
  onMediaUrlChange: (v: string) => void;
  onMediaFilenameChange: (v: string) => void;
}

const TYPES: { value: MediaType; label: string; icon: React.ElementType; accept: string }[] = [
  { value: "image", label: "Gambar",  icon: Image,    accept: "jpg, png, gif, webp" },
  { value: "file",  label: "File",    icon: FileText, accept: "pdf, docx, xlsx, dll" },
  { value: "video", label: "Video",   icon: Video,    accept: "mp4, mkv, mov" },
];

export function MediaPicker({
  mediaType, mediaUrl, mediaFilename,
  onMediaTypeChange, onMediaUrlChange, onMediaFilenameChange,
}: Props) {
  const current = TYPES.find((t) => t.value === mediaType) ?? null;

  return (
    <div className="overflow-hidden rounded-lg border border-[#d8deef] bg-white">
      <div className="flex items-center justify-between border-b border-[#e6eaf4] px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-800">Lampiran Media</h2>
          <p className="mt-0.5 text-xs text-slate-400">
            URL bisa static atau pakai variabel: <code className="font-mono text-[#546dfe]">{"{pdf_url}"}</code>
          </p>
        </div>
        {mediaType && (
          <button
            type="button"
            onClick={() => { onMediaTypeChange(null); onMediaUrlChange(""); onMediaFilenameChange(""); }}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-[#f2f5fb] hover:text-slate-700"
            title="Hapus lampiran"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Type selector */}
      <div className="border-b border-[#e6eaf4] px-5 py-4">
        <div className="flex gap-2">
          {/* No media */}
          <button
            type="button"
            onClick={() => { onMediaTypeChange(null); onMediaUrlChange(""); onMediaFilenameChange(""); }}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-all ${
              !mediaType
                ? "border-[#c7d1e6] bg-[#eef2fa] text-slate-800"
                : "border-[#d8deef] text-slate-500 hover:border-[#c1ccdf] hover:text-slate-700"
            }`}
          >
            Teks saja
          </button>

          {TYPES.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => onMediaTypeChange(value)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-all ${
                mediaType === value
                  ? "border-[#90a3ff] bg-[#eef1ff] text-[#546dfe]"
                  : "border-[#d8deef] text-slate-500 hover:border-[#c1ccdf] hover:text-slate-700"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* URL + Filename inputs (shown when a media type is selected) */}
      {mediaType && (
        <div className="space-y-3 bg-white px-5 py-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-600">
              URL {current?.label}
              <span className="text-red-500 ml-0.5">*</span>
            </label>
            <input
              type="text"
              value={mediaUrl}
              onChange={(e) => onMediaUrlChange(e.target.value)}
              placeholder={`https://example.com/file.${mediaType === "image" ? "jpg" : mediaType === "video" ? "mp4" : "pdf"} atau {url_variable}`}
              className="app-input font-mono"
            />
            <p className="mt-1 text-[11px] text-slate-400">
              Format: <code className="text-[#546dfe]">{"{nama_variable}"}</code> untuk URL dinamis per pengiriman
            </p>
          </div>

          {(mediaType === "file" || mediaType === "video") && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600">
                Nama file <span className="font-normal text-slate-400">(opsional)</span>
              </label>
              <input
                type="text"
                value={mediaFilename}
                onChange={(e) => onMediaFilenameChange(e.target.value)}
                placeholder={`Laporan.pdf atau {filename_variable}`}
                className="app-input font-mono"
              />
            </div>
          )}

          {/* Preview hint */}
          <div className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-sm ${
            mediaType === "image" ? "border-[#cfd7ea] bg-[#f5f7fd] text-[#546dfe]"
            : mediaType === "video" ? "border-[#cfd7ea] bg-[#f5f7fd] text-[#546dfe]"
            : "border-[#cfd7ea] bg-[#f5f7fd] text-[#546dfe]"
          }`}>
            {current && <current.icon className="w-5 h-5 flex-shrink-0" />}
            <div>
              <p className="text-xs font-medium">
                {mediaType === "image" && "Gambar akan dikirim dengan caption dari isi pesan"}
                {mediaType === "video" && "Video akan dikirim dengan caption dari isi pesan"}
                {mediaType === "file"  && "File akan dikirim sebagai dokumen dengan caption dari isi pesan"}
              </p>
              <p className="text-[11px] opacity-70 mt-0.5">
                Format yang didukung: {current?.accept}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
