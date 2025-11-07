# UWE Frenchay Campus Map - AI Agent Instructions

## Project Overview
This is an interactive web-based map application for the UWE Frenchay Campus using the Google Maps API and custom GeoJSON data. The application provides a user-friendly interface to explore campus buildings, facilities, and points of interest.

## Key Components

### Data Structures
- **GeoJSON Building Data**: Located in `frenchay-campus-geojson.json`
  - Features contain building polygons with properties: name, category, details, color
  - Standard categories: Academic, Recreation, Car Park, Accommodation
  - Colors are assigned per category (e.g., #387885 for Academic)

- **Points of Interest (POI)**: Defined in `frenchay-campus-map.html`
  - Structured array `pointOfInterestData` with fields: name, lat, lng, details, floorId
  - Used for searchable locations like the Students' Union and Library

### Map Features
1. **Custom Styling**
   - Uses Google Maps Cloud-based styling with ID: '9ba11c71e746911dd677c62b'
   - Toggle between custom campus style and satellite view
   - Consistent color scheme for building categories

2. **Interactive Elements**
   - Building hover effects (fillColor: '#ef4444', strokeWeight: 4)
   - InfoWindows with building details and navigation links
   - Category toggling through legend
   - POI selection with distinctive red markers

## Development Workflow

### Local Development
```bash
npm install  # Install dependencies
npm run dev  # Start development server at localhost:3000
npm run build  # Build for production
```

### Project Structure
- `frenchay-campus-map.html`: Main application file containing UI and logic
- `vite.config.js`: Development server configuration
- `frenchay-campus-geojson.json`: Campus building data
- `package.json`: Project dependencies and scripts

### Adding New Features
1. **New Buildings**
   - Add to GeoJSON structure in `frenchay-campus-geojson.json`
   - Include required properties: name, category, details, color
   - Follow existing coordinate structure for polygons

2. **New POIs**
   - Add to `pointOfInterestData` array in the HTML file
   - Required fields: name, lat, lng, details, floorId
   - POIs automatically appear in search dropdown

## Common Patterns

### Map Initialization
```javascript
// Initialize with custom styling and centered on campus
const mapInstance = new google.maps.Map(element, {
    zoom: 17,
    center: { lat: 51.5015, lng: -2.549 },
    mapId: '9ba11c71e746911dd677c62b',
    mapTypeId: 'roadmap'
});
```

### Event Handling
- Use `addListener` for map interactions
- Always provide visual feedback (hover effects, animations)
- Include navigation options in InfoWindows

### UI Components
- Modal-based main interface
- Tailwind CSS for styling (`class="..."`)
- Consistent color scheme using Tailwind's color palette

## Best Practices
1. Always provide proper context in InfoWindows (name, category, details)
2. Use semantic HTML and maintain accessibility attributes
3. Include navigation options for all locations
4. Maintain consistent styling with Tailwind CSS classes

## Integration Points
- Google Maps JavaScript API
- Tailwind CSS via CDN
- Vite for development and building

## Common Issues & Solutions
1. **Map Not Loading**: Check Google Maps API key in script URL
2. **Missing Buildings**: Verify GeoJSON coordinate format and required properties
3. **Styling Issues**: Ensure Tailwind CSS is loaded before custom styles