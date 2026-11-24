import type {Person} from './personTypes'
import {artistPortraits} from './art/artistPortraits'
import {biography as vanGogh} from './biographies/Vincent_Van_Gogh_Biography'
import {biography as monet} from './biographies/Claude_Monet_Biography'
import {biography as leonardo} from './biographies/Leonardo_Da_Vinci_Biography'
import {biography as cassatt} from './biographies/Mary_Cassatt_Biography'
import {biography as seurat} from './biographies/Georges_Seurat_Biography'
import {biography as caillebotte} from './biographies/Gustave_Caillebotte_Biography'
import {biography as renoir} from './biographies/Pierre_Auguste_Renoir_Biography'

const artists:[string,string,string,string[],Partial<Person>][]=[
  ['vincent-van-gogh','Վինսենթ վան Գոգ','1853–1890',['Աստղալից գիշեր','Արևածաղիկներ','Հիրիկներ'],vanGogh],
  ['claude-monet','Կլոդ Մոնե','1840–1926',['Ջրաշուշաններ','Տպավորություն. արևածագ','Կակաչներ'],monet],
  ['leonardo-da-vinci','Լեոնարդո դա Վինչի','1452–1519',['Մոնա Լիզա','Խորհրդավոր ընթրիք','Ժայռերի Տիրամայրը'],leonardo],
  ['mary-cassatt','Մերի Կասատ','1844–1926',['Երեխայի լոգանքը','Փոքրիկ աղջիկը կապույտ բազկաթոռում'],cassatt],
  ['georges-seurat','Ժորժ Սյորա','1859–1891',['Կիրակի Լա Գրանդ Ժատ կղզում','Լողացողները Անյերում'],seurat],
  ['gustave-caillebotte','Գյուստավ Կայբոտ','1848–1894',['Փարիզի փողոցը անձրևոտ օր','Հատակ հարթեցնողները'],caillebotte],
  ['pierre-auguste-renoir','Պիեռ Օգյուստ Ռենուար','1841–1919',['Պար Մուլեն դը լա Գալետում','Երկու քույր'],renoir],
]

export const artistPeople:Person[]=artists.map(([id,name,years,works,biography])=>({
  id,name,years,works,role:'Նկարիչ',category:'Կերպարվեստ և ճարտարապետություն',isArmenian:false,
  bio:artistPortraits[name]!.bio,portrait:artistPortraits[name]!.image,
  biographySections:biography.biographySections,timeline:biography.timeline,biographyDocument:biography.biographyDocument,source:biography.source,
}))
