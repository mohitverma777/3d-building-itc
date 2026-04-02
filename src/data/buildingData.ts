export type FloorType = 'Amenities' | 'Available Units' | 'Technical Infrastructure' | 'Core';

export interface FloorData {
  id: string;
  level: number;
  type: FloorType;
  title: string;
  description: string;
  price?: string;
  specs?: string;
  yPos: number; // For camera focus
}

export const buildingData: FloorData[] = [
  {
    id: 'f1',
    level: 1,
    type: 'Amenities',
    title: 'Grand Lobby & Cafe',
    description: 'A spectacular double-height lobby featuring a glass-enclosed cafe, concierge services, and resident lounge.',
    yPos: 0.5,   // low podium level
  },
  {
    id: 'f5',
    level: 5,
    type: 'Technical Infrastructure',
    title: 'Smart HVAC Core',
    description: 'Centralized high-efficiency heating and cooling distribution center with pure air filtration.',
    yPos: 2.5,   // ~3 floors above podium top
  },
  {
    id: 'f10',
    level: 10,
    type: 'Available Units',
    title: 'Executive Suites',
    description: 'Spacious 2-bedroom corner units with panoramic city views and smart home integration.',
    price: '$1.2M - $1.5M',
    specs: '2 Bed | 2.5 Bath | 1,450 sqft',
    yPos: 5.5,   // mid tower
  },
  {
    id: 'f15',
    level: 15,
    type: 'Amenities',
    title: 'Wellness Center & Pool',
    description: 'State-of-the-art fitness center, yoga studio, and a 25m heated infinity pool.',
    yPos: 8.0,   // upper tower
  },
  {
    id: 'f22',
    level: 22,
    type: 'Available Units',
    title: 'Penthouse Residences',
    description: 'The pinnacle of luxury living. Full-floor penthouses with private elevator access and massive terraces.',
    price: '$4.5M+',
    specs: '4 Bed | 4.5 Bath | 3,200 sqft',
    yPos: 10.5,  // near top
  },
  {
    id: 'roof',
    level: 25,
    type: 'Amenities',
    title: 'Sky Garden Terrace',
    description: 'Lush rooftop gardens featuring native plants, walking paths, and community fire pits.',
    yPos: 12.8,  // crown level
  },
  {
    id: 'solarglass',
    level: 12, // Midway up for hotspot placement
    type: 'Technical Infrastructure',
    title: 'Photovoltaic Facade',
    description: 'Integrated solar glass panels that power the building\'s common areas.',
    yPos: 6.8,
  }
];
