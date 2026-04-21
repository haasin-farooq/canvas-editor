import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { exportPng } from "./exportPng";
import type Konva from "konva";

function createMockStage() {
  const transformer1 = {
    visible: vi.fn().mockReturnValue(true),
  };
  const transformer2 = {
    visible: vi.fn().mockReturnValue(true),
  };
  const transformers = [transformer1, transformer2];

  const stage = {
    find: vi.fn().mockReturnValue(transformers),
    batchDraw: vi.fn(),
    toDataURL: vi.fn().mockReturnValue("data:image/png;base64,mockPngData"),
  };

  return { stage, transformers };
}

describe("exportPng", () => {
  let appendChildSpy: ReturnType<typeof vi.spyOn>;
  let removeChildSpy: ReturnType<typeof vi.spyOn>;
  let createElementSpy: ReturnType<typeof vi.spyOn>;
  let mockLink: {
    download: string;
    href: string;
    click: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockLink = {
      download: "",
      href: "",
      click: vi.fn(),
    };
    createElementSpy = vi
      .spyOn(document, "createElement")
      .mockReturnValue(mockLink as unknown as HTMLElement);
    appendChildSpy = vi
      .spyOn(document.body, "appendChild")
      .mockImplementation((node) => node);
    removeChildSpy = vi
      .spyOn(document.body, "removeChild")
      .mockImplementation((node) => node);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Requirement 10.3: Transformer hidden during export
  it("hides Transformer nodes before generating the PNG", () => {
    const { stage, transformers } = createMockStage();

    exportPng(stage as unknown as Konva.Stage);

    // Should find Transformer nodes
    expect(stage.find).toHaveBeenCalledWith("Transformer");

    // Each transformer should have been hidden (visible(false))
    for (const t of transformers) {
      expect(t.visible).toHaveBeenCalledWith(false);
    }
  });

  // Requirement 10.3: Transformer visibility restored after export
  it("restores Transformer visibility after export", () => {
    const { stage, transformers } = createMockStage();

    exportPng(stage as unknown as Konva.Stage);

    // After export, transformers should be restored to their original visibility
    // The first call is visible() to read, second is visible(false) to hide,
    // third is visible(true) to restore
    for (const t of transformers) {
      const calls = t.visible.mock.calls;
      // Last call should restore original visibility (true)
      expect(calls[calls.length - 1]).toEqual([true]);
    }
  });

  // Requirement 10.1: Generates PNG from stage
  it("calls stage.toDataURL with image/png", () => {
    const { stage } = createMockStage();

    exportPng(stage as unknown as Konva.Stage);

    expect(stage.toDataURL).toHaveBeenCalledWith({ mimeType: "image/png" });
  });

  // Requirement 10.2: Triggers download with correct filename
  it('triggers download with filename "ad-export.png"', () => {
    const { stage } = createMockStage();

    exportPng(stage as unknown as Konva.Stage);

    expect(createElementSpy).toHaveBeenCalledWith("a");
    expect(mockLink.download).toBe("ad-export.png");
    expect(mockLink.href).toBe("data:image/png;base64,mockPngData");
    expect(mockLink.click).toHaveBeenCalled();
  });

  // Requirement 10.2: Link is appended and removed from DOM
  it("appends and removes the download link from the DOM", () => {
    const { stage } = createMockStage();

    exportPng(stage as unknown as Konva.Stage);

    expect(appendChildSpy).toHaveBeenCalledWith(mockLink);
    expect(removeChildSpy).toHaveBeenCalledWith(mockLink);
  });

  // Requirement 10.1: batchDraw is called after hiding transformers
  it("calls batchDraw after hiding transformers and after restoring them", () => {
    const { stage } = createMockStage();

    exportPng(stage as unknown as Konva.Stage);

    // batchDraw should be called twice: once after hiding, once after restoring
    expect(stage.batchDraw).toHaveBeenCalledTimes(2);
  });

  // Error handling: gracefully handles errors
  it("restores Transformer visibility even when toDataURL throws", () => {
    const { stage, transformers } = createMockStage();
    stage.toDataURL.mockImplementation(() => {
      throw new Error("Canvas tainted");
    });

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    // Should not throw
    expect(() => exportPng(stage as unknown as Konva.Stage)).not.toThrow();

    // Transformers should still be restored
    for (const t of transformers) {
      const calls = t.visible.mock.calls;
      expect(calls[calls.length - 1]).toEqual([true]);
    }

    // batchDraw should still be called in finally block
    expect(stage.batchDraw).toHaveBeenCalledTimes(2);

    consoleSpy.mockRestore();
  });

  // Edge case: no transformers on stage
  it("works correctly when there are no Transformer nodes", () => {
    const stage = {
      find: vi.fn().mockReturnValue([]),
      batchDraw: vi.fn(),
      toDataURL: vi.fn().mockReturnValue("data:image/png;base64,mockPngData"),
    };

    expect(() => exportPng(stage as unknown as Konva.Stage)).not.toThrow();
    expect(stage.toDataURL).toHaveBeenCalled();
    expect(mockLink.click).toHaveBeenCalled();
  });
});
