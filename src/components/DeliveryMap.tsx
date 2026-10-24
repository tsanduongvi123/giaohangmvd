import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Shipment, RouteHub } from '../types';
import { autoBuildRouteHubs } from '../utils/geoHubs';
import { getStatusInfo } from '../utils/formatters';
import {
  calculateCompleteRoute,
  getQuickInitialRoute,
  calculateDistanceKm,
  RouteComputationResult,
} from '../utils/routeGeometry';
import { Navigation, Truck, Maximize2, Minimize2, ZoomIn, ZoomOut, RotateCcw, Plane } from 'lucide-react';

interface DeliveryMapProps {
  shipment: Shipment;
}

export const DeliveryMap: React.FC<DeliveryMapProps> = ({ shipment }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [, setSelectedHub] = useState<RouteHub | null>(null);

  const [mapStyle, setMapStyle] = useState<'google' | 'satellite' | 'esri'>('google');
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // References for live updating geometry and vehicle marker
  const vehicleMarkerRef = useRef<L.Marker | null>(null);
  const polylineLayersRef = useRef<L.Polyline[]>([]);
  const hubMarkersRef = useRef<L.Marker[]>([]);
  const currentVehiclePosRef = useRef<[number, number] | null>(null);

  const statusInfo = getStatusInfo(shipment.currentStatus);

  // Generate or read the smart route hubs (including Airport Air Cargo Hubs for inter-provincial flight)
  const routeHubs: RouteHub[] =
    shipment.autoRouteHubs && shipment.autoRouteHubs.length > 0
      ? shipment.autoRouteHubs
      : autoBuildRouteHubs(
          shipment.senderCity,
          shipment.senderAddress,
          shipment.receiverCity,
          shipment.receiverAddress
        );

  // Find airport hub indices
  const outboundAirportIdx = routeHubs.findIndex((h) => h.type === 'airport_hub');
  const inboundAirportIdx =
    routeHubs.length -
    1 -
    [...routeHubs].reverse().findIndex((h) => h.type === 'airport_hub');
  const hasAirFlightSegment =
    outboundAirportIdx !== -1 &&
    inboundAirportIdx !== -1 &&
    outboundAirportIdx < inboundAirportIdx;

  // Helper to accurately map shipment status to active hub index along the route
  const getActiveHubIndex = (status: Shipment['currentStatus'], totalHubs: number): number => {
    if (totalHubs <= 1) return 0;
    switch (status) {
      case 'PENDING_PICKUP':
      case 'CANCELLED':
        return 0; // Sender
      case 'PICKED_UP':
      case 'RETURNED':
        return 1; // Outbound Local Post Office
      case 'IN_TRANSIT':
        return hasAirFlightSegment ? inboundAirportIdx : Math.min(2, totalHubs - 1); // Flight leg or regional SOC
      case 'OUT_FOR_DELIVERY':
      case 'FAILED_ATTEMPT':
        return totalHubs - 2; // Inbound Delivery Post Office (local street delivery)
      case 'DELIVERED':
        return totalHubs - 1; // Destination Receiver!
      default:
        return Math.min(Math.max(0, statusInfo.stepIndex), totalHubs - 1);
    }
  };

  const activeHubIndex = getActiveHubIndex(shipment.currentStatus, routeHubs.length);
  const currentActiveHub = routeHubs[activeHubIndex] || routeHubs[0];

  // Determine if active current vehicle is in Air Flight leg or Ground Street leg
  const isVehicleFlyingInAir =
    shipment.currentStatus === 'IN_TRANSIT' &&
    hasAirFlightSegment &&
    activeHubIndex >= outboundAirportIdx &&
    activeHubIndex <= inboundAirportIdx;

  // Helper to get real map tile configuration
  const getTileConfig = (style: 'google' | 'satellite' | 'esri') => {
    if (style === 'satellite') {
      return {
        url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
        options: {
          maxZoom: 20,
          subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
          attribution: '© Google Bản đồ Vệ tinh',
        },
      };
    }
    if (style === 'esri') {
      return {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
        options: {
          maxZoom: 19,
          attribution: '© Esri Logistics Map',
        },
      };
    }
    return {
      url: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
      options: {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
        attribution: '© Google Maps | Express Logistics',
      },
    };
  };

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Clean up previous instance
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    try {
      // Helper to compute exact vehicle coordinate and path slices strictly synchronized on the polyline
      const getExactVehicleState = (
        fullPath: [number, number][],
        hubIndices: number[],
        status: Shipment['currentStatus'],
        totalHubs: number
      ) => {
        if (!fullPath || fullPath.length === 0) {
          return {
            truckCoord: [10.8231, 106.6297] as [number, number],
            passedPath: [] as [number, number][],
            upcomingPath: [] as [number, number][],
          };
        }

        if (fullPath.length === 1) {
          return {
            truckCoord: fullPath[0],
            passedPath: fullPath,
            upcomingPath: fullPath,
          };
        }

        let activeHubIdx = 0;
        let segProgress = 0; // 0.0 to 1.0 along the segment heading to activeHubIdx

        switch (status) {
          case 'PENDING_PICKUP':
          case 'CANCELLED':
            activeHubIdx = 0;
            segProgress = 0;
            break;
          case 'PICKED_UP':
          case 'RETURNED':
            activeHubIdx = 1;
            segProgress = 0;
            break;
          case 'IN_TRANSIT':
            activeHubIdx = hasAirFlightSegment ? inboundAirportIdx : Math.min(2, totalHubs - 1);
            segProgress = 0.5; // halfway along flight leg between SGN Airport and HAN Airport
            break;
          case 'OUT_FOR_DELIVERY':
          case 'FAILED_ATTEMPT':
            activeHubIdx = totalHubs - 1; // receiver destination
            segProgress = 0.65; // 65% along local street delivery leg from Bưu cục Cầu Giấy to Receiver
            break;
          case 'DELIVERED':
            activeHubIdx = totalHubs - 1;
            segProgress = 1.0;
            break;
          default:
            activeHubIdx = 0;
            segProgress = 0;
        }

        const prevHubIdx = Math.max(0, activeHubIdx - 1);
        const startVertex = hubIndices[prevHubIdx] ?? 0;
        const endVertex = hubIndices[activeHubIdx] ?? (fullPath.length - 1);

        if (startVertex === endVertex || segProgress <= 0) {
          const vIdx = hubIndices[activeHubIdx] ?? 0;
          const truckCoord = fullPath[vIdx] || fullPath[0];
          return {
            truckCoord,
            passedPath: fullPath.slice(0, vIdx + 1),
            upcomingPath: fullPath.slice(vIdx),
          };
        }

        if (segProgress >= 1.0) {
          const vIdx = hubIndices[activeHubIdx] ?? (fullPath.length - 1);
          const truckCoord = fullPath[vIdx] || fullPath[fullPath.length - 1];
          return {
            truckCoord,
            passedPath: fullPath.slice(0, vIdx + 1),
            upcomingPath: fullPath.slice(vIdx),
          };
        }

        const vertexSpan = endVertex - startVertex;
        const stepOffset = Math.floor(segProgress * vertexSpan);
        const actualVertexIdx = Math.min(fullPath.length - 1, startVertex + stepOffset);

        const truckCoord = fullPath[actualVertexIdx];
        const passedPath = fullPath.slice(0, actualVertexIdx + 1);
        const upcomingPath = fullPath.slice(actualVertexIdx);

        return {
          truckCoord,
          passedPath,
          upcomingPath,
        };
      };

      // Function to render multi-colored polylines (Orange for ground streets, Sky Blue for flight corridor)
      const renderMultimodalPolylinesOnMap = (map: L.Map, routeResult: RouteComputationResult) => {
        // Remove old polyline layers
        polylineLayersRef.current.forEach((layer) => layer.remove());
        polylineLayersRef.current = [];

        const { fullPath, hubIndices } = routeResult;
        if (fullPath.length < 2) return;

        if (hasAirFlightSegment) {
          const outboundAirportVertex = hubIndices[outboundAirportIdx];
          const inboundAirportVertex = hubIndices[inboundAirportIdx];

          // 1. Ground Pickup Street Segment (Origin City -> SGN Airport)
          const groundPickupPath = fullPath.slice(0, outboundAirportVertex + 1);
          if (groundPickupPath.length >= 2) {
            const line = L.polyline(groundPickupPath, {
              color: '#ea580c', // Orange for ground street
              weight: 5,
              opacity: 0.9,
              lineCap: 'round',
              lineJoin: 'round',
            }).addTo(map);
            polylineLayersRef.current.push(line);
          }

          // 2. Air Flight Corridor Segment (SGN Airport ✈️ HAN Airport) -> ALWAYS SKY BLUE!
          const airFlightPath = fullPath.slice(outboundAirportVertex, inboundAirportVertex + 1);
          if (airFlightPath.length >= 2) {
            const line = L.polyline(airFlightPath, {
              color: '#0284c7', // SKY BLUE for air flight corridor!
              weight: 6,
              dashArray: '8, 6',
              opacity: 1.0,
              lineCap: 'round',
              lineJoin: 'round',
            }).addTo(map);
            polylineLayersRef.current.push(line);
          }

          // 3. Ground Delivery Street Segment (HAN Airport -> Destination City Receiver)
          const groundDeliveryPath = fullPath.slice(inboundAirportVertex);
          if (groundDeliveryPath.length >= 2) {
            const line = L.polyline(groundDeliveryPath, {
              color: '#ea580c', // Orange for ground street
              weight: 5,
              opacity: 0.9,
              lineCap: 'round',
              lineJoin: 'round',
            }).addTo(map);
            polylineLayersRef.current.push(line);
          }
        } else {
          // Pure Road Transit
          const line = L.polyline(fullPath, {
            color: '#ea580c',
            weight: 5,
            opacity: 0.9,
            lineCap: 'round',
            lineJoin: 'round',
          }).addTo(map);
          polylineLayersRef.current.push(line);
        }
      };

      // 1. Initial quick highway & airport flight corridor route
      const initialRoute: RouteComputationResult = getQuickInitialRoute(routeHubs);
      const initialVehicleState = getExactVehicleState(
        initialRoute.fullPath,
        initialRoute.hubIndices,
        shipment.currentStatus,
        routeHubs.length
      );

      const initialTruckCoords = initialVehicleState.truckCoord;
      currentVehiclePosRef.current = initialTruckCoords;

      const isInterProvincial =
        routeHubs.length > 1 &&
        Math.abs(routeHubs[0].coords[0] - routeHubs[routeHubs.length - 1].coords[0]) > 2;

      const initialCenter: [number, number] = isInterProvincial
        ? [16.2, 107.5]
        : initialTruckCoords;
      const initialZoom = isInterProvincial ? 6 : 13;

      const map = L.map(mapContainerRef.current, {
        center: initialCenter,
        zoom: initialZoom,
        minZoom: 4,
        maxZoom: 20,
        zoomControl: false,
        attributionControl: false,
      });

      mapInstanceRef.current = map;

      // Base Tile Layer
      const tileCfg = getTileConfig(mapStyle);
      const tileLayer = L.tileLayer(tileCfg.url, tileCfg.options).addTo(map);
      tileLayerRef.current = tileLayer;

      // Attribution
      L.control
        .attribution({ position: 'bottomright', prefix: 'Bản đồ trực tuyến Express Việt Nam' })
        .addTo(map);

      // Render the distinct multi-colored polylines (Orange for ground streets, SKY BLUE for air flight)
      renderMultimodalPolylinesOnMap(map, initialRoute);

      // Place Hub Markers
      hubMarkersRef.current = [];
      routeHubs.forEach((hub, idx) => {
        const isOrigin = idx === 0;
        const isDestination = idx === routeHubs.length - 1;
        const isAirport = hub.type === 'airport_hub';
        const isCurrentActive = idx === activeHubIndex;

        let iconHtml = '';
        let iconSize: [number, number] = [28, 28];

        if (isOrigin) {
          iconHtml = `
            <div style="width: 32px; height: 32px; border-radius: 9999px; background-color: #2563eb; color: white; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 14px; border: 2.5px solid white; box-shadow: 0 3px 8px rgba(0,0,0,0.3);">
              A
            </div>
          `;
          iconSize = [32, 32];
        } else if (isDestination) {
          iconHtml = `
            <div style="width: 32px; height: 32px; border-radius: 9999px; background-color: #16a34a; color: white; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 14px; border: 2.5px solid white; box-shadow: 0 3px 8px rgba(0,0,0,0.3);">
              B
            </div>
          `;
          iconSize = [32, 32];
        } else if (isAirport) {
          iconHtml = `
            <div style="width: 32px; height: 32px; border-radius: 9999px; background-color: #0284c7; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 16px; border: 2.5px solid white; box-shadow: 0 3px 10px rgba(2, 132, 199, 0.6);">
              ✈️
            </div>
          `;
          iconSize = [32, 32];
        } else {
          iconHtml = `
            <div style="width: 24px; height: 24px; border-radius: 9999px; background-color: #ffffff; color: #0284c7; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; border: 2px solid #0284c7; box-shadow: 0 2px 5px rgba(0,0,0,0.25);">
              🏢
            </div>
          `;
          iconSize = [24, 24];
        }

        const customIcon = L.divIcon({
          html: iconHtml,
          className: 'custom-leaflet-marker',
          iconSize: iconSize,
          iconAnchor: [iconSize[0] / 2, iconSize[1] / 2],
        });

        const hubCoord = initialRoute.fullPath[initialRoute.hubIndices[idx]] || hub.coords;
        const marker = L.marker(hubCoord, { icon: customIcon }).addTo(map);
        hubMarkersRef.current.push(marker);

        const typeLabel = isOrigin
          ? 'Nơi gửi (Điểm xuất phát)'
          : isDestination
          ? 'Nơi nhận (Điểm đến)'
          : isAirport
          ? 'Cảng Hàng Không / Ga Tải Air Cargo'
          : isCurrentActive
          ? 'Vị trí bưu cục hiện tại'
          : 'Bưu cục / Kho phân loại';

        const popupContent = `
          <div style="font-family: inherit; font-size: 12px; padding: 4px; min-width: 210px;">
            <span style="display: inline-block; font-size: 10px; font-weight: bold; text-transform: uppercase; margin-bottom: 2px; color: ${
              isOrigin ? '#2563eb' : isDestination ? '#16a34a' : isAirport ? '#0284c7' : '#0284c7'
            };">${typeLabel}</span>
            <strong style="color: #0f172a; font-size: 13px; display: block; margin-bottom: 2px;">${hub.name}</strong>
            <p style="color: #475569; margin: 0 0 4px 0; font-size: 11px; line-height: 1.4;">${hub.location}</p>
          </div>
        `;
        marker.bindPopup(popupContent);
        marker.on('click', () => setSelectedHub(hub));
      });

      // Place Dedicated Vehicle Marker (Airplane ✈️ during flight leg, Delivery Truck / Courier 🚚 during road legs)
      const vehicleIconHtml = isVehicleFlyingInAir
        ? `
          <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 48px; height: 48px;">
            <span style="position: absolute; width: 100%; height: 100%; border-radius: 9999px; background-color: #0284c7; opacity: 0.65; animation: ping 1.2s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
            <div style="position: relative; width: 42px; height: 42px; border-radius: 9999px; background-color: #0284c7; color: white; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(2, 132, 199, 0.7); border: 2.5px solid white; font-size: 22px; transform: rotate(-35deg);">
              ✈️
            </div>
          </div>
        `
        : `
          <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 44px; height: 44px;">
            <span style="position: absolute; width: 100%; height: 100%; border-radius: 9999px; background-color: #ea580c; opacity: 0.65; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
            <div style="position: relative; width: 38px; height: 38px; border-radius: 9999px; background-color: #ea580c; color: white; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(234, 88, 12, 0.6); border: 2.5px solid white; font-size: 20px;">
              🚚
            </div>
          </div>
        `;

      const vehicleDivIcon = L.divIcon({
        html: vehicleIconHtml,
        className: 'custom-truck-marker',
        iconSize: isVehicleFlyingInAir ? [48, 48] : [44, 44],
        iconAnchor: isVehicleFlyingInAir ? [24, 24] : [22, 22],
      });

      const vehicleMarker = L.marker(initialTruckCoords, { icon: vehicleDivIcon, zIndexOffset: 1000 }).addTo(map);
      vehicleMarkerRef.current = vehicleMarker;

      const vehiclePopupLabel = isVehicleFlyingInAir
        ? '✈️ Máy bay hỏa tốc bưu chính (Chuyến bay SGN ✈️ HAN)'
        : shipment.currentStatus === 'OUT_FOR_DELIVERY'
        ? '🚚 Bưu tá đang đi giao tận nhà (Đường phố nội thành)'
        : '🚚 Xe tải gom hàng bưu cục đường bộ';

      const vehiclePopupDesc = isVehicleFlyingInAir
        ? 'Chuyến bay chuyên dụng hàng không SGN-HAN đang vận chuyển kiện hàng giữa hai sân bay'
        : shipment.currentStatus === 'OUT_FOR_DELIVERY'
        ? `Đã nhận hàng từ Sân bay Nội Bài ➔ Bưu cục Cầu Giấy và bưu tá đang giao đến ${shipment.receiverAddress}`
        : `Xe gom hàng đường bộ đang di chuyển đến bưu cục / sân bay`;

      const truckPopup = `
        <div style="font-family: inherit; font-size: 12px; padding: 4px; min-width: 230px;">
          <span style="display: inline-block; font-size: 10px; font-weight: bold; text-transform: uppercase; color: ${
            isVehicleFlyingInAir ? '#0284c7' : '#ea580c'
          }; margin-bottom: 2px;">
            ${vehiclePopupLabel}
          </span>
          <strong style="color: #0f172a; font-size: 13px; display: block; margin-bottom: 2px;">${currentActiveHub.name}</strong>
          <p style="color: #475569; margin: 0 0 4px 0; font-size: 11px; line-height: 1.4;">${vehiclePopupDesc}</p>
          <span style="background: ${
            isVehicleFlyingInAir ? '#e0f2fe' : '#ffedd5'
          }; color: ${
            isVehicleFlyingInAir ? '#0369a1' : '#9a3412'
          }; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 10px; display: inline-block;">
            Trạng thái: ${statusInfo.shortLabel}
          </span>
        </div>
      `;
      vehicleMarker.bindPopup(truckPopup);

      setTimeout(() => {
        vehicleMarker.openPopup();
      }, 500);

      // Fit initial bounds
      const fitMapBounds = () => {
        if (!mapInstanceRef.current) return;
        mapInstanceRef.current.invalidateSize();
        const roadCoords = initialRoute.fullPath.length > 0 ? initialRoute.fullPath : routeHubs.map((h) => h.coords);
        if (roadCoords.length > 0) {
          const bounds = L.latLngBounds(roadCoords);
          mapInstanceRef.current.fitBounds(bounds, {
            padding: [45, 45],
            maxZoom: 13,
          });
          if (mapInstanceRef.current.getZoom() < 5) {
            mapInstanceRef.current.setZoom(5);
          }
        }
      };
      fitMapBounds();
      setTimeout(fitMapBounds, 250);

      // Asynchronously fetch high-precision turn-by-turn road geometry via OSRM
      calculateCompleteRoute(routeHubs).then((enhancedResult) => {
        if (!enhancedResult || enhancedResult.fullPath.length < 2) return;
        if (mapInstanceRef.current !== map) return;

        // Re-render the distinct multi-colored polylines with enhanced OSRM road geometry
        renderMultimodalPolylinesOnMap(map, enhancedResult);

        const enhancedVehicleState = getExactVehicleState(
          enhancedResult.fullPath,
          enhancedResult.hubIndices,
          shipment.currentStatus,
          routeHubs.length
        );

        const newTruckCoords = enhancedVehicleState.truckCoord;
        currentVehiclePosRef.current = newTruckCoords;

        // Snap the vehicle marker directly onto the exact polyline vertex
        if (vehicleMarkerRef.current && newTruckCoords) {
          vehicleMarkerRef.current.setLatLng(newTruckCoords);
        }

        // Snap all hub markers to their exact polyline vertices
        enhancedResult.hubIndices.forEach((vIdx, hubIdx) => {
          const hubMarker = hubMarkersRef.current[hubIdx];
          const vertexCoord = enhancedResult.fullPath[vIdx];
          if (hubMarker && vertexCoord) {
            hubMarker.setLatLng(vertexCoord);
          }
        });
      });
    } catch (err) {
      console.error('Error rendering Leaflet delivery map:', err);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [shipment.trackingCode, shipment.currentStatus, isFullscreen, mapStyle, isVehicleFlyingInAir]);

  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  const handleRecenter = () => {
    if (!mapInstanceRef.current) return;
    const initialRoute = getQuickInitialRoute(routeHubs);
    const roadCoords = initialRoute.fullPath.length > 0 ? initialRoute.fullPath : routeHubs.map((h) => h.coords);
    if (roadCoords.length > 0) {
      mapInstanceRef.current.fitBounds(L.latLngBounds(roadCoords), {
        padding: [45, 45],
        maxZoom: 13,
      });
      if (mapInstanceRef.current.getZoom() < 5) {
        mapInstanceRef.current.setZoom(5);
      }
    }
  };

  const handleFocusPackage = () => {
    if (!mapInstanceRef.current) return;
    const targetCoord = currentVehiclePosRef.current || currentActiveHub.coords;
    if (targetCoord) {
      mapInstanceRef.current.setView(targetCoord, 16, { animate: true });
      if (vehicleMarkerRef.current) {
        vehicleMarkerRef.current.openPopup();
      }
    }
  };

  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-md transition-all ${
        isFullscreen ? 'fixed inset-4 z-50 shadow-2xl flex flex-col' : 'relative'
      }`}
    >
      {/* Map Header Toolbar */}
      <div className="p-3.5 sm:p-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0 shadow-md ${
              isVehicleFlyingInAir ? 'bg-sky-600' : 'bg-orange-600'
            }`}
          >
            {isVehicleFlyingInAir ? <Plane className="w-4 h-4" /> : <Navigation className="w-4 h-4" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm sm:text-base leading-tight">
                Bản Đồ Định Vị Đa Phương Thức Trực Tuyến
              </h3>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                  isVehicleFlyingInAir
                    ? 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                }`}
              >
                {isVehicleFlyingInAir ? 'AIR FREIGHT IN-FLIGHT' : 'LIVE STREET TRACKING'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {shipment.senderCity} ➔ {shipment.receiverCity}{' '}
              {hasAirFlightSegment
                ? '(Xe Tải Đường Bộ 🚚 + Chuyến Bay Hỏa Tốc SGN✈️HAN)'
                : `(${routeHubs.length} trạm bưu chính liên kết)`}
            </p>
          </div>
        </div>

        {/* Action Controls & Layer Switcher */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {/* Map Style Switcher */}
          <div className="inline-flex rounded-lg bg-slate-800 p-0.5 border border-slate-700">
            <button
              type="button"
              onClick={() => setMapStyle('google')}
              className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-all ${
                mapStyle === 'google' ? 'bg-orange-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
              }`}
            >
              🗺️ Google Maps
            </button>
            <button
              type="button"
              onClick={() => setMapStyle('satellite')}
              className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-all ${
                mapStyle === 'satellite' ? 'bg-orange-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
              }`}
            >
              🛰️ Vệ tinh
            </button>
            <button
              type="button"
              onClick={() => setMapStyle('esri')}
              className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-all ${
                mapStyle === 'esri' ? 'bg-orange-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
              }`}
            >
              🌐 Địa hình Esri
            </button>
          </div>

          <div className="h-4 w-px bg-slate-700 hidden sm:block mx-0.5" />

          {/* Quick Focus Buttons */}
          <button
            onClick={handleFocusPackage}
            className={`px-2.5 py-1.5 rounded-lg text-white flex items-center gap-1 transition-colors font-bold text-[11px] ${
              isVehicleFlyingInAir ? 'bg-sky-600 hover:bg-sky-700' : 'bg-orange-600 hover:bg-orange-700'
            }`}
            title="Định vị ngay vị trí phương tiện vận chuyển"
          >
            {isVehicleFlyingInAir ? <Plane className="w-3.5 h-3.5" /> : <Truck className="w-3.5 h-3.5" />}
            <span>{isVehicleFlyingInAir ? 'Vị trí máy bay' : 'Vị trí xe bưu tá'}</span>
          </button>
          <button
            onClick={handleRecenter}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1 transition-colors border border-slate-700 text-[11px]"
            title="Xem toàn tuyến từ người gửi đến người nhận"
          >
            <RotateCcw className="w-3.5 h-3.5 text-orange-400" />
            <span className="hidden sm:inline">Toàn tuyến</span>
          </button>
          <button
            onClick={handleZoomIn}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            title="Phóng to"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            title="Thu nhỏ"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            title={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Live Status Overlay Pill */}
      <div
        className={`border-b px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs ${
          isVehicleFlyingInAir
            ? 'bg-sky-50/95 border-sky-200 text-sky-950'
            : 'bg-orange-50/90 border-orange-200 text-orange-950'
        }`}
      >
        <div className="flex items-center gap-2">
          <span
            className={`w-2.5 h-2.5 rounded-full animate-ping ${
              isVehicleFlyingInAir ? 'bg-sky-600' : 'bg-orange-600'
            }`}
          />
          <span>
            Vị trí hiện tại:{' '}
            <strong className={isVehicleFlyingInAir ? 'text-sky-900' : 'text-orange-900'}>
              {currentActiveHub.name}
            </strong>{' '}
            ({currentActiveHub.location})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleFocusPackage}
            className={`text-[11px] hover:underline font-bold ${
              isVehicleFlyingInAir ? 'text-sky-700' : 'text-orange-700'
            }`}
          >
            [Phóng to vị trí này]
          </button>
          <span
            className={`font-semibold bg-white px-2 py-0.5 rounded border text-[11px] ${
              isVehicleFlyingInAir ? 'text-sky-800 border-sky-200' : 'text-orange-800 border-orange-200'
            }`}
          >
            {isVehicleFlyingInAir ? '✈️ Chuyến Bay Hỏa Tốc SGN-HAN' : statusInfo.shortLabel}
          </span>
        </div>
      </div>

      {/* Leaflet Map Canvas */}
      <div
        ref={mapContainerRef}
        className={`w-full bg-slate-200 z-10 transition-all ${
          isFullscreen ? 'flex-1 min-h-[500px]' : 'h-80 sm:h-96'
        }`}
      />

      {/* Map Legend Footer */}
      <div className="p-3 bg-white border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-1 font-medium">
            <span className="w-3 h-3 rounded-full bg-blue-600 inline-block" /> A: Nơi gửi (Bitexco Q1)
          </span>
          <span className="flex items-center gap-1 font-medium text-sky-700 font-bold">
            <span className="w-3 h-3 rounded-full bg-sky-600 inline-block" /> ✈️ Đường bay hàng không xanh biển (SGN ✈️ HAN)
          </span>
          <span className="flex items-center gap-1 font-medium text-orange-700 font-bold">
            <span className="w-3 h-3 rounded-full bg-orange-600 inline-block animate-pulse" /> 🚚 Đường bộ bưu tá nội thành (Cam)
          </span>
          <span className="flex items-center gap-1 font-medium">
            <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block" /> B: Nơi nhận (Cầu Giấy)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sky-900 bg-sky-50 font-bold px-2 py-0.5 rounded border border-sky-200 text-[10px]">
            ✈️ Chặng bay xanh biển SGN-HAN + 🚚 Đường bộ xe tải nội thành
          </span>
        </div>
      </div>
    </div>
  );
};
