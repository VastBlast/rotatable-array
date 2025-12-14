class RingNode<T> {
    value: T;
    next: RingNode<T>;
    prev: RingNode<T>;

    constructor(value: T) {
        this.value = value;
        this.next = this;
        this.prev = this;
    }
}

/**
 * A mutable, circular rotator with O(1) next/add/remove/furthest.
 *
 * The "current" cursor always points at the item that `next()` will return.
 * `getFurthestItem(index)` returns the item farthest ahead in the `next()`
 * direction (i.e. the previous item relative to the cursor), offset by `index`.
 */
export class RotatableSet<T> implements Iterable<T> {
    private current: RingNode<T> | null = null;
    private insertionHead: RingNode<T> | null = null;
    private readonly nodes = new Map<T, RingNode<T>>();
    private _size = 0;

    constructor(items: readonly T[] = []) {
        for (const item of items) {
            this.addToFurthest(item);
        }
    }

    /** Number of items in the list. */
    get size(): number {
        return this._size;
    }

    /** Whether the set is empty. */
    get isEmpty(): boolean {
        return this._size === 0;
    }

    /**
     * Return the current item then advance the cursor by one.
     * @throws Error if the list is empty.
     */
    next(): T {
        const node = this.requireCurrent();
        const value = node.value;
        this.current = node.next;
        return value;
    }

    /**
     * Read the current item without advancing.
     * @throws Error if the list is empty.
     */
    peek(): T {
        return this.requireCurrent().value;
    }

    /**
     * Add a new item at the furthest position (Set-style append).
     * The cursor is not moved.
     * Matches native `Set.add` return type.
     */
    addToFurthest(item: T): this {
        if (this.nodes.has(item)) return this;
        const node = new RingNode(item);

        if (!this.current) {
            this.current = node;
            this.insertionHead = node;
        } else {
            this.insertBefore(this.requireInsertionHead(), node);
        }

        this.nodes.set(item, node);
        this._size += 1;
        return this;
    }

    /**
     * Add a new item and make it the next one returned by `next()`.
     * After it's returned, rotation continues with what would have been next.
     */
    addToNext(item: T): this {
        if (this.nodes.has(item)) return this;
        const node = new RingNode(item);

        if (!this.current) {
            this.current = node;
            this.insertionHead = node;
        } else {
            this.insertBefore(this.current, node);
            this.current = node;
        }

        this.nodes.set(item, node);
        this._size += 1;
        return this;
    }

    /** Back-compat alias for Set-style append. */
    add(item: T): this {
        return this.addToFurthest(item);
    }

    /**
     * Remove `item` from the set. Matches native `Set.delete`.
     * @returns `true` if the item was removed.
     */
    delete(item: T): boolean {
        const node = this.nodes.get(item);
        if (!node) return false;
        this.nodes.delete(item);

        if (this._size === 1) {
            this.current = null;
            this.insertionHead = null;
            this._size = 0;
            return true;
        }

        const next = node.next;
        node.prev.next = node.next;
        node.next.prev = node.prev;

        if (node === this.current) {
            this.current = next;
        }

        if (node === this.insertionHead) {
            this.insertionHead = next;
        }

        this._size -= 1;
        return true;
    }

    /**
     * Get the furthest item from the current cursor in terms of `next()` steps.
     * Provide `index` to walk further backward from that furthest item (wraps).
     * Runtime: O(1) when `index === 0`, otherwise O(index mod size).
     * @throws Error if the set is empty.
     */
    getFurthestItem(index = 0): T {
        const node = this.requireCurrent();
        if (!Number.isFinite(index)) {
            throw new Error("Index must be a finite number");
        }
        index = Math.trunc(index);
        const offset = ((index % this._size) + this._size) % this._size;

        let target = node.prev;
        for (let i = 0; i < offset; i += 1) {
            target = target.prev;
        }
        return target.value;
    }

    /** O(1) membership check. */
    has(item: T): boolean {
        return this.nodes.has(item);
    }

    /** Remove all items. */
    clear(): void {
        this.current = null;
        this.insertionHead = null;
        this.nodes.clear();
        this._size = 0;
    }

    /** Snapshot in rotation order starting from the cursor. */
    toArray(): T[] {
        if (!this.current) return [];
        const out: T[] = [];
        let node = this.current;
        const n = this._size;
        for (let i = 0; i < n; i += 1) {
            out.push(node.value);
            node = node.next;
        }
        return out;
    }

    /**
     * Finite snapshot as a native `Set`, preserving insertion order.
     * Does not mutate the cursor.
     */
    toSet(): Set<T> {
        return new Set(this.nodes.keys());
    }

    /**
     * Infinite iterator that round-robins through items.
     * @throws Error on iteration if list becomes empty.
     */
    *[Symbol.iterator](): IterableIterator<T> {
        while (true) {
            yield this.next();
        }
    }

    /**
     * Generator that yields exactly one full pass starting from the cursor.
     */
    *cycle(): IterableIterator<T> {
        const n = this._size;
        for (let k = 0; k < n; k += 1) {
            yield this.next();
        }
    }

    private requireCurrent(): RingNode<T> {
        if (!this.current) {
            throw new Error("RotatableSet is empty");
        }
        return this.current;
    }

    private requireInsertionHead(): RingNode<T> {
        if (!this.insertionHead) {
            throw new Error("RotatableSet is empty");
        }
        return this.insertionHead;
    }

    private insertBefore(target: RingNode<T>, node: RingNode<T>): void {
        const prev = target.prev;
        node.next = target;
        node.prev = prev;
        prev.next = node;
        target.prev = node;
    }
}
