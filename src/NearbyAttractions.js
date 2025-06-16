const nearbyAttractions = [
  {
    location: 'Cavelossim, Goa',
    places: [
      { name: 'Cavelossim Beach', type: 'Beach', distance: '100m' },
      { name: 'Mobor Beach', type: 'Beach', distance: '1km' },
      { name: 'Sal River Cruise', type: 'Experience', distance: '2km' },
      { name: 'Cavelossim Fort', type: 'Historic', distance: '3km' },
      { name: 'Shri Shantadurga Temple', type: 'Religious', distance: '5km' },
      { name: 'Goa Chitra Museum', type: 'Museum', distance: '6km' },
    ],
    tripPurpose: [
      { type: 'Business', places: ['Goa Chitra Museum', 'Cavelossim Beach'] },
      { type: 'Educational', places: ['Shri Shantadurga Temple', 'Goa Chitra Museum'] },
      { type: 'Leisure', places: ['Mobor Beach', 'Sal River Cruise'] },
    ],
  },
  {
    location: 'Candolim, Goa',
    places: [
      { name: 'Candolim Beach', type: 'Beach', distance: '200m' },
      { name: 'Aguada Fort', type: 'Fort', distance: '3km' },
      { name: 'Shri Shantadurga Temple', type: 'Religious', distance: '5km' },
      { name: 'Fort Aguada Lighthouse', type: 'Historic', distance: '2km' },
      { name: 'Goa State Museum', type: 'Museum', distance: '10km' },
    ],
    tripPurpose: [
      { type: 'Business', places: ['Goa State Museum', 'Fort Aguada Lighthouse'] },
      { type: 'Educational', places: ['Shri Shantadurga Temple', 'Aguada Fort'] },
      { type: 'Leisure', places: ['Candolim Beach', 'Fort Aguada Lighthouse'] },
    ],
  },
  {
    location: 'Mumbai, Maharashtra',
    places: [
      { name: 'Gateway of India', type: 'Historic', distance: '500m' },
      { name: 'Marine Drive', type: 'Beach', distance: '1km' },
      { name: 'Chhatrapati Shivaji Maharaj Vastu Sangrahalaya', type: 'Museum', distance: '3km' },
      { name: 'Elephanta Caves', type: 'Historic', distance: '11km' },
      { name: 'Juhu Beach', type: 'Beach', distance: '20km' },
      { name: 'Haji Ali Dargah', type: 'Religious', distance: '7km' },
      { name: 'Bandra Worli Sea Link', type: 'Viewpoint', distance: '15km' },
      { name: 'Siddhivinayak Temple', type: 'Religious', distance: '6km' },
    ],
    tripPurpose: [
      { type: 'Business', places: ['Marine Drive', 'Chhatrapati Shivaji Maharaj Vastu Sangrahalaya'] },
      { type: 'Educational', places: ['Gateway of India', 'Elephanta Caves'] },
      { type: 'Leisure', places: ['Juhu Beach', 'Marine Drive'] },
    ],
  },
  {
    location: 'New Delhi',
    places: [
      { name: 'Red Fort', type: 'Historic', distance: '3km' },
      { name: 'India Gate', type: 'Historic', distance: '5km' },
      { name: 'National Museum', type: 'Museum', distance: '1km' },
      { name: 'Qutub Minar', type: 'Historic', distance: '15km' },
      { name: 'Lodhi Gardens', type: 'Park', distance: '7km' },
      { name: 'Humayun Tomb', type: 'Historic', distance: '10km' },
      { name: 'Akshardham Temple', type: 'Religious', distance: '10km' },
    ],
    tripPurpose: [
      { type: 'Business', places: ['National Museum', 'Humayun Tomb'] },
      { type: 'Educational', places: ['Red Fort', 'India Gate'] },
      { type: 'Leisure', places: ['Lodhi Gardens', 'Qutub Minar'] },
    ],
  },
  {
    location: 'Jaipur, Rajasthan',
    places: [
      { name: 'Amber Fort', type: 'Fort', distance: '11km' },
      { name: 'Hawa Mahal', type: 'Palace', distance: '2km' },
      { name: 'City Palace', type: 'Palace', distance: '1km' },
      { name: 'Jantar Mantar', type: 'Historic', distance: '2km' },
      { name: 'Albert Hall Museum', type: 'Museum', distance: '4km' },
      { name: 'Jaigarh Fort', type: 'Fort', distance: '8km' },
    ],
    tripPurpose: [
      { type: 'Business', places: ['Albert Hall Museum', 'City Palace'] },
      { type: 'Educational', places: ['Jantar Mantar', 'Amber Fort'] },
      { type: 'Leisure', places: ['Hawa Mahal', 'City Palace'] },
    ],
  },
  {
    location: 'Bengaluru, Karnataka',
    places: [
      { name: 'Bangalore Palace', type: 'Palace', distance: '2km' },
      { name: 'Lalbagh Botanical Garden', type: 'Park', distance: '3km' },
      { name: 'Vidhana Soudha', type: 'Government Building', distance: '5km' },
      { name: 'National Gallery of Modern Art', type: 'Museum', distance: '1km' },
      { name: 'Cubbon Park', type: 'Park', distance: '2km' },
      { name: 'ISKCON Temple', type: 'Religious', distance: '4km' },
    ],
    tripPurpose: [
      { type: 'Business', places: ['Vidhana Soudha', 'National Gallery of Modern Art'] },
      { type: 'Educational', places: ['Bangalore Palace', 'Lalbagh Botanical Garden'] },
      { type: 'Leisure', places: ['Cubbon Park', 'Lalbagh Botanical Garden'] },
    ],
  },
  {
    location: 'Madpackers Hostels, Delhi',
    places: [
      { name: 'Red Fort', type: 'Historic', distance: '3km' },
      { name: 'India Gate', type: 'Historic', distance: '5km' },
      { name: 'National Museum', type: 'Museum', distance: '1km' },
      { name: 'Qutub Minar', type: 'Historic', distance: '15km' },
      { name: 'Lodhi Gardens', type: 'Park', distance: '7km' },
      { name: 'Humayun Tomb', type: 'Historic', distance: '10km' },
      { name: 'Jantar Mantar', type: 'Historic', distance: '6km' },
    ],
    tripPurpose: [
      { type: 'Business', places: ['National Museum', 'Humayun Tomb'] },
      { type: 'Educational', places: ['Red Fort', 'India Gate'] },
      { type: 'Leisure', places: ['Lodhi Gardens', 'Qutub Minar'] },
    ],
  },
  {
    location: 'Lonavala, Maharashtra',
    places: [
      { name: 'Lion’s Point', type: 'Viewpoint', distance: '3km' },
      { name: 'Bushi Dam', type: 'Dam', distance: '5km' },
      { name: 'Karla Caves', type: 'Historic', distance: '12km' },
      { name: 'Della Adventure Park', type: 'Theme Park', distance: '8km' },
      { name: 'Pawna Lake', type: 'Lake', distance: '18km' },
      { name: 'Lonavala Lake', type: 'Lake', distance: '2km' },
      { name: 'Tiger’s Leap', type: 'Viewpoint', distance: '6km' },
    ],
    tripPurpose: [
      { type: 'Business', places: ['Della Adventure Park', 'Karla Caves'] },
      { type: 'Educational', places: ['Karla Caves', 'Lion’s Point'] },
      { type: 'Leisure', places: ['Lonavala Lake', 'Pawna Lake'] },
    ],
  },
  {
    location: 'Coorg, Karnataka',
    places: [
      { name: 'Coorg Heritage Homes', type: 'Stay', distance: '0km' },
      { name: 'Abbey Falls', type: 'Waterfall', distance: '10km' },
      { name: 'Madikeri Fort', type: 'Historic', distance: '15km' },
    ],
    tripPurpose: [
      { type: 'Leisure', places: ['Coorg Heritage Homes'] },
    ],
  },
  {
    location: 'Mumbai, Maharashtra',
    places: [
      { name: 'Oberoi Group Nariman Point', type: 'Hotel', distance: '0km' },
      { name: 'The Taj Mahal Palace', type: 'Hotel', distance: '0km' },
    ],
    tripPurpose: [
      { type: 'Business', places: ['Oberoi Group Nariman Point', 'The Taj Mahal Palace'] },
    ],
  },
  {
    location: 'Mumbai, Maharashtra',
    places: [
      { name: 'ITC Hotel Andheri', type: 'Hotel', distance: '0km' },
      { name: 'The Leela Mumbai', type: 'Hotel', distance: '0km' },
    ],
    tripPurpose: [
      { type: 'Business', places: ['ITC Hotel Andheri', 'The Leela Mumbai'] },
    ],
  },
];

export default nearbyAttractions;
