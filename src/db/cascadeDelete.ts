import type { EntityTable } from 'dexie'
import { db } from './db'

async function deleteWhere<T extends { id?: number }>(table: EntityTable<T, 'id'>, predicate: (item: T) => boolean) {
  const ids = (await table.toArray()).filter(predicate).map((item) => item.id!)
  await table.bulkDelete(ids as unknown as Parameters<typeof table.bulkDelete>[0])
}

/** Smaže osoby a všechny záznamy, které na ně odkazují — jinak by jejich dluh dál strašil v Přehledu. */
export async function deletePeople(personIds: number[]): Promise<void> {
  if (personIds.length === 0) return
  const ids = new Set(personIds)
  await db.transaction(
    'rw',
    [
      db.people,
      db.hoursEntries,
      db.outputEntries,
      db.salaryEntries,
      db.expenses,
      db.payments,
      db.insuranceOverrides,
      db.workHourEntries,
      db.brigadeMemberships,
    ],
    async () => {
      await deleteWhere(db.hoursEntries, (e) => ids.has(e.personId))
      await deleteWhere(db.outputEntries, (e) => ids.has(e.personId))
      await deleteWhere(db.salaryEntries, (e) => ids.has(e.personId))
      await deleteWhere(db.expenses, (e) => e.paidByPersonId != null && ids.has(e.paidByPersonId))
      await deleteWhere(db.payments, (p) => ids.has(p.personId))
      await deleteWhere(db.insuranceOverrides, (o) => ids.has(o.personId))
      await deleteWhere(db.workHourEntries, (e) => ids.has(e.personId))
      await deleteWhere(db.brigadeMemberships, (m) => ids.has(m.personId))
      await db.people.bulkDelete(personIds)
    },
  )
}

export async function deletePerson(personId: number): Promise<void> {
  await deletePeople([personId])
}

/** Smaže brigády i všechny osoby v nich (a tím i jejich záznamy, viz deletePeople). */
export async function deleteBrigades(brigadeIds: number[]): Promise<void> {
  if (brigadeIds.length === 0) return
  await db.transaction(
    'rw',
    [
      db.brigades,
      db.people,
      db.hoursEntries,
      db.outputEntries,
      db.salaryEntries,
      db.expenses,
      db.payments,
      db.insuranceOverrides,
      db.workHourEntries,
      db.brigadeMemberships,
    ],
    async () => {
      const brigadeIdSet = new Set(brigadeIds)
      const peopleInBrigades = await db.people.where('brigadeId').anyOf(brigadeIds).toArray()
      const personIds = new Set(peopleInBrigades.map((p) => p.id!))
      await deleteWhere(db.hoursEntries, (e) => personIds.has(e.personId))
      await deleteWhere(db.outputEntries, (e) => personIds.has(e.personId))
      await deleteWhere(db.salaryEntries, (e) => personIds.has(e.personId))
      await deleteWhere(db.expenses, (e) => e.paidByPersonId != null && personIds.has(e.paidByPersonId))
      await deleteWhere(db.payments, (p) => personIds.has(p.personId))
      await deleteWhere(db.insuranceOverrides, (o) => personIds.has(o.personId))
      await deleteWhere(db.workHourEntries, (e) => personIds.has(e.personId))
      await deleteWhere(db.brigadeMemberships, (m) => personIds.has(m.personId) || brigadeIdSet.has(m.brigadeId))
      await db.people.where('brigadeId').anyOf(brigadeIds).delete()
      await db.brigades.bulkDelete(brigadeIds)
    },
  )
}

export async function deleteBrigade(brigadeId: number): Promise<void> {
  await deleteBrigades([brigadeId])
}

/** Smaže stavby a všechny záznamy (mzdy, výdaje, materiál, platby zákazníka, plán), které na ně odkazují. */
export async function deleteSites(siteIds: number[]): Promise<void> {
  if (siteIds.length === 0) return
  const ids = new Set(siteIds)
  await db.transaction(
    'rw',
    [
      db.sites,
      db.hoursEntries,
      db.outputEntries,
      db.salaryEntries,
      db.expenses,
      db.siteCustomerPayments,
      db.siteMaterialCosts,
      db.siteWorkPlans,
      db.siteWorkProgress,
      db.workHourEntries,
      db.drawingRecords,
    ],
    async () => {
      await deleteWhere(db.hoursEntries, (e) => ids.has(e.siteId))
      await deleteWhere(db.outputEntries, (e) => ids.has(e.siteId))
      await deleteWhere(db.salaryEntries, (e) => e.siteId != null && ids.has(e.siteId))
      await deleteWhere(db.expenses, (e) => e.siteId != null && ids.has(e.siteId))
      await deleteWhere(db.siteCustomerPayments, (p) => ids.has(p.siteId))
      await deleteWhere(db.siteMaterialCosts, (m) => ids.has(m.siteId))
      await deleteWhere(db.siteWorkPlans, (p) => ids.has(p.siteId))
      await deleteWhere(db.siteWorkProgress, (p) => ids.has(p.siteId))
      await deleteWhere(db.workHourEntries, (e) => ids.has(e.siteId))
      await deleteWhere(db.drawingRecords, (d) => d.siteId != null && ids.has(d.siteId))
      await db.sites.bulkDelete(siteIds)
    },
  )
}

export async function deleteSite(siteId: number): Promise<void> {
  await deleteSites([siteId])
}

/** Smaže druhy práce a všechny záznamy výrobku i plánu, které na ně odkazují. */
export async function deleteWorkTypes(workTypeIds: number[]): Promise<void> {
  if (workTypeIds.length === 0) return
  const ids = new Set(workTypeIds)
  await db.transaction('rw', [db.workTypes, db.outputEntries, db.siteWorkPlans, db.siteWorkProgress], async () => {
    await deleteWhere(db.outputEntries, (e) => ids.has(e.workTypeId))
    await deleteWhere(db.siteWorkPlans, (p) => ids.has(p.workTypeId))
    await deleteWhere(db.siteWorkProgress, (p) => ids.has(p.workTypeId))
    await db.workTypes.bulkDelete(workTypeIds)
  })
}

export async function deleteWorkType(workTypeId: number): Promise<void> {
  await deleteWorkTypes([workTypeId])
}

/** Smaže kategorie výdajů a všechny výdaje, které na ně odkazují. */
export async function deleteExpenseCategories(categoryIds: number[]): Promise<void> {
  if (categoryIds.length === 0) return
  const ids = new Set(categoryIds)
  await db.transaction('rw', [db.expenseCategories, db.expenses], async () => {
    await deleteWhere(db.expenses, (e) => ids.has(e.categoryId))
    await db.expenseCategories.bulkDelete(categoryIds)
  })
}

export async function deleteExpenseCategory(categoryId: number): Promise<void> {
  await deleteExpenseCategories([categoryId])
}

export interface OrphanCleanupResult {
  hoursEntries: number
  outputEntries: number
  salaryEntries: number
  expenses: number
  payments: number
  siteCustomerPayments: number
  siteMaterialCosts: number
  siteWorkPlans: number
  siteWorkProgress: number
  insuranceOverrides: number
  workHourEntries: number
  brigadeMemberships: number
  drawingRecords: number
}

/**
 * Jednorázový úklid záznamů osiřelých ještě PŘED zavedením kaskádního mazání výše —
 * mazání osoby/stavby/atd. tehdy nechávalo jejich hodiny/mzdy/výdaje v databázi,
 * a ty se dál započítávaly do dluhu a ziskovosti, i když osoba/stavba už neexistuje.
 */
export async function pruneOrphanedRecords(): Promise<OrphanCleanupResult> {
  const [personIds, siteIds, workTypeIds, categoryIds, brigadeIds] = await Promise.all([
    db.people.toCollection().primaryKeys(),
    db.sites.toCollection().primaryKeys(),
    db.workTypes.toCollection().primaryKeys(),
    db.expenseCategories.toCollection().primaryKeys(),
    db.brigades.toCollection().primaryKeys(),
  ])
  const people = new Set(personIds as number[])
  const sites = new Set(siteIds as number[])
  const workTypes = new Set(workTypeIds as number[])
  const categories = new Set(categoryIds as number[])
  const brigades = new Set(brigadeIds as number[])

  return db.transaction(
    'rw',
    [
      db.hoursEntries,
      db.outputEntries,
      db.salaryEntries,
      db.expenses,
      db.payments,
      db.siteCustomerPayments,
      db.siteMaterialCosts,
      db.siteWorkPlans,
      db.siteWorkProgress,
      db.insuranceOverrides,
      db.workHourEntries,
      db.brigadeMemberships,
      db.drawingRecords,
    ],
    async () => {
      const countAndDelete = async <T extends { id?: number }>(
        table: EntityTable<T, 'id'>,
        predicate: (item: T) => boolean,
      ) => {
        const before = await table.count()
        await deleteWhere(table, predicate)
        return before - (await table.count())
      }

      return {
        hoursEntries: await countAndDelete(
          db.hoursEntries,
          (e) => !people.has(e.personId) || (e.siteId != null && !sites.has(e.siteId)),
        ),
        outputEntries: await countAndDelete(
          db.outputEntries,
          (e) => !people.has(e.personId) || !sites.has(e.siteId) || !workTypes.has(e.workTypeId),
        ),
        salaryEntries: await countAndDelete(
          db.salaryEntries,
          (e) => !people.has(e.personId) || (e.siteId != null && !sites.has(e.siteId)),
        ),
        expenses: await countAndDelete(
          db.expenses,
          (e) =>
            (e.paidByPersonId != null && !people.has(e.paidByPersonId)) ||
            !categories.has(e.categoryId) ||
            (e.siteId != null && !sites.has(e.siteId)),
        ),
        payments: await countAndDelete(db.payments, (p) => !people.has(p.personId)),
        siteCustomerPayments: await countAndDelete(db.siteCustomerPayments, (p) => !sites.has(p.siteId)),
        siteMaterialCosts: await countAndDelete(db.siteMaterialCosts, (m) => !sites.has(m.siteId)),
        siteWorkPlans: await countAndDelete(
          db.siteWorkPlans,
          (p) => !sites.has(p.siteId) || !workTypes.has(p.workTypeId),
        ),
        siteWorkProgress: await countAndDelete(
          db.siteWorkProgress,
          (p) => !sites.has(p.siteId) || !workTypes.has(p.workTypeId),
        ),
        insuranceOverrides: await countAndDelete(db.insuranceOverrides, (o) => !people.has(o.personId)),
        workHourEntries: await countAndDelete(
          db.workHourEntries,
          (e) => !people.has(e.personId) || !sites.has(e.siteId),
        ),
        brigadeMemberships: await countAndDelete(
          db.brigadeMemberships,
          (m) => !people.has(m.personId) || !brigades.has(m.brigadeId),
        ),
        drawingRecords: await countAndDelete(db.drawingRecords, (d) => d.siteId != null && !sites.has(d.siteId)),
      }
    },
  )
}
