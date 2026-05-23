// src/lib/auditEngine.ts
import { FormState } from '@/types/form';

export interface ToolAuditResult {
  currentSpend: number;
  recommendedPlan: string;
  recommendedSpend: number;
  savings: number;
  reason: string;
}

export interface AuditOutput {
  totalMonthlySavings: number;
  totalAnnualSavings: number;
  tools: {
    cursor?: ToolAuditResult;
    copilot?: ToolAuditResult;
    claude?: ToolAuditResult;
    chatgpt?: ToolAuditResult;
    anthropicApi?: ToolAuditResult;
    openaiApi?: ToolAuditResult;
    gemini?: ToolAuditResult;
    windsurf?: ToolAuditResult;
  };
}

export function calculateAudit(formState: FormState): AuditOutput {
  const output: AuditOutput = {
    totalMonthlySavings: 0,
    totalAnnualSavings: 0,
    tools: {},
  };

  let totalSavingsAccumulator = 0;

  // 1. Cursor Audit Rules
  if (formState.tools.cursor.selected) {
    const config = formState.tools.cursor;
    let recPlan = config.plan;
    let recSpend = config.monthlySpend;
    let reason = 'Your Cursor spend looks optimal for your team size.';

    // Rule: Cursor Business is $40/seat, Pro is $20/seat.
    // If team size is small (< 3) but on Business plan, recommend Pro.
    if (config.plan === 'Business' && formState.teamSize < 3) {
      recPlan = 'Pro';
      recSpend = config.seats * 20;
      reason = 'Cursor Business features are overkill for small teams. Downgrade to Pro to save $20 per seat.';
    }

    const savings = Math.max(0, config.monthlySpend - recSpend);
    totalSavingsAccumulator += savings;
    output.tools.cursor = {
      currentSpend: config.monthlySpend,
      recommendedPlan: recPlan,
      recommendedSpend: recSpend,
      savings,
      reason,
    };
  }

  // 2. Claude Audit Rules
  if (formState.tools.claude.selected) {
    const config = formState.tools.claude;
    let recPlan = config.plan;
    let recSpend = config.monthlySpend;
    let reason = 'Your Claude configuration matches your team profile.';

    // Rule: Claude Team has a 5-seat minimum ($150/mo minimum).
    // If they have < 5 seats but are paying for Claude Team, recommend Claude Pro ($20/seat).
    if (config.plan === 'Team' && config.seats < 5) {
      recPlan = 'Pro';
      recSpend = config.seats * 20;
      reason = 'Claude Team has a strict 5-seat minimum ($150/mo). Downgrading to individual Pro licenses saves $10 per seat.';
    }

    const savings = Math.max(0, config.monthlySpend - recSpend);
    totalSavingsAccumulator += savings;
    output.tools.claude = {
      currentSpend: config.monthlySpend,
      recommendedPlan: recPlan,
      recommendedSpend: recSpend,
      savings,
      reason,
    };
  }

  // 3. ChatGPT Audit Rules
  if (formState.tools.chatgpt.selected) {
    const config = formState.tools.chatgpt;
    let recPlan = config.plan;
    let recSpend = config.monthlySpend;
    let reason = 'Your ChatGPT allocation looks highly cost-effective.';

    // Rule: ChatGPT Team has a 2-seat minimum. If 1 seat on Team, suggest Plus ($20/mo).
    if (config.plan === 'Team' && config.seats === 1) {
      recPlan = 'Plus';
      recSpend = 20;
      reason = 'ChatGPT Team has a 2-seat minimum. Switch to an individual Plus license to save $10/mo.';
    }

    const savings = Math.max(0, config.monthlySpend - recSpend);
    totalSavingsAccumulator += savings;
    output.tools.chatgpt = {
      currentSpend: config.monthlySpend,
      recommendedPlan: recPlan,
      recommendedSpend: recSpend,
      savings,
      reason,
    };
  }

  // 4. Copilot Audit Rules
  if (formState.tools.copilot.selected) {
    const config = formState.tools.copilot;
    let recPlan = config.plan;
    let recSpend = config.monthlySpend;
    let reason = 'Your GitHub Copilot configurations are optimal.';

    // Rule: Copilot Enterprise is $39/seat, Business is $19/seat.
    // If the primary use case is not purely "coding", or team is < 3, suggest downgrading to Business.
    if (config.plan === 'Enterprise' && formState.primaryUseCase !== 'coding') {
      recPlan = 'Business';
      recSpend = config.seats * 19;
      reason = 'Copilot Enterprise features are designed for strict developer compliance. Downgrade to Copilot Business to save $20 per seat.';
    }

    const savings = Math.max(0, config.monthlySpend - recSpend);
    totalSavingsAccumulator += savings;
    output.tools.copilot = {
      currentSpend: config.monthlySpend,
      recommendedPlan: recPlan,
      recommendedSpend: recSpend,
      savings,
      reason,
    };
  }

  // 5. Tool Duplication rule: If user runs both Cursor AND Copilot, flag it
  if (formState.tools.cursor.selected && formState.tools.copilot.selected) {
    // Flag Copilot spend as potential 100% savings since Cursor has built-in Copilot functions.
    const copilotConfig = formState.tools.copilot;
    if (output.tools.copilot) {
      output.tools.copilot.recommendedPlan = 'None';
      output.tools.copilot.recommendedSpend = 0;
      output.tools.copilot.savings = copilotConfig.monthlySpend;
      output.tools.copilot.reason = 'Cursor possesses native auto-complete. Consolidating your stack and removing Copilot saves 100% of this spend.';
      
      // Re-calculate the accumulator correctly to avoid double counting
      totalSavingsAccumulator += copilotConfig.monthlySpend;
    }
  }

  // Handle default outputs for remaining unchecked tools to maintain typescript shapes
  const remainingTools: Array<keyof FormState['tools']> = ['anthropicApi', 'openaiApi', 'gemini', 'windsurf'];
  remainingTools.forEach((toolId) => {
    if (formState.tools[toolId].selected) {
      const config = formState.tools[toolId];
      output.tools[toolId] = {
        currentSpend: config.monthlySpend,
        recommendedPlan: config.plan,
        recommendedSpend: config.monthlySpend,
        savings: 0,
        reason: 'Spend parameters fall within standard operational margins.',
      };
    }
  });

  output.totalMonthlySavings = totalSavingsAccumulator;
  output.totalAnnualSavings = totalSavingsAccumulator * 12;

  return output;
}