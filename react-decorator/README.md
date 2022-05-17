# Decorator

Decorate non-empty content.

The `Decorator` component accepts a `decoration` component and children. It will only render the decoration if at least one DOM node is rendered by its children. Child DOM nodes are detected using a [MutationObserver](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver) (). This can help you avoid rendering an empty container when there's no content visible in the container.

```tsx
const MaybeEmpty = () => {
  const isVisible = useIsVisible();

  // Might render a div or nothing (null).
  return isVisible ? <p>Content</p> : null
};

const Card = (props: { children?: ReactNode }) => {
  return <div className="card">{children}</div>
}

render(
  <Decorator decoration={Card}>
    <MaybeEmpty />
  </Decorator>
);
```

If the `MaybeEmpty` component renders nothing (`null`), then only a single empty and hidden `div` is rendered.

```html
<div data-decorator="empty" style="display: none;"></div>
```

If the `MaybeEmpty` component renders something, then the following will be rendered.

```html
<div class="card">
  <div data-decorator="not-empty">
    <p>Content</p>
  </div>
</div>
```

If you need to, you can also change the children container element type.

```tsx
render(
  <Decorator decoration={Card} container="section">
    <p>Content</p>
  </Decorator>
)
```

Which will render the following.

```html
<div class="card">
  <section data-decorator="not-empty">
    <p>Content</p>
  </section>
</div>
```
