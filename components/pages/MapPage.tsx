import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  AlertTriangle,
  Droplets,
  Wind,
  Trash2,
  Plus,
  MapPin,
  Loader2,
  X,
  User,
  Navigation,
  Layers,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Types & Constants ---

type PollutionType = 'WASTE' | 'WATER' | 'AIR' | 'OTHER';
type Severity = 1 | 2 | 3 | 4 | 5;

interface PollutionMarker {
  id: string;
  owner_id: string;
  owner_name?: string;
  lat: number;
  lng: number;
  type: PollutionType;
  severity: Severity;
  description: string;
  created_at: string;
  is_anonymous: boolean;
}

const POLLUTION_TYPES: Record<PollutionType, { label: string, icon: string, color: string }> = {
  WASTE: {
    label: 'Rác thải rắn',
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`,
    color: '#f59e0b'
  },
  WATER: {
    label: 'Ô nhiễm nước',
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M12 2.69l5.74 5.74c.9.9 1.41 2.13 1.41 3.41a5.66 5.66 0 0 1-5.66 5.66c-1.35 0-2.61-.53-3.57-1.41L12 18.2l-5.74 5.74c-.9.9-1.41 2.13-1.41 3.41 0 3.12 2.53 5.65 5.65 5.65 1.35 0 2.61-.53 3.57-1.41L12 29.5l5.74-5.74zM7.22 13.83A5.66 5.66 0 0 1 1.57 8.17 5.66 5.66 0 0 1 7.22 2.51c1.35 0 2.61.53 3.57 1.41L12 5.12l1.21-1.2A5.66 5.66 0 0 1 16.78 2.51c3.12 0 5.65 2.53 5.65 5.66 0 1.28-.51 2.51-1.41 3.41L12 20.69l-4.78-6.86z"></path></svg>`,
    color: '#3b82f6'
  },
  AIR: {
    label: 'Khói bụi / Khí',
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"></path></svg>`,
    color: '#64748b'
  },
  OTHER: {
    label: 'Khác',
    icon: `<span style="font-weight: 800; font-size: 14px;">!</span>`,
    color: '#8b5cf6'
  },
};

const SEVERITY_COLORS: Record<Severity, string> = {
  1: '#10b981', // Green
  2: '#84cc16', // Lime
  3: '#f59e0b', // Amber
  4: '#f97316', // Orange
  5: '#ef4444', // Red
};

const SEVERITY_THEME: Record<Severity, { textClass: string; bgClass: string; widthClass: string }> = {
  1: { textClass: 'text-emerald-500', bgClass: 'bg-emerald-500', widthClass: 'w-1/5' },
  2: { textClass: 'text-lime-500', bgClass: 'bg-lime-500', widthClass: 'w-2/5' },
  3: { textClass: 'text-amber-500', bgClass: 'bg-amber-500', widthClass: 'w-3/5' },
  4: { textClass: 'text-orange-500', bgClass: 'bg-orange-500', widthClass: 'w-4/5' },
  5: { textClass: 'text-red-500', bgClass: 'bg-red-500', widthClass: 'w-full' },
};

interface MapPageProps {
  user: { id: string; name: string } | null;
  onLoginRequest: () => void;
}

export const MapPage: React.FC<MapPageProps> = ({ user, onLoginRequest }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerLayerRef = useRef<L.LayerGroup | null>(null);
  const userLocLayerRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const tempMarkerRef = useRef<L.Marker | null>(null);

  const [markers, setMarkers] = useState<PollutionMarker[]>([]);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [addingMode, setAddingMode] = useState(false);
  const [tempMarkerPos, setTempMarkerPos] = useState<{ lat: number, lng: number } | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<PollutionMarker | null>(null);
  const [mapStyle, setMapStyle] = useState<'streets' | 'satellite'>('streets');

  // Form State
  const [formData, setFormData] = useState<{
    type: PollutionType;
    severity: Severity;
    description: string;
    is_anonymous: boolean;
  }>({
    type: 'WASTE',
    severity: 3,
    description: '',
    is_anonymous: false
  });

  // Load markers from backend
  useEffect(() => {
    const controller = new AbortController();

    fetch('/api/pollution', { signal: controller.signal })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return (await r.json()) as any;
      })
      .then((data) => {
        if (Array.isArray(data?.markers)) setMarkers(data.markers);
      })
      .catch(() => {
        setMarkers([]);
      });

    return () => controller.abort();
  }, []);

  // --- Map Initialization ---
  useEffect(() => {
    if (mapRef.current) return;
    if (!mapContainer.current) return;

    try {
      // Define bounds for Vietnam and surrounding area
      // SouthWest: 5.0, 95.0 (Near Indian Ocean/Singapore)
      // NorthEast: 26.0, 120.0 (Above Ha Giang, East of Spratly Islands)
      const vietnamBounds = L.latLngBounds(
        L.latLng(5.0, 95.0),
        L.latLng(26.0, 120.0)
      );

      const map = L.map(mapContainer.current, {
        zoomControl: false,
        attributionControl: false,
        fadeAnimation: true,
        zoomAnimation: true,
        minZoom: 5, // Prevent zooming out to world view (fixes gray areas)
        maxBounds: vietnamBounds, // Restrict panning to Vietnam area
        maxBoundsViscosity: 1.0, // Hard limit (no rubber-banding)
      }).setView([16.0471, 108.2068], 5);

      mapRef.current = map;

      // Default Layer: CartoDB Voyager
      tileLayerRef.current = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 20,
        keepBuffer: 6,
        noWrap: true, // Don't repeat the world horizontally
        bounds: vietnamBounds // Optimize loading for bounds
      }).addTo(map);

      // Layers
      markerLayerRef.current = L.layerGroup().addTo(map);
      userLocLayerRef.current = L.layerGroup().addTo(map);

      // Ensure correct initial sizing (helps when the map mounts inside dynamic layouts)
      setTimeout(() => {
        try {
          map.invalidateSize();
        } catch {
          // ignore
        }
      }, 0);

      map.on('load', () => setIsMapLoaded(true));
      setTimeout(() => setIsMapLoaded(true), 500); // Fallback

      L.control.zoom({ position: 'bottomright' }).addTo(map);

    } catch (err) {
      console.error("Leaflet Init Error:", err);
      setIsMapLoaded(true);
    }

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // --- Map Style Switcher ---
  const toggleMapStyle = () => {
    if (!mapRef.current || !tileLayerRef.current) return;

    const newStyle = mapStyle === 'streets' ? 'satellite' : 'streets';
    setMapStyle(newStyle);

    if (newStyle === 'satellite') {
      // Esri World Imagery
      tileLayerRef.current.setUrl('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}');
    } else {
      // CartoDB Voyager
      tileLayerRef.current.setUrl('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png');
    }
  };


  // --- Auto Geolocate & Smart Focus Logic ---
  useEffect(() => {
    if (!isMapLoaded || !mapRef.current) return;

    const performSmartFocus = () => {
      if (!('geolocation' in navigator)) return;

      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (!mapRef.current) return; // Prevent null access if unmounted

          const { latitude, longitude } = pos.coords;
          const map = mapRef.current;
          const userLatLng = L.latLng(latitude, longitude);

          // 1. Draw User Location Dot
          userLocLayerRef.current?.clearLayers();

          // Outer pulse ring
          const pulseIcon = L.divIcon({
            className: 'custom-div-icon',
            html: `<div class="w-8 h-8 rounded-full bg-blue-500/20 animate-ping"></div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 16]
          });
          L.marker(userLatLng, { icon: pulseIcon, zIndexOffset: -10 }).addTo(userLocLayerRef.current!);

          // Inner solid dot
          const dotIcon = L.divIcon({
            className: 'custom-div-icon',
            html: `<div class="w-3 h-3 rounded-full bg-blue-500 border-2 border-white shadow-sm"></div>`,
            iconSize: [12, 12],
            iconAnchor: [6, 6]
          });
          L.marker(userLatLng, { icon: dotIcon, zIndexOffset: 1000 }).addTo(userLocLayerRef.current!);

          // 2. Find Nearest Marker
          let nearest: PollutionMarker | null = null;
          let minDist = Infinity;

          markers.forEach(m => {
            const dist = userLatLng.distanceTo([m.lat, m.lng]);
            if (dist < minDist) {
              minDist = dist;
              nearest = m;
            }
          });

          // 3. Smart Focus Decision
          if (nearest && minDist < 50000) {
            // Fly to marker
            map.flyTo([nearest.lat, nearest.lng], 14, { duration: 2 });
            setTimeout(() => {
              if (mapRef.current) setSelectedMarker(nearest);
            }, 2000);
          } else {
            // Fly to user
            map.flyTo(userLatLng, 13, { duration: 2 });
          }

          setIsLocating(false);
        },
        (err) => {
          console.warn("Geolocation denied or failed", err);
          setIsLocating(false);
        }
      );
    };

    performSmartFocus();

  }, [isMapLoaded, markers]); // Re-run when markers arrive


  // --- Handle Map Interactions ---
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const clickHandler = (e: L.LeafletMouseEvent) => {
      if (addingMode) {
        setTempMarkerPos({ lat: e.latlng.lat, lng: e.latlng.lng });
      } else {
        setSelectedMarker(null);
      }
    };

    map.on('click', clickHandler);
    return () => map.off('click', clickHandler);
  }, [addingMode]);


  // --- Render Markers ---
  useEffect(() => {
    if (!mapRef.current || !markerLayerRef.current) return;

    markerLayerRef.current.clearLayers();

    markers.forEach(marker => {
      // Create Custom DivIcon
      const iconHtml = `
        <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
           ${marker.severity >= 4 ? `<div style="position: absolute; inset: 0; background-color: ${SEVERITY_COLORS[marker.severity]}; border-radius: 50%; opacity: 0.4; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>` : ''}
           <div style="background-color: ${SEVERITY_COLORS[marker.severity]}; width: 28px; height: 28px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 2px solid white; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); display: flex; align-items: center; justify-content: center; transition: transform 0.2s;">
              <div style="transform: rotate(45deg); color: white; display: flex;">
                 ${POLLUTION_TYPES[marker.type].icon}
              </div>
           </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-div-icon',
        html: iconHtml,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      });

      const m = L.marker([marker.lat, marker.lng], { icon: customIcon });

      m.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        setSelectedMarker(marker);
        mapRef.current?.flyTo([marker.lat, marker.lng], 14, { duration: 1.5 });
      });

      m.addTo(markerLayerRef.current!);
    });

  }, [markers]);

  // --- Render Temp Marker ---
  useEffect(() => {
    if (!mapRef.current) return;
    if (tempMarkerRef.current) { tempMarkerRef.current.remove(); tempMarkerRef.current = null; }

    if (tempMarkerPos && addingMode) {
      const el = `
        <div class="animate-bounce">
           <svg width="40" height="40" viewBox="0 0 24 24" fill="#10b981" stroke="white" stroke-width="2" style="filter: drop-shadow(0 4px 3px rgb(0 0 0 / 0.07));">
             <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
             <circle cx="12" cy="10" r="3" fill="white"></circle>
           </svg>
        </div>
      `;
      const tempIcon = L.divIcon({ className: 'custom-div-icon', html: el, iconSize: [40, 40], iconAnchor: [20, 40] });
      tempMarkerRef.current = L.marker([tempMarkerPos.lat, tempMarkerPos.lng], { icon: tempIcon }).addTo(mapRef.current);
    }
  }, [tempMarkerPos, addingMode]);


  // --- Actions ---
  const handleStartAdd = () => {
    if (!user) { onLoginRequest(); return; }
    setAddingMode(true);
    setSelectedMarker(null);
  };

  const handleConfirmAdd = async () => {
    if (!tempMarkerPos || !user) return;

    try {
      const res = await fetch('/api/pollution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: tempMarkerPos.lat,
          lng: tempMarkerPos.lng,
          type: formData.type,
          severity: formData.severity,
          description: formData.description,
          is_anonymous: formData.is_anonymous,
        }),
      });
      const data = (await res.json()) as any;
      if (!res.ok) throw new Error(data?.error ?? 'Không tạo được báo cáo');

      setMarkers((prev) => [...prev, data.marker as PollutionMarker]);
      setAddingMode(false);
      setTempMarkerPos(null);
      setFormData({ type: 'WASTE', severity: 3, description: '', is_anonymous: false });
    } catch (e: any) {
      alert(e?.message ?? 'Có lỗi xảy ra');
    }
  };

  const handleDeleteMarker = async (id: string) => {
    if (!user) { onLoginRequest(); return; }
    if (!confirm("Bạn có chắc chắn muốn xóa cảnh báo này không?")) return;

    try {
      const res = await fetch(`/api/pollution/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok && res.status !== 204) {
        const data = (await res.json()) as any;
        throw new Error(data?.error ?? 'Xóa thất bại');
      }
      setMarkers((prev) => prev.filter(m => m.id !== id));
      setSelectedMarker(null);
    } catch (e: any) {
      alert(e?.message ?? 'Có lỗi xảy ra');
    }
  };

  const manualLocate = () => {
    // Re-trigger location check
    if (mapRef.current) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition((pos) => {
        if (!mapRef.current) return;
        const { latitude, longitude } = pos.coords;
        mapRef.current.flyTo([latitude, longitude], 14, { duration: 1.5 });
        setIsLocating(false);
      }, () => setIsLocating(false));
    }
  };

  const handleNavigateMarker = (direction: 'next' | 'prev') => {
    if (markers.length === 0) return;

    let nextIndex = 0;
    if (selectedMarker) {
      const currentIndex = markers.findIndex(m => m.id === selectedMarker.id);
      if (currentIndex !== -1) {
        if (direction === 'next') {
          nextIndex = (currentIndex + 1) % markers.length;
        } else {
          nextIndex = (currentIndex - 1 + markers.length) % markers.length;
        }
      }
    } else {
      // If no marker selected, 'next' starts at 0, 'prev' starts at end
      if (direction === 'prev') nextIndex = markers.length - 1;
    }

    const targetMarker = markers[nextIndex];
    setSelectedMarker(targetMarker);
    mapRef.current?.flyTo([targetMarker.lat, targetMarker.lng], 14, { duration: 1.5 });
  };

  return (
    <div className="relative w-full h-[calc(100vh-64px)] bg-slate-100 overflow-hidden select-none">

      {/* Map Container */}
      <div ref={mapContainer} className="w-full h-full z-0 eco-map-container" />

      {/* Styles for animation */}
      <style>{`
        @keyframes ping {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
      `}</style>

      {/* Loading */}
      <AnimatePresence>
        {!isMapLoaded && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-50 flex flex-col items-center justify-center z-50"
          >
            <Loader2 className="animate-spin text-emerald-500 mb-2" size={32} />
            <span className="text-slate-500 font-medium">Đang tải bản đồ...</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Locating Toast */}
      <AnimatePresence>
        {isLocating && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-20 left-1/2 -translate-x-1/2 z-[400] bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-md flex items-center gap-2 text-sm text-slate-700"
          >
            <Loader2 className="animate-spin" size={16} />
            Đang tìm điểm ô nhiễm gần bạn...
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- UI Controls --- */}
      <>
        {/* Marker Navigation Controls - MOVED TO CENTER */}
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-[400] flex flex-col gap-2">
          <div className="bg-white/90 backdrop-blur rounded-full shadow-xl p-1.5 flex items-center gap-1 border border-slate-200">
            <button
              onClick={() => handleNavigateMarker('prev')}
              className="p-2 rounded-full hover:bg-slate-100 text-slate-600 hover:text-emerald-600 transition-colors"
              title="Điểm trước"
            >
              <ChevronLeft size={22} />
            </button>
            <div className="w-px h-5 bg-slate-200"></div>
            <button
              onClick={() => handleNavigateMarker('next')}
              className="p-2 rounded-full hover:bg-slate-100 text-slate-600 hover:text-emerald-600 transition-colors"
              title="Điểm tiếp theo"
            >
              <ChevronRight size={22} />
            </button>
          </div>
        </div>

        {/* Layer Toggle Button (Satellite/Streets) */}
        <div className="absolute bottom-40 right-4 z-[400] sm:bottom-24 sm:right-14 flex flex-col gap-2">
          <button
            onClick={toggleMapStyle}
            className="bg-white p-3 rounded-full shadow-lg text-slate-600 hover:text-emerald-600 hover:bg-slate-50 transition-all active:scale-95"
            title="Đổi loại bản đồ"
          >
            <Layers size={20} className={mapStyle === 'satellite' ? "text-emerald-500" : ""} />
          </button>
        </div>

        {/* Locate Button */}
        <div className="absolute bottom-24 right-4 z-[400] sm:bottom-8 sm:right-14">
          <button
            onClick={manualLocate}
            className="bg-white p-3 rounded-full shadow-lg text-slate-600 hover:text-emerald-600 hover:bg-slate-50 transition-all active:scale-95"
            title="Vị trí của tôi"
          >
            <Navigation size={20} className={isLocating ? "animate-pulse text-emerald-500" : ""} />
          </button>
        </div>

        {/* Title Card */}
        <div className="absolute top-4 left-4 z-[400] hidden sm:flex flex-col gap-2 pointer-events-none">
          <div className="bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-lg border border-slate-200 w-64 pointer-events-auto">
            <h2 className="font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle size={18} className="text-red-500" />
              Bản đồ ô nhiễm
            </h2>
            <div className="mt-4 space-y-2">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Mức độ</div>
              <div className="flex h-2 rounded-full overflow-hidden">
                <div className="flex-1 bg-emerald-500" />
                <div className="flex-1 bg-lime-500" />
                <div className="flex-1 bg-amber-500" />
                <div className="flex-1 bg-orange-500" />
                <div className="flex-1 bg-red-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Add Mode Instruction */}
        {addingMode && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[400] w-[90%] md:w-auto">
            <div className="bg-slate-900 text-white px-6 py-3 rounded-full shadow-xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-4">
              <div className="flex items-center gap-2">
                <MapPin size={18} />
                <span className="text-sm font-medium truncate">
                  {tempMarkerPos ? 'Đã chọn vị trí.' : 'Click bản đồ để chọn vị trí'}
                </span>
              </div>
              <button
                onClick={() => { setAddingMode(false); setTempMarkerPos(null); }}
                className="bg-slate-700 hover:bg-slate-600 rounded-full p-1 ml-2 shrink-0"
                aria-label="Hủy chế độ thêm"
                title="Hủy chế độ thêm"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Add Button */}
        {!addingMode && !tempMarkerPos && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[400]">
            <button
              onClick={handleStartAdd}
              className="group flex items-center gap-3 bg-slate-900 text-white pl-5 pr-6 py-3 rounded-full shadow-xl hover:bg-emerald-600 transition-all hover:scale-105"
            >
              <div className="bg-white/20 rounded-full p-1">
                <Plus size={20} />
              </div>
              <span className="font-semibold whitespace-nowrap">Báo cáo ô nhiễm</span>
            </button>
          </div>
        )}
      </>

      {/* Forms & Panels */}
      <AnimatePresence>
        {addingMode && tempMarkerPos && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            className="absolute bottom-0 left-0 w-full md:w-96 md:left-4 md:bottom-4 bg-white rounded-t-2xl md:rounded-2xl shadow-2xl z-[500] border border-slate-200 overflow-hidden max-h-[80vh] overflow-y-auto"
          >
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center sticky top-0 z-10">
              <h3 className="font-bold text-slate-900">Chi tiết báo cáo</h3>
              <button
                onClick={() => { setAddingMode(false); setTempMarkerPos(null); }}
                className="text-slate-400 hover:text-slate-900"
                aria-label="Đóng"
                title="Đóng"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase">Loại ô nhiễm</label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(POLLUTION_TYPES) as PollutionType[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => setFormData({ ...formData, type: t })}
                      className={`flex items-center gap-2 p-2 rounded-lg border text-sm transition-all ${formData.type === t
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 font-medium ring-1 ring-emerald-500'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                    >
                      <div className="text-current" dangerouslySetInnerHTML={{ __html: POLLUTION_TYPES[t].icon }} />
                      {POLLUTION_TYPES[t].label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Severity */}
              <div>
                <label htmlFor="pollution-severity" className="block text-xs font-semibold text-slate-500 mb-2 uppercase">
                  Mức độ: <span className={SEVERITY_THEME[formData.severity].textClass}>{formData.severity}/5</span>
                </label>
                <input
                  id="pollution-severity"
                  name="pollution-severity"
                  type="range" min="1" max="5" step="1"
                  value={formData.severity}
                  onChange={(e) => setFormData({ ...formData, severity: parseInt(e.target.value) as Severity })}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
              </div>

              {/* Desc */}
              <div>
                <label htmlFor="pollution-description" className="block text-xs font-semibold text-slate-500 mb-2 uppercase">Mô tả</label>
                <textarea
                  id="pollution-description"
                  name="pollution-description"
                  placeholder="Mô tả ngắn về tình trạng ô nhiễm..."
                  className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:border-emerald-500"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              {/* Anonymous */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox" id="anon"
                  checked={formData.is_anonymous}
                  onChange={(e) => setFormData({ ...formData, is_anonymous: e.target.checked })}
                  className="rounded border-slate-300 text-emerald-600"
                />
                <label htmlFor="anon" className="text-sm text-slate-600">Đăng ẩn danh</label>
              </div>

              <button
                onClick={handleConfirmAdd}
                className="w-full bg-slate-900 text-white py-3 rounded-xl font-medium hover:bg-emerald-600 shadow-lg"
              >
                Xác nhận
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedMarker && !addingMode && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            className="absolute top-0 right-0 h-full w-full md:w-96 bg-white shadow-2xl z-[500] border-l border-slate-200 flex flex-col"
          >
            <div className="p-4 border-b border-slate-100 flex justify-between items-start">
              <div className="flex gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-white shadow-sm ${SEVERITY_THEME[selectedMarker.severity].bgClass}`}
                >
                  <div dangerouslySetInnerHTML={{ __html: POLLUTION_TYPES[selectedMarker.type].icon }} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{POLLUTION_TYPES[selectedMarker.type].label}</h3>
                  <span className="text-xs text-slate-500">
                    {new Date(selectedMarker.created_at).toLocaleDateString('vi-VN')}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedMarker(null)}
                className="p-1 hover:bg-slate-100 rounded-full"
                aria-label="Đóng"
                title="Đóng"
              >
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <div className="p-5 flex-1 overflow-y-auto">
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-slate-900 mb-2">Mức độ</h4>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${SEVERITY_THEME[selectedMarker.severity].bgClass} ${SEVERITY_THEME[selectedMarker.severity].widthClass}`}
                    />
                  </div>
                  <span className={`text-sm font-bold ${SEVERITY_THEME[selectedMarker.severity].textClass}`}>Lvl {selectedMarker.severity}</span>
                </div>
              </div>
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-slate-900 mb-2">Chi tiết</h4>
                <p className="text-slate-600 text-sm leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                  {selectedMarker.description || "Không có mô tả."}
                </p>
              </div>
              <div className="flex items-center gap-3 py-4 border-t border-slate-100">
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
                  <User size={14} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {selectedMarker.is_anonymous ? 'Người dùng ẩn danh' : (selectedMarker.owner_name || 'Thành viên')}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50">
              {user && user.id === selectedMarker.owner_id ? (
                <button
                  onClick={() => handleDeleteMarker(selectedMarker.id)}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 font-medium"
                >
                  <Trash2 size={18} />
                  Xóa báo cáo
                </button>
              ) : (
                <div className="w-full py-3 text-center text-slate-400 text-sm italic">
                  Chỉ người tạo mới được xóa
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};