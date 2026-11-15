// react-hook-formと連携して進捗投稿（kind: "progress"）に必要な選択UIを提供
"use client";

import type {
  MyProjectOption,
  MyTaskOption,
} from "@/app/api/me/projects/route";
import { FormField } from "@/app/_components/common/FormField";
import { Select } from "@/app/_components/common/Select";
import { TASK_STATUSES } from "@/lib/constants";
import type { TaskStatus } from "@/types/task";
import Link from "next/link";
import type {
  Control,
  FieldErrors,
  UseFormRegister,
} from "react-hook-form";
import { useWatch } from "react-hook-form";

export type ProgressFieldValues = {
  projectId?: number;
  taskId?: number;
  status?: TaskStatus;
};

export type PostFormValues = ProgressFieldValues & {
  kind: "normal" | "progress";
  body: string;
};

type ProgressSelectFieldsProps = {
  projects: MyProjectOption[];
  register: UseFormRegister<PostFormValues>;
  control: Control<PostFormValues>;
  errors: FieldErrors<PostFormValues>;
  disabled: boolean;
  emptyHref: string | null;
  onProjectChange: () => void;
  onTaskChange: (task: MyTaskOption) => void;
};

// 文字IDを数値IDに変換
function parseOptionalId(value: string) {
  if (value === "") {
    return undefined;
  }
  return Number(value);
}

// 3つのセレクトと0件時の案内リンクを表示する
export function ProgressSelectFields({
  projects,
  register,
  control,
  errors,
  disabled,
  emptyHref,
  onProjectChange,
  onTaskChange,
}: ProgressSelectFieldsProps) {
  const projectId = useWatch({ control, name: "projectId" });
  const selectedProject = projects.find((project) => project.id === projectId);
  const tasks = selectedProject?.tasks ?? [];
  const noProjects = projects.length === 0;
  const noTasks = Boolean(selectedProject && tasks.length === 0);
  const showEmptyGuide = Boolean(emptyHref) && (noProjects || noTasks);

  return (
    <div className="flex flex-col gap-4">
      {showEmptyGuide && emptyHref ? (
        <p className="text-sm text-[#6A7B82]">
          <Link href={emptyHref} className="text-[#0F6E6B] underline">
            先にプロジェクトとタスクを登録してください
          </Link>
        </p>
      ) : null}

      <FormField
        label="自分のプロジェクト"
        required
        htmlFor="progress-project"
        error={errors.projectId?.message}
      >
        <Select
          id="progress-project"
          hasError={Boolean(errors.projectId)}
          disabled={disabled || noProjects}
          {...register("projectId", {
            setValueAs: parseOptionalId,
            onChange: () => {
              onProjectChange();
            },
          })}
        >
          <option value="">プロジェクトを選択</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </Select>
      </FormField>

      <FormField
        label="タスク"
        required
        htmlFor="progress-task"
        error={errors.taskId?.message}
      >
        <Select
          id="progress-task"
          hasError={Boolean(errors.taskId)}
          disabled={disabled || noProjects || projectId == null || noTasks}
          {...register("taskId", {
            setValueAs: parseOptionalId,
            onChange: (event) => {
              const nextId = parseOptionalId(event.target.value);
              const task = tasks.find((item) => item.id === nextId);
              if (task) {
                onTaskChange(task);
              }
            },
          })}
        >
          <option value="">タスクを選択</option>
          {tasks.map((task) => (
            <option key={task.id} value={task.id}>
              {task.name}
            </option>
          ))}
        </Select>
      </FormField>

      <FormField
        label="ステータス"
        htmlFor="progress-status"
        error={errors.status?.message}
        hint="今のステータスのままでも投稿できます"
      >
        <Select
          id="progress-status"
          hasError={Boolean(errors.status)}
          disabled={disabled || noProjects || projectId == null || noTasks}
          {...register("status", {
            setValueAs: (value: string) => (value === "" ? undefined : value),
          })}
        >
          <option value="">ステータスを選択</option>
          {TASK_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </Select>
      </FormField>
    </div>
  );
}
