# Earth interior mode

The `/globe` page retains its existing D3 orthographic SVG country map, search,
country details, world facts and capital quiz. It stays mounted while hidden to
preserve selection and filters. The quiz receives `paused` to stop microphone,
reading and feedback timers while hidden, without resetting scores or answers.
The new mode is a dynamically imported client-only Three.js cutaway. No new
route, geographic dataset, texture, model asset or library was added. The mode
reuses already loaded country polygons from the original globe to draw clipped
surface outlines; it never fetches another map. If opened before that map loads,
the interior remains available and receives the surface when the map finishes.

## Structure and pressure

Sources in `interior.ts` are linked in the interface. PREM Table I:
Dziewonski & Anderson (1981), doi:10.1016/0031-9201(81)90046-7,
https://lweb.cfa.harvard.edu/~lzeng/papers/PREM.pdf (pp. 308–309).
PREM's radius 6371 km, core boundaries at radii 3480 and 1221.5 km, and
crust/mantle boundary radius 6346.6 km are retained. The outer 24.4 km visual
shell combines PREM's crust and its outer 3 km water layer; the interface states
this explicitly. It is a global average, not local crustal thickness.

Pressure is numerically derived from the original PREM density polynomials,
including the ocean. Integrate mass outward and hydrostatic pressure inward
using midpoint quadrature at <=2 km spacing and every discontinuity, with
G=6.67430e-11 SI and P(surface)=0 gauge. Results are ~364.1 GPa centre,
~135.8 GPa CMB and ~329.1 GPa ICB. These are derived approximations, not copied
pressure observations. Density discontinuities remain; pressure is continuous.
The table is built once per lazy module lifetime, then interpolated by binary
search. Nothing scales with the full site catalog.

## Temperature: a separate illustrative estimate, never PREM data

Temperature is not measured directly at these depths and is not a PREM field.
We linearly interpolate a documented envelope of selected source estimates:

- Surface 15 C is an explicitly chosen reference, not a measurement.
- Crust base ~900 C is AGS's educational estimate, assigned to the model's
  average crust boundary (not a measured PREM temperature).
- McDonough, MMTE 2022 slide 11 (linked): 200 km 1720±40 K; 410 km 1860±40 K;
  660 km 1935±40 K; 2800 km 2590±60 K; core top near 3000 km 4000±500 K;
  ICB near 5150 km 6000±1000 K. Celsius values are rounded after subtracting
  273.15; the near-3000 km estimate is assigned to the PREM CMB at 2891 km.
- Hold the broad ICB envelope to the centre rather than inventing a separate
  centre temperature or an unsupported exact gradient.

This envelope is NOT a confidence interval, a self-consistent thermal inversion,
a computed equilibrium geotherm or a local borehole prediction. The lower mantle
boundary layer is approximated between sparse anchors. Temperature summaries
are educational ranges and the source differences remain explicit.

USGS structure/composition and mostly-solid mantle explanations complement PREM.
The cutaway colours, illumination and probe size are schematic. Shell radii and
thicknesses are proportional; the very thin crust is also selectable by button.
The probe is drawn on top for readability, never a physical tunnel or spacecraft.
Opening rebuilds bounded low-resolution geometries only during a short animation;
all replaced GPU geometries are disposed. Frames stop once opening finishes,
when offscreen/hidden, or on unmount. Reduced motion opens immediately. Travel
runs only on explicit request and pauses on document hiding. No textures fetched.


## Material appearance

Rock grain, metallic highlights and irregular static material patterns are
procedural shader illustrations, not observed mineral maps or physical convection
calculations. The mostly-solid mantle has a rough rock finish; liquid outer-core
metal and solid inner-core metal have different roughness and reflectivity. No
geometry, PREM boundary, temperature or pressure is changed by this styling.
A 128×64 procedural reflection environment adds depth without fetching an image.
It and all eight surface/section materials are released with the scene. Patterns
are stationary, so no new continuous animation loop is introduced.

The second material pass removes periodic concentric stripes, reduces saturation
and selection glow, and adds derivative-based surface-gradient normal shading.
The apparent small-scale relief affects illumination only: the cut faces, shell
radii and raycast targets remain unchanged. Muted rock and warmer iron-alloy
finishes are illustrative; the patterns are not real mineral grain sizes at
planetary scale. Subtle boundary shading affects ambient light only. A neutral
reflection environment replaces the stronger blue studio tint. No extra frames,
assets, network requests or dependencies are introduced.


## User-supplied cutaway reference

`public/images/Внутренние слои Земли.png` is used as a visual reference, not as a
runtime texture or a replacement for the 3D scene. The view uses a small 60-degree cut, preserving five sixths of the sphere,
with muted warm rock and metal colours inspired by the illustration. The globe
is never split into detached pieces or reduced to a half-sphere. This is a colour convention, not a
measurement of emitted light. USGS/PREM structure, boundaries and descriptions
remain unchanged (in particular the mostly-solid mantle).

A bounded 1024×512 canvas albedo is drawn from the original globe's already loaded
Natural Earth polygons; it adds blue oceans and muted land colours. Static clouds
are procedural illustrations, not weather data. No new map/image request is made.
Longitudes crossing the antimeridian are unwrapped and repeated; the South Pole
closes through the pole. Sphere UVs retain their global longitude as the cut opens,
so the map never stretches around a partial sphere. The canvas texture is released
when replaced or on teardown. The supplied large reference PNG is never fetched
by the viewer.
