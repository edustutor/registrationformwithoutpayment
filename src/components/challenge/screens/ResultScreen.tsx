"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Confetti from "react-confetti";
import { useWindowSize } from "react-use";
import { Clock, DownloadSimple, EyeSlash, ShareNetwork, Target, Trophy } from "@phosphor-icons/react";

import { gradeLabel, trackLabel, type LanguageCode } from "@/lib/catalog";
import type { Dictionary } from "@/lib/dictionary";
import { fillTemplate } from "@/lib/dictionary";
import { EDUS_HOTLINE, EDUS_WEBSITE, SHARE_HASHTAGS } from "@/lib/links";
import type { ChallengeResult } from "@/lib/types";
import { PrimaryButton, SecondaryButton } from "../ui";

const TIER_EMOJI: Record<string, string> = {
  CHAMPION: "🏆",
  EXCELLENT: "⭐",
  GREAT_START: "🚀",
  CHALLENGE_ACCEPTED: "💪",
};

/**
 * The PNG a student takes away and shares.
 *
 * Carries the student's name and school by explicit business decision, so a
 * shared card identifies who did it and promotes EDUS. The phone number is
 * never on the card. The website and hotline are included so a card shared to
 * WhatsApp or Facebook advertises EDUS without any extra text.
 */
function ScoreCard({
  result,
  studentName,
  school,
  t,
  language,
  cardRef,
}: {
  result: ChallengeResult;
  studentName: string;
  school: string;
  t: Dictionary;
  language: LanguageCode;
  cardRef: React.RefObject<HTMLDivElement | null>;
}) {
  const seconds = Math.round(result.elapsedMs / 100) / 10;
  const trackName = result.alTrack ? trackLabel(result.alTrack, language) : "";

  return (
    // Solid colours only, and no blend modes: html2canvas renders this subtree
    // to an image, and gradients or filters do not survive that reliably.
    <div ref={cardRef} className="bg-white p-6" style={{ width: "100%" }}>
      <div className="overflow-hidden rounded-3xl border-2 border-slate-100">
        <div className="bg-blue-600 px-6 pb-8 pt-7 text-center">
          <div className="mb-4 flex items-center justify-center">
            <Image src="/edus_logo_blue.webp" alt="EDUS" width={96} height={38} className="bg-white rounded-lg p-1.5" />
          </div>
          <div className="mb-3 text-5xl leading-none">{TIER_EMOJI[result.tier]}</div>
          <h2 className="text-xl font-extrabold leading-tight text-white sm:text-2xl">
            {t.result.tiers[result.tier]}
          </h2>

          {studentName && (
            <p className="mt-2 text-lg font-bold leading-tight text-white">{studentName}</p>
          )}
          {school && (
            <p className="text-sm font-medium leading-tight text-blue-100">{school}</p>
          )}

          <p className="mt-1 text-sm font-semibold text-blue-100">
            {gradeLabel(result.grade, language)}
            {trackName ? ` · ${trackName}` : ""}
          </p>
        </div>

        <div className="bg-white px-6 py-6">
          <div className="mb-5 text-center">
            <div className="flex items-baseline justify-center">
              <span className="text-6xl font-black leading-none text-emerald-500">
                {result.correctCount}
              </span>
              <span className="ml-1 text-3xl font-black text-slate-300">/{result.totalQuestions}</span>
            </div>
            <p className="mt-2 text-xs font-bold uppercase tracking-widest text-slate-400">
              {t.result.correctLabel}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Stat icon={<Target size={18} weight="duotone" />} label={t.result.points} value={String(result.normalisedScore)} />
            <Stat icon={<Clock size={18} weight="duotone" />} label={t.result.timeTaken} value={`${seconds}s`} />
            <Stat
              icon={<Trophy size={18} weight="duotone" />}
              label={t.result.gradeRank}
              value={`#${result.rank}`}
            />
          </div>

          {result.badges.length > 0 && (
            <div className="mt-5">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                {t.result.badgesTitle}
              </p>
              <div className="flex flex-wrap gap-2">
                {result.badges.map((badge) => (
                  <span
                    key={badge}
                    className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700"
                  >
                    {t.result.badges[badge]}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-5 border-t border-slate-100 pt-4 text-center">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              EDUS 60-Second Challenge · YGCIF 2026
            </p>
            <p className="mt-1.5 text-sm font-black text-blue-700">{EDUS_WEBSITE}</p>
            <p className="text-[11px] font-bold text-slate-500">Hotline {EDUS_HOTLINE}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-2 py-3 text-center">
      <div className="mb-1 flex justify-center text-blue-500">{icon}</div>
      <div className="text-lg font-black leading-none text-slate-900">{value}</div>
      <div className="mt-1 text-[9px] font-bold uppercase tracking-wider text-slate-500">{label}</div>
    </div>
  );
}

export function ResultScreen({
  t,
  language,
  result,
  studentName,
  school,
  storageFailed,
  onContinue,
}: {
  t: Dictionary;
  language: LanguageCode;
  result: ChallengeResult;
  studentName: string;
  school: string;
  storageFailed: boolean;
  onContinue: () => void;
}) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const { width, height } = useWindowSize();
  const [busy, setBusy] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [shareNote, setShareNote] = useState<string | null>(null);

  const fileName = `edus-challenge-${result.correctCount}-of-${result.totalQuestions}.png`;

  /** Loaded on demand so the image library is not in the first page download. */
  async function renderCard(): Promise<Blob | null> {
    if (!cardRef.current) return null;
    const { default: html2canvas } = await import("html2canvas-pro");
    const canvas = await html2canvas(cardRef.current, {
      scale: 2,
      backgroundColor: "#ffffff",
      logging: false,
      useCORS: true,
    });
    return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  }

  async function handleDownload() {
    setBusy(true);
    setDownloadError(null);
    try {
      const blob = await renderCard();
      if (!blob) throw new Error("Canvas produced no image");

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
    } catch (error) {
      console.error("[result] download failed", error);
      setDownloadError(t.result.downloadFailed);
    } finally {
      setBusy(false);
    }
  }

  /**
   * The caption that travels with a shared card. Carries who did it, the
   * score, the EDUS website and hotline, and the campaign hashtags, so a share
   * promotes EDUS without the student writing anything.
   */
  function buildCaption(): string {
    return fillTemplate(t.result.shareCaption, {
      name: studentName,
      // The connector differs per language, so it lives in the copy file.
      school: school ? fillTemplate(t.result.shareCaptionSchool, { school }) : "",
      correct: result.correctCount,
      total: result.totalQuestions,
      grade: gradeLabel(result.grade, language),
      score: result.normalisedScore,
      seconds: Math.round(result.elapsedMs / 100) / 10,
      website: EDUS_WEBSITE,
      hotline: EDUS_HOTLINE,
      hashtags: SHARE_HASHTAGS,
    });
  }

  async function copyCaption(caption: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(caption);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Three routes, best first.
   *
   * 1. The device can share an image with text: WhatsApp and Facebook receive
   *    the card and the caption together, which is the whole point.
   * 2. The device can share an image but drops text: copy the caption to the
   *    clipboard first and tell the student to paste it.
   * 3. No share sheet at all, typically desktop: save the image and copy the
   *    caption so they can post both by hand.
   */
  async function handleShare() {
    setBusy(true);
    setDownloadError(null);
    setShareNote(null);

    try {
      const blob = await renderCard();
      if (!blob) throw new Error("Canvas produced no image");

      const file = new File([blob], fileName, { type: "image/png" });
      const caption = buildCaption();

      if (navigator.canShare?.({ files: [file], text: caption })) {
        await navigator.share({ files: [file], text: caption, title: t.result.shareTitle });
        return;
      }

      if (navigator.canShare?.({ files: [file] })) {
        const copied = await copyCaption(caption);
        await navigator.share({ files: [file], title: t.result.shareTitle });
        if (copied) setShareNote(t.result.captionCopied);
        return;
      }

      const copied = await copyCaption(caption);
      await handleDownload();
      if (copied) setShareNote(t.result.savedAndCopied);
    } catch (error) {
      // A student dismissing the share sheet is not an error worth showing.
      if ((error as Error)?.name !== "AbortError") {
        console.error("[result] share failed", error);
        setDownloadError(t.result.downloadFailed);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative flex min-h-[100dvh] w-full flex-col bg-slate-50 md:min-h-[46rem]">
      {result.correctCount >= 4 && (
        <Confetti
          width={width}
          height={height}
          numberOfPieces={result.correctCount === 5 ? 320 : 180}
          recycle={false}
          style={{ zIndex: 30, pointerEvents: "none" }}
        />
      )}

      <div className="mx-auto w-full max-w-lg flex-1 px-4 py-6 md:py-10">
        <ScoreCard
          result={result}
          studentName={studentName}
          school={school}
          t={t}
          language={language}
          cardRef={cardRef}
        />

        <div className="px-6">
          <p className="mb-2 text-center text-base font-semibold leading-relaxed text-slate-600">
            {t.result.messages[result.tier]}
          </p>
          <p className="mb-6 text-center text-sm font-bold text-blue-700">
            {fillTemplate(t.result.rankOf, { rank: result.rank, total: result.rankOutOf })}
          </p>

          <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4">
            <p className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
              <EyeSlash size={14} weight="bold" />
              {t.result.answersHiddenTitle}
            </p>
            <p className="text-xs font-medium leading-relaxed text-slate-500">{t.result.answersHidden}</p>
          </div>

          {storageFailed && (
            <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-semibold leading-relaxed text-amber-800">
              Your score is shown correctly but could not be saved automatically. Please ask EDUS
              booth staff to record it before you continue.
            </div>
          )}

          {downloadError && (
            <p role="alert" className="mb-4 text-center text-xs font-bold text-red-600">
              {downloadError}
            </p>
          )}

          {shareNote && (
            <p role="status" className="mb-4 rounded-xl bg-blue-50 px-4 py-3 text-center text-xs font-semibold text-blue-800">
              {shareNote}
            </p>
          )}

          <div className="space-y-3">
            <SecondaryButton onClick={handleDownload} disabled={busy}>
              <span className="flex items-center justify-center gap-2">
                <DownloadSimple size={19} weight="bold" />
                {busy ? t.result.downloading : t.result.download}
              </span>
            </SecondaryButton>

            <SecondaryButton onClick={handleShare} disabled={busy}>
              <span className="flex items-center justify-center gap-2">
                <ShareNetwork size={19} weight="bold" />
                {t.result.share}
              </span>
            </SecondaryButton>

            <PrimaryButton onClick={onContinue} disabled={busy}>
              {t.result.continueCta} &rarr;
            </PrimaryButton>
          </div>
        </div>
      </div>
    </div>
  );
}
