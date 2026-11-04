# Atom viewer data

The existing 118-element catalog in `data/periodicElements.json` remains the source
of atomic numbers and electron configurations. No element records are replaced.

`atomIsotopes.json` is an offline snapshot of the **selected isotopes** in the
[NIST Atomic Weights and Isotopic Compositions table](https://physics.nist.gov/cgi-bin/Compositions/stand_alone.pl?ascii=ascii).
It is not an exhaustive list of known nuclides. Each `massNumber` is the integer
isotope mass number printed in that table, never a rounded atomic weight.
Neutrons are calculated as `massNumber - atomicNumber`.

`abundance` is NIST's representative isotopic amount fraction, without its printed
uncertainty. `null` means unspecified, not zero, and implies no stability claim.
The initial isotope is the one with the largest stated fraction, or the first
listed isotope when no fraction is supplied. No half-lives or isotope atomic
masses are inferred or displayed. Use `scripts/prepare-atom-isotopes.mjs` with a
downloaded NIST ASCII table to reproduce the snapshot.

Electron counts per principal shell are calculated by expanding the existing
[PubChem](https://pubchem.ncbi.nlm.nih.gov/periodic-table) configurations. Noble-gas
cores and exceptions such as chromium and palladium are retained. Calculated or
predicted configurations are explicitly identified in the viewer.

The shell mode in the Three.js scene is an educational schematic, not a quantum simulation.
Circular orbits, particle sizes, nuclear positions and distances are not physical
predictions. The UI states these limitations. No model assets or textures are
fetched; Three.js and this snapshot load only after opening the atom tab.

## Orbital probability view

The optional cloud mode samples normalized non-relativistic hydrogenic orbitals
(Z=1, radii in Bohr units) from `|ψ|²`. The radial function uses generalized
Laguerre polynomials; real spherical harmonics are normalized combinations of
±m complex harmonics. The orientation selector does **not** claim a real p_x,
p_y, etc. orbital has a definite magnetic quantum number. Source:
[MIT 5.61 lectures 21–22, Hydrogen Atom](https://www.ocw.mit.edu/courses/5-61-physical-chemistry-fall-2007/c2078ff25c61c136e67ceb6fd8eb9b34_lecture21to22.pdf).

The radial CDF numerically integrates `r²|R|²` and validates normalization.
Angular rejection sampling uses `|Y|² dΩ`, bounded by the harmonic addition
 theorem. Each cloud has 12,000 possible observations, not 12,000 electrons.
Blue/gold encode wavefunction sign, not charge. Rotation only changes the view.
A half-space cutaway can expose radial nodes; visibility changes alpha only.

Occupied subshells come from the existing configuration, including exceptions.
Subshell occupancy is not an assignment to one chosen orbital (capacity 2).
For atoms with more than one electron, this is **only a hydrogenic basis shape**,
not the actual atom's full density or an ab initio calculation. No screening,
electron correlation, relativistic effects, spin or fine structure are modeled.
Even hydrogen is non-relativistic with a fixed nucleus approximation.

Each orbital is rescaled so its 95% radial probability fits the viewport; samples
outside that radius remain present. Thus clouds cannot compare actual atom
sizes. The nucleus is a deliberately oversized schematic marker. n−l−1 radial
and l angular nodes describe the selected basis orbital, not the whole atom.

Sampling runs in a worker loaded only on demand; changing selection terminates
stale work. A maximum of eight clouds is cached per mounted viewer. Platforms
without Worker support use the same bounded computation on the main thread.
The renderer uses one Points draw call for the cloud and disposes replaced GPU
buffers. No additional dependency or external runtime API has been introduced.

## Learning through the model

The viewer opens with the nucleus and electron-shell schematic. A single learning
sequence connects protons, neutrons, electrons, isotopes, orbital clouds and
phase legends to the current element. Lesson buttons only change explanatory text and never change
the view, camera, rotation or particle highlighting. Coordinate axes are not
displayed. For an isotope without neutrons,
the text explains their absence instead of adding a fictitious particle.
Atomic structure explanations are based on the
[NRC Science 101 atom overview](https://www.nrc.gov/education-regulatory-research/the-student-corner/science-101/what-is-an-atom).
There are no beginner/advanced variants: unfamiliar terms have explanations next
to the relevant controls, with the mathematical details expandable in place.


## Five reading topics

`atomLessons.ts` contains original Armenian explanations (300–500 words of body
text per topic) for proton, neutron, electron, isotope and electron cloud. Each
has six subsections and links to primary institutional/research sources. The
current element/isotope counts appear separately as contextual examples; no
unknown stability, lifetime or isotope mass is inferred. The content module is
imported by the lazy explorer, not the table or homepage.

The “What is…” particle links select text, scroll to its heading and move keyboard
focus without changing the camera, model, particles or animation. The five topic
tabs themselves change only text. Dropdowns use a shared bounded listbox with
numeric/string values preserved, keyboard navigation, Armenian typeahead,
outside/Escape dismissal, focus restoration and a viewport-aware opening side.
