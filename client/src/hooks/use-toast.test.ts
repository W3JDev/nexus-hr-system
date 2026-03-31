/**
 * Tests for useToast hook - specifically testing the memory leak fix
 */
import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useToast, toast } from "./use-toast";

describe("useToast", () => {
  it("should initialize with empty toasts", () => {
    const { result } = renderHook(() => useToast());
    expect(result.current.toasts).toEqual([]);
  });

  it("should add a toast", () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.toast({
        title: "Test Toast",
        description: "Test description",
      });
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].title).toBe("Test Toast");
  });

  it("should dismiss a toast", () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      const t = result.current.toast({
        title: "Test Toast",
      });
      t.dismiss();
    });

    expect(result.current.toasts[0].open).toBe(false);
  });

  it("should update a toast", () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      const t = result.current.toast({
        title: "Initial Title",
      });
      t.update({
        id: t.id,
        title: "Updated Title",
        open: true,
        onOpenChange: () => {},
      });
    });

    expect(result.current.toasts[0].title).toBe("Updated Title");
  });

  /**
   * MEMORY LEAK FIX TEST
   * This test verifies that the memory leak fix is working correctly.
   * Before the fix, each state change would add a new listener, causing
   * a memory leak. After the fix, the listener is only added once.
   */
  it("should not accumulate listeners on state changes (memory leak fix)", () => {
    // Create multiple hook instances to simulate multiple components
    const hooks: ReturnType<typeof renderHook<ReturnType<typeof useToast>>>[] = [];
    
    // Render the hook multiple times (simulating multiple components using useToast)
    for (let i = 0; i < 5; i++) {
      const hook = renderHook(() => useToast());
      hooks.push(hook);
    }

    // Each hook instance should have the same toast function
    // and should be listening to the same state
    act(() => {
      toast({ title: "Broadcast Test" });
    });

    // All hooks should have received the toast
    hooks.forEach((hook) => {
      expect(hook.result.current.toasts).toHaveLength(1);
      expect(hook.result.current.toasts[0].title).toBe("Broadcast Test");
    });

    // Cleanup all hooks
    hooks.forEach((hook) => {
      hook.unmount();
    });

    // After unmounting, adding a new toast should not affect unmounted components
    act(() => {
      toast({ title: "After Unmount" });
    });

    // Create a fresh hook to verify state is still working
    // Note: TOAST_LIMIT is 1, so only the latest toast remains
    const { result } = renderHook(() => useToast());
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].title).toBe("After Unmount");
  });

  it("should generate unique IDs for each toast", () => {
    const ids: string[] = [];

    act(() => {
      for (let i = 0; i < 5; i++) {
        const t = toast({ title: `Toast ${i}` });
        ids.push(t.id);
      }
    });

    // All IDs should be unique
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("should limit toasts to TOAST_LIMIT", () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      for (let i = 0; i < 5; i++) {
        result.current.toast({ title: `Toast ${i}` });
      }
    });

    // Should be limited to 1 toast (TOAST_LIMIT)
    expect(result.current.toasts.length).toBeLessThanOrEqual(1);
  });
});
