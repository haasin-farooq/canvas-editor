import { describe, it, expect } from "vitest";

describe("Test setup", () => {
  it("should have canvas mock available", () => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    expect(ctx).not.toBeNull();
  });

  it("should have jest-dom matchers available", () => {
    const div = document.createElement("div");
    div.textContent = "hello";
    document.body.appendChild(div);
    expect(div).toBeInTheDocument();
    document.body.removeChild(div);
  });
});
