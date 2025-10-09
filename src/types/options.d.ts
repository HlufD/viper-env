interface EnvConfigOptions {
  path?: string;
  debug?: boolean;
  loadAllDefaults?: boolean;
  override?: boolean;
  expand?: boolean;
  multiline?: boolean;
  validationMode?: ValidationMode;
  schema?: EnvSchema;
}
