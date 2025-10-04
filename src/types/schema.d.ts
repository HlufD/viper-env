type EnvType = "string" | "number" | "boolean" | "email" | "url";

type EnvVariableSchema = {
    required: boolean;
    type: EnvType;
    allowedValues?: any[];
    regex?: RegExp;
    default?: any;
    custom?: (value: any) => true | string;
};

type EnvSchema = Record<string, EnvVariableSchema>;
