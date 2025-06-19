"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { mapService } from "../api/service";
import Navbar from '../components/common/Navbar';

const HeatMap = dynamic(() => import("../components/maps/SpeciesHeatMap"), {
  ssr: false,
});

export default function HeatmapPage() {
  const [data, setData] = useState([]);

  useEffect(() => {
    async function fetchLocations() {
      try {
        const res = await mapService.getSpeciesLocations();
        setData(res);
      } catch (err) {
        console.error("Failed to fetch species locations", err);
      }
    }

    fetchLocations();
  }, []);

  return (
    <>
    <Navbar />
    <div className="section flex flex-col lg:flex-row gap-6">
      <div className="flex-1">
        <h2 className="text-3xl font-bold mb-4 flex items-center gap-2 !text-black">
          🌍 Species Observation Heatmap
        </h2>
        <div className="bg-gray-900 rounded-lg overflow-hidden shadow-lg border border-gray-700">
          <HeatMap data={data} />
        </div>
      </div>
    </div>
    </>
  );
}
