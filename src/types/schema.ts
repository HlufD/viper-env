type EnvType = "string" | "number" | "boolean" | "email" | "url";

type EnvVariableSchema = {
  required: boolean;
  type: EnvType;
  allowedValues?: any[];
  regex?: RegExp;
  custom?: (value: any) => true | string;
};

type EnvSchema = Record<string, EnvVariableSchema>;

type ValidationMode = "throw" | "warn";

export type { EnvSchema, ValidationMode, EnvType };
