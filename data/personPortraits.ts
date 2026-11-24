// Local portraits determine which Armenian profiles are published.
export const armenianPortraits: Record<string, string> = {
  'tumanyan': '/images/armenian-people/Hovhannes_Tumanyan.jpg',
  'raffi': '/images/armenian-people/Raffi.jpg',
  'bakunts': '/images/armenian-people/Aksel_Bakunts.jpg',
  'momik': '/images/armenian-people/Momik.jpeg',
  'aznavour': '/images/armenian-people/Charles_Aznavour.jpg',
  'abraham-alikhanov': '/images/armenian-people/Abraham_Alikhanov.jpg',
  'aghayan': '/images/armenian-people/Ghazaros_Aghayan.jpg',
  'abovyan': '/images/armenian-people/Khachatur_Abovyan.jpg',
  'nalbandian': '/images/armenian-people/Mikayel_Nalbandyan.jpg',
  'teryan': '/images/armenian-people/Vahan_Teryan.jpg',
  'komitas': '/images/armenian-people/Komitas.jpg',
  'mashtots': '/images/armenian-people/Mesrop_Mashtots.jpg',
  'hambardzumyan': '/images/armenian-people/Viktor_Hambardzumyan.jpg',
}
export const localPortraits: Record<string, string> = {
  einstein: '/images/people/einstein.jpg', ...armenianPortraits,
  'vincent-van-gogh':'/images/art/self-portrait.webp',
  'claude-monet':'/images/art/artists/monet.webp',
  'leonardo-da-vinci':'/images/art/artists/leonardo.webp',
  'mary-cassatt':'/images/art/artists/cassatt.webp',
  'georges-seurat':'/images/art/artists/seurat.webp',
  'gustave-caillebotte':'/images/art/artists/caillebotte.webp',
  'pierre-auguste-renoir':'/images/art/artists/renoir.webp',
}
