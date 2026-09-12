import { describe, it, expect } from "vitest"
import { parseJsonResponse } from "../ai/ai"

describe("parseJsonResponse", () => {
  it("parses valid JSON", () => {
    const result = parseJsonResponse('{"done": true}')
    expect(result).toEqual({ done: true })
  })

  it("strips markdown fences", () => {
    const result = parseJsonResponse('```json\n{"done": true}\n```')
    expect(result).toEqual({ done: true })
  })

  it("handles empty fences", () => {
    const result = parseJsonResponse('```\n{"done": true}\n```')
    expect(result).toEqual({ done: true })
  })

  it("throws on invalid JSON", () => {
    expect(() => parseJsonResponse("not json")).toThrow()
  })

  it("handles null/undefined input", () => {
    expect(() => parseJsonResponse(null)).toThrow()
    expect(() => parseJsonResponse(undefined)).toThrow()
  })
})
