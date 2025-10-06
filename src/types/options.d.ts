interface EnvConfigOptions {
    path?: string = null;
    encoding?: BufferEncoding;
    debug?: boolean;
    override?: boolean;
    expand?: boolean;
    multiline?: boolean;
    validationMode?: ValidationMode;
    schema?: EnvSchema;
}
