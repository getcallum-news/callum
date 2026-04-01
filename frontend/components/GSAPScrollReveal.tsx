"use client";

import { useEffect, useRef, ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface Props {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right";
  distance?: number;
  stagger?: number;
}

export default function GSAPScrollReveal({
  children,
  className = "",
  delay = 0,
  direction = "up",
  distance = 60,
  stagger = 0,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const fromVars: gsap.TweenVars = {
      opacity: 0,
      filter: "blur(8px)",
      duration: 1,
      delay,
      ease: "power3.out",
      stagger: stagger || undefined,
      scrollTrigger: {
        trigger: el,
        start: "top 88%",
        once: true,
      },
    };

    switch (direction) {
      case "up":
        fromVars.y = distance;
        break;
      case "down":
        fromVars.y = -distance;
        break;
      case "left":
        fromVars.x = distance;
        break;
      case "right":
        fromVars.x = -distance;
        break;
    }

    const ctx = gsap.context(() => {
      gsap.from(el, fromVars);
    });

    return () => ctx.revert();
  }, [delay, direction, distance, stagger]);

  return (
    <div ref={ref} className={className} style={{ willChange: "transform, opacity, filter" }}>
      {children}
    </div>
  );
}
