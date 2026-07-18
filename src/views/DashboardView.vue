<template>
  <main class="min-h-screen bg-slate-50 p-6 text-slate-900">
    <section class="mx-auto max-w-6xl">
      <p class="font-semibold text-primary">FEPPM</p>
      <h1 class="mt-2 text-3xl font-bold">Maintenance dashboard</h1>
      <p class="mt-2 text-slate-600">
        Your facility and equipment overview will appear here.
      </p>

      <div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <article v-for="item in summary" :key="item.label" class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p class="text-sm text-slate-500">{{ item.label }}</p>
          <p class="mt-2 text-2xl font-bold">{{ item.value }}</p>
        </article>
      </div>
    </section>
  </main>
</template>

<script setup>
const summary = [
  { label: "Today's tasks", value: 0 },
  { label: 'Upcoming', value: 0 },
  { label: 'Overdue', value: 0 },
  { label: 'Compliance', value: '0%' },
];
</script>
