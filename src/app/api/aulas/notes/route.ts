import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { verifyJWT } from "@/lib/auth";
import { generateVideoAiNotes } from "@/lib/gemini";

async function getUserIdFromRequest(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value;
  if (!token) return null;

  const payload = await verifyJWT(token);
  if (!payload || !payload.id) return null;

  return payload.id as string;
}

export async function GET(req: NextRequest) {
  try {
    const usuarioId = await getUserIdFromRequest(req);
    if (!usuarioId) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const videoId = searchParams.get("videoId");

    if (!videoId) {
      return NextResponse.json({ message: "videoId é obrigatório" }, { status: 400 });
    }

    const cached = await prisma.videoCache.findUnique({
      where: { youtube_id: videoId },
      select: { ai_notes_json: true },
    });

    return NextResponse.json(
      {
        notes: cached?.ai_notes_json ?? null,
        cached: Boolean(cached?.ai_notes_json),
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[AULAS_NOTES_GET_ERROR]", err);
    return NextResponse.json({ message: "Erro interno no servidor" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const usuarioId = await getUserIdFromRequest(req);
    if (!usuarioId) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const videoId = String(body.videoId || "").trim();
    const titulo = String(body.titulo || "").trim();
    const materia = String(body.materia || "").trim();
    const topico = String(body.topico || "").trim();
    const canal = String(body.canal || "").trim();
    const descricao = String(body.descricao || "").trim();

    if (!videoId || !titulo || !materia) {
      return NextResponse.json(
        { message: "videoId, titulo e materia são obrigatórios" },
        { status: 400 }
      );
    }

    const existing = await prisma.videoCache.findUnique({
      where: { youtube_id: videoId },
      select: { ai_notes_json: true },
    });

    if (existing?.ai_notes_json) {
      return NextResponse.json(
        { notes: existing.ai_notes_json, cached: true },
        { status: 200 }
      );
    }

    const notes = await generateVideoAiNotes({
      titulo,
      materia,
      topico,
      canal,
      descricao,
    });

    if (!notes) {
      return NextResponse.json(
        { message: "Não foi possível gerar o resumo por IA" },
        { status: 502 }
      );
    }

    await prisma.videoCache.upsert({
      where: { youtube_id: videoId },
      create: {
        youtube_id: videoId,
        titulo,
        topico: topico || materia,
        thumbnail: String(body.thumb || ""),
        duracao: String(body.duracao || ""),
        ai_notes_json: notes as any,
      },
      update: {
        titulo,
        topico: topico || materia,
        thumbnail: String(body.thumb || ""),
        duracao: String(body.duracao || ""),
        ai_notes_json: notes as any,
      },
    });

    return NextResponse.json({ notes, cached: false }, { status: 200 });
  } catch (err) {
    console.error("[AULAS_NOTES_POST_ERROR]", err);
    return NextResponse.json({ message: "Erro interno no servidor" }, { status: 500 });
  }
}
