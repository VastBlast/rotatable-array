import { describe, it, expect } from "vitest";
import { RotatableArray } from "../src/index";

describe("RotatableArray", () => {
    it("throws on empty source array", () => {
        expect(() => new RotatableArray([])).toThrowError(/non-empty/i);
    });

    it("exposes length of the backing store", () => {
        const rot = new RotatableArray([1, 2, 3]);
        expect(rot.length).toBe(3);
    });

    it("next() cycles through elements and wraps", () => {
        const rot = new RotatableArray(["A", "B", "C"]);
        expect(rot.next()).toBe("A");
        expect(rot.next()).toBe("B");
        expect(rot.next()).toBe("C");
        expect(rot.next()).toBe("A");
    });

    it("peek() reads relative to cursor without moving", () => {
        const rot = new RotatableArray([10, 20, 30]);
        expect(rot.peek()).toBe(10);
        expect(rot.peek(1)).toBe(20);
        expect(rot.peek(2)).toBe(30);
        expect(rot.peek(3)).toBe(10); // wrap
        expect(rot.peek(-1)).toBe(30); // look-behind
        expect(rot.next()).toBe(10); // cursor unchanged by peek
        expect(rot.next()).toBe(20);
    });

    it("peek() normalizes large and fractional offsets", () => {
        const rot = new RotatableArray(["A", "B", "C", "D"]);
        expect(rot.peek(1001)).toBe("B"); // 1001 % 4 = 1
        expect(rot.peek(1.9)).toBe("B"); // truncates toward zero
        expect(rot.peek(-1.9)).toBe("D");
    });

    it("peek() throws on NaN/Infinity offsets", () => {
        const rot = new RotatableArray([1]);
        expect(() => rot.peek(Number.NaN)).toThrowError(/finite/i);
        expect(() => rot.peek(Number.POSITIVE_INFINITY)).toThrowError(/finite/i);
        expect(() => rot.peek(Number.NEGATIVE_INFINITY)).toThrowError(/finite/i);
    });

    it("move() advances cursor by normalized offset", () => {
        const rot = new RotatableArray(["A", "B", "C"]);
        expect(rot.move(1)).toBe("B");
        expect(rot.move(1)).toBe("C");
        expect(rot.move(1)).toBe("A");
        expect(rot.move(-1)).toBe("C");
        expect(rot.move(2)).toBe("B"); // -1 + 2 = 1
    });

    it("move() handles large and fractional offsets", () => {
        const rot = new RotatableArray([0, 1, 2, 3]);
        expect(rot.move(1e6 + 2)).toBe(2);
        expect(rot.move(0.75)).toBe(2); // truncates to 0; cursor stays put
    });

    it("move() throws on NaN/Infinity offsets", () => {
        const rot = new RotatableArray([1, 2]);
        expect(() => rot.move(Number.NaN)).toThrowError(/finite/i);
        expect(() => rot.move(Number.POSITIVE_INFINITY)).toThrowError(/finite/i);
        expect(() => rot.move(Number.NEGATIVE_INFINITY)).toThrowError(/finite/i);
    });

    it("previous() is an alias for move(-1)", () => {
        const rot = new RotatableArray(["A", "B", "C"]);
        rot.next(); // A, cursor at B
        expect(rot.previous()).toBe("A");
        expect(rot.previous()).toBe("C");
    });

    it("setIndex() jumps to an absolute cursor", () => {
        const rot = new RotatableArray(["A", "B", "C"]);
        rot.setIndex(2);
        expect(rot.next()).toBe("C");
        expect(rot.next()).toBe("A");
    });

    it("setIndex() rejects invalid indices", () => {
        const rot = new RotatableArray([1, 2, 3]);
        expect(() => rot.setIndex(-1)).toThrow(RangeError);
        expect(() => rot.setIndex(3)).toThrow(RangeError);
        expect(() => rot.setIndex(1.2)).toThrow(RangeError);
        expect(() => rot.setIndex(Number.NaN)).toThrow(RangeError);
        expect(() => rot.setIndex(Number.POSITIVE_INFINITY)).toThrow(RangeError);
    });

    it("resetIndex() brings cursor back to 0", () => {
        const rot = new RotatableArray(["A", "B", "C"]);
        rot.move(2);
        rot.resetIndex();
        expect(rot.next()).toBe("A");
    });

    it("toArray() returns a snapshot copy", () => {
        const src = [1, 2, 3];
        const rot = new RotatableArray(src);
        const a1 = rot.toArray();
        const a2 = rot.toArray();
        expect(a1).toEqual(src);
        expect(a1).not.toBe(a2);
        a1[0] = 99;
        expect(rot.next()).toBe(1);
    });

    it("cycle() yields exactly one full pass and restores cursor", () => {
        const rot = new RotatableArray(["A", "B", "C"]);
        rot.move(1); // cursor at B
        expect([...rot.cycle()]).toEqual(["B", "C", "A"]);
        expect(rot.next()).toBe("B"); // cursor back at B
    });

    it("Symbol.iterator produces an infinite iterator", () => {
        const rot = new RotatableArray([1, 2]);
        const it1 = rot[Symbol.iterator]();
        expect(it1.next()).toEqual({ value: 1, done: false });
        expect(it1.next()).toEqual({ value: 2, done: false });
        expect(it1.next()).toEqual({ value: 1, done: false });
        expect(it1.return?.(999)).toEqual({ value: 999, done: true });
    });

    it("supports arrays that contain undefined values", () => {
        const rot = new RotatableArray<number | undefined>([1, undefined, 3]);
        expect(rot.next()).toBe(1);
        expect(rot.next()).toBeUndefined();
        expect(rot.peek()).toBe(3);
        expect(rot.move(1)).toBe(1);
    });

    it("behaves correctly for singleton arrays", () => {
        const rot = new RotatableArray(["only"]);
        expect(rot.next()).toBe("only");
        expect(rot.next()).toBe("only");
        expect(rot.peek(100)).toBe("only");
        expect(rot.move(-999)).toBe("only");
        expect([...rot.cycle()]).toEqual(["only"]);
    });

    it("respects copy=true vs copy=false semantics", () => {
        const srcForCopy = [1, 2, 3];
        const copied = new RotatableArray(srcForCopy, true);
        srcForCopy[0] = 99;
        expect(copied.peek()).toBe(1);

        const srcForFreeze = [1, 2, 3];
        const frozen = new RotatableArray(srcForFreeze, false);
        expect(() => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (srcForFreeze as any).push(4);
        }).toThrow();
        expect(frozen.length).toBe(3);
        expect(frozen.peek()).toBe(1);
    });
});
