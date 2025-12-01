// Vietnam city and district mapping
export const VIETNAM_CITIES = {
  'Ho Chi Minh City': {
    name: 'Ho Chi Minh City',
    nameVi: 'TP. Hồ Chí Minh',
    coordinates: [10.8231, 106.6297] as [number, number],
    districts: [
      'Quận 1', 'Quận 2', 'Quận 3', 'Quận 4', 'Quận 5', 'Quận 6', 'Quận 7', 
      'Quận 8', 'Quận 9', 'Quận 10', 'Quận 11', 'Quận 12',
      'Quận Bình Thạnh', 'Quận Gò Vấp', 'Quận Phú Nhuận', 'Quận Tân Bình',
      'Quận Tân Phú', 'Quận Bình Tân', 'Quận Thủ Đức',
    ],
  },
  'Hanoi': {
    name: 'Hanoi',
    nameVi: 'Hà Nội',
    coordinates: [21.0285, 105.8542] as [number, number],
    districts: [
      'Quận Ba Đình', 'Quận Hoàn Kiếm', 'Quận Tây Hồ', 'Quận Long Biên',
      'Quận Cầu Giấy', 'Quận Đống Đa', 'Quận Hai Bà Trưng', 'Quận Hoàng Mai',
      'Quận Thanh Xuân', 'Quận Hà Đông', 'Quận Nam Từ Liêm', 'Quận Bắc Từ Liêm',
    ],
  },
  'Da Lat' : {
    name: 'Da Lat',
    nameVi: 'Đà Lạt',
    coordinates: [11.9404, 108.4583] as [number, number],
    districts: ['Đà Lạt', 'Bảo Lộc'],
  },
  'Da Nang': {
    name: 'Da Nang',
    nameVi: 'Đà Nẵng',
    coordinates: [16.0544, 108.2022] as [number, number],
    districts: [
      'Quận Hải Châu', 'Quận Thanh Khê', 'Quận Sơn Trà', 'Quận Ngũ Hành Sơn',
      'Quận Liên Chiểu', 'Quận Cẩm Lệ', 'Huyện Hòa Vang',
    ],
  },
  'Can Tho': {
    name: 'Can Tho',
    nameVi: 'Cần Thơ',
    coordinates: [10.0452, 105.7469] as [number, number],
    districts: [
      'Quận Ninh Kiều', 'Quận Bình Thủy', 'Quận Cái Răng', 'Quận Ô Môn',
      'Quận Thốt Nốt',
    ],
  },
  'Hai Phong': {
    name: 'Hai Phong',
    nameVi: 'Hải Phòng',
    coordinates: [20.8449, 106.6881] as [number, number],
    districts: [
      'Quận Hồng Bàng', 'Quận Ngô Quyền', 'Quận Lê Chân', 'Quận Hải An',
      'Quận Kiến An', 'Quận Đồ Sơn', 'Quận Dương Kinh',
    ],
  },
  'Nha Trang': {
    name: 'Nha Trang',
    nameVi: 'Nha Trang',
    coordinates: [12.2388, 109.1967] as [number, number],
    districts: ['Nha Trang', 'Cam Ranh', 'Ninh Hòa'],
  },
  'Hue': {
    name: 'Hue',
    nameVi: 'Huế',
    coordinates: [16.4637, 107.5909] as [number, number],
    districts: ['Thành phố Huế', 'Hương Thủy', 'Hương Trà'],
  },
  'Vung Tau': {
    name: 'Vung Tau',
    nameVi: 'Vũng Tàu',
    coordinates: [10.3460, 107.0843] as [number, number],
    districts: ['Vũng Tàu', 'Bà Rịa', 'Long Điền'],
  },
  'Phu Quoc': {
    name: 'Phu Quoc',
    nameVi: 'Phú Quốc',
    coordinates: [10.2899, 103.9840] as [number, number],
    districts: ['Phú Quốc', 'An Thới', 'Dương Đông'],
  },
  'Quy Nhon': {
    name: 'Quy Nhon',
    nameVi: 'Quy Nhơn',
    coordinates: [13.7830, 109.2196] as [number, number],
    districts: ['Quy Nhơn'],
  },
};

// Helper function to check if address/district belongs to a city
export function isLocationInCity(location: string, cityName: string): boolean {
  const city = VIETNAM_CITIES[cityName as keyof typeof VIETNAM_CITIES];
  if (!city) return false;

  const locationLower = location.toLowerCase();
  const cityNameLower = city.name.toLowerCase();
  const cityNameViLower = city.nameVi.toLowerCase();

  // Check if location contains city name
  if (locationLower.includes(cityNameLower) || locationLower.includes(cityNameViLower)) {
    return true;
  }

  // Check if location contains any district from this city
  return city.districts.some(district => 
    locationLower.includes(district.toLowerCase())
  );
}

// Get city coordinates for map center
export function getCityCoordinates(cityName: string): [number, number] {
  const city = VIETNAM_CITIES[cityName as keyof typeof VIETNAM_CITIES];
  return city?.coordinates || [10.8231, 106.6297]; // Default to HCMC
}

// Get city name variations for search
export function getCitySearchTerms(cityName: string): string[] {
  const city = VIETNAM_CITIES[cityName as keyof typeof VIETNAM_CITIES];
  if (!city) return [cityName.toLowerCase()];
  
  return [
    city.name.toLowerCase(),
    city.nameVi.toLowerCase(),
    ...city.districts.map(d => d.toLowerCase()),
  ];
}
