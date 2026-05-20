import { useEffect, useState } from "react";
import { Easing } from "react-native";

export function useCountUp(target: number, duration = 500) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let mounted = true;
    const start = Date.now();

    const loop = () => {
      if (!mounted) return;

      const t = (Date.now() - start) / duration;
      if (t >= 1) {
        setValue(target);
        return;
      }

      const eased = Easing.out(Easing.cubic)(t);
      setValue(Math.round(target * eased));

      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);

    return () => {
      mounted = false;
    };
  }, [target]);

  return value;
}
