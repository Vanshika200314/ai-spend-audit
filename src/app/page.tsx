// src/app/page.tsx
/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React, { useState, useEffect } from 'react';
import { FormState, ToolConfig } from '@/types/form';
import { DEFAULT_FORM_STATE, SUPPORTED_TOOLS } from '@/constants/tools';

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

  // Hydration safety: Load stored inputs only on client mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Defer state update using setTimeout to satisfy strict linter rule
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
          b_honey: '', // Empty honeypot variable (unfilled by human)
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
          <form onSubmit={handleAuditSubmit} className="space-y-8">
            {/* General Configurations Card */}
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

            {/* AI Tools Selection Card */}
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
                        <div className="space-y-4 mt-4 pt-4 border-t border-gray-700">
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
          /* Lead Generation Block: displayed once audit is saved */
          <div className="bg-gray-800 p-8 rounded-xl border border-gray-700 shadow-xl max-w-lg mx-auto">
            <h2 className="text-2xl font-bold mb-3 text-center">Unlock Your Audit Report</h2>
            <p className="text-gray-400 text-sm mb-6 text-center">
              We have processed your configuration parameters. Submit your contact details to view the optimized layout.
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
          /* Complete State Placeholder (Results view will be implemented on Day 4) */
          <div className="bg-gray-800 p-8 rounded-xl border border-gray-700 text-center max-w-lg mx-auto shadow-xl">
            <div className="h-16 w-16 bg-emerald-900/40 border border-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="h-8 w-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-3">Audit Generated Successfully</h2>
            <p className="text-gray-400 text-sm mb-6">
              Your profile has been captured under Audit ID:
            </p>
            <code className="block bg-gray-900 text-emerald-400 p-3 rounded-lg font-mono text-sm mb-6">
              {auditId}
            </code>
            <p className="text-gray-400 text-xs">
              Check your inbox for your transactional email. Tomorrow, we will compile the math models and construct the results dashboard.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}