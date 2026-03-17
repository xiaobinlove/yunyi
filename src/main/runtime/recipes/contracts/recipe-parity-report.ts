export interface RecipeContractParityIssue {
  code: string;
  message: string;
}

export interface RecipeContractParityReport {
  adapterId: string;
  ok: boolean;
  checks: string[];
  issues: RecipeContractParityIssue[];
}
