// src/constants/tools.ts
import { FormState } from '@/types/form';

export interface ToolMetadata {
  id: keyof FormState['tools'];
  name: string;
  plans: string[];
}

export const SUPPORTED_TOOLS: ToolMetadata[] = [
  { id: 'cursor', name: 'Cursor', plans: ['Hobby', 'Pro', 'Business', 'Enterprise'] },
  { id: 'copilot', name: 'GitHub Copilot', plans: ['Individual', 'Business', 'Enterprise'] },
  { id: 'claude', name: 'Claude', plans: ['Free', 'Pro', 'Max', 'Team', 'Enterprise', 'API direct'] },
  { id: 'chatgpt', name: 'ChatGPT', plans: ['Plus', 'Team', 'Enterprise', 'API direct'] },
  { id: 'anthropicApi', name: 'Anthropic API direct', plans: ['Pay-as-you-go'] },
  { id: 'openaiApi', name: 'OpenAI API direct', plans: ['Pay-as-you-go'] },
  { id: 'gemini', name: 'Gemini', plans: ['Pro', 'Ultra', 'API'] },
  { id: 'windsurf', name: 'Windsurf', plans: ['Hobby', 'Pro', 'Teams'] },
];

export const DEFAULT_FORM_STATE: FormState = {
  teamSize: 1,
  primaryUseCase: 'mixed',
  tools: {
    cursor: { selected: false, plan: 'Pro', monthlySpend: 0, seats: 1 },
    copilot: { selected: false, plan: 'Individual', monthlySpend: 0, seats: 1 },
    claude: { selected: false, plan: 'Pro', monthlySpend: 0, seats: 1 },
    chatgpt: { selected: false, plan: 'Plus', monthlySpend: 0, seats: 1 },
    anthropicApi: { selected: false, plan: 'Pay-as-you-go', monthlySpend: 0, seats: 1 },
    openaiApi: { selected: false, plan: 'Pay-as-you-go', monthlySpend: 0, seats: 1 },
    gemini: { selected: false, plan: 'Pro', monthlySpend: 0, seats: 1 },
    windsurf: { selected: false, plan: 'Pro', monthlySpend: 0, seats: 1 },
  },
};