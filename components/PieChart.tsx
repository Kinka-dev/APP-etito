import Text from "@/components/Text";
import React, { useEffect, useState } from "react";
import { Easing, View } from "react-native";
import Svg, { G, Path } from "react-native-svg";

type Props = {
  carbs: number;
  protein: number;
  fat: number;
  size?: number;
};

function arcPath(start: number, end: number, r: number) {
  const x1 = r + r * Math.cos(start);
  const y1 = r + r * Math.sin(start);
  const x2 = r + r * Math.cos(end);
  const y2 = r + r * Math.sin(end);
  const largeArc = end - start > Math.PI ? 1 : 0;

  return `M${r},${r} L${x1},${y1} A${r},${r} 0 ${largeArc} 1 ${x2},${y2} Z`;
}

export default function PieChartMini({
  carbs,
  protein,
  fat,
  size = 130,
}: Props) {
  const total = carbs + protein + fat || 1;
  const r = size / 2;

  const carbsAngle = (carbs / total) * 2 * Math.PI;
  const proteinAngle = (protein / total) * 2 * Math.PI;
  const fatAngle = (fat / total) * 2 * Math.PI;

  const carbsPct = Math.round((carbs / total) * 100);
  const proteinPct = Math.round((protein / total) * 100);
  const fatPct = Math.round((fat / total) * 100);

  // progress archi (0 → 1)
  const [p1, setP1] = useState(0);
  const [p2, setP2] = useState(0);
  const [p3, setP3] = useState(0);

  // percentuali visualizzate
  const [carbsView, setCarbsView] = useState(0);
  const [proteinView, setProteinView] = useState(0);
  const [fatView, setFatView] = useState(0);

  // animazione archi “a raggio”
  useEffect(() => {
    let mounted = true;

    const animate = (
      setter: React.Dispatch<React.SetStateAction<number>>,
      duration: number,
      cb?: () => void,
    ) => {
      const start = Date.now();
      const loop = () => {
        if (!mounted) return;
        const t = (Date.now() - start) / duration;
        if (t >= 1) {
          setter(1);
          cb && cb();
          return;
        }
        const eased = Easing.out(Easing.cubic)(t);
        setter(eased);
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    };

    animate(setP1, 150, () => {
      animate(setP2, 150, () => {
        animate(setP3, 150);
      });
    });

    return () => {
      mounted = false;
    };
  }, []);

  // animazione count‑up percentuali
  useEffect(() => {
    let mounted = true;
    const duration = 600;
    const start = Date.now();

    const loop = () => {
      if (!mounted) return;
      const t = (Date.now() - start) / duration;
      if (t >= 1) {
        setCarbsView(carbsPct);
        setProteinView(proteinPct);
        setFatView(fatPct);
        return;
      }
      const eased = Easing.out(Easing.cubic)(t);
      setCarbsView(Math.round(carbsPct * eased));
      setProteinView(Math.round(proteinPct * eased));
      setFatView(Math.round(fatPct * eased));
      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);

    return () => {
      mounted = false;
    };
  }, [carbsPct, proteinPct, fatPct]);

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 20,
        backgroundColor: "white",
      }}
    >
      {/* Pie chart piccolo */}
      <Svg width={size} height={size}>
        <G>
          {/* Carboidrati */}
          <Path d={arcPath(0, carbsAngle * p1, r)} fill="#00a56e" />

          {/* Proteine */}
          <Path
            d={arcPath(carbsAngle, carbsAngle + proteinAngle * p2, r)}
            fill="#b292ad"
          />

          {/* Grassi */}
          <Path
            d={arcPath(
              carbsAngle + proteinAngle,
              carbsAngle + proteinAngle + fatAngle * p3,
              r,
            )}
            fill="#ffc800"
          />
        </G>
      </Svg>

      {/* Macro + percentuali animate */}
      <View style={{ gap: 6 }}>
        <Text style={{ fontSize: 11 }}>
          <Text bold style={{ color: "#00a56e" }}>
            {carbsView}%
          </Text>{" "}
          Carboidrati
        </Text>

        <Text style={{ fontSize: 11 }}>
          <Text bold style={{ color: "#b292ad" }}>
            {proteinView}%
          </Text>{" "}
          Proteine
        </Text>

        <Text style={{ fontSize: 11 }}>
          <Text bold style={{ color: "#ffc800" }}>
            {fatView}%
          </Text>{" "}
          Grassi
        </Text>
      </View>
    </View>
  );
}
