import "./App.css";
import { MapContainer, TileLayer } from "react-leaflet";
import { useEffect, useState } from "react";
import { GeoJSON } from "react-leaflet";
import Papa from "papaparse";
import "leaflet/dist/leaflet.css";
const zoneTypes = {
  "Parking Zone": "#ff0000",
  "Loading Zone": "#0000ff",
  "Taxi Zone": "#00ff00",
  "Handicapped Zone": "#8673A1",
  "Access Calgary Loading Zone": "#3D642D",
  "Motorcycle Zone": "#EFA94A",
  "Registered Loading Zone": "#7FB5B5",
  "VIP Zone": "#8B8C7A",
  "Valet Parking Zone": "#6C3B2A",
};
const Legend = () => {
  return (
    <div className="legend">
      <h4>Zone Types</h4>
      {Object.entries(zoneTypes).map(([type, color]) => (
        <div key={type} className="legend-item">
          <span
            className="legend-color"
            style={{ backgroundColor: color }}
          ></span>
          <span className="legend-text">{type}</span>
        </div>
      ))}
    </div>
  );
};
function App() {
  const [geoJsonData, setGeoJsonData] = useState(null);

  const colors = (zoneType) => {
    switch (zoneType) {
      case "Parking Zone":
        return "#ff0000";
      case "Loading Zone":
        return "#0000ff";
      case "Taxi Zone":
        return "#00ff00";
      case "Handicapped Zone":
        return "#8673A1";
      case "Access Calgary Loading Zone":
        return "#3D642D";
      case "Motorcycle Zone":
        return "#EFA94A";
      case "Registered Loading Zone":
        return "#7FB5B5";
      case "VIP Zone":
        return "#8B8C7A";
      case "Valet Parking Zone":
        return "#6C3B2A";
      default:
        return "#000000";
    }
  };

  useEffect(() => {
    const convertCsvToGeoJson = async () => {
      try {
        const response = await fetch("/parking.csv");
        const csvText = await response.text();

        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const geoJson = {
              type: "FeatureCollection",
              features: results.data
                .filter((row) => row.line)
                .map((row) => {
                  try {
                    // Parse MULTILINESTRING coordinates
                    const coordString = row.line
                      .replace("MULTILINESTRING ((", "")
                      .replace("))", "")
                      .trim();

                    const coordinates = coordString
                      .split(",")
                      .map((coord) => {
                        const [lng, lat] = coord
                          .trim()
                          .split(" ")
                          .map((num) => parseFloat(num));
                        return [lng, lat];
                      })
                      .filter((coord) => !isNaN(coord[0]) && !isNaN(coord[1]));

                    if (coordinates.length >= 2) {
                      return {
                        type: "Feature",
                        properties: {
                          parkingZone: row.PARKING_ZONE,
                          zoneType: row.ZONE_TYPE,
                          stallType: row.STALL_TYPE,
                          address: row.ADDRESS_DESC,
                          status: row.STATUS,
                          priceZone: row.PRICE_ZONE,
                          enforceableTime: row.ENFORCEABLE_TIME,
                          maxTime: row.MAX_TIME,
                        },
                        geometry: {
                          type: "LineString",
                          coordinates: coordinates,
                        },
                      };
                    }
                    return null;
                  } catch (err) {
                    console.error("Error processing row:", row, err);
                    return null;
                  }
                })
                .filter((feature) => feature !== null),
            };

            console.log(`Processed ${geoJson.features.length} features`);
            setGeoJsonData(geoJson);
          },
          error: (error) => {
            console.error("Error parsing CSV:", error);
          },
        });
      } catch (err) {
        console.error("Error fetching CSV:", err);
      }
    };

    convertCsvToGeoJson();
  }, []);

  return (
    <div className="map-wrapper">
      <MapContainer
        center={[51.0447, -114.0719]}
        zoom={13}
        scrollWheelZoom={true}
        style={{ height: "100vh", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {geoJsonData && geoJsonData.features.length > 0 && (
          <GeoJSON
            data={geoJsonData}
            style={() => ({
              // color: "#2874A6",
              weight: 3,
              opacity: 1,
            })}
            onEachFeature={(feature, layer) => {
              feature.properties.color = colors(feature.properties.zoneType);
              layer.setStyle({
                color: feature.properties.color,
              });
              layer.bindPopup(`
                <div class="popup-content">
                  <strong>Zone:</strong> ${feature.properties.parkingZone}<br>
                  <strong>Address:</strong> ${feature.properties.address}<br>
                  <strong>Type:</strong> ${feature.properties.zoneType}<br>
                  <strong>Status:</strong> ${feature.properties.status}<br>
                  <strong>Max Time:</strong> ${feature.properties.maxTime}<br>
                  <strong>Enforceable Time:</strong> ${feature.properties.enforceableTime}
                </div>
              `);
            }}
          />
        )}
        <Legend />
      </MapContainer>
    </div>
  );
}

export default App;
