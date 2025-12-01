import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Custom red marker icon
const RedIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = RedIcon;

interface Vehicle {
  id: string;
  name: string;
  pricePerDay: number;
  address: string;
  coordinates: [number, number];
  image?: string;
}

interface MapProps {
  vehicles?: Vehicle[];
  center: [number, number];
  zoom?: number;
  height?: string;
  onMarkerClick?: (id: string) => void;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('us-EN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);

export default function Map({ 
  center, 
  zoom = 13, 
  vehicles = [], 
  height = '400px',
  onMarkerClick 
}: MapProps) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height, width: '100%' }}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.google.com/maps">Google Maps</a>'
        url="https://mt1.google.com/vt/lyrs=r&x={x}&y={y}&z={z}"
      />
      
      {vehicles.map((vehicle) => (
        <Marker 
          key={vehicle.id} 
          position={vehicle.coordinates}
          eventHandlers={{
            click: () => onMarkerClick?.(vehicle.id),
          }}
        >
          <Popup>
            <div className="p-2 min-w-[200px]">
              {vehicle.image && (
                <img
                  src={vehicle.image}
                  alt={vehicle.name}
                  className="w-full h-32 object-cover rounded-md mb-2"
                />
              )}
              <h3 className="font-bold text-gray-900 mb-1">{vehicle.name}</h3>
              <p className="text-xs text-gray-500 mb-2">{vehicle.address}</p>
              <p className="text-lg font-bold text-gray-900">
                {formatCurrency(vehicle.pricePerDay)}
                <span className="text-xs font-normal text-gray-500"> /day</span>
              </p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
