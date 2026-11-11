// プロジェクトの新規登録 API 
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api/auth";
import { validationError, withErrorHandling } from "@/lib/api/errors";
import { projectFormSchema, type ProjectFormValues } from "@/lib/validations/project";
import { ZodError } from "zod";

export type CreateProjectRequest = ProjectFormValues;
export type CreateProjectResponse = { project: { id: number } };

async function readJson(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

// userをオーナーとしてプロジェクトを作成
export const POST = withErrorHandling(async (request) => {
  const user = await requireUser();
  const raw = await readJson(request);
  if (raw === null) {
    throw validationError(
      new ZodError([
        {
          code: "custom",
          path: [],
          message: "入力内容を確認してください。",
        },
      ]),
    );
  }

  const { name, description } = projectFormSchema.parse(raw);
  const created = await prisma.project.create({
    data: { name, description, ownerId: user.id },
    select: { id: true },
  });

  const body: CreateProjectResponse = { project: { id: created.id } };
  return Response.json(body, { status: 201 });
});
