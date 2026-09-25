'use client';

import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import type { ApexOptions } from 'apexcharts';

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface Props {
  topVets: { vetId: string; vetName: string; count: number }[];
}

export default function TopVetsChart({ topVets }: Props) {
  const { categories, series } = useMemo(() => {
    if (topVets.length === 0) {
      return { categories: ['Sin datos'], series: [{ name: 'Citas', data: [0] }] };
    }
    return {
      categories: topVets.map((v) => v.vetName),
      series: [{ name: 'Citas atendidas', data: topVets.map((v) => v.count) }],
    };
  }, [topVets]);

  const options: ApexOptions = {
    chart: { fontFamily: 'Outfit, sans-serif', type: 'bar', height: 280, toolbar: { show: false } },
    colors: ['#465fff'],
    plotOptions: {
      bar: { borderRadius: 6, columnWidth: '50%', horizontal: false },
    },
    dataLabels: { enabled: true, style: { fontSize: '12px' } },
    xaxis: {
      categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { fontSize: '12px' } },
    },
    yaxis: { labels: { style: { fontSize: '12px' } } },
    legend: { show: false },
    grid: { borderColor: '#e5e7eb', strokeDashArray: 4 },
    tooltip: { y: { formatter: (val: number) => `${val} citas` } },
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">
        Top veterinarios
      </h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Citas en el rango seleccionado</p>
      <div className="mt-4">
        <ReactApexChart options={options} series={series} type="bar" height={280} />
      </div>
    </div>
  );
}
