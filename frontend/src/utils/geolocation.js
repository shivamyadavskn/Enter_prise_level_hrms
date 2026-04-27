/**
 * Browser geolocation helper.
 *
 * Returns a promise resolving to:
 *   - "lat,lng,accuracy_m"   when the user grants permission, OR
 *   - ""                     on permission denial / unsupported / timeout.
 *
 * Never rejects — callers can safely use the result as a free-form string
 * for the existing `locationIn` / `locationOut` columns.
 */
export function getLocationString({ timeoutMs = 6000 } = {}) {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      return resolve('')
    }
    let settled = false
    const done = (val) => { if (!settled) { settled = true; resolve(val) } }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords
        done(`${latitude.toFixed(6)},${longitude.toFixed(6)},${Math.round(accuracy)}m`)
      },
      () => done(''),
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 60_000 },
    )

    // Hard timeout safety net (some browsers ignore the inner timeout)
    setTimeout(() => done(''), timeoutMs + 500)
  })
}

/**
 * Parses a "lat,lng,accuracy" string back to an object, or null.
 * Useful when displaying recorded clock-in locations in admin views.
 */
export function parseLocationString(s) {
  if (!s) return null
  const [lat, lng, acc] = String(s).split(',').map((x) => x?.trim())
  const latN = Number(lat), lngN = Number(lng)
  if (Number.isNaN(latN) || Number.isNaN(lngN)) return null
  return { lat: latN, lng: lngN, accuracy: acc || null }
}
