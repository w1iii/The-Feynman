import { describe, it, expect, vi, beforeEach } from "vitest"

describe("rateLimit", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("allows requests under the limit", async () => {
    const { rateLimit } = await import("../rate-limit")
    const result = await rateLimit("test-allow", 5, 60)
    expect(result.allowed).toBe(true)
  })

  it("returns remaining count", async () => {
    const { rateLimit } = await import("../rate-limit")
    const result = await rateLimit("test-remaining", 10, 60)
    expect(result.remaining).toBeGreaterThanOrEqual(0)
  })

  it("returns resetMs in the future", async () => {
    const { rateLimit } = await import("../rate-limit")
    const result = await rateLimit("test-reset", 5, 60)
    expect(result.resetMs).toBeGreaterThan(Date.now())
  })
})
