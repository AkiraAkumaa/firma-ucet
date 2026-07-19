import type { Attachment } from '../attachments/types'

export type WorkCategory = 'armovani' | 'monolit'

/**
 * Hodiny odpracované na konkrétní práci — čistě pro analytiku produktivity a
 * prognózu trudovitrat, NENÍ propojeno se mzdou/dluhem (viz HoursEntry, ten
 * zůstává beze změny). Osoba placená od výrobku (kus/kg) tu může mít odpracované
 * hodiny zaznamenané bez toho, aby to znamenalo hodinovou mzdu 250 Kč/h.
 */
export interface WorkHourEntry {
  id?: number
  tenantId: number
  /** ISO yyyy-mm-dd */
  date: string
  personId: number
  siteId: number
  hours: number
  workCategory: WorkCategory
  /** Volitelná vazba na konkrétní kreslení/objekt (DrawingRecord) — pro sečtení "skutečných" hodin k prognóze. */
  drawingRecordId?: number
  note?: string
}

/**
 * Datovaná příslušnost osoby k partě — na rozdíl od Person.brigadeId (jen aktuální
 * hodnota) tady držíme historii, protože lidé mezi partami přechází a produktivita
 * party musí být počítána podle toho, kde osoba SKUTEČNĚ byla v daný den.
 * Pokud pro osobu/den neexistuje žádný záznam, použije se Person.brigadeId jako fallback.
 */
export interface BrigadeMembership {
  id?: number
  tenantId: number
  personId: number
  brigadeId: number
  /** ISO yyyy-mm-dd, včetně */
  startDate: string
  /** ISO yyyy-mm-dd, včetně; chybí = stále aktivní */
  endDate?: string
}

export interface RebarDiameterMass {
  diameterMm: 6 | 8 | 10 | 12 | 14 | 16
  massKg: number
}

export interface RebarFeatures {
  massByDiameter: RebarDiameterMass[]
  /** Počet různých pozic výkazu výztuže — hlavní ukazatel složitosti. */
  positionCount: number
  /** 0..1, podíl ohýbaných prvků na celkové hmotnosti. */
  bentFraction: number
  /** Počet distančníků (ks/m²) — souhrnně za kreslení. */
  sponyCount: number
  /** Objem betonu konstrukce, kterou tato výztuž vyztužuje — potřeba pro normalizaci (hustota vyztužení). */
  concreteVolumeM3: number
  /** Prostupy, šachty, složité uzly — volný text, zatím bez strukturovaného rozboru. */
  complexNodesNote?: string
}

export interface ConcreteVolumeByThickness {
  thicknessMm: number
  volumeM3: number
}

export interface MonolithFeatures {
  concreteVolumeByThickness: ConcreteVolumeByThickness[]
  formworkAreaM2: number
  /** Počet samostatných betonáží/etap. */
  pourCount: number
}

/**
 * Jedno kreslení/objekt zadaný do modulu prognózy — ознаки se teď zadávají ručně
 * (API parsing z PDF přijde později), skutečné hodiny a poznámka o zpoždění se
 * doplní až po dokončení prací.
 */
export interface DrawingRecord {
  id?: number
  tenantId: number
  siteId?: number
  name: string
  workCategory: WorkCategory
  rebar?: RebarFeatures
  monolith?: MonolithFeatures
  /** ISO yyyy-mm-dd */
  createdDate: string
  /** ISO yyyy-mm-dd — kdy práce skutečně začala; přebíjí nejstarší WorkHourEntry, protože práce mohla začít dřív, než se zapsaly první hodiny. */
  startDate?: string
  /** Naskenované kreslení — zatím jen pro archiv, bez automatického parsování. */
  attachment?: Attachment
  /** Vyplní se při "Zaznamenat skutečnost" — normálně součet WorkHourEntry.hours s tímto drawingRecordId. */
  actualHours?: number
  /** Povinné při zaznamenání skutečnosti — hlavní hodnota pro budoucí srovnání ("co protáhlo dobu"). */
  delayNotes?: string
  /** ISO yyyy-mm-dd */
  actualRecordedDate?: string
}
