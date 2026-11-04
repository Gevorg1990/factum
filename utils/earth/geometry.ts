import { BufferGeometry, Float32BufferAttribute, SphereGeometry } from 'three'
export const EARTH_CUT_ANGLE = Math.PI / 3

/** Same polar convention as Three SphereGeometry; radial section, not a flat picture. */
export function sectionGeometry(inner: number, outer: number, phi: number, reverse=false) {
  const positions: number[]=[]
  const point=(r:number,t:number)=>[-r*Math.cos(phi)*Math.sin(t),r*Math.cos(t),r*Math.sin(phi)*Math.sin(t)]
  for(let i=0;i<64;i++) {
    const a=i*Math.PI/64,b=(i+1)*Math.PI/64
    const vertices=[point(inner,a),point(outer,a),point(outer,b),point(inner,a),point(outer,b),point(inner,b)]
    if(reverse) { [vertices[1],vertices[2]]=[vertices[2]!,vertices[1]!]; [vertices[4],vertices[5]]=[vertices[5]!,vertices[4]!] }
    for(const v of vertices) positions.push(...v)
  }
  const geometry=new BufferGeometry()
  geometry.setAttribute('position',new Float32BufferAttribute(positions,3)); geometry.computeVertexNormals()
  return geometry
}
export function shellSurface(radius: number, opening: number) {
  const geometry=new SphereGeometry(radius,64,40,opening,Math.PI*2-opening)
  // Preserve global longitude when opening the wedge; default partial-sphere UVs stretch the whole map.
  const uv=geometry.getAttribute('uv'),start=opening/(Math.PI*2),span=1-start
  for(let i=0;i<uv.count;i++)uv.setX(i,Math.max(0,Math.min(1,start+uv.getX(i)*span)))
  return geometry
}
