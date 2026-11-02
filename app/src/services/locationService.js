// Live GPS Location Service for PASHU PULSE

export async function detectLiveLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({
        latitude: 12.5238,
        longitude: 76.8973,
        locationNameEn: 'Mandya Rural, Karnataka',
        locationNameKn: 'ಮಂಡ್ಯ ಗ್ರಾಮಾಂತರ, ಕರ್ನಾಟಕ',
        isGps: false,
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        try {
          // Attempt reverse geocoding via OpenStreetMap Nominatim
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=14&addressdetails=1`,
            { headers: { 'Accept-Language': 'kn,en' } }
          );
          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            const village = addr.village || addr.suburb || addr.town || addr.county || 'ಸ್ಥಳೀಯ ಪ್ರದೇಶ';
            const stateDistrict = addr.state_district || addr.district || 'ಮಂಡ್ಯ / ಮೈಸೂರು';
            const state = addr.state || 'ಕರ್ನಾಟಕ';

            const villageEn = addr.village || addr.suburb || addr.town || addr.county || 'Local Area';
            const distEn = addr.state_district || addr.district || 'Mandya / Mysuru';
            const stateEn = addr.state || 'Karnataka';

            resolve({
              latitude: lat,
              longitude: lon,
              locationNameEn: `${villageEn}, ${distEn}, ${stateEn}`,
              locationNameKn: `${village}, ${stateDistrict}, ${state}`,
              isGps: true,
            });
            return;
          }
        } catch (err) {
          // Ignore network failure and resolve coords
        }

        resolve({
          latitude: lat,
          longitude: lon,
          locationNameEn: `GPS (${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E), Karnataka`,
          locationNameKn: `ಜಿಪಿಎಸ್ (${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E), ಕರ್ನಾಟಕ`,
          isGps: true,
        });
      },
      (error) => {
        // Fallback default pilot coordinates (Mandya Central)
        resolve({
          latitude: 12.5238,
          longitude: 76.8973,
          locationNameEn: 'Mandya Taluk, Karnataka',
          locationNameKn: 'ಮಂಡ್ಯ ತಾಲ್ಲೂಕು, ಕರ್ನಾಟಕ',
          isGps: false,
        });
      },
      { timeout: 7000, enableHighAccuracy: true }
    );
  });
}
