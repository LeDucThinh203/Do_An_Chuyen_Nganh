import React from "react";

export function SkeletonBlock({ className = "" }) {
  return <div className={`skeleton-shimmer rounded ${className}`}></div>;
}

export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <SkeletonBlock className="aspect-square w-full" />
      <div className="p-3 space-y-2">
        <SkeletonBlock className="h-4 w-5/6" />
        <SkeletonBlock className="h-4 w-2/3" />
        <SkeletonBlock className="h-8 w-full mt-2" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }) {
  return (
    <div className="space-y-6">
      <SkeletonBlock className="h-10 w-2/5" />
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: count }).map((_, idx) => (
          <ProductCardSkeleton key={idx} />
        ))}
      </div>
    </div>
  );
}

export function ProductFormSkeleton({ containerClassName = "max-w-5xl" }) {
  return (
    <div className={`w-full ${containerClassName} mx-auto bg-white p-8 rounded-lg shadow-md`}>
      <SkeletonBlock className="h-9 w-64 mx-auto mb-8" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <SkeletonBlock className="h-12 w-full" />
          <SkeletonBlock className="h-12 w-full" />
          <SkeletonBlock className="h-12 w-full" />
          <SkeletonBlock className="h-40 w-full" />
          <SkeletonBlock className="h-11 w-full" />
        </div>
        <div className="space-y-3">
          <SkeletonBlock className="h-5 w-20" />
          <SkeletonBlock className="h-80 w-full" />
        </div>
      </div>
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div className="w-full px-4 py-8 space-y-8">
      <SkeletonBlock className="h-6 w-24" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <SkeletonBlock className="h-96 w-full rounded-2xl" />
        <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
          <SkeletonBlock className="h-10 w-3/4" />
          <SkeletonBlock className="h-8 w-1/2" />
          <div className="flex gap-2">
            <SkeletonBlock className="h-10 w-14" />
            <SkeletonBlock className="h-10 w-14" />
            <SkeletonBlock className="h-10 w-14" />
          </div>
          <SkeletonBlock className="h-12 w-full" />
          <SkeletonBlock className="h-24 w-full" />
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow-lg p-6 space-y-3">
        <SkeletonBlock className="h-8 w-56" />
        <SkeletonBlock className="h-4 w-full" />
        <SkeletonBlock className="h-4 w-11/12" />
        <SkeletonBlock className="h-4 w-3/4" />
      </div>
    </div>
  );
}

export function AdminPanelSkeleton({ cardCount = 6 }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <SkeletonBlock className="h-8 w-56" />
        <SkeletonBlock className="h-6 w-32" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: cardCount }).map((_, idx) => (
          <div key={idx} className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
            <SkeletonBlock className="h-5 w-2/3" />
            <SkeletonBlock className="h-4 w-5/6" />
            <SkeletonBlock className="h-4 w-2/3" />
            <SkeletonBlock className="h-10 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function StatsCardsSkeleton({ count = 4 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
          <SkeletonBlock className="h-4 w-2/3" />
          <SkeletonBlock className="h-8 w-1/3" />
          <SkeletonBlock className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

export function TableRowsSkeleton({ rows = 6, cols = 5 }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <div className="space-y-3">
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          {Array.from({ length: cols }).map((_, idx) => (
            <SkeletonBlock key={`head-${idx}`} className="h-4 w-4/5" />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <div
            key={`row-${rowIdx}`}
            className="grid gap-3"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: cols }).map((__, colIdx) => (
              <SkeletonBlock key={`cell-${rowIdx}-${colIdx}`} className="h-4 w-full" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function RevenueDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <SkeletonBlock className="h-9 w-80 mb-2" />
        <SkeletonBlock className="h-4 w-96" />
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <SkeletonBlock className="h-7 w-32" />
          <SkeletonBlock className="h-10 w-40" />
        </div>
        <SkeletonBlock className="h-4 w-72" />
      </div>

      <StatsCardsSkeleton count={4} />

      <div className="flex gap-2">
        <SkeletonBlock className="h-10 w-36" />
        <SkeletonBlock className="h-10 w-36" />
        <SkeletonBlock className="h-10 w-36" />
      </div>

      <TableRowsSkeleton rows={7} cols={6} />
    </div>
  );
}

function RevenueOrdersTabSkeleton({ accentClass = "w-24" }) {
  return (
    <div className="space-y-5">
      <div className="bg-white rounded-lg shadow-md p-6 space-y-3">
        <SkeletonBlock className={`h-6 ${accentClass}`} />
        <SkeletonBlock className="h-4 w-72" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, idx) => (
          <div key={idx} className="bg-white border border-gray-100 rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-start">
              <SkeletonBlock className="h-4 w-14" />
              <SkeletonBlock className="h-5 w-16 rounded-full" />
            </div>
            <SkeletonBlock className="h-3 w-5/6" />
            <SkeletonBlock className="h-3 w-3/5" />
            <SkeletonBlock className="h-16 w-full" />
            <div className="flex justify-between items-center pt-2">
              <SkeletonBlock className="h-5 w-24" />
              <SkeletonBlock className="h-10 w-20" />
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center gap-3">
        <SkeletonBlock className="h-10 w-40" />
        <SkeletonBlock className="h-10 w-28" />
      </div>
    </div>
  );
}

export function RevenueTabContentSkeleton({ tab = "revenue" }) {
  if (tab === "pending") return <RevenueOrdersTabSkeleton accentClass="w-40" />;
  if (tab === "confirmed") return <RevenueOrdersTabSkeleton accentClass="w-36" />;
  if (tab === "shipping") return <RevenueOrdersTabSkeleton accentClass="w-44" />;
  if (tab === "paid") return <RevenueOrdersTabSkeleton accentClass="w-48" />;
  return <RevenueDashboardSkeleton />;
}

export function OrderManagerSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <SkeletonBlock className="h-8 w-64" />
        <SkeletonBlock className="h-6 w-40" />
      </div>

      <StatsCardsSkeleton count={7} />

      <div className="bg-white rounded-lg border border-gray-100 p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <SkeletonBlock className="h-10 w-full" />
          <SkeletonBlock className="h-10 w-full md:w-52" />
          <SkeletonBlock className="h-10 w-full md:w-52" />
        </div>
      </div>

      <TableRowsSkeleton rows={8} cols={7} />
    </div>
  );
}

export function RouteFallbackSkeleton() {
  return (
    <div className="space-y-4 pt-4">
      <SkeletonBlock className="h-10 w-1/3" />
      <SkeletonBlock className="h-64 w-full rounded-2xl" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SkeletonBlock className="h-28 w-full" />
        <SkeletonBlock className="h-28 w-full" />
        <SkeletonBlock className="h-28 w-full" />
      </div>
    </div>
  );
}