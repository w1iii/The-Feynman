import { describe, it, expect } from "vitest"
import { isRetryableError, withTimeout } from "../ai/ai"

describe("isRetryableError", () => {
  it("returns true for 429 status", () => {
    expect(isRetryableError({ status: 429 })).toBe(true)
  })

  it("returns true for 404 status", () => {
    expect(isRetryableError({ status: 404 })).toBe(true)
  })

  it("returns true for 500 status", () => {
    expect(isRetryableError({ status: 500 })).toBe(true)
  })

  it("returns true for 502 status", () => {
    expect(isRetryableError({ status: 502 })).toBe(true)
  })

  it("returns true for 503 status", () => {
    expect(isRetryableError({ status: 503 })).toBe(true)
  })

  it("returns true for rate_limit message", () => {
    expect(isRetryableError({ message: "rate_limit exceeded" })).toBe(true)
  })

  it("returns true for model_not_found message", () => {
    expect(isRetryableError({ message: "model_not_found" })).toBe(true)
  })

  it("returns true for ECONNRESET message", () => {
    expect(isRetryableError({ message: "ECONNRESET" })).toBe(true)
  })

  it("returns true for ETIMEDOUT message", () => {
    expect(isRetryableError({ message: "ETIMEDOUT" })).toBe(true)
  })

  it("returns true for network message", () => {
    expect(isRetryableError({ message: "network error" })).toBe(true)
  })

  it("returns false for 400 status", () => {
    expect(isRetryableError({ status: 400 })).toBe(false)
  })

  it("returns false for 401 status", () => {
    expect(isRetryableError({ status: 401 })).toBe(false)
  })

  it("returns false for unrelated message", () => {
    expect(isRetryableError({ message: "invalid request" })).toBe(false)
  })

  it("returns false for null", () => {
    expect(isRetryableError(null)).toBe(false)
  })

  it("returns false for undefined", () => {
    expect(isRetryableError(undefined)).toBe(false)
  })
})

describe("withTimeout", () => {
  it("resolves if promise completes before timeout", async () => {
    const result = await withTimeout(Promise.resolve("ok"), 1000)
    expect(result).toBe("ok")
  })

  it("rejects if promise takes too long", async () => {
    const slow = new Promise<string>((resolve) => setTimeout(() => resolve("late"), 500))
    await expect(withTimeout(slow, 50)).rejects.toThrow("Request timed out after 50ms")
  })

  it("rejects if promise rejects", async () => {
    const failing = Promise.reject(new Error("boom"))
    await expect(withTimeout(failing, 1000)).rejects.toThrow("boom")
  })
})
