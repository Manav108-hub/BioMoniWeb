"use client";

import React, { useRef, useEffect, useState } from "react";
import * as d3 from "d3";
import { feature } from "topojson-client";
import worldData from "../data/countries-110m.json"; // ✅ Ensure this is placed correctly

const SpeciesHeatMap = ({ data = [] }) => {
  const svgRef = useRef();
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [speciesByRegion, setSpeciesByRegion] = useState({});

  useEffect(() => {
  const width = 960;
  const height = 500;

  const svg = d3
    .select(svgRef.current)
    .attr("viewBox", `0 0 ${width} ${height}`)
    .style("background", "white")
    .style("border-radius", "0.75rem")
    .style("overflow", "hidden");

  svg.selectAll("*").remove(); // clear old render

  const projection = d3.geoMercator()
    .scale(150)
    .translate([width / 2, height / 1.5]);

  const path = d3.geoPath().projection(projection);

  const countries = feature(worldData, worldData.objects.countries);

  const g = svg.append("g"); // all map elements go into this

  // ⬇️ Apply zoom behavior
  svg.call(
    d3.zoom()
      .scaleExtent([1, 8]) // zoom range
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      })
  );

  // Draw countries
  g.selectAll("path")
    .data(countries.features)
    .join("path")
    .attr("d", path)
    .attr("fill", "#f3f4f6")
    .attr("stroke", "#d1d5db")
    .attr("stroke-width", 0.5)
    .on("click", (event, d) => {
      const name = d.properties.name || "Unknown";
      setSelectedRegion(name);
    });

  // Group species by region
  const grouped = d3.group(data, (d) => d.region || "Unknown");
  setSpeciesByRegion(Object.fromEntries(grouped));

  // Draw species points
  g.selectAll("circle")
    .data(data.filter(d => d.lat && d.lng))
    .join("circle")
    .attr("cx", (d) => projection([d.lng, d.lat])[0])
    .attr("cy", (d) => projection([d.lng, d.lat])[1])
    .attr("r", 4.5)
    .attr("fill", "#ef4444")
    .attr("opacity", 0.75)
    .append("title")
    .text((d) => d.species_name);
}, [data]);


  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Map */}
      <div className="col-span-2 card">
        <svg ref={svgRef} className="w-full h-[500px]" />
      </div>

      {/* Sidebar */}
      <div className="card bg-gray-900 text-white max-h-[500px] overflow-y-auto scrollbar">
        <h3 className="text-xl font-semibold mb-3">
          {selectedRegion ? `Species in ${selectedRegion}` : "Species by Region"}
        </h3>

        {selectedRegion && speciesByRegion[selectedRegion]?.length ? (
          <>
            <p className="text-sm text-gray-400 mb-2">
              {speciesByRegion[selectedRegion].length} sightings
            </p>
            <ul className="list-disc list-inside space-y-1">
              {speciesByRegion[selectedRegion].map((s, idx) => (
                <li key={idx} className="text-green-400">{s.species_name}</li>
              ))}
            </ul>
          </>
        ) : (
          <div className="space-y-3 text-sm">
            {Object.entries(speciesByRegion).map(([region, list]) => (
              <div key={region} className="border-b border-gray-700 pb-1">
                <h4 className="text-gray-300">📍 {region}</h4>
                <p className="text-gray-500">{list.length} total observations</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SpeciesHeatMap;
