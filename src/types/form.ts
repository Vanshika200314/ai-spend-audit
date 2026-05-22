// src/types/form.ts

export interface ToolConfig {
  selected: boolean;
  plan: string;
  monthlySpend: number;
  seats: number;
}

export interface FormState {
  teamSize: number;
  primaryUseCase: 'coding' | 'writing' | 'data' | 'research' | 'mixed';
  tools: {
    cursor: ToolConfig;
    copilot: ToolConfig;
    claude: ToolConfig;
    chatgpt: ToolConfig;
    anthropicApi: ToolConfig;
    openaiApi: ToolConfig;
    gemini: ToolConfig;
    windsurf: ToolConfig;
  };
}