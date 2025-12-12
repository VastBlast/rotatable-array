# rotatable-array

Two tiny, zero‑dependency circular rotators for TypeScript / JavaScript:

- `RotatableArray<T>`: an **immutable**, **non‑empty** round‑robin view over a backing array.
- `RotatableSet<T>`: a **mutable**, **unique‑item** round‑robin set with O(1) add/remove/next.

---

## Install

```bash
npm i rotatable-array
````

---

## Quick Start

```ts
import { RotatableArray, RotatableSet } from "rotatable-array";

const rot = new RotatableArray(["A", "B", "C"]);
console.log(rot.next());      // A
console.log(rot.peek(1));     // B
console.log(rot.next());      // B
console.log(rot.previous());  // B
console.log(rot.move(1));     // C

const set = new RotatableSet([1, 2, 3]);
set.add(4);                   // Set-style add (unique, returns this)
set.addItem(4);               // false (already present)
console.log(set.next());      // 1
console.log(set.getFurthestItem()); // 4
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
`getFurthestItem()` is the item farthest ahead in `next()` order (i.e. `previous`).

| method                | summary                                                     |
| --------------------- | ----------------------------------------------------------- |
| `add(item)`           | Set‑style add (unique), returns `this`                      |
| `addItem(item)`       | boolean add helper (`true` if inserted)                     |
| `delete(item)`        | Set‑style delete, returns `boolean`                         |
| `removeItem(item)`    | alias for `delete`                                          |
| `next()`              | return current, advance (wraps)                             |
| `peek()`              | read current without advancing                              |
| `getFurthestItem()`   | item farthest from cursor in `next()` steps                 |
| `has(item)`           | membership check                                            |
| `clear()`             | remove all items                                            |
| `toArray()` *(O(n))*  | snapshot in rotation order starting from cursor             |
| `toSet()` *(O(n))*    | finite snapshot as native `Set` (in insertion order)        |
| `size` / `length`     | item count                                                  |
| `Symbol.iterator`     | infinite iterator (never `done`)                            |
| `cycle()` *(O(n))*    | one full pass starting at cursor                            |

Note: because the iterator is infinite, use `toArray()`, `toSet()`, or `cycle()` for finite snapshots.
