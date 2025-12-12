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
    private readonly nodes = new Map<T, RingNode<T>>();
    private _size = 0;

    constructor(items: readonly T[] = []) {
        for (const item of items) {
            this.add(item);
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
     * Add a new item to the set. The cursor is not moved.
     * Items are appended just before the cursor to preserve insertion order.
     * Matches native `Set.add` return type.
     */
    add(item: T): this {
        if (this.nodes.has(item)) return this;
        const node = new RingNode(item);

        if (!this.current) {
            this.current = node;
        } else {
            const tail = this.current.prev;
            node.next = this.current;
            node.prev = tail;
            tail.next = node;
            this.current.prev = node;
        }

        this.nodes.set(item, node);
        this._size += 1;
        return this;
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
            this._size = 0;
            return true;
        }

        node.prev.next = node.next;
        node.next.prev = node.prev;

        if (node === this.current) {
            this.current = node.next;
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
}
