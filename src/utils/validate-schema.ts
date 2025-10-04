function validateSchema(
    schema: EnvSchema,
    environment: Map<string, string | number | boolean>,
    mode: ValidationMode = "warn"
) {
    const errors: string[] = [];

    const handleValidation = (message: string) => {
        if (mode === "throw") {
            errors.push(message);
        } else {
            console.warn(message);
        }
    };

    for (const [key, rule] of Object.entries(schema)) {
        const currValue = environment.get(key);

        if ((currValue === undefined || currValue === "") && rule.required) {
            handleValidation(`Environment variable "${key}" is required`);
            continue;
        }

        if (currValue !== undefined && currValue !== "") {
            let value: any = currValue;

            switch (rule.type) {
                case "number":
                    value = Number(currValue);
                    if (isNaN(value)) handleValidation(`Environment variable "${key}" should be a number`);
                    break;

                case "boolean":
                    if (!["true", "false", "1", "0"].includes(String(currValue)))
                        handleValidation(`Environment variable "${key}" should be a boolean`);
                    value = currValue === "true" || currValue === "1";
                    break;

                case "email":
                    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(currValue)))
                        handleValidation(`Environment variable "${key}" should be a valid email`);
                    break;

                case "url":
                    try {
                        new URL(String(currValue));
                    } catch {
                        handleValidation(`Environment variable "${key}" should be a valid URL`);
                    }
                    break;
            }

            if (rule.allowedValues && !rule.allowedValues.includes(value)) {
                handleValidation(`Environment variable "${key}" should be one of: ${rule.allowedValues.join(", ")}`);
            }

            if (rule.regex && !rule.regex.test(String(value))) {
                handleValidation(`Environment variable "${key}" does not match regex`);
            }

            if (rule.custom) {
                const result = rule.custom(value);
                if (result !== true) handleValidation(`Environment variable "${key}": ${result}`);
            }

            environment.set(key, value);
        }
    }

    if (errors.length > 0 && mode === "throw") {
        throw new Error(errors.join("; "));
    }
}

export { validateSchema }