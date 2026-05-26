// src/app/share/[id]/page.tsx
import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { calculateAudit } from '@/lib/auditEngine';
import { FormState } from '@/types/form';
import { SUPPORTED_TOOLS } from '@/constants/tools';
import Link from 'next/link';

interface Props {
  params: Promise<{ id: string }>;
}

// Next.js 15 Type-safe Server-Side Open Graph Meta Tags
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  try {
    const auditRecord = await prisma.audit.findUnique({
      where: { id },
    });

    if (!auditRecord) {
      return {
        title: 'AI Spend Audit Report',
        description: 'Analyze software duplications, over-allocations, and potential savings.',
      };
    }

    const monthlySavings = auditRecord.totalMonthlySavings.toFixed(0);
    const annualSavings = auditRecord.totalAnnualSavings.toFixed(0);

    return {
      title: `AI Spend Audit Report - Potential Savings: $${monthlySavings}/mo`,
      description: `This startup tech profile identified $${annualSavings}/year in potential AI subscription savings. Run your own free audit now.`,
      openGraph: {
        title: `AI Spend Audit Report - Save $${monthlySavings}/mo`,
        description: `This startup tech profile identified $${annualSavings}/year in potential AI subscription savings. Run your own free audit now.`,
        type: 'website',
        url: `https://credex-audit.rocks/share/${id}`, // Placeholder domain
      },
      twitter: {
        card: 'summary_large_image',
        title: `AI Spend Audit - Potential Savings: $${monthlySavings}/mo`,
        description: `Uncovered $${annualSavings}/year in AI software overspend. Run your free audit.`,
      },
    };
  } catch (e) {
    console.error('Failed to generate sharing metadata', e);
    return {
      title: 'AI Spend Audit Report',
    };
  }
}

export default async function SharePage({ params }: Props) {
  const { id } = await params;

  // Retrieve the audit parameters (strictly from audits table - privacy secured)
  const auditRecord = await prisma.audit.findUnique({
    where: { id },
  });

  if (!auditRecord) {
    notFound();
  }

  const formState = auditRecord.toolsData as unknown as FormState;
  const auditReport = calculateAudit(formState);

  return (
    <main className="min-h-screen bg-gray-900 text-gray-100 p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12 text-center">
          <span className="px-3 py-1 bg-emerald-950 text-emerald-400 border border-emerald-800 text-xs font-bold uppercase rounded-full tracking-wider">
            Public Report Preview
          </span>
          <h1 className="text-4xl font-extrabold tracking-tight mt-4 mb-4">
            AI Spend Audit Report
          </h1>
          <p className="text-gray-400 text-lg">
            This startup tech profile has been audited for software over-allocations and potential savings.
          </p>
        </header>

        <div className="space-y-8">
          {/* Savings Metrics Grid */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 text-center shadow-md">
              <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Estimated Monthly Savings</span>
              <p className="text-4xl font-extrabold text-emerald-400 mt-2">
                ${auditReport.totalMonthlySavings.toFixed(0)}
              </p>
            </div>
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 text-center shadow-md">
              <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Estimated Annual Savings</span>
              <p className="text-4xl font-extrabold text-emerald-400 mt-2">
                ${auditReport.totalAnnualSavings.toFixed(0)}
              </p>
            </div>
          </section>

          {/* Viral Loop CTA Card */}
          <section className="bg-gradient-to-r from-emerald-950/40 to-gray-800 p-8 rounded-xl border border-emerald-500 text-center shadow-xl">
            <h3 className="text-2xl font-bold mb-3">How Optimized is Your Stack?</h3>
            <p className="text-gray-300 text-sm max-w-xl mx-auto mb-6">
              Most startups are overspending on AI tools. Run your own free 2-minute spend audit to surface overlap and redundancies.
            </p>
            <Link
                href="/"
                className="inline-block px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg transition-all"
                >
                Run Your Free Spend Audit
            </Link>
          </section>

          {/* Per-Tool Optimization Details */}
          <section className="space-y-6">
            <h3 className="text-lg font-bold">Optimization Breakdown</h3>
            <div className="space-y-4">
              {Object.entries(auditReport.tools).map(([toolId, result]) => {
                const metadata = SUPPORTED_TOOLS.find((t) => t.id === toolId);
                if (!metadata || !result) return null;

                return (
                  <div
                    key={toolId}
                    className="bg-gray-800 p-5 rounded-xl border border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm"
                  >
                    <div>
                      <h4 className="font-bold text-md text-white">{metadata.name}</h4>
                      <p className="text-gray-400 text-sm mt-2 max-w-xl">{result.reason}</p>
                    </div>
                    <div className="text-right whitespace-nowrap">
                      <span className="text-gray-400 text-xs block">POTENTIAL SAVINGS</span>
                      <span className={`text-xl font-extrabold block mt-1 ${
                        result.savings > 0 ? 'text-emerald-400' : 'text-gray-400'
                      }`}>
                        ${result.savings.toFixed(0)}/mo
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}