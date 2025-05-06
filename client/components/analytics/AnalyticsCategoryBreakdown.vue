<template>
  <div ref="root">
    {{ chartTopLevelCategories }}
  </div>
  <div
    ref="tooltip"
    class="absolute z-10 bg-gray-800 text-white text-sm px-3 py-1 rounded pointer-events-none hidden"
  ></div>
</template>

<script setup lang="ts">
import type { CategoryTransactions, Transaction } from "@saffron/types";
import * as d3 from "d3";

const props = defineProps<{
  categoryTransactions: CategoryTransactions[];
  transactions: Record<string, Transaction>;
}>();

// The following block of code allows referencing the container width via `rootWidth.value`
const root = ref<HTMLElement | null>(null);
const rootWidth = ref(0);
let observer: ResizeObserver | null = null;

onMounted(() => {
  if (root.value) {
    // Set initial width
    rootWidth.value = root.value.offsetWidth;

    // Watch for changes
    observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === root.value) {
          rootWidth.value = entry.contentRect.width;
        }
      }
    });

    observer.observe(root.value);
  }
});

onUnmounted(() => {
  if (observer && root.value) {
    observer.unobserve(root.value);
    observer.disconnect();
  }
});
// End block of code concerning previous comment.

const tooltip = ref<HTMLElement | null>(null);

// See https://observablehq.com/@d3/donut-chart/2
function createDonutChart(
  data: { name: string; value: number }[],
  width: number,
) {
  const height = Math.min(rootWidth.value, 500);
  const radius = Math.min(rootWidth.value, height) / 2;

  const arc = d3
    .arc()
    .innerRadius(radius * 0.67)
    .outerRadius(radius - 1);

  const pie = d3
    .pie()
    .padAngle(4 / radius)
    .sort(null)
    .value((d) => d.value);

  const color = d3
    .scaleOrdinal()
    .domain(data.map((d) => d.name))
    .range(
      d3
        .quantize((t) => d3.interpolateSpectral(t * 0.8 + 0.1), data.length)
        .reverse(),
    );

  const svg = d3
    .create("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [-width / 2, -height / 2, width, height])
    .attr("style", "max-width: 100%; height: auto;");

  svg
    .append("g")
    .selectAll()
    .data(pie(data))
    .join("path")
    .attr("fill", (d) => color(d.data.name))
    .attr("d", arc)
    .on("mouseover", (event, d) => {
      if (tooltip.value) {
        tooltip.value.classList.remove("hidden");
        tooltip.value.innerText = `${d.data.name}: ${d.data.value.toLocaleString()}`;
      }
    })
    .on("mousemove", (event) => {
      if (tooltip.value) {
        tooltip.value.style.left = `${event.pageX + 10}px`;
        tooltip.value.style.top = `${event.pageY + 10}px`;
      }
    })
    .on("mouseout", () => {
      if (tooltip.value) {
        tooltip.value.classList.add("hidden");
      }
    });

  svg
    .append("g")
    .attr("font-family", "sans-serif")
    .attr("font-size", 12)
    .attr("text-anchor", "middle")
    .selectAll()
    .data(pie(data))
    .join("text")
    .attr("transform", (d) => `translate(${arc.centroid(d)})`)
    .call((text) =>
      text
        .filter((d) => d.endAngle - d.startAngle > 0.25)
        .append("tspan")
        .attr("y", "-0.4em")
        .attr("font-weight", "bold")
        .text((d) => d.data.name),
    )
    .call((text) =>
      text
        .filter((d) => d.endAngle - d.startAngle > 0.25)
        .append("tspan")
        .attr("x", 0)
        .attr("y", "0.7em")
        .attr("fill-opacity", 0.7)
        .text((d) => d.data.value.toLocaleString("en-US")),
    );

  return svg.node();
}

const dataTopLevelCategories = computed(() => {
  const data: { name: string; value: number }[] = props.categoryTransactions
    .map((catx) => ({
      name: catx.category.name,
      value: Number(catx.totalAmount),
    }))
    .filter((d) => d.value > 0);

  return data;
});

const chartTopLevelCategories = computed(() =>
  createDonutChart(dataTopLevelCategories.value, rootWidth.value),
);
watch(
  chartTopLevelCategories,
  () => {
    if (!root.value) return;

    // Clear existing chart
    root.value.innerHTML = "";

    // Append new chart
    if (chartTopLevelCategories.value) {
      root.value.appendChild(chartTopLevelCategories.value);
    }
  },
  { immediate: true },
);
</script>
