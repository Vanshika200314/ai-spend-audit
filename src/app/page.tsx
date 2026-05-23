/* eslint-disable react-hooks/set-state-in-effect */
// src/app/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { FormState, ToolConfig } from '@/types/form';
import { DEFAULT_FORM_STATE, SUPPORTED_TOOLS } from '@/constants/tools';
import { calculateAudit, AuditOutput } from '@/lib/auditEngine';

const LOCAL_STORAGE_KEY = 'credex_audit_form_state';

export default function AuditPage() {
  const [formState, setFormState] = useState<FormState>(DEFAULT_FORM_STATE);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [auditId, setAuditId] = useState<string | null>(null);

  // Lead fields
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [role, setRole] = useState('');
  const [teamSizeInput, setTeamSizeInput] = useState('');
  const [submittedLead, setSubmittedLead] = useState(false);

  // Calculations
  const [auditReport, setAuditReport] = useState<AuditOutput | null>(null);

  // Hydration safety: Load stored inputs only on client mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setTimeout(() => {
          setFormState(parsed);
        }, 0);
      }
    } catch (e) {
      console.error('Failed to parse stored configuration', e);
    }
    setIsHydrated(true);
  }, []);

  // Save changes to localStorage on state update
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(formState));
    }
  }, [formState, isHydrated]);

  const handleGeneralChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormState((prev) => ({
      ...prev,
      [name]: name === 'teamSize' ? parseInt(value, 10) || 1 : value,
    }));
  };

  const handleToolToggle = (toolId: keyof FormState['tools']) => {
    setFormState((prev) => {
      const tool = prev.tools[toolId];
      return {
        ...prev,
        tools: {
          ...prev.tools,
          [toolId]: {
            ...tool,
            selected: !tool.selected,
          },
        },
      };
    });
  };

  const handleToolPropertyChange = (
    toolId: keyof FormState['tools'],
    property: keyof ToolConfig,
    value: string | number | boolean
  ) => {
    setFormState((prev) => {
      const tool = prev.tools[toolId];
      return {
        ...prev,
        tools: {
          ...prev.tools,
          [toolId]: {
            ...tool,
            [property]: value,
          },
        },
      };
    });
  };

  const handleAuditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tools_data: formState }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Server processing error');

      setAuditId(data.auditId);
      // Run the client-side audit engine calculations immediately
      setAuditReport(calculateAudit(formState));
    } catch (error) {
      alert(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auditId,
          email,
          companyName,
          role,
          teamSize: teamSizeInput,
          b_honey: '', // Empty honeypot
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Lead capture error');

      setSubmittedLead(true);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <p>Initializing dashboard...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-900 text-gray-100 p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight mb-4">
            AI Spend Audit
          </h1>
          <p className="text-gray-400 text-lg">
            Identify software duplication, plan over-commitments, and potential savings.
          </p>
        </header>

        {!auditId ? (
          /* Form Interface Step */
          <form onSubmit={handleAuditSubmit} className="space-y-8">
            <section className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-md">
              <h2 className="text-xl font-bold mb-6">1. General Profile</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold mb-2">Team Size</label>
                  <input
                    type="number"
                    name="teamSize"
                    min="1"
                    value={formState.teamSize}
                    onChange={handleGeneralChange}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Primary Use Case</label>
                  <select
                    name="primaryUseCase"
                    value={formState.primaryUseCase}
                    onChange={handleGeneralChange}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="coding">Software Engineering (Coding)</option>
                    <option value="writing">Content Generation / Copywriting</option>
                    <option value="data">Data Analytics & Business Intelligence</option>
                    <option value="research">Academic or Market Research</option>
                    <option value="mixed">Mixed Stack Usage</option>
                  </select>
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <h2 className="text-xl font-bold">2. Select Your AI Infrastructure Stack</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {SUPPORTED_TOOLS.map((tool) => {
                  const state = formState.tools[tool.id];
                  return (
                    <div
                      key={tool.id}
                      className={`p-5 rounded-xl border transition-all ${
                        state.selected
                          ? 'bg-gray-800 border-emerald-500 shadow-lg'
                          : 'bg-gray-800/60 border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <label className="text-md font-bold cursor-pointer" htmlFor={tool.id}>
                          {tool.name}
                        </label>
                        <input
                          type="checkbox"
                          id={tool.id}
                          checked={state.selected}
                          onChange={() => handleToolToggle(tool.id)}
                          className="h-5 w-5 rounded border-gray-600 text-emerald-500 focus:ring-emerald-500 bg-gray-700"
                        />
                      </div>

                      {state.selected && (
                        <div className="space-y-4 mt-4 pt-4 border-t border-gray-700 animate-fadeIn">
                          <div>
                            <label className="block text-xs font-semibold mb-1">Select Tier / Plan</label>
                            <select
                              value={state.plan}
                              onChange={(e) =>
                                handleToolPropertyChange(tool.id, 'plan', e.target.value)
                              }
                              className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 text-sm text-white"
                            >
                              {tool.plans.map((p) => (
                                <option key={p} value={p}>
                                  {p}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-semibold mb-1">Seats Used</label>
                              <input
                                type="number"
                                min="1"
                                value={state.seats}
                                onChange={(e) =>
                                  handleToolPropertyChange(
                                    tool.id,
                                    'seats',
                                    parseInt(e.target.value, 10) || 1
                                  )
                                }
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 text-sm text-white"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold mb-1">Monthly Spend ($)</label>
                              <input
                                type="number"
                                min="0"
                                value={state.monthlySpend}
                                onChange={(e) =>
                                  handleToolPropertyChange(
                                    tool.id,
                                    'monthlySpend',
                                    parseInt(e.target.value, 10) || 0
                                  )
                                }
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 text-sm text-white"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white font-bold rounded-xl shadow-lg transition-all"
            >
              {isLoading ? 'Processing Audit Engine...' : 'Run Audit Engine'}
            </button>
          </form>
        ) : !submittedLead ? (
          /* Lead Capture Step */
          <div className="bg-gray-800 p-8 rounded-xl border border-gray-700 shadow-xl max-w-lg mx-auto">
            <h2 className="text-2xl font-bold mb-3 text-center">Unlock Your Audit Report</h2>
            <p className="text-gray-400 text-sm mb-6 text-center">
              We have processed your configurations. Submit your contact details to view your savings breakdown.
            </p>
            <form onSubmit={handleLeadSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white"
                  placeholder="name@company.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Company Name (Optional)</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white"
                  placeholder="Acme Corp"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Your Role (Optional)</label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white"
                  placeholder="Engineering Lead"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Team Size (Optional)</label>
                <input
                  type="text"
                  value={teamSizeInput}
                  onChange={(e) => setTeamSizeInput(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white"
                  placeholder="10 - 25"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white font-bold rounded-lg shadow-md"
              >
                {isLoading ? 'Saving Lead Profile...' : 'Unlock Audit Report'}
              </button>
            </form>
          </div>
        ) : (
          /* Report and Results Dashboard Step */
          <div className="space-y-8 animate-fadeIn">
            {/* Savings Overview Metrics Grid */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 text-center shadow-md">
                <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Total Monthly Savings</span>
                <p className="text-4xl font-extrabold text-emerald-400 mt-2">
                  ${auditReport?.totalMonthlySavings.toFixed(0)}
                </p>
              </div>
              <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 text-center shadow-md">
                <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Total Annual Savings</span>
                <p className="text-4xl font-extrabold text-emerald-400 mt-2">
                  ${auditReport?.totalAnnualSavings.toFixed(0)}
                </p>
              </div>
            </section>

            {/* Credex High-Savings Promotion Conditional UI */}
            {auditReport && auditReport.totalMonthlySavings >= 500 && (
              <section className="bg-gradient-to-r from-emerald-900/60 to-gray-800 p-6 rounded-xl border border-emerald-500 shadow-xl">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2">Claim Your Credex Premium Benefits</h3>
                    <p className="text-gray-300 text-sm max-w-xl">
                      Your organization qualifies for substantial credit optimizations. Book a consultation to route your AI stack through heavily discounted credits.
                    </p>
                  </div>
                  <button className="whitespace-nowrap px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-lg shadow transition-all">
                    Book Credex Consultation
                  </button>
                </div>
              </section>
            )}

            {/* Honest spend validation conditional UI */}
            {auditReport && auditReport.totalMonthlySavings < 100 && (
              <section className="bg-gray-800/80 p-6 rounded-xl border border-gray-700 text-center max-w-xl mx-auto">
                <div className="h-10 w-10 bg-emerald-950/40 border border-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-md font-bold mb-1">Your AI Spend is Optimized</h3>
                <p className="text-gray-400 text-xs mb-4">
                  Outstanding job! You are currently spending very efficiently. No unnecessary overhead or overlapping licenses detected.
                </p>
                <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg text-xs">
                  Notify Me When New Optimizations Apply
                </button>
              </section>
            )}

            {/* Per-Tool Optimization Cards */}
            <section className="space-y-6">
              <h3 className="text-lg font-bold">Optimization Breakdown</h3>
              <div className="space-y-4">
                {auditReport &&
                  Object.entries(auditReport.tools).map(([toolId, result]) => {
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
        )}
      </div>
    </main>
  );
}