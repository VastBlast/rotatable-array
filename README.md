# rotatable-array

Three tiny, zero‑dependency circular rotators for TypeScript / JavaScript:

- `RotatableArray<T>`: an **immutable**, **non‑empty** round‑robin view over a backing array.
- `RotatableMutatableArray<T>`: a **mutable**, **non-empty** round-robin array with add/remove.
- `RotatableSet<T>`: a **mutable**, **unique‑item** round‑robin set with O(1) add/remove/next.

---

## Install

```bash
npm i rotatable-array
````

---

## Quick Start

```ts
import { RotatableMutatableArray, RotatableArray, RotatableSet } from "rotatable-array";

const rot = new RotatableArray(["A", "B", "C"]);
console.log(rot.next());      // A
console.log(rot.peek(1));     // B
console.log(rot.next());      // B
console.log(rot.previous());  // B
console.log(rot.move(1));     // C

const mut = new RotatableMutatableArray(["A", "B"]);
mut.add("C");
mut.removeAt(1);
console.log(mut.next());      // A

const set = new RotatableSet([1, 2, 3]);
set.addToFurthest(4);          // Set-style append (unique, returns this)
set.addToFurthest(4);          // no-op for duplicates
console.log(set.getFurthestItem()); // 4
console.log(set.getFurthestItem(1)); // 3
console.log(set.next());      // 1
```

### Iteration

```ts
for (const x of rot)      // infinite round-robin
  console.log(x);

for (const x of rot.cycle())  // one full pass then stops
  console.log(x);

for (const x of set)      // infinite round-robin (like rot)
  console.log(x);

for (const x of set.cycle())  // one full pass then stops
  console.log(x);
```

---

## API

### RotatableArray

| method                         | summary                                      |
| ------------------------------ | -------------------------------------------- |
| `next()`                       | return current, advance (wraps)              |
| `peek(offset=0)`               | inspect relative to cursor                   |
| `move(offset)`                 | jump ±offset, return new current             |
| `previous()`                   | `move(-1)` shortcut                          |
| `setIndex(i)` / `resetIndex()` | absolute cursor jumps                        |
| `toArray()`                    | snapshot copy of backing store               |
| `length`                       | item count                                   |
| `Symbol.iterator`              | infinite iterator (never `done`)             |
| `cycle()`                      | one full pass starting at cursor             |

### RotatableSet

Unique, ordered, circular set. All operations below are O(1) unless noted.
The cursor always points at the item that `next()` will return.  
`getFurthestItem(index=0)` is the item farthest ahead in `next()` order (i.e.
`previous`), offset further backward by `index` (wraps).

| method                | summary                                                     |
| --------------------- | ----------------------------------------------------------- |
| `addToFurthest(item)` | Set‑style append (unique), returns `this`                   |
| `addToNext(item)`     | add and make it next returned by `next()`                   |
| `add(item)`           | alias of `addToFurthest(item)`                              |
| `delete(item)`        | Set‑style delete, returns `boolean`                         |
| `next()`              | return current, advance (wraps)                             |
| `peek()`              | read current without advancing                              |
| `getFurthestItem(index=0)` | item farthest from cursor; `index` steps farther back (wraps, O(1) when `index` is 0, otherwise O(index mod size)) |
| `has(item)`           | membership check                                            |
| `isEmpty`             | whether the set has zero items                              |
| `clear()`             | remove all items                                            |
| `toArray()` *(O(n))*  | snapshot in rotation order starting from cursor             |
| `toSet()` *(O(n))*    | finite snapshot as native `Set` (in insertion order)        |
| `size`                | item count                                                  |
| `Symbol.iterator`     | infinite iterator (never `done`)                            |
| `cycle()` *(O(n))*    | one full pass starting at cursor                            |

Note: because the iterator is infinite, use `toArray()`, `toSet()`, or `cycle()` for finite snapshots.

### RotatableMutatableArray

Mutable, ordered, circular array. Inherits all `RotatableArray` methods and adds:

| method                 | summary                                                              |
| ---------------------- | -------------------------------------------------------------------- |
| `push(item)` / `add(item)` | append to end, returns new length                                 |
| `insert(index, item)`  | insert at absolute index, returns new length                          |
| `removeAt(index)`      | remove by absolute index, returns removed item (throws if last item) |

Note: the array must always contain at least one element; `removeAt` throws if it would become empty.
