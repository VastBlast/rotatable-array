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
        ring.addToFurthest(1).addToFurthest(2).addToFurthest(3);
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
        ring.addToFurthest(4);
        expect(ring.peek()).toBe(2);
        expect(ring.toArray()).toEqual([2, 3, 4, 1]);
        expect(ring.next()).toBe(2);
    });

    it("adding an existing item keeps state unchanged", () => {
        const ring = new RotatableSet([1, 2, 3]);
        ring.next(); // 1, cursor at 2
        ring.addToFurthest(2); // duplicate
        expect(ring.size).toBe(3);
        expect(ring.peek()).toBe(2);
        expect(ring.toArray()).toEqual([2, 3, 1]);
    });

    it("addToFurthest() matches Set semantics", () => {
        const ring = new RotatableSet<number>();
        const ret = ring.addToFurthest(1).addToFurthest(2);
        expect(ret).toBe(ring);
        expect(ring.size).toBe(2);
        ring.addToFurthest(2); // no-op
        expect(ring.size).toBe(2);
        expect(ring.toArray()).toEqual([1, 2]);
    });

    it("add() aliases addToFurthest()", () => {
        const ring = new RotatableSet<number>();
        const ret = ring.add(1).add(2);
        expect(ret).toBe(ring);
        expect(ring.size).toBe(2);
        expect(ring.toArray()).toEqual([1, 2]);
    });

    it("addToNext makes the new item current", () => {
        const ring = new RotatableSet([1, 2, 3]);
        ring.next(); // 1, cursor at 2
        ring.addToNext(99);
        expect(ring.peek()).toBe(99);
        expect(ring.toArray()).toEqual([99, 2, 3, 1]);
        expect(ring.next()).toBe(99);
        expect(ring.next()).toBe(2);
    });

    it("addToNext ignores duplicates and does not move the cursor", () => {
        const ring = new RotatableSet([1, 2, 3]);
        ring.next(); // 1, cursor at 2
        ring.addToNext(2); // duplicate
        expect(ring.size).toBe(3);
        expect(ring.peek()).toBe(2);
        expect(ring.toArray()).toEqual([2, 3, 1]);
    });

    it("addToNext works on empty sets", () => {
        const ring = new RotatableSet<number>();
        ring.addToNext(42);
        expect(ring.size).toBe(1);
        expect(ring.peek()).toBe(42);
        expect(ring.next()).toBe(42);
        expect(ring.next()).toBe(42);
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
        ring.addToFurthest(4);
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

    it("getFurthestItem supports indexed access and wraps", () => {
        const ring = new RotatableSet([1, 2, 3, 4]);
        expect(ring.getFurthestItem()).toBe(4);
        expect(ring.getFurthestItem(1)).toBe(3);
        expect(ring.getFurthestItem(2)).toBe(2);
        expect(ring.getFurthestItem(3)).toBe(1);
        expect(ring.getFurthestItem(4)).toBe(4); // exact wrap to same as 0
        expect(ring.getFurthestItem(5)).toBe(3); // wraps past size
        expect(ring.getFurthestItem(9)).toBe(3); // multiple full wraps
        ring.next(); // 1, cursor at 2
        expect(ring.getFurthestItem(1)).toBe(4);
    });

    it("getFurthestItem throws on non-finite indexes", () => {
        const ring = new RotatableSet([1, 2, 3]);
        expect(() => ring.getFurthestItem(Number.NaN)).toThrowError(/finite/i);
        expect(() => ring.getFurthestItem(Number.POSITIVE_INFINITY)).toThrowError(/finite/i);
        expect(() => ring.getFurthestItem(Number.NEGATIVE_INFINITY)).toThrowError(/finite/i);
    });

    it("getFurthestItem truncates float indexes", () => {
        const ring = new RotatableSet([1, 2, 3, 4]);
        expect(ring.getFurthestItem(1.9)).toBe(3);
        expect(ring.getFurthestItem(-1.9)).toBe(1);
    });

    it("supports adding and deleting class instances", () => {
        class Foo {
            constructor(public id: number) {}
        }
        const a = new Foo(1);
        const b = new Foo(2);
        const c = new Foo(3);

        const ring = new RotatableSet<Foo>([a, b]);
        ring.addToFurthest(c);
        expect(ring.size).toBe(3);
        expect(ring.peek()).toBe(a);
        expect(ring.delete(b)).toBe(true);
        expect(ring.size).toBe(2);
        expect(ring.delete(b)).toBe(false);
        expect(ring.toArray()).toEqual([a, c]);
    });

    it("allows deleting via a grabbed class reference", () => {
        class Widget {
            constructor(public name: string) {}
        }
        const w1 = new Widget("w1");
        const w2 = new Widget("w2");
        const w3 = new Widget("w3");

        const ring = new RotatableSet<Widget>([w1, w2, w3]);
        const grabbed = ring.getFurthestItem(); // w3
        expect(grabbed).toBe(w3);
        expect(ring.delete(grabbed)).toBe(true);
        expect(ring.size).toBe(2);
        expect(ring.has(w3)).toBe(false);
        expect(ring.toArray()).toEqual([w1, w2]);
        expect(ring.getFurthestItem()).toBe(w2);
    });

    it("getFurthestItem works for two items", () => {
        const ring = new RotatableSet(["A", "B"]);
        expect(ring.peek()).toBe("A");
        expect(ring.getFurthestItem()).toBe("B");
        ring.next(); // A, cursor at B
        expect(ring.getFurthestItem()).toBe("A");
    });

    it("getFurthestItem indexes wrap for singleton rings", () => {
        const ring = new RotatableSet(["only"]);
        expect(ring.getFurthestItem(0)).toBe("only");
        expect(ring.getFurthestItem(1)).toBe("only");
        expect(ring.getFurthestItem(99)).toBe("only");
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

    it("deleting insertionHead preserves the furthest-append position", () => {
        const ring = new RotatableSet(["A", "B", "C"]);
        ring.next(); // A, cursor at B
        ring.addToNext("D"); // cursor at D
        expect(ring.toArray()).toEqual(["D", "B", "C", "A"]);

        expect(ring.delete("A")).toBe(true); // delete insertionHead
        expect(ring.toArray()).toEqual(["D", "B", "C"]);

        ring.addToFurthest("E");
        expect(ring.toArray()).toEqual(["D", "B", "C", "E"]);
        expect(Array.from(ring.toSet())).toEqual(["B", "C", "D", "E"]);
    });

    it("enforces uniqueness on addToFurthest", () => {
        const ring = new RotatableSet([1, 2, 3]);
        ring.addToFurthest(2);
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
        ring.addToFurthest(20);
        ring.addToFurthest(30);
        expect(ring.toArray()).toEqual([20, 30]);
        expect(ring.next()).toBe(20);
    });

    it("adding after next is called updates expected order", ()=> {
        const set = new RotatableSet<number>();
        set.addToFurthest(1).addToFurthest(2).addToFurthest(3);
        expect(set.next()).toBe(1);
        set.addToFurthest(4).addToFurthest(5).addToFurthest(6);
        expect(set.next()).toBe(2);
        expect(set.next()).toBe(3);
        expect(set.next()).toBe(4);
        expect(set.next()).toBe(5);
        expect(set.next()).toBe(6);
        expect(set.next()).toBe(1);
    })

    it('adding to next, after next is called, updates expected order', ()=> {
        const set = new RotatableSet<number>();
        set.add(1).add(2).add(3);
        expect(set.next()).toBe(1);
        expect(set.next()).toBe(2);
        set.addToNext(99);
        expect(set.next()).toBe(99);
        expect(set.next()).toBe(3);
        expect(set.next()).toBe(1);
    })

    it('still works as expected after deletes and adds in between', ()=> {
        const set = new RotatableSet<string>();
        set.add('A').add('B').add('C');
        expect(set.next()).toBe('A');
        expect(set.next()).toBe('B');
        expect(set.next()).toBe('C');
        set.addToNext('D');
        expect(set.next()).toBe('D');
        expect(set.delete('B'));
        expect(set.next()).toBe('A');
        set.addToFurthest('E')
        set.addToNext('F');
        expect(set.next()).toBe('F');
        expect(set.next()).toBe('C');
        expect(set.next()).toBe('D');
        expect(set.next()).toBe('E');
        expect(set.next()).toBe('A');
    })
});
