"use client";

import { useEffect, useRef, ReactNode } from "react";
import { gsap } from "gsap";

interface Props {
  children: ReactNode;
  className?: string;
  /** Delay before animation starts (accounts for intro splash) */
  delay?: number;
  as?: "h1" | "h2" | "h3" | "p" | "span";
}

/**
 * Splits text into words, then characters, and reveals them
 * with a blur-to-sharp staggered animation.
 */
export default function HeroTextReveal({
  children,
  className = "",
  delay = 0,
  as: Tag = "h1",
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Find all character spans
    const chars = container.querySelectorAll<HTMLElement>("[data-char]");
    if (chars.length === 0) return;

    const ctx = gsap.context(() => {
      gsap.set(chars, {
        opacity: 0,
        filter: "blur(12px)",
        y: 25,
        rotateX: -40,
      });

      gsap.to(chars, {
        opacity: 1,
        filter: "blur(0px)",
        y: 0,
        rotateX: 0,
        duration: 0.8,
        ease: "power3.out",
        stagger: {
          each: 0.025,
          from: "start",
        },
        delay,
      });
    });

    return () => ctx.revert();
  }, [delay]);

  // Split children text into words → chars
  function renderChildren(node: ReactNode): ReactNode {
    if (typeof node === "string") {
      return splitText(node);
    }
    if (Array.isArray(node)) {
      return node.map((child, i) => (
        <span key={i}>{renderChildren(child)}</span>
      ));
    }
    if (
      node &&
      typeof node === "object" &&
      "props" in node &&
      node.props?.children
    ) {
      // Preserve the original element (like <span className="italic">)
      const { children: innerChildren, ...restProps } = node.props;
      return {
        ...node,
        props: {
          ...restProps,
          children: renderChildren(innerChildren),
        },
      };
    }
    return node;
  }

  function splitText(text: string) {
    const words = text.split(/(\s+)/);
    return words.map((word, wi) => {
      if (/^\s+$/.test(word)) {
        return <span key={`s${wi}`}>{word}</span>;
      }
      return (
        <span
          key={`w${wi}`}
          style={{ display: "inline-block", overflow: "hidden", perspective: 400 }}
        >
          {word.split("").map((char, ci) => (
            <span
              key={`c${ci}`}
              data-char
              style={{
                display: "inline-block",
                willChange: "transform, opacity, filter",
                transformOrigin: "bottom center",
              }}
            >
              {char}
            </span>
          ))}
        </span>
      );
    });
  }

  return (
    <div ref={containerRef}>
      <Tag className={className}>{renderChildren(children)}</Tag>
    </div>
  );
}
