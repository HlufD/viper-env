import { describe, it, expect, vi, beforeEach } from "vitest";
import { validateSchema } from "../../src/utils/validate-schema";

type EnvType = "string" | "number" | "boolean" | "email" | "url";

type EnvVariableSchema = {
    required: boolean;
    type: EnvType;
    allowedValues?: any[];
    regex?: RegExp;
    custom?: (value: any) => true | string;
};

type EnvSchema = Record<string, EnvVariableSchema>;

describe("validateSchema", () => {
    let environment: Map<string, string | number | boolean>;
    let schema: EnvSchema;

    beforeEach(() => {
        environment = new Map();
        schema = {
            NODE_ENV: { required: true, type: "string", allowedValues: ["development", "production"] },
            PORT: { required: true, type: "number" },
            DEBUG: { required: false, type: "boolean" },
            ADMIN_EMAIL: { required: false, type: "email" },
            WEBSITE: { required: false, type: "url" },
            CUSTOM: { required: false, type: "string", custom: (v) => v.length > 3 || "too short" },
            REGEX_TEST: { required: false, type: "string", regex: /^[a-z]+$/ }
        };
    });

    it("throws error for missing required variable in throw mode", () => {
        expect(() => validateSchema(schema, environment, "throw")).toThrow(
            /Environment variable "NODE_ENV" is required/
        );
    });

    it("warns instead of throwing in warn mode", () => {
        const spy = vi.spyOn(console, "warn").mockImplementation(() => { });
        validateSchema(schema, environment, "warn");
        expect(spy).toHaveBeenCalledWith(
            expect.stringContaining('Environment variable "NODE_ENV" is required')
        );
        expect(spy).toHaveBeenCalledWith(
            expect.stringContaining('Environment variable "PORT" is required')
        );
        spy.mockRestore();
    });

    it("validates number type correctly", () => {
        environment.set("NODE_ENV", "development");
        environment.set("PORT", "not-a-number");
        expect(() => validateSchema(schema, environment, "throw")).toThrow(
            /Environment variable "PORT" should be a number/
        );
    });

    it("validates boolean type correctly", () => {
        environment.set("NODE_ENV", "development");
        environment.set("PORT", "3000");
        environment.set("DEBUG", "maybe");
        expect(() => validateSchema(schema, environment, "throw")).toThrow(
            /Environment variable "DEBUG" should be a boolean/
        );
    });

    it("validates email type correctly", () => {
        environment.set("NODE_ENV", "development");
        environment.set("PORT", "3000");
        environment.set("ADMIN_EMAIL", "invalid-email");
        expect(() => validateSchema(schema, environment, "throw")).toThrow(
            /Environment variable "ADMIN_EMAIL" should be a valid email/
        );
    });

    it("validates URL type correctly", () => {
        environment.set("NODE_ENV", "development");
        environment.set("PORT", "3000");
        environment.set("WEBSITE", "not-a-url");
        expect(() => validateSchema(schema, environment, "throw")).toThrow(
            /Environment variable "WEBSITE" should be a valid URL/
        );
    });

    it("validates allowedValues correctly", () => {
        environment.set("NODE_ENV", "staging");
        environment.set("PORT", "3000");
        expect(() => validateSchema(schema, environment, "throw")).toThrow(
            /Environment variable "NODE_ENV" should be one of/
        );
    });

    it("validates custom function correctly", () => {
        environment.set("NODE_ENV", "development");
        environment.set("PORT", "3000");
        environment.set("CUSTOM", "ok");
        expect(() => validateSchema(schema, environment, "throw")).toThrow(
            /Environment variable "CUSTOM": too short/
        );
    });

    it("casts number and boolean correctly", () => {
        environment.set("NODE_ENV", "development");
        environment.set("PORT", "8080");
        environment.set("DEBUG", "true");
        validateSchema(schema, environment, "throw");
        expect(environment.get("PORT")).toBe(8080);
        expect(environment.get("DEBUG")).toBe(true);
    });

    it("accepts optional missing variables", () => {
        environment.set("NODE_ENV", "development");
        environment.set("PORT", "3000");
        expect(() => validateSchema(schema, environment, "throw")).not.toThrow();
    });

    it("validates regex correctly", () => {
        environment.set("NODE_ENV", "development");
        environment.set("PORT", "3000");
        environment.set("REGEX_TEST", "abc123");
        expect(() => validateSchema(schema, environment, "throw")).toThrow(
            /Environment variable "REGEX_TEST" does not match regex/
        );
    });

    it("handles empty string for required variable", () => {
        environment.set("NODE_ENV", "");
        environment.set("PORT", "3000");
        expect(() => validateSchema(schema, environment, "throw")).toThrow(
            /Environment variable "NODE_ENV" is required/
        );
    });

    it("handles false boolean correctly", () => {
        environment.set("NODE_ENV", "development");
        environment.set("PORT", "3000");
        environment.set("DEBUG", "false");
        validateSchema(schema, environment, "throw");
        expect(environment.get("DEBUG")).toBe(false);
    });

    it("handles zero number correctly", () => {
        environment.set("NODE_ENV", "development");
        environment.set("PORT", "0");
        validateSchema(schema, environment, "throw");
        expect(environment.get("PORT")).toBe(0);
    });

    it("warn mode for invalid type", () => {
        environment.set("NODE_ENV", "development");
        environment.set("PORT", "not-a-number");
        const spy = vi.spyOn(console, "warn").mockImplementation(() => { });
        validateSchema(schema, environment, "warn");
        expect(spy).toHaveBeenCalledWith(expect.stringContaining("PORT"));
        spy.mockRestore();
    });

    it("custom function returns true passes validation", () => {
        environment.set("NODE_ENV", "development");
        environment.set("PORT", "3000");
        environment.set("CUSTOM", "hello");
        expect(() => validateSchema(schema, environment, "throw")).not.toThrow();
    });

    it("multiple errors at once", () => {
        environment.set("NODE_ENV", "invalid");
        environment.set("PORT", "NaN");
        environment.set("DEBUG", "maybe");
        expect(() => validateSchema(schema, environment, "throw")).toThrow(
            /NODE_ENV.*PORT.*DEBUG/
        );
    });
});
