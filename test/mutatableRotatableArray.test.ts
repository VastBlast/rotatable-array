import { describe, it, expect } from "vitest";
import { MutatableRotatableArray } from "../src/index";

describe("MutatableRotatableArray", () => {
    it("throws on empty source array", () => {
        expect(() => new MutatableRotatableArray([])).toThrowError(/non-empty/i);
    });

    it("push/add appends without moving the cursor", () => {
        const rot = new MutatableRotatableArray(["A", "B"]);
        rot.setIndex(1); // B
        expect(rot.push("C")).toBe(3);
        expect(rot.add("D")).toBe(4);
        expect(rot.peek()).toBe("B");
        expect([...rot.cycle()]).toEqual(["B", "C", "D", "A"]);
    });

    it("next() reflects new items appended mid-rotation", () => {
        const rot = new MutatableRotatableArray([1, 2, 3]);
        expect(rot.next()).toBe(1);
        rot.push(4);
        rot.push(5);
        expect(rot.next()).toBe(2);
        expect(rot.next()).toBe(3);
        expect(rot.next()).toBe(4);
        expect(rot.next()).toBe(5);
        expect(rot.next()).toBe(1);
    });

    it("insert() before or at the cursor keeps the same current item", () => {
        const rot = new MutatableRotatableArray(["A", "B", "C"]);
        rot.setIndex(1); // B
        rot.insert(0, "X");
        expect(rot.peek()).toBe("B");
        expect([...rot.cycle()]).toEqual(["B", "C", "X", "A"]);

        const rot2 = new MutatableRotatableArray(["A", "B", "C"]);
        rot2.setIndex(1); // B
        rot2.insert(1, "Y");
        expect(rot2.peek()).toBe("B");
        expect([...rot2.cycle()]).toEqual(["B", "C", "A", "Y"]);
    });

    it("insert() after the cursor does not move the cursor", () => {
        const rot = new MutatableRotatableArray(["A", "B", "C"]);
        rot.setIndex(1); // B
        rot.insert(3, "D"); // append
        expect(rot.peek()).toBe("B");
        expect(rot.next()).toBe("B");
        expect(rot.next()).toBe("C");
        expect(rot.next()).toBe("D");
        expect(rot.next()).toBe("A");
        expect(rot.next()).toBe("B");
    });

    it("insert() at index 0 keeps the current item when cursor is 0", () => {
        const rot = new MutatableRotatableArray(["A", "B", "C"]);
        rot.setIndex(0); // A
        rot.insert(0, "X");
        expect(rot.peek()).toBe("A");
        expect(rot.next()).toBe("A");
        expect(rot.next()).toBe("B");
        expect(rot.next()).toBe("C");
        expect(rot.next()).toBe("X");
        expect(rot.next()).toBe("A");
    });

    it("insert() returns the new length and allows index == length", () => {
        const rot = new MutatableRotatableArray(["A"]);
        expect(rot.insert(1, "B")).toBe(2);
        expect(rot.length).toBe(2);
        expect(rot.next()).toBe("A");
        expect(rot.next()).toBe("B");
        expect(rot.next()).toBe("A");
    });

    it("removeAt() shifts the cursor to keep the same current item", () => {
        const rot = new MutatableRotatableArray(["A", "B", "C", "D"]);
        rot.setIndex(2); // C
        expect(rot.removeAt(0)).toBe("A");
        expect(rot.peek()).toBe("C");
        expect([...rot.cycle()]).toEqual(["C", "D", "B"]);
    });

    it("removeAt() advances when removing the current item and wraps on last", () => {
        const rot = new MutatableRotatableArray(["A", "B", "C"]);
        rot.setIndex(1); // B
        expect(rot.removeAt(1)).toBe("B");
        expect(rot.peek()).toBe("C");
        expect([...rot.cycle()]).toEqual(["C", "A"]);

        const rot2 = new MutatableRotatableArray(["A", "B", "C"]);
        rot2.setIndex(2); // C
        rot2.removeAt(2);
        expect(rot2.peek()).toBe("A");
    });

    it("removeAt() after the cursor keeps the cursor position", () => {
        const rot = new MutatableRotatableArray(["A", "B", "C", "D"]);
        rot.setIndex(1); // B
        expect(rot.removeAt(3)).toBe("D");
        expect(rot.peek()).toBe("B");
        expect(rot.next()).toBe("B");
        expect(rot.next()).toBe("C");
        expect(rot.next()).toBe("A");
        expect(rot.next()).toBe("B");
    });

    it("removeAt() on a 2-item array leaves the remaining item current", () => {
        const rot = new MutatableRotatableArray(["A", "B"]);
        rot.setIndex(0); // A
        expect(rot.removeAt(0)).toBe("A");
        expect(rot.length).toBe(1);
        expect(rot.peek()).toBe("B");
        expect(rot.next()).toBe("B");
        expect(rot.next()).toBe("B");
    });

    it("removeAt() throws when removing the last element", () => {
        const rot = new MutatableRotatableArray(["only"]);
        expect(() => rot.removeAt(0)).toThrowError(/at least one/i);
    });

    it("validates indices for insert/remove", () => {
        const rot = new MutatableRotatableArray(["A", "B"]);
        expect(() => rot.insert(-1, "X")).toThrow(RangeError);
        expect(() => rot.insert(3, "X")).toThrow(RangeError);
        expect(() => rot.insert(0.5, "X")).toThrow(RangeError);
        expect(() => rot.insert(Number.NaN, "X")).toThrow(RangeError);
        expect(() => rot.insert(Number.POSITIVE_INFINITY, "X")).toThrow(RangeError);
        expect(() => rot.removeAt(-1)).toThrow(RangeError);
        expect(() => rot.removeAt(2)).toThrow(RangeError);
        expect(() => rot.removeAt(1.1)).toThrow(RangeError);
        expect(() => rot.removeAt(Number.POSITIVE_INFINITY)).toThrow(RangeError);
    });

    it("respects copy=true vs copy=false semantics", () => {
        const srcForCopy = [1, 2];
        const copied = new MutatableRotatableArray(srcForCopy, true);
        copied.push(3);
        expect(srcForCopy).toEqual([1, 2]);
        expect(copied.toArray()).toEqual([1, 2, 3]);

        const srcForShare = [1, 2];
        const shared = new MutatableRotatableArray(srcForShare, false);
        shared.push(3);
        expect(srcForShare).toEqual([1, 2, 3]);
        srcForShare.push(4);
        expect(shared.length).toBe(4);
    });
});
