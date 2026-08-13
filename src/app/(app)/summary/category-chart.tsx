"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";

export type CategoryCount = { name: string; count: number; color: string };

export function CategoryChart({ data }: { data: CategoryCount[] }) {
  const height = Math.max(120, data.length * 36 + 24);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 24, left: 4, bottom: 4 }}
      >
        <XAxis type="number" hide allowDecimals={false} />
        <YAxis
          type="category"
          dataKey="name"
          tickLine={false}
          axisLine={false}
          width={100}
          tick={{ fill: "var(--foreground)", fontSize: 12 }}
        />
        <Tooltip
          cursor={{ fill: "var(--muted)" }}
          contentStyle={{
            background: "var(--popover)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)",
            color: "var(--popover-foreground)",
            fontSize: 12,
          }}
          labelStyle={{ color: "var(--foreground)", fontWeight: 500 }}
        />
        <Bar dataKey="count" name="Tasks" radius={[0, 4, 4, 0]} maxBarSize={20}>
          {data.map((entry) => (
            <Cell key={entry.name} fill={entry.color} />
          ))}
          <LabelList
            dataKey="count"
            position="right"
            style={{ fill: "var(--muted-foreground)", fontSize: 11 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
