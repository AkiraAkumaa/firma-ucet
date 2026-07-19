import Dexie, { type EntityTable } from 'dexie'
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
import type { Tenant } from '../domain/tenants/types'
import { todayIso } from '../shared/date'

const DEFAULT_TENANT_NAME = 'Моя компанія'

class AppDatabase extends Dexie {
  tenants!: EntityTable<Tenant, 'id'>
  brigades!: EntityTable<Brigade, 'id'>
  people!: EntityTable<Person, 'id'>
  sites!: EntityTable<Site, 'id'>
  workTypes!: EntityTable<WorkType, 'id'>
  expenseCategories!: EntityTable<ExpenseCategory, 'id'>
  hoursEntries!: EntityTable<HoursEntry, 'id'>
  outputEntries!: EntityTable<OutputEntry, 'id'>
  expenses!: EntityTable<Expense, 'id'>
  payments!: EntityTable<Payment, 'id'>
  siteCustomerPayments!: EntityTable<SiteCustomerPayment, 'id'>
  siteMaterialCosts!: EntityTable<SiteMaterialCost, 'id'>
  siteWorkPlans!: EntityTable<SiteWorkPlan, 'id'>
  siteWorkProgress!: EntityTable<SiteWorkProgressEntry, 'id'>
  salaryEntries!: EntityTable<SalaryEntry, 'id'>
  insuranceOverrides!: EntityTable<InsuranceOverride, 'id'>
  workHourEntries!: EntityTable<WorkHourEntry, 'id'>
  brigadeMemberships!: EntityTable<BrigadeMembership, 'id'>
  drawingRecords!: EntityTable<DrawingRecord, 'id'>

  constructor() {
    super('ucet-firm')

    this.version(1).stores({
      brigades: '++id, name',
      people: '++id, name, brigadeId, type',
      sites: '++id, name, status',
      workTypes: '++id, name',
      expenseCategories: '++id, name',
      hoursEntries: '++id, date, personId, siteId',
      outputEntries: '++id, date, personId, siteId, workTypeId',
      expenses: '++id, date, paidByPersonId, brigadeIdSnapshot, categoryId',
      payments: '++id, date, personId',
      siteCustomerPayments: '++id, siteId, date',
      siteMaterialCosts: '++id, siteId, date',
    })

    this.version(2).stores({
      siteWorkPlans: '++id, siteId, workTypeId',
    })

    this.version(3).stores({
      salaryEntries: '++id, date, personId, siteId',
    })

    // Multi-tenant: každý záznam patří konkrétní firmě (tenantId). Stávající data
    // (vytvořená před touto verzí) se přiřadí do jedné nově vytvořené výchozí firmy,
    // aby se po upgradu nic neztratilo.
    this.version(4)
      .stores({
        tenants: '++id, name',
        brigades: '++id, name, tenantId',
        people: '++id, name, brigadeId, type, tenantId',
        sites: '++id, name, status, tenantId',
        workTypes: '++id, name, tenantId',
        expenseCategories: '++id, name, tenantId',
        hoursEntries: '++id, date, personId, siteId, tenantId',
        outputEntries: '++id, date, personId, siteId, workTypeId, tenantId',
        expenses: '++id, date, paidByPersonId, brigadeIdSnapshot, categoryId, tenantId',
        payments: '++id, date, personId, tenantId',
        siteCustomerPayments: '++id, siteId, date, tenantId',
        siteMaterialCosts: '++id, siteId, date, tenantId',
        siteWorkPlans: '++id, siteId, workTypeId, tenantId',
        salaryEntries: '++id, date, personId, siteId, tenantId',
      })
      .upgrade(async (tx) => {
        const defaultTenantId = await tx.table('tenants').add({ name: DEFAULT_TENANT_NAME })
        const scopedTables = [
          'brigades',
          'people',
          'sites',
          'workTypes',
          'expenseCategories',
          'hoursEntries',
          'outputEntries',
          'expenses',
          'payments',
          'siteCustomerPayments',
          'siteMaterialCosts',
          'siteWorkPlans',
          'salaryEntries',
        ]
        for (const tableName of scopedTables) {
          await tx.table(tableName).toCollection().modify({ tenantId: defaultTenantId })
        }
      })

    // "Provedeno" u Plánu po objektech se mění z jednoho ručně přepisovaného čísla
    // na datované záznamy (kvůli rozpisu po měsících) — stávající actualQuantity/
    // attachment se převede na jeden migrovaný záznam, ať se nic neztratí.
    this.version(5)
      .stores({
        siteWorkProgress: '++id, siteId, workTypeId, date, tenantId',
      })
      .upgrade(async (tx) => {
        const plans = await tx.table('siteWorkPlans').toArray()
        for (const plan of plans) {
          if (plan.actualQuantity > 0 || plan.attachment) {
            await tx.table('siteWorkProgress').add({
              tenantId: plan.tenantId,
              siteId: plan.siteId,
              workTypeId: plan.workTypeId,
              date: todayIso(),
              quantity: plan.actualQuantity ?? 0,
              ...(plan.attachment ? { attachment: plan.attachment } : {}),
            })
          }
        }
        await tx
          .table('siteWorkPlans')
          .toCollection()
          .modify((plan) => {
            delete plan.actualQuantity
            delete plan.attachment
          })
      })

    // Sociální/zdravotní pojištění za zaměstnance — přidán jen nový store
    // (insuranceOverrides), Person.insuranceMonthly a SiteWorkPlan.customerPriceOverride
    // jsou neindexovaná volitelná pole, žádnou migraci nepotřebují.
    this.version(6).stores({
      insuranceOverrides: '++id, personId, month, tenantId',
    })

    // Modul analýzy kreslení a prognózy trudovitrat: hodiny tady NEJSOU
    // propojené se mzdou (viz WorkHourEntry v domain/analytics/types.ts) —
    // schválně samostatné tabulky, ať se nic nemíchá s FIFO logikou dluhů.
    this.version(7).stores({
      workHourEntries: '++id, date, personId, siteId, workCategory, drawingRecordId, tenantId',
      brigadeMemberships: '++id, personId, brigadeId, tenantId',
      drawingRecords: '++id, siteId, workCategory, createdDate, tenantId',
    })
  }
}

export const db = new AppDatabase()
