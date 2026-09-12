import { describe, it, expect } from "vitest"
import { getClientIp } from "../rate-limit"

function makeRequest(headers: Record<string, string> = {}): Request {
  return new Request("http://localhost", { headers })
}

describe("getClientIp", () => {
  it("extracts IP from x-forwarded-for", () => {
    const req = makeRequest({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" })
    expect(getClientIp(req)).toBe("1.2.3.4")
  })

  it("falls back to x-real-ip", () => {
    const req = makeRequest({ "x-real-ip": "9.8.7.6" })
    expect(getClientIp(req)).toBe("9.8.7.6")
  })

  it("returns unknown when no headers present", () => {
    const req = makeRequest()
    expect(getClientIp(req)).toBe("unknown")
  })
})
