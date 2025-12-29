// Quick demo of city selection functionality
import { selectCitiesForLevel, CITIES } from './src/data/cities.ts';

console.log('=== GeoQuest City Database Demo ===\n');

console.log(`Total cities in database: ${CITIES.length}`);
console.log(`Tier 1 cities: ${CITIES.filter(c => c.tier === 1).length}`);
console.log(`Tier 2 cities: ${CITIES.filter(c => c.tier === 2).length}`);
console.log(`Tier 3 cities: ${CITIES.filter(c => c.tier === 3).length}\n`);

// Level 1-3: Uses only Tier 1 cities
console.log('Level 1 (Tier 1 cities only):');
const level1Cities = selectCitiesForLevel(1);
level1Cities.forEach(city => {
  console.log(`  - ${city.name}, ${city.country} (Tier ${city.tier})`);
});

console.log('\nLevel 5 (Tier 1 & 2 cities):');
const level5Cities = selectCitiesForLevel(5);
level5Cities.forEach(city => {
  console.log(`  - ${city.name}, ${city.country} (Tier ${city.tier})`);
});

console.log('\nLevel 10 (All tiers):');
const level10Cities = selectCitiesForLevel(10);
level10Cities.forEach(city => {
  console.log(`  - ${city.name}, ${city.country} (Tier ${city.tier})`);
});
