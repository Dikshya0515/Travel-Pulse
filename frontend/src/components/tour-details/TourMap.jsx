// import { useRef, useEffect } from "react";
// import mapboxgl from "mapbox-gl";

// import "./TourMap.css";

// mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

// export default function TourMap({ locations }) {
//   const mapContainer = useRef(null);
//   const map = useRef(null);

//   useEffect(() => {
//     if (map.current) return; // initialize map only once
//     map.current = new mapboxgl.Map({
//       container: mapContainer.current,
//       style: "mapbox://styles/s-chanda/clikoaxwo00fq01pf9h3lgc0g",
//       scrollZoom: false,
//     });

//     const bounds = new mapboxgl.LngLatBounds();
//     locations.forEach((loc) => {
//       // create marker
//       const el = document.createElement("div");
//       el.className = "marker";

//       // add marker
//       new mapboxgl.Marker({ element: el, anchor: "bottom" })
//         .setLngLat(loc.coordinates)
//         .addTo(map.current);

//       // add popup
//       new mapboxgl.Popup({ offset: 30 })
//         .setLngLat(loc.coordinates)
//         .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
//         .addTo(map.current);

//       // extend map bounds to include current location
//       bounds.extend(loc.coordinates);
//     });

//     map.current.fitBounds(bounds, {
//       padding: { top: 200, bottom: 150, left: 100, right: 100 },
//     });
//   });

//   return (
//     <section className="section-map">
//       <div ref={mapContainer} id="map"></div>
//     </section>
//   );
// }



// import { useRef, useEffect } from "react";
// import L from "leaflet";
// import "leaflet/dist/leaflet.css";

// import "./TourMap.css";

// // Fix for default markers in Leaflet with Vite/React
// delete L.Icon.Default.prototype._getIconUrl;
// L.Icon.Default.mergeOptions({
//   iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
//   iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
//   shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
// });

// // Custom marker icon (optional - for better styling)
// const customIcon = L.divIcon({
//   html: '<div class="custom-marker"></div>',
//   className: 'custom-marker-wrapper',
//   iconSize: [20, 20],
//   iconAnchor: [10, 20],
//   popupAnchor: [0, -20]
// });

// export default function TourMap({ locations }) {
//   const mapContainer = useRef(null);
//   const map = useRef(null);

//   useEffect(() => {
//     // Cleanup previous map instance
//     if (map.current) {
//       map.current.remove();
//       map.current = null;
//     }
    
//     if (!locations || locations.length === 0) return;

//     // Initialize the map
//     map.current = L.map(mapContainer.current, {
//       scrollWheelZoom: false, // Disable scroll zoom (like your original)
//       zoomControl: true,
//       attributionControl: true
//     });

//     // Add OpenStreetMap tiles (completely free)
//     L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//       attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
//       maxZoom: 18,
//       subdomains: ['a', 'b', 'c']
//     }).addTo(map.current);

//     // Create bounds for fitting all locations
//     const group = new L.featureGroup();

//     locations.forEach((loc, index) => {
//       // Leaflet uses [lat, lng] while your data might be [lng, lat]
//       const lat = loc.coordinates[1];
//       const lng = loc.coordinates[0];

//       // Create marker with custom styling
//       const marker = L.marker([lat, lng], {
//         icon: customIcon // Use custom icon or remove this line for default
//       }).addTo(map.current);

//       // Create popup content
//       const popupContent = `
//         <div class="map-popup">
//           <h4>Day ${loc.day}</h4>
//           <p>${loc.description}</p>
//         </div>
//       `;

//       // Add popup to marker
//       marker.bindPopup(popupContent, {
//         offset: [0, -10],
//         closeButton: true,
//         autoClose: false,
//         closeOnClick: false
//       });

//       // Add to group for bounds calculation
//       group.addLayer(marker);
//     });

//     // Fit map to show all markers with padding
//     if (locations.length > 0) {
//       map.current.fitBounds(group.getBounds(), {
//         padding: [50, 50], // Add some padding around the bounds
//         maxZoom: 10 // Don't zoom in too much for single locations
//       });
//     }

//     // Cleanup function
//     return () => {
//       if (map.current) {
//         map.current.remove();
//         map.current = null;
//       }
//     };
//   }, [locations]);

//   return (
//     <section className="section-map">
//       <div 
//         ref={mapContainer} 
//         id="map" 
//         style={{ 
//           height: '65rem', 
//           width: '100%',
//           borderRadius: '3px'
//         }}
//       />
//     </section>
//   );
// }




import { useRef, useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import "./TourMap.css";

// Fix for default markers in Leaflet with Vite/React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Beautiful custom marker icons with gradient and animation
const createCustomIcon = (day, isStartEnd = false) => {
  const color = isStartEnd ? '#e74c3c' : '#3498db';
  const gradient = isStartEnd ? 'linear-gradient(135deg, #e74c3c, #c0392b)' : 'linear-gradient(135deg, #3498db, #2980b9)';
  
  return L.divIcon({
    html: `
      <div class="custom-marker-pin" style="background: ${gradient};">
        <div class="marker-number">${day}</div>
        <div class="marker-pulse"></div>
      </div>
    `,
    className: 'custom-marker-wrapper',
    iconSize: [40, 50],
    iconAnchor: [20, 50],
    popupAnchor: [0, -50]
  });
};

// Polyline style for connecting locations
const polylineStyle = {
  color: '#3498db',
  weight: 3,
  opacity: 0.8,
  dashArray: '10, 5',
  lineCap: 'round',
  lineJoin: 'round'
};

export default function TourMap({ locations }) {
  const mapContainer = useRef(null);
  const map = useRef(null);

  useEffect(() => {
    // Cleanup previous map instance
    if (map.current) {
      map.current.remove();
      map.current = null;
    }
    
    if (!locations || locations.length === 0) return;

    // Initialize the map with better styling
    map.current = L.map(mapContainer.current, {
      scrollWheelZoom: true,
      zoomControl: true,
      attributionControl: true,
      fadeAnimation: true,
      zoomAnimation: true,
      markerZoomAnimation: true
    });

    // Add beautiful map tiles (CartoDB Positron for clean look)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 19,
      subdomains: 'abcd'
    }).addTo(map.current);

    // Create bounds for fitting all locations
    const group = new L.featureGroup();
    const coordinates = [];

    // Add markers with enhanced interactivity
    locations.forEach((loc, index) => {
      const lat = loc.coordinates[1];
      const lng = loc.coordinates[0];
      const isStartEnd = index === 0 || index === locations.length - 1;
      
      coordinates.push([lat, lng]);

      // Create enhanced marker
      const marker = L.marker([lat, lng], {
        icon: createCustomIcon(loc.day || index + 1, isStartEnd),
        riseOnHover: true,
        riseOffset: 250
      }).addTo(map.current);

      // Enhanced popup content with better styling
      const popupContent = `
        <div class="map-popup-enhanced">
          <div class="popup-header">
            <span class="popup-day">Day ${loc.day || index + 1}</span>
            ${isStartEnd ? '<span class="popup-badge">' + (index === 0 ? 'Start' : 'End') + '</span>' : ''}
          </div>
          <h4 class="popup-title">${loc.description}</h4>
          ${loc.coordinates ? `<p class="popup-coords">📍 ${lat.toFixed(4)}, ${lng.toFixed(4)}</p>` : ''}
        </div>
      `;

      // Add enhanced popup with custom styling
      marker.bindPopup(popupContent, {
        offset: [0, -15],
        closeButton: true,
        autoClose: false,
        closeOnClick: false,
        className: 'custom-popup'
      });

      // Add hover effects
      marker.on('mouseover', function() {
        this.openPopup();
        // Add bounce animation
        this.getElement().style.animation = 'markerBounce 0.6s ease-in-out';
      });

      marker.on('mouseout', function() {
        // Remove animation after completion
        setTimeout(() => {
          if (this.getElement()) {
            this.getElement().style.animation = '';
          }
        }, 600);
      });

      // Add to group for bounds calculation
      group.addLayer(marker);
    });

    // Add connecting polyline if more than one location
    if (coordinates.length > 1) {
      const polyline = L.polyline(coordinates, polylineStyle).addTo(map.current);
      
      // Add arrow decorations to show direction
      const decorator = L.polylineDecorator && L.polylineDecorator(polyline, {
        patterns: [
          {
            offset: '10%',
            repeat: '20%',
            symbol: L.Symbol.arrowHead({
              pixelSize: 10,
              polygon: false,
              pathOptions: {
                stroke: true,
                weight: 2,
                color: '#2980b9'
              }
            })
          }
        ]
      });
      
      // Add decorator if the plugin is available
      if (decorator) {
        decorator.addTo(map.current);
      }
    }

    // Fit map to show all markers with padding
    if (locations.length > 0) {
      map.current.fitBounds(group.getBounds(), {
        padding: [50, 50],
        maxZoom: 12
      });
    }

    // Add scale control
    L.control.scale({
      position: 'bottomright',
      imperial: false
    }).addTo(map.current);

    // Add custom zoom animation
    map.current.on('zoomstart', function() {
      map.current.getContainer().style.cursor = 'wait';
    });

    map.current.on('zoomend', function() {
      map.current.getContainer().style.cursor = '';
    });

    // Cleanup function
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [locations]);

  return (
    <section className="section-map">
      <div 
        ref={mapContainer} 
        id="map" 
        className="interactive-map"
        style={{ 
          height: '65rem', 
          width: '100%',
          borderRadius: '8px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
          overflow: 'hidden',
          border: '2px solid #e8f4f8'
        }}
      />
    </section>
  );
}