// src/app/api/audit/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tools_data } = body;

    if (!tools_data) {
      return NextResponse.json({ error: 'Missing tools_data' }, { status: 400 });
    }

    // Temporary mock calculations (to be updated with actual calculations on Day 4)
    const mockMonthlySavings = 120.0;
    const mockAnnualSavings = mockMonthlySavings * 12;

    const audit = await prisma.audit.create({
      data: {
        toolsData: tools_data,
        totalMonthlySavings: mockMonthlySavings,
        totalAnnualSavings: mockAnnualSavings,
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