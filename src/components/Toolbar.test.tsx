import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { Toolbar } from "./Toolbar";
import { EditorContext } from "../context/EditorContext";
import type { EditorContextValue } from "../context/EditorContext";
import { initialState } from "../constants";
import type { EditorState } from "../types";

function createWrapper(overrides?: Partial<EditorContextValue>) {
  const dispatch = vi.fn();
  const stageRef = { current: null };
  const value: EditorContextValue = {
    state: initialState,
    dispatch,
    stageRef,
    ...overrides,
  };
  return {
    dispatch,
    value,
    wrapper: ({ children }: { children: ReactNode }) => (
      <EditorContext.Provider value={value}>{children}</EditorContext.Provider>
    ),
  };
}

describe("Toolbar", () => {
  // Requirement 2.1: Add Text button dispatches ADD_TEXT_BLOCK
  it("dispatches ADD_TEXT_BLOCK when Add Text is clicked", async () => {
    const user = userEvent.setup();
    const { dispatch, wrapper } = createWrapper();

    render(<Toolbar />, { wrapper });

    await user.click(screen.getByRole("button", { name: /add text/i }));

    expect(dispatch).toHaveBeenCalledWith({ type: "ADD_TEXT_BLOCK" });
  });

  // Requirement 3.1: Add Image button opens file input
  it("opens file input when Add Image is clicked", async () => {
    const user = userEvent.setup();
    const { wrapper } = createWrapper();

    render(<Toolbar />, { wrapper });

    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const clickSpy = vi.spyOn(fileInput, "click");

    await user.click(screen.getByRole("button", { name: /add image/i }));

    expect(clickSpy).toHaveBeenCalled();
  });

  // Requirement 3.1, 3.2: Valid image file dispatches ADD_IMAGE_BLOCK
  it("dispatches ADD_IMAGE_BLOCK with data URL for a valid PNG file", async () => {
    const { dispatch, wrapper } = createWrapper();

    let capturedOnload: (() => void) | null = null;
    const mockResult = "data:image/png;base64,ZmFrZS1wbmctZGF0YQ==";

    const OriginalFileReader = globalThis.FileReader;
    globalThis.FileReader = class MockFileReader {
      result = mockResult;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      readAsDataURL() {
        capturedOnload = this.onload;
      }
    } as unknown as typeof FileReader;

    render(<Toolbar />, { wrapper });

    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;

    const file = new File(["fake-png-data"], "test.png", {
      type: "image/png",
    });

    fireEvent.change(fileInput, { target: { files: [file] } });

    // Trigger the onload callback
    capturedOnload!();

    expect(dispatch).toHaveBeenCalledWith({
      type: "ADD_IMAGE_BLOCK",
      payload: { imageSrc: mockResult },
    });

    globalThis.FileReader = OriginalFileReader;
  });

  // Requirement 3.6: Invalid file shows error message
  it("shows error message for non-PNG/JPEG files", () => {
    const { dispatch, wrapper } = createWrapper();

    render(<Toolbar />, { wrapper });

    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;

    const file = new File(["fake-gif-data"], "test.gif", {
      type: "image/gif",
    });

    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(
      screen.getByText("Only PNG and JPEG images are supported."),
    ).toBeInTheDocument();
    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: "ADD_IMAGE_BLOCK" }),
    );
  });

  // Requirement 3.6: JPEG files are accepted
  it("accepts JPEG files without showing an error", () => {
    const { wrapper } = createWrapper();

    let readAsDataURLCalled = false;

    const OriginalFileReader = globalThis.FileReader;
    globalThis.FileReader = class MockFileReader {
      result = null;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      readAsDataURL() {
        readAsDataURLCalled = true;
      }
    } as unknown as typeof FileReader;

    render(<Toolbar />, { wrapper });

    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;

    const file = new File(["fake-jpeg-data"], "test.jpg", {
      type: "image/jpeg",
    });

    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(
      screen.queryByText("Only PNG and JPEG images are supported."),
    ).not.toBeInTheDocument();
    expect(readAsDataURLCalled).toBe(true);

    globalThis.FileReader = OriginalFileReader;
  });

  // Requirement 9.3: Undo button disabled when history.past is empty
  it("disables Undo button when history.past is empty", () => {
    const { wrapper } = createWrapper();

    render(<Toolbar />, { wrapper });

    const undoButton = screen.getByRole("button", { name: /undo/i });
    expect(undoButton).toBeDisabled();
  });

  // Requirement 9.4: Redo button disabled when history.future is empty
  it("disables Redo button when history.future is empty", () => {
    const { wrapper } = createWrapper();

    render(<Toolbar />, { wrapper });

    const redoButton = screen.getByRole("button", { name: /redo/i });
    expect(redoButton).toBeDisabled();
  });

  // Requirement 9.3: Undo button enabled when history.past has entries
  it("enables Undo button when history.past has entries", () => {
    const stateWithPast: EditorState = {
      ...initialState,
      history: {
        past: [[]],
        future: [],
      },
    };
    const { wrapper } = createWrapper({ state: stateWithPast });

    render(<Toolbar />, { wrapper });

    const undoButton = screen.getByRole("button", { name: /undo/i });
    expect(undoButton).toBeEnabled();
  });

  // Requirement 9.4: Redo button enabled when history.future has entries
  it("enables Redo button when history.future has entries", () => {
    const stateWithFuture: EditorState = {
      ...initialState,
      history: {
        past: [],
        future: [[]],
      },
    };
    const { wrapper } = createWrapper({ state: stateWithFuture });

    render(<Toolbar />, { wrapper });

    const redoButton = screen.getByRole("button", { name: /redo/i });
    expect(redoButton).toBeEnabled();
  });

  // Requirement 9.1: Undo button dispatches UNDO
  it("dispatches UNDO when Undo button is clicked", async () => {
    const user = userEvent.setup();
    const stateWithPast: EditorState = {
      ...initialState,
      history: {
        past: [[]],
        future: [],
      },
    };
    const { dispatch, wrapper } = createWrapper({ state: stateWithPast });

    render(<Toolbar />, { wrapper });

    await user.click(screen.getByRole("button", { name: /undo/i }));

    expect(dispatch).toHaveBeenCalledWith({ type: "UNDO" });
  });

  // Requirement 9.2: Redo button dispatches REDO
  it("dispatches REDO when Redo button is clicked", async () => {
    const user = userEvent.setup();
    const stateWithFuture: EditorState = {
      ...initialState,
      history: {
        past: [],
        future: [[]],
      },
    };
    const { dispatch, wrapper } = createWrapper({ state: stateWithFuture });

    render(<Toolbar />, { wrapper });

    await user.click(screen.getByRole("button", { name: /redo/i }));

    expect(dispatch).toHaveBeenCalledWith({ type: "REDO" });
  });

  // Requirement 10.1: Export PNG button calls exportPng
  it("calls exportPng when Export PNG button is clicked and stageRef is set", async () => {
    const user = userEvent.setup();

    const transformers: { visible: ReturnType<typeof vi.fn> }[] = [];
    const mockStage = {
      find: vi.fn().mockReturnValue(transformers),
      batchDraw: vi.fn(),
      toDataURL: vi.fn().mockReturnValue("data:image/png;base64,mock"),
    };

    const stageRef = { current: mockStage };
    const { wrapper } = createWrapper({
      stageRef: stageRef as unknown as React.RefObject<null>,
    });

    render(<Toolbar />, { wrapper });

    // Mock document methods after render so React rendering isn't affected
    const mockLink = { download: "", href: "", click: vi.fn() };
    const origCreateElement = document.createElement.bind(document);
    const createSpy = vi
      .spyOn(document, "createElement")
      .mockImplementation((tag: string) => {
        if (tag === "a") return mockLink as unknown as HTMLAnchorElement;
        return origCreateElement(tag);
      });
    const appendSpy = vi
      .spyOn(document.body, "appendChild")
      .mockImplementation((node) => node);
    const removeSpy = vi
      .spyOn(document.body, "removeChild")
      .mockImplementation((node) => node);

    await user.click(screen.getByRole("button", { name: /export/i }));

    expect(mockStage.toDataURL).toHaveBeenCalledWith({ mimeType: "image/png" });
    expect(mockLink.download).toBe("ad-export.png");
    expect(mockLink.click).toHaveBeenCalled();

    createSpy.mockRestore();
    appendSpy.mockRestore();
    removeSpy.mockRestore();
  });
});
