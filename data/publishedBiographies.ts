import type { Person } from './personTypes'
import { biography as biography0 } from './biographies/Albert_Einstein_Biography'
import { biography as biography1 } from './biographies/Mesrop_Mashtots_Biography'
import { biography as biography2 } from './biographies/Khachatur_Abovyan_Biography'
import { biography as biography3 } from './biographies/Mikayel_Nalbandyan_Biography'
import { biography as biography4 } from './biographies/Ghazaros_Aghayan_Biography'
import { biography as biography11 } from './biographies/Vahan_Teryan_Biography'
import { biography as biography15 } from './biographies/Aksel_Bakunts_Biography'
import { biography as biography54 } from './biographies/Momik_Biography'
import { biography as biography68 } from './biographies/Charles_Aznavour_Biography'
import { biography as biography80 } from './biographies/Abraham_Alikhanov_Biography'
import { tumanyanBiography } from './biographies/Hovhannes_Tumanyan_Biography'
import { raffiBiography } from './biographies/Raffi_Biography'
import { komitasBiography } from './biographies/Komitas_Biography'
import { hambardzumyanBiography } from './biographies/Viktor_Hambardzumyan_Biography'

// Only published profiles are included in browser-facing catalog bundles.
export const publishedBiographies: Record<string, Partial<Person>> = {
  'abovyan': biography2,
  'abraham-alikhanov': biography80,
  'aghayan': biography4,
  'aznavour': biography68,
  'bakunts': biography15,
  'einstein': biography0,
  'hambardzumyan': hambardzumyanBiography,
  'komitas': komitasBiography,
  'mashtots': biography1,
  'momik': biography54,
  'nalbandian': biography3,
  'raffi': raffiBiography,
  'teryan': biography11,
  'tumanyan': tumanyanBiography,
}
