# React boolean hook

Commonly used hook for boolean state, with zero argument setters.

```tsx
const { value, toggle, setTrue, setFalse, setValue } = useBoolean(true);

value; // true or false
toggle();
setTrue();
setFalse();
setValue(true);
setValue(false);
```
