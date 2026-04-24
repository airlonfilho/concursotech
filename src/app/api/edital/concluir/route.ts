import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJWT } from '@/lib/auth';
import prisma from '@/lib/prisma';

async function getUsuario() {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) return null;

    const payload = await verifyJWT(token);
    if (!payload) return null;

    const usuario = await prisma.usuario.findUnique({
        where: { id: payload.id as string },
    });

    return usuario;
}

export async function POST(request: Request) {
    try {
        const usuario = await getUsuario();

        if (!usuario) {
            return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
        }

        const body = await request.json();
        const { materia, topico } = body;

        if (!materia || !topico) {
            return NextResponse.json(
                { error: 'Matéria e tópico são obrigatórios' },
                { status: 400 }
            );
        }

        // Upsert - marca como concluído (ou reverte se já existir)
        const existingProgress = await prisma.progressoTopico.findUnique({
            where: {
                usuario_id_materia_topico: {
                    usuario_id: usuario.id,
                    materia,
                    topico,
                },
            },
        });

        if (existingProgress) {
            // Se já existe, remove o progresso (desmarca)
            await prisma.progressoTopico.delete({
                where: { id: existingProgress.id },
            });

            return NextResponse.json({
                success: true,
                concluso: false,
                message: `Tópico "${topico}" desmarcado como concluído`,
            });
        } else {
            // Se não existe, cria o progresso
            await prisma.progressoTopico.create({
                data: {
                    usuario_id: usuario.id,
                    materia,
                    topico,
                    concluido: true,
                    data_conclusao: new Date(),
                },
            });

            // Adiciona XP pela conclusão do tópico
            await prisma.usuario.update({
                where: { id: usuario.id },
                data: {
                    xp: { increment: 10 }, // 10 XP por tópico concluído
                },
            });

            return NextResponse.json({
                success: true,
                concluso: true,
                message: `Tópico "${topico}" marcado como concluído! +10 XP`,
            });
        }
    } catch (error) {
        console.error('Erro ao marcar tópico como concluído:', error);
        return NextResponse.json(
            { error: 'Erro interno ao processar requisição' },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        const usuario = await getUsuario();

        if (!usuario) {
            return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
        }

        // Busca todo o progresso do usuário
        const progressos = await prisma.progressoTopico.findMany({
            where: { usuario_id: usuario.id },
            orderBy: { data_conclusao: 'desc' },
        });

        // Calcula estatísticas por matéria
        const estatisticasPorMateria = progressos.reduce((acc, p) => {
            if (!acc[p.materia]) {
                acc[p.materia] = { total: 0, concluidos: 0 };
            }
            acc[p.materia].concluidos += 1;
            return acc;
        }, {} as Record<string, { total: number; concluidos: number }>);

        return NextResponse.json({
            progressos,
            estatisticasPorMateria,
            totalConcluidos: progressos.length,
        });
    } catch (error) {
        console.error('Erro ao buscar progresso:', error);
        return NextResponse.json(
            { error: 'Erro interno ao processar requisição' },
            { status: 500 }
        );
    }
}
