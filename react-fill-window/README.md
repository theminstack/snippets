# React fill window

A div that fills the browser window without scroll bars, even on mobile devices with browser navigation controls that are dynamically visible.

Why not use `100vh`? Because on mobile browsers, that is [larger than the visible page content](https://stackoverflow.com/questions/37112218/css3-100vh-not-constant-in-mobile-browser) when the navigation controls are visible.

The visible content size with browser navigation controls shown, is given by `window.innerHeight`. This component renders a div that always has a `min-height` equal to the inner height of the window, which is useful when you want to pin a footer to the bottom of the window, or if you want to render an image or canvas which exactly fills the window without scroll bars.

```tsx
render(
  <FillWindow>
    Your content here.
  </FillWindow>
);
```
