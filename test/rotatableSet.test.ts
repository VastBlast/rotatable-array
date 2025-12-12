import { describe, it, expect } from "vitest";
import { RotatableSet } from "../src/index";

describe("RotatableSet", () => {
    it("starts empty and throws on next/furthest/peek", () => {
        const ring = new RotatableSet<number>();
        expect(ring.size).toBe(0);
        expect(ring.isEmpty).toBe(true);
        expect(() => ring.next()).toThrowError(/empty/i);
        expect(() => ring.getFurthestItem()).toThrowError(/empty/i);
        expect(() => ring.peek()).toThrowError(/empty/i);
        expect(ring.delete(1)).toBe(false);
        expect([...ring.cycle()]).toEqual([]);
        expect(Array.from(ring.toSet())).toEqual([]);
    });

    it("preserves insertion order when adding to empty ring", () => {
        const ring = new RotatableSet<number>();
        ring.add(1).add(2).add(3);
        expect(ring.size).toBe(3);
        expect(ring.toArray()).toEqual([1, 2, 3]);
        expect(ring.next()).toBe(1);
        expect(ring.next()).toBe(2);
        expect(ring.next()).toBe(3);
        expect(ring.next()).toBe(1);
    });

    it("constructs from an initial array (may be empty)", () => {
        expect(new RotatableSet([]).size).toBe(0);
        const ring = new RotatableSet(["A", "B"]);
        expect(ring.toArray()).toEqual(["A", "B"]);
        expect(ring.next()).toBe("A");
        expect(ring.next()).toBe("B");
        expect(ring.next()).toBe("A");
    });

    it("ignores duplicates in the constructor while preserving first-seen order", () => {
        const ring = new RotatableSet([1, 2, 1, 3, 2]);
        expect(ring.size).toBe(3);
        expect(ring.toArray()).toEqual([1, 2, 3]);
    });

    it("add does not move the cursor", () => {
        const ring = new RotatableSet([1, 2, 3]);
        ring.next(); // 1, cursor at 2
        ring.add(4);
        expect(ring.peek()).toBe(2);
        expect(ring.toArray()).toEqual([2, 3, 1, 4]);
        expect(ring.next()).toBe(2);
    });

    it("adding an existing item keeps state unchanged", () => {
        const ring = new RotatableSet([1, 2, 3]);
        ring.next(); // 1, cursor at 2
        ring.add(2); // duplicate
        expect(ring.size).toBe(3);
        expect(ring.peek()).toBe(2);
        expect(ring.toArray()).toEqual([2, 3, 1]);
    });

    it("add() matches Set semantics", () => {
        const ring = new RotatableSet<number>();
        const ret = ring.add(1).add(2);
        expect(ret).toBe(ring);
        expect(ring.size).toBe(2);
        ring.add(2); // no-op
        expect(ring.size).toBe(2);
        expect(ring.toArray()).toEqual([1, 2]);
    });

    it("toArray does not mutate cursor", () => {
        const ring = new RotatableSet(["A", "B", "C"]);
        ring.next(); // A, cursor at B
        expect(ring.toArray()).toEqual(["B", "C", "A"]);
        expect(ring.peek()).toBe("B");
        expect(ring.next()).toBe("B");
    });

    it("toSet returns a finite snapshot in insertion order and keeps cursor", () => {
        const ring = new RotatableSet([1, 2, 3]);
        ring.next(); // 1, cursor at 2
        ring.add(4);
        expect(Array.from(ring.toSet())).toEqual([1, 2, 3, 4]);
        expect(ring.peek()).toBe(2);
    });

    it("cycle yields exactly one pass and restores cursor", () => {
        const ring = new RotatableSet([1, 2, 3]);
        ring.next(); // 1, cursor at 2
        expect([...ring.cycle()]).toEqual([2, 3, 1]);
        expect(ring.peek()).toBe(2);
    });

    it("getFurthestItem returns previous item relative to cursor", () => {
        const ring = new RotatableSet([1, 2, 3, 4, 5]);
        expect(ring.peek()).toBe(1);
        expect(ring.getFurthestItem()).toBe(5);
        ring.next(); // 1, cursor at 2
        expect(ring.peek()).toBe(2);
        expect(ring.getFurthestItem()).toBe(1);
        ring.next(); // 2, cursor at 3
        expect(ring.getFurthestItem()).toBe(2);
    });

    it("getFurthestItem works for two items", () => {
        const ring = new RotatableSet(["A", "B"]);
        expect(ring.peek()).toBe("A");
        expect(ring.getFurthestItem()).toBe("B");
        ring.next(); // A, cursor at B
        expect(ring.getFurthestItem()).toBe("A");
    });

    it("behaves correctly for singleton rings", () => {
        const ring = new RotatableSet(["only"]);
        expect(ring.size).toBe(1);
        expect(ring.next()).toBe("only");
        expect(ring.next()).toBe("only");
        expect(ring.getFurthestItem()).toBe("only");
        expect([...ring.cycle()]).toEqual(["only"]);
    });

    it("delete removes items and maintains cursor", () => {
        const ring = new RotatableSet([1, 2, 3]);
        ring.next(); // 1, cursor at 2
        expect(ring.delete(2)).toBe(true); // remove current
        expect(ring.peek()).toBe(3);
        expect(ring.size).toBe(2);
        expect([...ring.cycle()]).toEqual([3, 1]);

        expect(ring.delete(99)).toBe(false);
        expect(ring.size).toBe(2);
    });

    it("delete() matches Set semantics", () => {
        const ring = new RotatableSet([1, 2, 3]);
        expect(ring.delete(2)).toBe(true);
        expect(ring.delete(2)).toBe(false);
        expect(ring.size).toBe(2);
        expect(ring.has(2)).toBe(false);
    });

    it("removing current from a 2-item set leaves the other item current", () => {
        const ring = new RotatableSet(["A", "B"]);
        ring.next(); // A, cursor at B
        expect(ring.delete("B")).toBe(true);
        expect(ring.size).toBe(1);
        expect(ring.peek()).toBe("A");
        expect(ring.getFurthestItem()).toBe("A");
    });

    it("deleting a non-current item does not move the cursor", () => {
        const ring = new RotatableSet([1, 2, 3, 4]);
        ring.next(); // 1, cursor at 2
        expect(ring.delete(4)).toBe(true);
        expect(ring.peek()).toBe(2);
        expect(ring.toArray()).toEqual([2, 3, 1]);
        expect(ring.getFurthestItem()).toBe(1);
    });

    it("enforces uniqueness on add", () => {
        const ring = new RotatableSet([1, 2, 3]);
        ring.add(2);
        expect(ring.size).toBe(3);
        expect(ring.toArray()).toEqual([1, 2, 3]);
    });

    it("has() and clear() work as expected", () => {
        const ring = new RotatableSet([1, 2]);
        expect(ring.has(1)).toBe(true);
        expect(ring.has(3)).toBe(false);
        ring.clear();
        expect(ring.size).toBe(0);
        expect(ring.has(1)).toBe(false);
        expect(() => ring.next()).toThrowError(/empty/i);
    });

    it("removing the last item resets ring and allows fresh adds", () => {
        const ring = new RotatableSet<number>([10]);
        expect(ring.delete(10)).toBe(true);
        expect(ring.size).toBe(0);
        expect(() => ring.next()).toThrowError(/empty/i);
        ring.add(20);
        ring.add(30);
        expect(ring.toArray()).toEqual([20, 30]);
        expect(ring.next()).toBe(20);
    });
});
