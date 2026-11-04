import { CanvasTexture, SRGBColorSpace } from 'three'
import type { CountryFeature } from '../globe'
/** Render the existing vector map as albedo; no image download or reference-image texture. */
export function createEarthSurfaceTexture(features: readonly CountryFeature[]) {
  if (!features.length || typeof document.createElement !== 'function') return null
  const canvas=document.createElement('canvas')
  canvas.width=1024;canvas.height=512
  const context=canvas.getContext('2d')
  if(!context)return null
  const ocean=context.createLinearGradient(0,0,0,512)
  ocean.addColorStop(0,'#185272');ocean.addColorStop(.45,'#0a4267');ocean.addColorStop(.7,'#104d73');ocean.addColorStop(1,'#226281')
  context.fillStyle=ocean;context.fillRect(0,0,1024,512)
  const land=context.createLinearGradient(0,0,0,512)
  for(const [position,color] of [[0,'#e7ece0'],[.12,'#d4d9ba'],[.22,'#778b59'],[.34,'#aa9c68'],[.44,'#587441'],[.52,'#335d37'],[.64,'#718152'],[.8,'#9a9f7a'],[.93,'#e3e8df'],[1,'#edf2ea']] as const)land.addColorStop(position,color)
  context.fillStyle=land
  for(const feature of features){
    const polygons=feature.geometry.type==='Polygon'?[feature.geometry.coordinates]:feature.geometry.coordinates
    for(const polygon of polygons)for(const shift of [-1024,0,1024]){
      context.beginPath()
      for(const ring of polygon){
        if(!ring.length||!ring.every(point=>point.length>=2&&Number.isFinite(point[0])&&Number.isFinite(point[1])&&Math.abs(point[0]!)<=180&&Math.abs(point[1]!)<=90))continue
        let previous=ring[0]![0]!,firstX=0,lastX=0
        for(let i=0;i<ring.length;i++){
          let lon=ring[i]![0]!
          while(lon-previous>180)lon-=360
          while(lon-previous< -180)lon+=360
          previous=lon
          const x=(lon+180)/360*1024+shift,y=(90-ring[i]![1]!)/180*512
          if(i===0){context.moveTo(x,y);firstX=x}else context.lineTo(x,y)
          lastX=x
        }
        // A ring winding around the South Pole must close through the pole in equirectangular space.
        if(Math.abs(lastX-firstX)>900&&ring.every(point=>point[1]!< -50)){context.lineTo(lastX,512);context.lineTo(firstX,512)}
        context.closePath()
      }
      context.fill('evenodd')
    }
  }
  const texture=new CanvasTexture(canvas)
  texture.colorSpace=SRGBColorSpace
  texture.anisotropy=2
  return texture
}
