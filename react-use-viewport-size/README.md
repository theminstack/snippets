# React viewport size hook

A hook which returns the dimensions of the viewport (window inner height and width). This hook uses the `requestAnimationFrame` function to throttle updates.

```tsx
const { height, width } = useViewportSize();
```
