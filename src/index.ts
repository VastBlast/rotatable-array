export class RotatableArray<T> implements Iterable<T> {
    private _array: ReadonlyArray<T>;
    private _index = 0;
    private _length: number;

    /**
     * @param src   A **non-empty** array used as backing store.
     * @param copy  If `true` (default) we clone `src`; otherwise we *freeze*
     *              and reference it directly (prevents being externally mutated).
     * @throws      `Error` when `src` is empty.
     */
    constructor(src: T[], copy = true) {
        if (src.length === 0) throw new Error("RotatingArray requires a non-empty array");
        this._array = copy ? src.slice() : Object.freeze(src);
        this._length = this._array.length;
    }

    /** Array length */
    get length(): number {
        return this._length;
    }

    /**
     * Return the current element *then* advance the cursor by one,
     * wrapping to `0` after the last slot.
     */
    next(): T {
        const v = this._array[this._index];
        this._index = (this._index + 1 === this._length) ? 0 : this._index + 1;
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
        offset = this._norm(offset);
        return this._array[((this._index + offset) % this._length + this._length) % this._length];
    }

    /**
     * Move the cursor by `offset` steps (positive or negative) and
     * return the new current element.
     * @param offset  Finite, integer offset. Large numbers are allowed.
     * @throws        `Error` when `offset` is `NaN`/`Infinity`.
     */
    move(offset: number): T {
        offset = this._norm(offset);
        this._index = ((this._index + offset) % this._length + this._length) % this._length;
        return this._array[this._index];
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
        if (!Number.isInteger(index) || index < 0 || index >= this._length) {
            throw new RangeError(`Index ${index} out of bounds`);
        }
        this._index = index;
    }

    /** Reset the cursor to the first element (`index = 0`). */
    resetIndex(): void {
        this._index = 0;
    }

    /** Shallow copy of the backing store (snapshot). */
    toArray(): T[] {
        return this._array.slice();
    }

    /**
     * Standards-compliant **infinite** iterator that never signals `done`.
     * ```ts
     * for (const x of rot) { … }   // round-robins endlessly
     * ```
     */
    [Symbol.iterator](): IterableIterator<T> {
        const self = this;
        return {
            next(): IteratorResult<T, any> {
                return { value: self.next(), done: false };
            },
            return(value?: any): IteratorResult<T, any> {
                return { value: value as T, done: true };
            },
            // (throw is optional; leaving it out is fine)
            [Symbol.iterator]() { return this; }
        };
    }


    /**
     * Generator that yields **exactly one full pass** (length elements)
     * starting from the current cursor.
     */
    *cycle(): IterableIterator<T> {
        for (let k = 0; k < this._length; ++k) {
            yield this.next();
        }
    }

    /** Normalise any finite number to an integer modulo `length`. */
    private _norm(off: number): number {
        if (!Number.isFinite(off)) {
            throw new Error("Offset must be a finite number");
        }
        return Math.trunc(off % this._length);
    }
}