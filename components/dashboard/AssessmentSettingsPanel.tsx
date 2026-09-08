"use client";

import { useState } from "react";
import { RotateCcw, Save, SlidersHorizontal } from "lucide-react";
import {
  AssessmentSettings,
  SIZE_PRESETS,
  validateSettings,
} from "@/lib/assessmentSettings";
import { saveAssessmentSettingsApi, resetAssessmentSettings } from "@/lib/api";

interface AssessmentSettingsPanelProps {
  settings: AssessmentSettings;
  onChange: (s: AssessmentSettings) => void;
}

const FIELDS: {
  key: keyof AssessmentSettings;
  label: string;
  unit: string;
  help: string;
}[] = [
  {
    key: "alertThreshold",
    label: "임계점 경보 기준",
    unit: "건",
    help: "누적 아차사고가 이 건수에 도달하면 경보가 점등됩니다.",
  },
  {
    key: "minForFrequent",
    label: "가능성 '상' 최소 건수",
    unit: "건",
    help: "구역별 신고가 이 건수 이상이어야 가능성 3점(빈번)으로 판정합니다.",
  },
  {
    key: "minForOccasional",
    label: "가능성 '중' 최소 건수",
    unit: "건",
    help: "구역별 신고가 이 건수 이상이어야 가능성 2점(가끔)으로 판정합니다.",
  },
];

/**
 * 사업장별 평가 기준값 설정.
 *
 * 위험성평가의 판정 경계는 표준으로 정해진 수치가 아니라 사업장이 스스로 정하는
 * 관리 기준이다. 근로자 수·운영 기간·업종 위험도에 따라 달라야 하므로,
 * 코드를 고치지 않고 화면에서 조정할 수 있게 한다.
 */
export function AssessmentSettingsPanel({
  settings,
  onChange,
}: AssessmentSettingsPanelProps) {
  const [draft, setDraft] = useState<AssessmentSettings>(settings);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const isDirty =
    draft.alertThreshold !== settings.alertThreshold ||
    draft.minForFrequent !== settings.minForFrequent ||
    draft.minForOccasional !== settings.minForOccasional;

  function setField(key: keyof AssessmentSettings, raw: string) {
    const n = parseInt(raw, 10);
    setDraft({ ...draft, [key]: Number.isNaN(n) ? 0 : n });
    setMessage(null);
  }

  async function handleSave() {
    const error = validateSettings(draft);
    if (error) {
      setMessage({ text: error, ok: false });
      return;
    }
    setIsSaving(true);
    try {
      const saved = await saveAssessmentSettingsApi(draft);
      onChange(saved);
      setDraft(saved);
      setMessage({ text: "저장했습니다. 평가 결과가 새 기준으로 다시 계산됩니다.", ok: true });
    } catch (err) {
      setMessage({
        text: err instanceof Error ? err.message : "저장에 실패했습니다.",
        ok: false,
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleReset() {
    setIsSaving(true);
    try {
      const saved = await resetAssessmentSettings();
      onChange(saved);
      setDraft(saved);
      setMessage({ text: "기본값으로 되돌렸습니다.", ok: true });
    } catch (err) {
      setMessage({
        text: err instanceof Error ? err.message : "초기화에 실패했습니다.",
        ok: false,
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* 규모별 권장값 */}
      <div>
        <p className="mb-2 font-body text-[11px] text-steel-light">
          근로자 규모별 권장값 (클릭하면 입력란에 채워집니다)
        </p>
        <div className="grid grid-cols-3 gap-2">
          {SIZE_PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => {
                setDraft(p.settings);
                setMessage(null);
              }}
              className="flex flex-col items-center rounded-module border border-steel-hairline bg-ink-softer py-2 transition-colors hover:border-steel"
            >
              <span className="font-body text-sm text-paper">{p.label}</span>
              <span className="font-body text-[10px] text-steel-light">
                {p.description}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 개별 입력 */}
      <div className="flex flex-col gap-3">
        {FIELDS.map((f) => (
          <div key={f.key}>
            <label className="flex items-center justify-between gap-3">
              <span className="font-body text-sm text-paper">{f.label}</span>
              <span className="flex shrink-0 items-center gap-1.5">
                <input
                  type="number"
                  min={1}
                  value={draft[f.key]}
                  onChange={(e) => setField(f.key, e.target.value)}
                  className="w-20 rounded-module border border-steel bg-ink-softer px-2 py-1.5 text-right font-body text-sm text-paper outline-none focus:border-safety-yellow"
                />
                <span className="font-body text-xs text-steel-light">{f.unit}</span>
              </span>
            </label>
            <p className="mt-0.5 font-body text-[11px] leading-snug text-steel-light">
              {f.help}
            </p>
          </div>
        ))}
      </div>

      {message && (
        <p
          className={
            message.ok
              ? "rounded-module border border-safety-green bg-safety-green/10 px-3 py-2 font-body text-xs text-safety-green"
              : "rounded-module border border-safety-red bg-safety-red/10 px-3 py-2 font-body text-xs text-safety-red"
          }
        >
          {message.text}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={!isDirty || isSaving}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-module bg-safety-green py-2.5 font-display text-sm tracking-wide text-ink transition-opacity disabled:opacity-30"
        >
          <Save className="h-4 w-4" />
          {isSaving ? "저장 중…" : "저장"}
        </button>
        <button
          type="button"
          onClick={handleReset}
          disabled={isSaving}
          className="flex shrink-0 items-center justify-center gap-1.5 rounded-module border border-steel bg-ink-softer px-3 py-2.5 font-body text-sm text-steel-light transition-colors hover:text-paper disabled:opacity-30"
        >
          <RotateCcw className="h-4 w-4" />
          기본값
        </button>
      </div>

      <p className="flex items-start gap-1.5 rounded-module border border-steel-hairline bg-ink-softer px-3 py-2 font-body text-[11px] leading-relaxed text-steel-light">
        <SlidersHorizontal className="mt-0.5 h-3 w-3 shrink-0" />
        <span>
          이 값들은 <span className="text-paper">표준으로 정해진 수치가 아닙니다.</span>{" "}
          과거 1~2년 자기 사업장 데이터로 분포를 확인한 뒤 산업안전보건위원회 심의를
          거쳐 정하고, 운영하며 조정하는 것이 바람직합니다.
        </span>
      </p>
    </div>
  );
}
