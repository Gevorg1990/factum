import test from 'node:test'
import assert from 'node:assert/strict'
import { moduleUrl } from './helpers/catalog.mjs'
const q = await import(moduleUrl(new URL('../utils/chemistry/orbitals.ts', import.meta.url)))
const close = (a,b,tolerance=1e-8) => assert.ok(Math.abs(a-b)<tolerance, `${a} differs from ${b}`)
test('hydrogenic ground state, analytic nodes and all supported radial normalizations', () => {
  close(q.orbitalDensity({n:1,l:0,m:0},0,0,0),1/Math.PI)
  close(q.orbitalDensity({n:1,l:0,m:0},1,0,0),Math.exp(-2)/Math.PI)
  close(q.radialWavefunction(2,0,2),0)
  close(q.orbitalDensity({n:2,l:1,m:0},1,0,0),0)
  close(q.orbitalDensity({n:3,l:2,m:-2},0,2,1),0)
  for(let n=1;n<=7;n++) for(let l=0;l<Math.min(n,4);l++) {
    close(q.radialDistribution(n,l).integratedProbability,1,1e-6)
    assert.equal(q.orbitalOrientations(l).length,2*l+1)
  }
  assert.throws(()=>q.sampleOrbital({n:2,l:2,m:0}),/Invalid orbital/)
})
test('all real spherical harmonics integrate to one on the sphere', () => {
  for(let l=0;l<=3;l++) for(let m=-l;m<=l;m++) {
    let integral=0
    const steps=160
    for(let i=0;i<steps;i++) for(let j=0;j<steps;j++) integral+=q.realSphericalHarmonic(l,m,-1+2*(i+.5)/steps,2*Math.PI*(j+.5)/steps)**2 * 4*Math.PI/steps**2
    close(integral,1,.0006)
  }
})
test('sample clouds preserve probability moments, orientation, phase and reproducibility', () => {
  const s=q.sampleOrbital({n:1,l:0,m:0},12000,42)
  let radius=0,x2=0,z2=0
  for(let i=0;i<s.phases.length;i++) {
    const [x,y,z]=s.positions.slice(3*i,3*i+3)
    radius+=Math.hypot(x,y,z); x2+=x*x; z2+=z*z
    assert.equal(s.phases[i],1)
  }
  close(radius/12000,1.5,.04)
  close(x2/z2,1,.08)
  const p=q.sampleOrbital({n:2,l:1,m:0},12000,42)
  let axial=0,transverse=0
  for(let i=0;i<12000;i++) { axial+=p.positions[3*i+2]**2; transverse+=p.positions[3*i]**2 }
  close(axial/transverse,3,.2)
  assert.ok(p.phases.includes(-1) && p.phases.includes(1))
  assert.deepEqual(q.sampleOrbital({n:4,l:3,m:-3},128,2),q.sampleOrbital({n:4,l:3,m:-3},128,2))
})
