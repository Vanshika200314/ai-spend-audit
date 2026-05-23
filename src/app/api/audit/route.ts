// src/app/api/audit/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateAudit } from '@/lib/auditEngine';
import { FormState } from '@/types/form';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tools_data } = body;

    if (!tools_data) {
      return NextResponse.json({ error: 'Missing tools_data' }, { status: 400 });
    }

    // Run the typed mathematical audit engine
    const formState = tools_data as FormState;
    const auditCalculations = calculateAudit(formState);

    const audit = await prisma.audit.create({
      data: {
        toolsData: tools_data,
        totalMonthlySavings: auditCalculations.totalMonthlySavings,
        totalAnnualSavings: auditCalculations.totalAnnualSavings,
        isPublic: true,
      },
      select: {
        id: true,
      },
    });

    return NextResponse.json({ auditId: audit.id });
 } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }}