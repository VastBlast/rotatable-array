# RotatableArray

A tiny, simple, zero-dependency circular array for TypeScript / JavaScript. I created this to use within my own projects. Nothing fancy, nice and simple.

---

## Install

```bash
npm i rotatable-array
````

---

## Quick Start

```ts
import { RotatableArray } from "rotatable-array";

const rot = new RotatableArray(["A", "B", "C"]);
console.log(rot.next());      // A
console.log(rot.peek(1));     // C
console.log(rot.next());      // B
console.log(rot.previous());  // B
console.log(rot.move(1));     // C
```

### Iteration

```ts
for (const x of rot)      // infinite round-robin
  console.log(x);

for (const x of rot.cycle())  // one full pass then stops
  console.log(x);
```

---

## API

| method                         | summary                      |
| ------------------------------ | ---------------------------- |
| `next()`                       | return current, advance      |
| `peek(offset=0)`               | inspect without moving       |
| `move(offset)`                 | jump ±offset                 |
| `previous()`                   | `move(-1)` shortcut          |
| `setIndex(i)` / `resetIndex()` | absolute jumps               |
| `add(...items)`                | insert after cursor          |
| `removeAt(i = current)`        | delete & return item         |
| `shuffle()`                    | in-place shuffle, cursor → 0 |
| `toArray()`                    | snapshot copy                |
| `length`                       | live item count              |
| `Symbol.iterator`              | infinite iterator            |
| `cycle()`                      | one-pass generator           |