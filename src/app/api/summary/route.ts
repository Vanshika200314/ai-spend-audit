// src/app/api/summary/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateAudit } from '@/lib/auditEngine';
import { FormState } from '@/types/form';

// Graceful fallback summary generator in case of API failure or missing keys
function generateFallbackSummary(teamSize: number, useCase: string, monthlySavings: number): string {
  return `Based on your team profile of ${teamSize} members using a ${useCase} stack, our audit has identified $${monthlySavings.toFixed(0)} in potential monthly overhead. The primary inefficiencies stem from redundant seat allocations and plan misalignments. We recommend immediate plan downgrades and seat consolidation to claim these savings and align your AI infrastructure with actual usage.`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { auditId } = body;

    if (!auditId) {
      return NextResponse.json({ error: 'Missing auditId' }, { status: 400 });
    }

    // Retrieve the raw audit inputs from Neon
    const auditRecord = await prisma.audit.findUnique({
      where: { id: auditId },
    });

    if (!auditRecord) {
      return NextResponse.json({ error: 'Audit not found' }, { status: 404 });
    }

    const formState = auditRecord.toolsData as unknown as FormState;
    const auditCalculations = calculateAudit(formState);

    // If there are zero savings, skip the API call to save credits and return an optimized summary
    if (auditCalculations.totalMonthlySavings === 0) {
      return NextResponse.json({
        summary: `Your stack configuration is highly optimal for a team size of ${formState.teamSize}. There are currently no overlapping developer tools or empty seat overheads. We recommend maintaining your current configuration and reviewing licenses quarterly as team scaling occurs.`,
      });
    }

    const anthropicKey = process.env.ANTHROPIC_API_KEY;

    // Gracefully handle missing keys by returning the fallback summary immediately
    if (!anthropicKey) {
      const fallback = generateFallbackSummary(
        formState.teamSize,
        formState.primaryUseCase,
        auditCalculations.totalMonthlySavings
      );
      return NextResponse.json({ summary: fallback });
    }

    // Format the tools summary for the prompt context
    const toolSummaries = Object.entries(auditCalculations.tools)
      .map(([toolId, res]) => {
        if (!res) return '';
        return `- ${toolId}: Current Spend $${res.currentSpend}/mo, Recommended Plan: ${res.recommendedPlan}, Savings: $${res.savings}/mo.`;
      })
      .filter(Boolean)
      .join('\n');

    const prompt = `You are an elite B2B SaaS finance auditor. Analyze this startup AI software spend audit data and generate a highly personalized, actionable summary paragraph:
    
- Team Size: ${formState.teamSize}
- Primary Use Case: ${formState.primaryUseCase}
- Total Monthly Savings: $${auditCalculations.totalMonthlySavings}
- Total Annual Savings: $${auditCalculations.totalAnnualSavings}
- Per-Tool Analysis:
${toolSummaries}

Rules:
1. Speak directly to the founder/engineering manager.
2. Be concise. Keep the output under 100 words.
3. Reference specific numerical savings and plans from the inputs.
4. Maintain a professional, quantitative, and objective tone (no fluff or exclamation marks).
5. Output ONLY the summary paragraph. No introductory greeting or conversational pleasantries.`;

    // Make direct HTTP request to Anthropic API (bypassing heavy SDKs)
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307', // High speed, low cost model
        max_tokens: 150,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API returned status ${response.status}`);
    }

    const data = await response.json();
    const summary = data.content?.[0]?.text?.trim();

    if (!summary) {
      throw new Error('No content returned from Anthropic');
    }

    return NextResponse.json({ summary });
  } catch (error) {
    // Log the error for internal debugging
    console.error('AI summary generation failed, falling back to templated generator:', error);

    // Return fallback summary gracefully
    return NextResponse.json({
      summary: 'Our audit indicates potential areas of optimization across your current stack. The inefficiencies are primarily due to redundant subscriptions and under-utilized enterprise licenses. We recommend restructuring these seat allocations to reduce your monthly burn rate.',
    });
  }
}