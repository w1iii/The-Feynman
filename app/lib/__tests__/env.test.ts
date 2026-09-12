import { describe, it, expect } from "vitest"
import { requireEnv } from "../env"

describe("requireEnv", () => {
  it("returns env var value when set", () => {
    process.env.TEST_VAR = "hello"
    expect(requireEnv("TEST_VAR")).toBe("hello")
    delete process.env.TEST_VAR
  })

  it("throws when env var is missing", () => {
    delete process.env.MISSING_VAR
    expect(() => requireEnv("MISSING_VAR")).toThrow("Missing required environment variable: MISSING_VAR")
  })
})
