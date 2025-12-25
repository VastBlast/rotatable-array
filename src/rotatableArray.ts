abstract class RotatableArrayBase<T> implements Iterable<T> {
    protected array: T[];
    protected index = 0;

    protected constructor(array: T[]) {
        if (array.length === 0) throw new Error("RotatingArray requires a non-empty array");
        this.array = array;
    }

    /** Array length */
    get length(): number {
        return this.array.length;
    }

    /**
     * Return the current element *then* advance the cursor by one,
     * wrapping to `0` after the last slot.
     */
    next(): T {
        const v = this.at(this.index);
        this.index = (this.index + 1 === this.length) ? 0 : this.index + 1;
        return v;
    }

    /**
     * Read an element at `offset` relative to the current cursor
     * without mutating state.  
     * @param offset  0 = current (default), positive = look-ahead,
     *                negative = look-behind.  Must be finite.
     * @returns       The element at that logical position.
     * @throws        `Error` when `offset` is `NaN`/`Infinity`.
     */
    peek(offset = 0): T {
        offset = this.norm(offset);
        const i = ((this.index + offset) % this.length + this.length) % this.length;
        return this.at(i);
    }

    /**
     * Move the cursor by `offset` steps (positive or negative) and
     * return the new current element.
     * @param offset  Finite, integer offset. Large numbers are allowed.
     * @throws        `Error` when `offset` is `NaN`/`Infinity`.
     */
    move(offset: number): T {
        offset = this.norm(offset);
        this.index = ((this.index + offset) % this.length + this.length) % this.length;
        return this.at(this.index);
    }

    /** Convenience alias for `move(-1)` */
    previous(): T {
        return this.move(-1);
    }

    /**
     * Jump directly to absolute `index`.
     * @throws `RangeError` if `index` is not an integer in `[0,length)`.
     */
    setIndex(index: number): void {
        if (!Number.isInteger(index) || index < 0 || index >= this.length) {
            throw new RangeError(`Index ${index} out of bounds`);
        }
        this.index = index;
    }

    /** Reset the cursor to the first element (`index = 0`). */
    resetIndex(): void {
        this.index = 0;
    }

    /** Shallow copy of the backing store (snapshot). */
    toArray(): T[] {
        return this.array.slice();
    }

    /**
     * Standards-compliant **infinite** iterator that never signals `done`.
     * ```ts
     * for (const x of rot) { … }   // round-robins endlessly
     * ```
     */
    *[Symbol.iterator](): IterableIterator<T> {
        while (true) {
            yield this.next();
        }
    }


    /**
     * Generator that yields **exactly one full pass** (length elements)
     * starting from the current cursor.
     */
    *cycle(): IterableIterator<T> {
        const n = this.length;
        for (let k = 0; k < n; ++k) {
            yield this.next();
        }
    }

    /** Normalise any finite number to an integer modulo `length`. */
    protected norm(off: number): number {
        if (!Number.isFinite(off)) {
            throw new Error("Offset must be a finite number");
        }
        return Math.trunc(off % this.length);
    }

    /** Safe indexed access preserving `T` (even if it includes `undefined`). */
    protected at(index: number): T {
        if (index < 0 || index >= this.length) {
            throw new RangeError(`Index ${index} out of bounds`);
        }
        return this.array[index] as T;
    }
}

export class RotatableArray<T> extends RotatableArrayBase<T> {
    /**
     * @param src   A **non-empty** array used as backing store.
     * @param copy  If `true` (default) we clone `src`; otherwise we *freeze*
     *              and reference it directly (prevents being externally mutated).
     * @throws      `Error` when `src` is empty.
     */
    constructor(src: readonly T[], copy = true) {
        const array: T[] = copy ? src.slice() : (Object.freeze(src) as T[]);
        super(array);
    }
}

export class RotatableMutatableArray<T> extends RotatableArrayBase<T> {
    /**
     * @param src   A **non-empty** array used as backing store.
     * @param copy  If `true` (default) we clone `src`; otherwise we reference it
     *              directly (caller must ensure it remains mutable and non-empty).
     * @throws      `Error` when `src` is empty.
     */
    constructor(src: readonly T[], copy = true) {
        const array: T[] = copy ? src.slice() : (src as T[]);
        super(array);
    }

    /**
     * Append `item` to the end. The cursor is not moved.
     * @returns The new length.
     */
    push(item: T): number {
        this.array.push(item);
        return this.length;
    }

    /** Alias for `push` (append). */
    add(item: T): number {
        return this.push(item);
    }

    /**
     * Insert `item` at absolute `index`. The cursor is shifted only if needed
     * to keep pointing at the same logical element.
     * @throws `RangeError` if `index` is not an integer in `[0,length]`.
     */
    insert(index: number, item: T): number {
        this.assertInsertIndex(index);
        if (index <= this.index) {
            this.index += 1;
        }
        this.array.splice(index, 0, item);
        return this.length;
    }

    /**
     * Remove the item at absolute `index` and return it.
     * The cursor advances to the next item if the current one is removed.
     * @throws `RangeError` if `index` is not an integer in `[0,length)`.
     * @throws `Error` if removal would make the array empty.
     */
    removeAt(index: number): T {
        this.assertRemoveIndex(index);
        if (this.length === 1) {
            throw new Error("RotatableMutatableArray must contain at least one element");
        }
        if (index < this.index) {
            this.index -= 1;
        }
        const removed = this.array[index] as T;
        this.array.splice(index, 1);
        if (this.index >= this.length) {
            this.index = 0;
        }
        return removed;
    }

    private assertInsertIndex(index: number): void {
        if (!Number.isInteger(index) || index < 0 || index > this.length) {
            throw new RangeError(`Index ${index} out of bounds`);
        }
    }

    private assertRemoveIndex(index: number): void {
        if (!Number.isInteger(index) || index < 0 || index >= this.length) {
            throw new RangeError(`Index ${index} out of bounds`);
        }
    }
}
