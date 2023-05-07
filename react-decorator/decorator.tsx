import {
  type ComponentProps,
  type ComponentType,
  type CSSProperties,
  type ReactNode,
  useLayoutEffect,
  useState,
} from 'react';

type DecoratorProps<
  TDecoration extends ComponentType<any>,
  TContainer extends keyof JSX.IntrinsicElements = 'div',
> = (Record<string, never> extends ComponentProps<TDecoration>
  ? { readonly decorationProps?: Omit<ComponentProps<TDecoration>, 'children'> }
  : { readonly decorationProps: Omit<ComponentProps<TDecoration>, 'children'> }) & {
  readonly children?: ReactNode;
  /**
   * HTML element which will wrap the `Decorator` component's `children`.
   * Defaults to `div`. Properties can be passed to this element by setting
   * the `containerProps` property.
   */
  readonly container?: TContainer;
  /**
   * Style applied to the `container` when it has no content. Defaults to
   * `{ display: "none" }`.
   *
   * Common alternatives:
   *
   * - `{ position: "absolute", clip: "rect(0, 0, 0, 0)", clipPath: "inset(100%)"" }`
   * - `{ position: "absolute", "left: -9999px" }`
   */
  readonly containerHiddenStyle?: CSSProperties;
  /**
   * Properties passed to the `container` element.
   */
  readonly containerProps?: Omit<ComponentProps<TContainer>, 'children'>;
  /**
   * Decoration (wrapper) component. Properties can be passed to this component
   * by setting the `decorationProps` property.
   */
  readonly decoration: TDecoration;
  /**
   * Properties passed to the `decoration` component.
   */
  readonly decorationProps?: unknown;
};

const containerHiddenStyleDefault: CSSProperties = {
  display: 'none',
};

/**
 * Wrap `children` using the `decoration` component, as long as the children
 * render at least one DOM node.
 */
const Decorator = <TDecoration extends ComponentType<any>, TContainer extends keyof JSX.IntrinsicElements = 'div'>({
  decoration,
  decorationProps,
  container = 'div' as TContainer,
  containerHiddenStyle = containerHiddenStyleDefault,
  containerProps,
  children,
}: DecoratorProps<TDecoration, TContainer>): JSX.Element => {
  const Decoration = decoration as unknown as ComponentType<any>;
  const Container = container as unknown as ComponentType<any>;
  const [element, setElement] = useState<Node | null>(null);
  const [isEmpty, setIsEmpty] = useState(false);

  useLayoutEffect(() => {
    if (!element) {
      return;
    }

    let isEmptyPrevious: boolean | undefined;

    const update = (): void => {
      const isEmptyNow = element.childNodes.length === 0;

      if (isEmptyPrevious !== isEmptyNow) {
        isEmptyPrevious = isEmptyNow;
        setIsEmpty(isEmptyNow);
      }
    };
    const observer = new MutationObserver(update);

    observer.observe(element, { childList: true });
    update();

    return () => {
      observer.disconnect();
    };
  }, [element]);

  return isEmpty ? (
    <Container
      ref={setElement}
      data-decorator="empty"
      {...containerProps}
      style={{ ...containerProps?.style, ...containerHiddenStyle }}
    >
      {children}
    </Container>
  ) : (
    <Decoration {...decorationProps}>
      <Container ref={setElement} data-decorator="not-empty" {...containerProps}>
        {children}
      </Container>
    </Decoration>
  );
};

export { Decorator, type DecoratorProps };
