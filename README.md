# JSON Parser

A standard compliant JSON parser for JavaScript.

```js
const data = parseJSON(input);
```

## Custom handler for numbers

Allows to represent numbers in a custom type, for example to avoid
precision loss.

```js
const data = parseJSON(input, {
  handleNumber: (value) => new BigNumber(value)
})
```
