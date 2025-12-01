export const VIETNAM_CITIES = [
  { name: 'Đà Nẵng', lat: 16.0544, lng: 108.2022 },
  { name: 'Hội An', lat: 15.8801, lng: 108.3380 },
  { name: 'Hà Nội', lat: 21.0285, lng: 105.8542 },
  { name: 'Nha Trang', lat: 12.2388, lng: 109.1967 },
  { name: 'TP.HCM', lat: 10.7769, lng: 106.7009 },
];

export const PLACE_CATEGORIES = [
  { value: 'Tham quan', icon: '🏛️', color: 'blue' },
  { value: 'Cafe', icon: '☕', color: 'amber' },
  { value: 'Nhà hàng', icon: '🍜', color: 'red' },
  { value: 'Biển', icon: '🏖️', color: 'cyan' },
  { value: 'Mua sắm', icon: '🛍️', color: 'pink' },
  { value: 'Giải trí', icon: '🎡', color: 'purple' },
];

export const VEHICLE_TYPES = [
  { value: 'MOTORBIKE', label: 'Motorbike', icon: '🏍️' },
  { value: 'CAR', label: 'Car', icon: '🚗' },
  { value: 'BICYCLE', label: 'Bicycle', icon: '🚲' },
];

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(price);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
}

export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function getDaysDifference(startDate: Date, endDate: Date): number {
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}
