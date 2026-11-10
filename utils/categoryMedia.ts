export type CategoryMediaFields={slug:string;image?:string;cardVideo?:string;cardVideoPoster?:string}
export type EncyclopediaCategory=CategoryMediaFields & {name:string;shortName?:string;img?:string}
// Preserve the original assets until a category is explicitly edited in CMS.
export const legacyCategoryPreviews:Record<string,{src:string;poster:string}>={
  "music": {
    "src": "/videos/previews/Instruments_floating_on_opera_stage_3e75357e.mp4",
    "poster": "/images/optimized/video-first-frame-c6e2a98273d1.webp"
  },
  "geography": {
    "src": "/videos/previews/Illuminated_globe_rotating_on_map_4e2efb7e.mp4",
    "poster": "/images/optimized/video-first-frame-4e9546a8ab01.webp"
  },
  "physics": {
    "src": "/videos/previews/Glowing_atom_floating_in_space_12f9fd11.mp4",
    "poster": "/images/optimized/video-first-frame-e4e4972220ff.webp"
  },
  "biology": {
    "src": "/videos/previews/Glowing_butterfly_on_DNA_strand_929f84ef_t0-6.mp4",
    "poster": "/images/optimized/video-first-frame-f09d43ca356a.webp"
  },
  "mathematics": {
    "src": "/videos/previews/Owl_blinking_on_stone_pedestal_ee98753c.mp4",
    "poster": "/images/optimized/video-first-frame-5db14267bb82.webp"
  },
  "chemistry": {
    "src": "/videos/previews/Molecular_structure_rotating_in_…_654c41f3.mp4",
    "poster": "/images/optimized/video-first-frame-93a6e86a6353.webp"
  },
  "cinema": {
    "src": "/videos/previews/Vintage_film_projector_turning_r…_eb957e93.mp4",
    "poster": "/images/optimized/video-first-frame-650fb4c0e44b.webp"
  },
  "nature": {
    "src": "/videos/previews/Deer_and_fox_in_landscape_d0932100.mp4",
    "poster": "/images/optimized/video-first-frame-697a147e83d9.webp"
  },
  "history": {
    "src": "/videos/previews/Ancient_monuments_under_drifting…_8c16c027.mp4",
    "poster": "/images/optimized/video-first-frame-109d93bdc887.webp"
  },
  "linguistics": {
    "src": "/videos/previews/Magical_tree_sprouting_from_book_4ffec4a6.mp4",
    "poster": "/images/optimized/video-first-frame-b36b975b4af1.webp"
  },
  "technology": {
    "src": "/videos/previews/Cyberpunk_city_lights_at_night_6d880cd4.mp4",
    "poster": "/images/optimized/video-first-frame-c52d37ab7a2d.webp"
  },
  "space": {
    "src": "/videos/previews/Solar_system_planets_orbiting_sun_d14eb8ab.mp4",
    "poster": "/images/optimized/space-video-first-frame.webp"
  },
  "finance": {
    "src": "/videos/previews/Brass_scales_book_coins_abacus_db917ecf.mp4",
    "poster": "/images/optimized/finance-video-first-frame.webp"
  },
  "health": {
    "src": "/videos/previews/Holographic_human_body_and_DNA_270d202e.mp4",
    "poster": "/images/optimized/health-video-first-frame.webp"
  },
  "literature": {
    "src": "/videos/previews/Magical_figures_emerge_from_book_f81aa87e.mp4",
    "poster": "/images/optimized/literature-video-first-frame.webp"
  },
  "people": {
    "src": "/videos/previews/Historical_thinkers_against_cosm…_7be85a42.mp4",
    "poster": "/images/optimized/video-first-frame-91d65d13a4d6.webp"
  },
  "bible": {
    "src": "/videos/previews/Manuscript_page_turns_over_a45f134d.mp4",
    "poster": "/images/optimized/video-first-frame-5bbf5db1a9ad.webp"
  }
}
export function categoryMedia(category:CategoryMediaFields,fallbackImage='/images/optimized/space-art-2f2239150d.webp'){
 const legacy=legacyCategoryPreviews[category.slug]
 const image=category.image||fallbackImage
 const video=category.cardVideo!==undefined?category.cardVideo:(category.image?'':legacy?.src||'')
 return {image,video,poster:category.image||category.cardVideoPoster||legacy?.poster||image}
}
