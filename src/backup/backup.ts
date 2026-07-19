import type { EntityTable } from 'dexie'
import { db } from '../db/db'
import { deserializeAttachment, serializeAttachment, type SerializedAttachment } from '../domain/attachments/serialize'
import type { Attachment } from '../domain/attachments/types'
import type { Brigade } from '../domain/brigades/types'
import type { Person } from '../domain/people/types'
import type { Site } from '../domain/sites/types'
import type { WorkType } from '../domain/workTypes/types'
import type { ExpenseCategory } from '../domain/expenseCategories/types'
import type { HoursEntry } from '../domain/hours/types'
import type { OutputEntry } from '../domain/output/types'
import type { Expense } from '../domain/expenses/types'
import type { Payment } from '../domain/payments/types'
import type { SiteCustomerPayment, SiteMaterialCost, SiteWorkPlan, SiteWorkProgressEntry } from '../domain/profitability/types'
import type { SalaryEntry } from '../domain/salary/types'
import type { InsuranceOverride } from '../domain/people/types'
import type { BrigadeMembership, DrawingRecord, WorkHourEntry } from '../domain/analytics/types'
import { getActiveTenantId } from '../tenant/activeTenant'

const BACKUP_VERSION = 1

type WithSerializedAttachment<T extends { attachment?: unknown }> = Omit<T, 'attachment'> & {
  attachment?: SerializedAttachment
}

async function serializeAttachments<T extends { attachment?: { fileName: string; mimeType: string; blob: Blob } }>(
  items: T[],
): Promise<WithSerializedAttachment<T>[]> {
  return Promise.all(
    items.map(async (item) => {
      if (!item.attachment) return item as WithSerializedAttachment<T>
      return { ...item, attachment: await serializeAttachment(item.attachment) }
    }),
  )
}

function deserializeAttachments<Base extends { attachment?: Attachment }>(
  items: WithSerializedAttachment<Base>[] | undefined,
): Base[] {
  if (!items) return []
  return items.map((item): Base => {
    if (!item.attachment) return item as unknown as Base
    return { ...item, attachment: deserializeAttachment(item.attachment) } as unknown as Base
  })
}

export async function exportBackup(): Promise<void> {
  const tenantId = getActiveTenantId()
  if (tenantId == null) return

  const byTenant = <T extends { id?: number }>(table: EntityTable<T, 'id'>): Promise<T[]> =>
    table.where('tenantId').equals(tenantId).toArray()

  const [hoursEntries, outputEntries, expenses, siteMaterialCosts, siteWorkProgress, salaryEntries, drawingRecords] =
    await Promise.all([
      byTenant(db.hoursEntries),
      byTenant(db.outputEntries),
      byTenant(db.expenses),
      byTenant(db.siteMaterialCosts),
      byTenant(db.siteWorkProgress),
      byTenant(db.salaryEntries),
      byTenant(db.drawingRecords),
    ])

  const data = {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    brigades: await byTenant(db.brigades),
    people: await byTenant(db.people),
    sites: await byTenant(db.sites),
    workTypes: await byTenant(db.workTypes),
    expenseCategories: await byTenant(db.expenseCategories),
    hoursEntries: await serializeAttachments(hoursEntries),
    outputEntries: await serializeAttachments(outputEntries),
    expenses: await serializeAttachments(expenses),
    payments: await byTenant(db.payments),
    siteCustomerPayments: await byTenant(db.siteCustomerPayments),
    siteMaterialCosts: await serializeAttachments(siteMaterialCosts),
    siteWorkPlans: await byTenant(db.siteWorkPlans),
    siteWorkProgress: await serializeAttachments(siteWorkProgress),
    salaryEntries: await serializeAttachments(salaryEntries),
    insuranceOverrides: await byTenant(db.insuranceOverrides),
    brigadeMemberships: await byTenant(db.brigadeMemberships),
    drawingRecords: await serializeAttachments(drawingRecords),
    workHourEntries: await byTenant(db.workHourEntries),
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `ucet-firm-backup-${new Date().toISOString().slice(0, 10)}.json`
  link.click()
  URL.revokeObjectURL(url)
}

interface BackupData {
  version: number
  brigades?: Brigade[]
  people?: Person[]
  sites?: Site[]
  workTypes?: WorkType[]
  expenseCategories?: ExpenseCategory[]
  hoursEntries?: WithSerializedAttachment<HoursEntry>[]
  outputEntries?: WithSerializedAttachment<OutputEntry>[]
  expenses?: WithSerializedAttachment<Expense>[]
  payments?: Payment[]
  siteCustomerPayments?: SiteCustomerPayment[]
  siteMaterialCosts?: WithSerializedAttachment<SiteMaterialCost>[]
  siteWorkPlans?: SiteWorkPlan[]
  siteWorkProgress?: WithSerializedAttachment<SiteWorkProgressEntry>[]
  salaryEntries?: WithSerializedAttachment<SalaryEntry>[]
  insuranceOverrides?: InsuranceOverride[]
  brigadeMemberships?: BrigadeMembership[]
  drawingRecords?: WithSerializedAttachment<DrawingRecord>[]
  workHourEntries?: WorkHourEntry[]
}

function isBackupData(value: unknown): value is BackupData {
  return typeof value === 'object' && value !== null && 'version' in value
}

/**
 * Vloží záznam BEZ původního id (ať se nekříží s ID cizí firmy) a vrátí nové id —
 * volající si podle staré hodnoty dohledá novou přes vrácenou mapu.
 */
async function addRemapped<T extends { id?: number; tenantId: number }>(
  table: EntityTable<T, 'id'>,
  item: T,
  tenantId: number,
  overrides: Partial<T> = {},
): Promise<number> {
  const { id: _oldId, ...rest } = item
  const newId = await table.add({ ...rest, ...overrides, tenantId } as T)
  return newId as number
}

export async function importBackup(file: File): Promise<void> {
  const text = await file.text()
  const parsed: unknown = JSON.parse(text)
  if (!isBackupData(parsed)) {
    throw new Error('Invalid backup file')
  }

  const tenantId = getActiveTenantId()
  if (tenantId == null) throw new Error('No active company')

  await db.transaction(
    'rw',
    [
      db.brigades,
      db.people,
      db.sites,
      db.workTypes,
      db.expenseCategories,
      db.hoursEntries,
      db.outputEntries,
      db.expenses,
      db.payments,
      db.siteCustomerPayments,
      db.siteMaterialCosts,
      db.siteWorkPlans,
      db.siteWorkProgress,
      db.salaryEntries,
      db.insuranceOverrides,
      db.brigadeMemberships,
      db.drawingRecords,
      db.workHourEntries,
    ],
    async () => {
      // Smaže jen záznamy AKTIVNÍ firmy — data ostatních firem zůstávají nedotčená.
      await Promise.all([
        db.brigades.where('tenantId').equals(tenantId).delete(),
        db.people.where('tenantId').equals(tenantId).delete(),
        db.sites.where('tenantId').equals(tenantId).delete(),
        db.workTypes.where('tenantId').equals(tenantId).delete(),
        db.expenseCategories.where('tenantId').equals(tenantId).delete(),
        db.hoursEntries.where('tenantId').equals(tenantId).delete(),
        db.outputEntries.where('tenantId').equals(tenantId).delete(),
        db.expenses.where('tenantId').equals(tenantId).delete(),
        db.payments.where('tenantId').equals(tenantId).delete(),
        db.siteCustomerPayments.where('tenantId').equals(tenantId).delete(),
        db.siteMaterialCosts.where('tenantId').equals(tenantId).delete(),
        db.siteWorkPlans.where('tenantId').equals(tenantId).delete(),
        db.siteWorkProgress.where('tenantId').equals(tenantId).delete(),
        db.salaryEntries.where('tenantId').equals(tenantId).delete(),
        db.insuranceOverrides.where('tenantId').equals(tenantId).delete(),
        db.brigadeMemberships.where('tenantId').equals(tenantId).delete(),
        db.drawingRecords.where('tenantId').equals(tenantId).delete(),
        db.workHourEntries.where('tenantId').equals(tenantId).delete(),
      ])

      // ID v souboru mohou kolidovat s jinou firmou (auto-increment je sdílený přes
      // celou databázi) — proto se všechno vloží s novým ID a závislé tabulky se
      // přemapují podle starých ID zaznamenaných při vkládání "kořenových" tabulek.
      const brigadeMap = new Map<number, number>()
      for (const brigade of parsed.brigades ?? []) {
        if (brigade.id != null) brigadeMap.set(brigade.id, await addRemapped(db.brigades, brigade, tenantId))
      }

      const siteMap = new Map<number, number>()
      for (const site of parsed.sites ?? []) {
        if (site.id != null) siteMap.set(site.id, await addRemapped(db.sites, site, tenantId))
      }

      const workTypeMap = new Map<number, number>()
      for (const workType of parsed.workTypes ?? []) {
        if (workType.id != null) workTypeMap.set(workType.id, await addRemapped(db.workTypes, workType, tenantId))
      }

      const categoryMap = new Map<number, number>()
      for (const category of parsed.expenseCategories ?? []) {
        if (category.id != null) categoryMap.set(category.id, await addRemapped(db.expenseCategories, category, tenantId))
      }

      const peopleMap = new Map<number, number>()
      for (const person of parsed.people ?? []) {
        const newId = await addRemapped(db.people, person, tenantId, {
          brigadeId: brigadeMap.get(person.brigadeId) ?? person.brigadeId,
        })
        if (person.id != null) peopleMap.set(person.id, newId)
      }

      for (const entry of deserializeAttachments(parsed.hoursEntries)) {
        await addRemapped(db.hoursEntries, entry, tenantId, {
          personId: peopleMap.get(entry.personId) ?? entry.personId,
          siteId: siteMap.get(entry.siteId) ?? entry.siteId,
        })
      }

      for (const entry of deserializeAttachments(parsed.outputEntries)) {
        await addRemapped(db.outputEntries, entry, tenantId, {
          personId: peopleMap.get(entry.personId) ?? entry.personId,
          siteId: siteMap.get(entry.siteId) ?? entry.siteId,
          workTypeId: workTypeMap.get(entry.workTypeId) ?? entry.workTypeId,
        })
      }

      for (const entry of deserializeAttachments(parsed.expenses)) {
        await addRemapped(db.expenses, entry, tenantId, {
          categoryId: categoryMap.get(entry.categoryId) ?? entry.categoryId,
          ...(entry.paidByPersonId != null
            ? { paidByPersonId: peopleMap.get(entry.paidByPersonId) ?? entry.paidByPersonId }
            : {}),
          ...(entry.brigadeIdSnapshot != null
            ? { brigadeIdSnapshot: brigadeMap.get(entry.brigadeIdSnapshot) ?? entry.brigadeIdSnapshot }
            : {}),
          ...(entry.siteId != null ? { siteId: siteMap.get(entry.siteId) ?? entry.siteId } : {}),
        })
      }

      for (const payment of parsed.payments ?? []) {
        await addRemapped(db.payments, payment, tenantId, {
          personId: peopleMap.get(payment.personId) ?? payment.personId,
        })
      }

      for (const entry of parsed.siteCustomerPayments ?? []) {
        await addRemapped(db.siteCustomerPayments, entry, tenantId, {
          siteId: siteMap.get(entry.siteId) ?? entry.siteId,
        })
      }

      for (const entry of deserializeAttachments(parsed.siteMaterialCosts)) {
        await addRemapped(db.siteMaterialCosts, entry, tenantId, {
          siteId: siteMap.get(entry.siteId) ?? entry.siteId,
        })
      }

      for (const plan of parsed.siteWorkPlans ?? []) {
        await addRemapped(db.siteWorkPlans, plan, tenantId, {
          siteId: siteMap.get(plan.siteId) ?? plan.siteId,
          workTypeId: workTypeMap.get(plan.workTypeId) ?? plan.workTypeId,
        })
      }

      for (const entry of deserializeAttachments(parsed.siteWorkProgress)) {
        await addRemapped(db.siteWorkProgress, entry, tenantId, {
          siteId: siteMap.get(entry.siteId) ?? entry.siteId,
          workTypeId: workTypeMap.get(entry.workTypeId) ?? entry.workTypeId,
        })
      }

      for (const entry of deserializeAttachments(parsed.salaryEntries)) {
        await addRemapped(db.salaryEntries, entry, tenantId, {
          personId: peopleMap.get(entry.personId) ?? entry.personId,
          ...(entry.siteId != null ? { siteId: siteMap.get(entry.siteId) ?? entry.siteId } : {}),
        })
      }

      for (const entry of parsed.insuranceOverrides ?? []) {
        await addRemapped(db.insuranceOverrides, entry, tenantId, {
          personId: peopleMap.get(entry.personId) ?? entry.personId,
        })
      }

      for (const entry of parsed.brigadeMemberships ?? []) {
        await addRemapped(db.brigadeMemberships, entry, tenantId, {
          personId: peopleMap.get(entry.personId) ?? entry.personId,
          brigadeId: brigadeMap.get(entry.brigadeId) ?? entry.brigadeId,
        })
      }

      const drawingRecordMap = new Map<number, number>()
      for (const record of deserializeAttachments(parsed.drawingRecords)) {
        const newId = await addRemapped(db.drawingRecords, record, tenantId, {
          ...(record.siteId != null ? { siteId: siteMap.get(record.siteId) ?? record.siteId } : {}),
        })
        if (record.id != null) drawingRecordMap.set(record.id, newId)
      }

      for (const entry of parsed.workHourEntries ?? []) {
        await addRemapped(db.workHourEntries, entry, tenantId, {
          personId: peopleMap.get(entry.personId) ?? entry.personId,
          siteId: siteMap.get(entry.siteId) ?? entry.siteId,
          ...(entry.drawingRecordId != null
            ? { drawingRecordId: drawingRecordMap.get(entry.drawingRecordId) ?? entry.drawingRecordId }
            : {}),
        })
      }
    },
  )
}
