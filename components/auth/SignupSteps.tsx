// ユーザー登録ステップ表示コンポーネント（Google認証 → ユーザー情報登録）
"use client";

import { clsx } from "clsx";
import { Check } from "lucide-react";   // チェックマークアイコン

type SignupStepsProps = {
  currentStep: 1 | 2;
};

// ステート、 処理中,完了,未達
type StepState = "active" | "done" | "upcoming";

// ステップ情報
type StepIndexProps = {
  n: 1 | 2;
  state: StepState;
};

// ステップ番号表示、完了ならチェック、処理中なら番号表示、未達なら枠線つき番号表示
function StepIndex({ n, state }: StepIndexProps) {
  return (
    <span
      className={clsx(
        "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
        state === "upcoming"
          ? "border border-[#DEE7E9] text-[#6A7B82]"
          : "bg-[#0F6E6B] text-white",
      )}
    >
      {state === "done" ? <Check className="h-3.5 w-3.5" aria-hidden /> : n}
    </span>
  );
}

type StepLabelProps = {
  n: 1 | 2;
  state: StepState;
  label: string;
};

// ステップ番号と文章を並べ、今のステップだけ強調色にする
function StepLabel({ n, state, label }: StepLabelProps) {
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap">
      <StepIndex n={n} state={state} />
      <span className={state === "active" ? "font-medium text-[#0F6E6B]" : "text-[#6A7B82]"}>
        {label}
      </span>
    </span>
  );
}

// ステップごとのStepLabelと進行状態を表示
export function SignupSteps({ currentStep }: SignupStepsProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-2 text-xs sm:text-sm" aria-label="登録ステップ">
      <StepLabel n={1} state={currentStep === 1 ? "active" : "done"} label="Google認証" />
      <span className="h-px w-6 bg-[#DEE7E9]" aria-hidden />
      <StepLabel n={2} state={currentStep === 2 ? "active" : "upcoming"} label="ユーザー情報登録" />
    </div>
  );
}
