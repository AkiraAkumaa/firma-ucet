import * as XLSX from 'xlsx'
import type { EntityTable } from 'dexie'
import { db } from '../db/db'
import { calculatePersonDebt } from '../domain/debt/calculateDebt'
import { hoursEntryAmount } from '../domain/hours/calc'
import { outputEntryAmount } from '../domain/output/calc'
import { calculateSiteProfitability, expensesForSite } from '../domain/profitability/calculateSiteProfitability'
import { calculateSiteMonthlyBreakdown } from '../domain/profitability/calculateSiteMonthlyBreakdown'
import { calculateBrigadeMonthlyBreakdown } from '../domain/brigades/calculateBrigadeSummary'
import { calculateSummaryRows } from '../domain/reports/summaryRows'
import { calculateJobTimeline } from '../domain/analytics/timeline'
import type { PeriodRange } from '../domain/reports/period'
import { getActiveTenantId } from '../tenant/activeTenant'
import { todayIso } from '../shared/date'
import type { Dictionary } from '../i18n/translations'

/** Sloupce podle nejdelšího obsahu (max 40 znaků) — ať se v Excelu nemusí ručně roztahovat. */
function sheetFromRows(rows: Record<string, unknown>[]) {
  const sheet = XLSX.utils.json_to_sheet(rows)
  const headers = rows.length > 0 ? Object.keys(rows[0]) : []
  sheet['!cols'] = headers.map((header) => {
    const maxContentWidth = rows.reduce((max, row) => Math.max(max, String(row[header] ?? '').length), 0)
    return { wch: Math.min(40, Math.max(header.length, maxContentWidth) + 2) }
  })
  return sheet
}

export async function exportToExcel(t: Dictionary): Promise<void> {
  const tenantId = getActiveTenantId()
  if (tenantId == null) return

  const byTenant = <T extends { id?: number }>(table: EntityTable<T, 'id'>): Promise<T[]> =>
    table.where('tenantId').equals(tenantId).toArray()

  const [
    brigades,
    people,
    sites,
    workTypes,
    expenseCategories,
    hoursEntries,
    outputEntries,
    salaryEntries,
    expenses,
    payments,
    customerPayments,
    materialCosts,
    workProgress,
    workPlans,
  ] = await Promise.all([
    byTenant(db.brigades),
    byTenant(db.people),
    byTenant(db.sites),
    byTenant(db.workTypes),
    byTenant(db.expenseCategories),
    byTenant(db.hoursEntries),
    byTenant(db.outputEntries),
    byTenant(db.salaryEntries),
    byTenant(db.expenses),
    byTenant(db.payments),
    byTenant(db.siteCustomerPayments),
    byTenant(db.siteMaterialCosts),
    byTenant(db.siteWorkProgress),
    byTenant(db.siteWorkPlans),
  ])

  const brigadeName = (id?: number) => brigades.find((b) => b.id === id)?.name ?? ''
  const siteName = (id: number) => sites.find((s) => s.id === id)?.name ?? ''
  const workTypeName = (id: number) => workTypes.find((w) => w.id === id)?.name ?? ''
  const categoryName = (id: number) => expenseCategories.find((c) => c.id === id)?.name ?? ''
  const personName = (id?: number) => people.find((p) => p.id === id)?.name ?? ''

  const debtRows = people
    .map((person) => ({
      person,
      debt: calculatePersonDebt({
        hoursEntries: hoursEntries.filter((e) => e.personId === person.id),
        outputEntries: outputEntries.filter((e) => e.personId === person.id),
        salaryEntries: salaryEntries.filter((e) => e.personId === person.id),
        expenses: expenses.filter((e) => e.paidByPersonId === person.id),
        payments: payments.filter((p) => p.personId === person.id),
      }),
    }))
    .sort((a, b) => b.debt.totalDebt - a.debt.totalDebt)
    .map(({ person, debt }) => ({
      [t.people.name]: person.name,
      [t.people.brigade]: brigadeName(person.brigadeId),
      [t.people.type]: person.type === 'osvc' ? t.personType.osvc : t.personType.zamestnanec,
      [t.people.detail.totalDebt]: debt.totalDebt,
      [t.people.detail.oldestUnpaidMonth]: debt.oldestUnpaidMonth ?? '',
      [t.people.detail.delay]: debt.delayDays,
    }))

  const siteRows = sites.map((site) => {
    const profitability = calculateSiteProfitability({
      hoursEntries: hoursEntries.filter((e) => e.siteId === site.id),
      outputEntries: outputEntries.filter((e) => e.siteId === site.id),
      salaryEntries: salaryEntries.filter((e) => e.siteId === site.id),
      workProgress: workProgress.filter((p) => p.siteId === site.id),
      workTypes,
      plans: workPlans.filter((p) => p.siteId === site.id),
      customerPayments: customerPayments.filter((p) => p.siteId === site.id),
      materialCosts: materialCosts.filter((m) => m.siteId === site.id),
      siteExpenses: expensesForSite(expenses, site.id!),
    })
    return {
      [t.sites.name]: site.name,
      [t.sites.address]: site.address,
      [t.sites.status]: site.status === 'active' ? t.siteStatus.active : t.siteStatus.completed,
      [t.sites.laborCost]: profitability.laborCost,
      [t.sites.revenue]: profitability.revenue,
      [t.sites.materialCost]: profitability.materialCost,
      [t.sites.otherExpenses]: profitability.otherExpenses,
      [t.sites.netProfit]: profitability.netProfit,
    }
  })

  const materialCostRows = materialCosts.map((m) => ({
    [t.common.date]: m.date,
    [t.entry.site]: siteName(m.siteId),
    [t.common.amount]: m.amount,
    [t.common.note]: m.note ?? '',
    [t.entry.attachment]: m.attachment ? t.common.yes : t.common.no,
  }))

  const hoursRows = hoursEntries.map((e) => ({
    [t.common.date]: e.date,
    [t.entry.person]: personName(e.personId),
    [t.entry.site]: siteName(e.siteId),
    [t.entry.hours]: e.hours,
    [t.people.hourlyRate]: e.hourlyRateSnapshot,
    [t.common.amount]: hoursEntryAmount(e),
    [t.entry.attachment]: e.attachment ? t.common.yes : t.common.no,
  }))

  const outputRows = outputEntries.map((e) => ({
    [t.common.date]: e.date,
    [t.entry.person]: personName(e.personId),
    [t.entry.site]: siteName(e.siteId),
    [t.entry.workType]: workTypeName(e.workTypeId),
    [t.entry.quantity]: e.quantity,
    [t.entry.unitPrice]: e.unitPrice,
    [t.common.amount]: outputEntryAmount(e),
    [t.entry.priceOverridden]: e.priceOverridden ? t.common.yes : t.common.no,
    [t.entry.attachment]: e.attachment ? t.common.yes : t.common.no,
  }))

  const expenseRows = expenses.map((e) => ({
    [t.common.date]: e.date,
    [t.entry.paidBy]: e.paidByCompany ? t.entry.paidByCompany : personName(e.paidByPersonId),
    [t.people.brigade]: brigadeName(e.brigadeIdSnapshot),
    [t.entry.category]: categoryName(e.categoryId),
    [t.common.amount]: e.amount,
    [t.common.note]: e.note ?? '',
    [t.entry.attachment]: e.attachment ? t.common.yes : t.common.no,
  }))

  const paymentRows = payments.map((p) => ({
    [t.common.date]: p.date,
    [t.entry.person]: personName(p.personId),
    [t.common.amount]: p.amount,
  }))

  const salaryRows = salaryEntries.map((e) => ({
    [t.common.date]: e.date,
    [t.entry.person]: personName(e.personId),
    [t.entry.site]: e.siteId != null ? siteName(e.siteId) : '',
    [t.common.amount]: e.amount,
    [t.common.note]: e.note ?? '',
    [t.entry.attachment]: e.attachment ? t.common.yes : t.common.no,
  }))

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheetFromRows(debtRows), t.export.debtSheet)
  XLSX.utils.book_append_sheet(workbook, sheetFromRows(siteRows), t.export.sitesSheet)
  XLSX.utils.book_append_sheet(workbook, sheetFromRows(hoursRows), t.export.hoursSheet)
  XLSX.utils.book_append_sheet(workbook, sheetFromRows(outputRows), t.export.outputSheet)
  XLSX.utils.book_append_sheet(workbook, sheetFromRows(expenseRows), t.export.expensesSheet)
  XLSX.utils.book_append_sheet(workbook, sheetFromRows(paymentRows), t.export.paymentsSheet)
  XLSX.utils.book_append_sheet(workbook, sheetFromRows(salaryRows), t.export.salarySheet)
  XLSX.utils.book_append_sheet(workbook, sheetFromRows(materialCostRows), t.export.materialCostSheet)

  const filename = `${t.export.fileNamePrefix}-${new Date().toISOString().slice(0, 10)}.xlsx`
  XLSX.writeFile(workbook, filename)
}

/** Export jedné osoby — pro tlačítko "Excel" na detailu osoby. */
export async function exportPersonToExcel(personId: number, t: Dictionary): Promise<void> {
  const tenantId = getActiveTenantId()
  if (tenantId == null) return

  const byTenant = <T extends { id?: number }>(table: EntityTable<T, 'id'>): Promise<T[]> =>
    table.where('tenantId').equals(tenantId).toArray()

  const [people, sites, hoursEntries, outputEntries, salaryEntries, expenses, payments, workHourEntries] = await Promise.all([
    byTenant(db.people),
    byTenant(db.sites),
    byTenant(db.hoursEntries),
    byTenant(db.outputEntries),
    byTenant(db.salaryEntries),
    byTenant(db.expenses),
    byTenant(db.payments),
    byTenant(db.workHourEntries),
  ])

  const person = people.find((p) => p.id === personId)
  if (!person) return
  const siteName = (id: number) => sites.find((s) => s.id === id)?.name ?? ''

  const personWorkHours = workHourEntries.filter((e) => e.personId === personId)
  const personHours = hoursEntries.filter((e) => e.personId === personId)
  const personOutput = outputEntries.filter((e) => e.personId === personId)
  const personSalary = salaryEntries.filter((e) => e.personId === personId)
  const personExpenses = expenses.filter((e) => e.paidByPersonId === personId)
  const personPayments = payments.filter((p) => p.personId === personId)

  const debt = calculatePersonDebt({
    hoursEntries: personHours,
    outputEntries: personOutput,
    salaryEntries: personSalary,
    expenses: personExpenses,
    payments: personPayments,
  })

  const monthlyRows = debt.months.map((m) => ({
    [t.people.detail.month]: m.month,
    [t.people.detail.accrued]: m.accrued,
    [t.people.detail.expenses]: m.expenses,
    [t.people.detail.paid]: m.paid,
    [t.people.detail.remaining]: m.remaining,
  }))

  const historyRows = [
    ...personHours.map((e) => ({
      [t.common.date]: e.date,
      [t.people.type]: t.people.detail.historyHours,
      [t.entry.site]: siteName(e.siteId),
      [t.common.amount]: hoursEntryAmount(e),
    })),
    ...personOutput.map((e) => ({
      [t.common.date]: e.date,
      [t.people.type]: t.people.detail.historyOutput,
      [t.entry.site]: siteName(e.siteId),
      [t.common.amount]: outputEntryAmount(e),
    })),
    ...personSalary.map((e) => ({
      [t.common.date]: e.date,
      [t.people.type]: t.people.detail.historySalary,
      [t.entry.site]: e.siteId != null ? siteName(e.siteId) : '',
      [t.common.amount]: e.amount,
    })),
    ...personExpenses.map((e) => ({
      [t.common.date]: e.date,
      [t.people.type]: t.people.detail.historyExpense,
      [t.entry.site]: '',
      [t.common.amount]: e.amount,
    })),
    ...personPayments.map((p) => ({
      [t.common.date]: p.date,
      [t.people.type]: t.people.detail.historyPayment,
      [t.entry.site]: '',
      [t.common.amount]: -p.amount,
    })),
  ].sort((a, b) => String(a[t.common.date]).localeCompare(String(b[t.common.date])))

  const summaryRows = [
    {
      [t.people.name]: person.name,
      [t.people.detail.totalDebt]: debt.totalDebt,
      [t.people.detail.oldestUnpaidMonth]: debt.oldestUnpaidMonth ?? '',
      [t.people.detail.delay]: debt.delayDays,
    },
  ]

  const workHoursRows = personWorkHours
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((e) => ({
      [t.common.date]: e.date,
      [t.entry.site]: siteName(e.siteId),
      [t.analytics.workCategory]: e.workCategory === 'armovani' ? t.analytics.categoryArmovani : t.analytics.categoryMonolit,
      [t.entry.hours]: e.hours,
      [t.common.note]: e.note ?? '',
    }))

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheetFromRows(summaryRows), t.people.detail.totalDebt.slice(0, 31))
  XLSX.utils.book_append_sheet(workbook, sheetFromRows(monthlyRows), t.people.detail.monthlyBreakdown.slice(0, 31))
  XLSX.utils.book_append_sheet(workbook, sheetFromRows(historyRows), t.people.detail.history.slice(0, 31))
  if (workHoursRows.length > 0) {
    XLSX.utils.book_append_sheet(workbook, sheetFromRows(workHoursRows), t.export.workHoursSheet.slice(0, 31))
  }

  XLSX.writeFile(workbook, `${person.name}-${new Date().toISOString().slice(0, 10)}.xlsx`)
}

/** Export jedné stavby — pro tlačítko "Excel" na detailu stavby. */
export async function exportSiteToExcel(siteId: number, t: Dictionary): Promise<void> {
  const tenantId = getActiveTenantId()
  if (tenantId == null) return

  const byTenant = <T extends { id?: number }>(table: EntityTable<T, 'id'>): Promise<T[]> =>
    table.where('tenantId').equals(tenantId).toArray()

  const [
    sites,
    workTypes,
    hoursEntries,
    outputEntries,
    salaryEntries,
    expenses,
    customerPayments,
    materialCosts,
    workProgressAll,
    workPlansAll,
    workHourEntries,
    drawingRecords,
  ] = await Promise.all([
    byTenant(db.sites),
    byTenant(db.workTypes),
    byTenant(db.hoursEntries),
    byTenant(db.outputEntries),
    byTenant(db.salaryEntries),
    byTenant(db.expenses),
    byTenant(db.siteCustomerPayments),
    byTenant(db.siteMaterialCosts),
    byTenant(db.siteWorkProgress),
    byTenant(db.siteWorkPlans),
    byTenant(db.workHourEntries),
    byTenant(db.drawingRecords),
  ])

  const site = sites.find((s) => s.id === siteId)
  if (!site) return

  const siteHours = hoursEntries.filter((e) => e.siteId === siteId)
  const siteOutput = outputEntries.filter((e) => e.siteId === siteId)
  const siteSalary = salaryEntries.filter((e) => e.siteId === siteId)
  const siteExpensesList = expensesForSite(expenses, siteId)
  const siteCustomerPayments = customerPayments.filter((p) => p.siteId === siteId)
  const siteMaterialCosts = materialCosts.filter((m) => m.siteId === siteId)
  const siteWorkProgress = workProgressAll.filter((p) => p.siteId === siteId)
  const siteWorkPlans = workPlansAll.filter((p) => p.siteId === siteId)

  const profitability = calculateSiteProfitability({
    hoursEntries: siteHours,
    outputEntries: siteOutput,
    salaryEntries: siteSalary,
    workProgress: siteWorkProgress,
    workTypes,
    plans: siteWorkPlans,
    customerPayments: siteCustomerPayments,
    materialCosts: siteMaterialCosts,
    siteExpenses: siteExpensesList,
  })

  const monthly = calculateSiteMonthlyBreakdown({
    hoursEntries: siteHours,
    outputEntries: siteOutput,
    salaryEntries: siteSalary,
    workProgress: siteWorkProgress,
    workTypes,
    plans: siteWorkPlans,
    customerPayments: siteCustomerPayments,
    materialCosts: siteMaterialCosts,
    siteExpenses: siteExpensesList,
  })

  const summaryRows = [
    {
      [t.sites.name]: site.name,
      [t.sites.revenue]: profitability.revenue,
      [t.sites.laborCost]: profitability.laborCost,
      [t.sites.materialCost]: profitability.materialCost,
      [t.sites.otherExpenses]: profitability.otherExpenses,
      [t.sites.netProfit]: profitability.netProfit,
    },
  ]

  const monthlyRows = monthly.map((m) => ({
    [t.people.detail.month]: m.month,
    [t.sites.revenue]: m.revenue,
    [t.sites.laborCost]: m.laborCost,
    [t.sites.materialCost]: m.materialCost,
    [t.sites.otherExpenses]: m.otherExpenses,
    [t.sites.netProfit]: m.netProfit,
  }))

  const siteWorkHours = workHourEntries.filter((e) => e.siteId === siteId)
  const workHoursRows = siteWorkHours
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((e) => ({
      [t.common.date]: e.date,
      [t.analytics.workCategory]: e.workCategory === 'armovani' ? t.analytics.categoryArmovani : t.analytics.categoryMonolit,
      [t.entry.hours]: e.hours,
    }))

  const today = todayIso()
  const drawingRows = drawingRecords
    .filter((d) => d.siteId === siteId)
    .map((d) => {
      const workedDates = workHourEntries.filter((e) => e.drawingRecordId === d.id).map((e) => e.date)
      const timeline = calculateJobTimeline(workedDates, { startDateOverride: d.startDate, endDateOverride: d.actualRecordedDate, today })
      return {
        [t.analytics.drawingName]: d.name,
        [t.analytics.workCategory]: d.workCategory === 'armovani' ? t.analytics.categoryArmovani : t.analytics.categoryMonolit,
        [t.analytics.startDate]: timeline.startDate ?? '',
        [t.common.date]: timeline.endDate ?? '',
        [t.analytics.totalCalendarDays]: timeline.totalCalendarDays,
        [t.analytics.workedDaysCount]: timeline.workedDaysCount,
        [t.analytics.pauseDaysCount]: timeline.pauseDaysCount,
      }
    })

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheetFromRows(summaryRows), t.sites.profitability.slice(0, 31))
  XLSX.utils.book_append_sheet(workbook, sheetFromRows(monthlyRows), t.sites.monthlyBreakdown.slice(0, 31))
  if (workHoursRows.length > 0) {
    XLSX.utils.book_append_sheet(workbook, sheetFromRows(workHoursRows), t.export.workHoursSheet.slice(0, 31))
  }
  if (drawingRows.length > 0) {
    XLSX.utils.book_append_sheet(workbook, sheetFromRows(drawingRows), t.analytics.drawingsOnSite.slice(0, 31))
  }

  XLSX.writeFile(workbook, `${site.name}-${new Date().toISOString().slice(0, 10)}.xlsx`)
}

/** Export jen vybraných lidí (hromadná akce v seznamu) — jedna sada souhrnných dluhů. */
export async function exportSelectedPeopleToExcel(personIds: number[], t: Dictionary): Promise<void> {
  const tenantId = getActiveTenantId()
  if (tenantId == null || personIds.length === 0) return
  const idSet = new Set(personIds)

  const byTenant = <T extends { id?: number }>(table: EntityTable<T, 'id'>): Promise<T[]> =>
    table.where('tenantId').equals(tenantId).toArray()

  const [brigades, people, hoursEntries, outputEntries, salaryEntries, expenses, payments] = await Promise.all([
    byTenant(db.brigades),
    byTenant(db.people),
    byTenant(db.hoursEntries),
    byTenant(db.outputEntries),
    byTenant(db.salaryEntries),
    byTenant(db.expenses),
    byTenant(db.payments),
  ])

  const brigadeName = (id: number) => brigades.find((b) => b.id === id)?.name ?? ''

  const rows = people
    .filter((p) => idSet.has(p.id!))
    .map((person) => ({
      person,
      debt: calculatePersonDebt({
        hoursEntries: hoursEntries.filter((e) => e.personId === person.id),
        outputEntries: outputEntries.filter((e) => e.personId === person.id),
        salaryEntries: salaryEntries.filter((e) => e.personId === person.id),
        expenses: expenses.filter((e) => e.paidByPersonId === person.id),
        payments: payments.filter((p) => p.personId === person.id),
      }),
    }))
    .sort((a, b) => b.debt.totalDebt - a.debt.totalDebt)
    .map(({ person, debt }) => ({
      [t.people.name]: person.name,
      [t.people.brigade]: brigadeName(person.brigadeId),
      [t.people.type]: person.type === 'osvc' ? t.personType.osvc : t.personType.zamestnanec,
      [t.people.detail.totalDebt]: debt.totalDebt,
      [t.people.detail.oldestUnpaidMonth]: debt.oldestUnpaidMonth ?? '',
      [t.people.detail.delay]: debt.delayDays,
    }))

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheetFromRows(rows), t.export.debtSheet)
  XLSX.writeFile(workbook, `${t.export.fileNamePrefix}-${new Date().toISOString().slice(0, 10)}.xlsx`)
}

/** Export jedné party — pro tlačítko "Excel" na detailu party. */
export async function exportBrigadeToExcel(brigadeId: number, t: Dictionary): Promise<void> {
  const tenantId = getActiveTenantId()
  if (tenantId == null) return

  const byTenant = <T extends { id?: number }>(table: EntityTable<T, 'id'>): Promise<T[]> =>
    table.where('tenantId').equals(tenantId).toArray()

  const [brigades, people, hoursEntries, outputEntries, expenses, sites, workHourEntries] = await Promise.all([
    byTenant(db.brigades),
    byTenant(db.people),
    byTenant(db.hoursEntries),
    byTenant(db.outputEntries),
    byTenant(db.expenses),
    byTenant(db.sites),
    byTenant(db.workHourEntries),
  ])

  const brigade = brigades.find((b) => b.id === brigadeId)
  if (!brigade) return

  const members = people.filter((p) => p.brigadeId === brigadeId)
  const memberIds = new Set(members.map((p) => p.id))
  const brigadeHours = hoursEntries.filter((e) => memberIds.has(e.personId))
  const brigadeOutput = outputEntries.filter((e) => memberIds.has(e.personId))
  const brigadeExpenses = expenses.filter((e) => e.brigadeIdSnapshot === brigadeId)
  const brigadeWorkHours = workHourEntries.filter((e) => memberIds.has(e.personId))
  const memberName = (id: number) => people.find((p) => p.id === id)?.name ?? ''
  const siteName = (id: number) => sites.find((s) => s.id === id)?.name ?? ''

  const labor =
    brigadeHours.reduce((sum, e) => sum + hoursEntryAmount(e), 0) + brigadeOutput.reduce((sum, e) => sum + outputEntryAmount(e), 0)
  const expensesTotal = brigadeExpenses.reduce((sum, e) => sum + e.amount, 0)

  const monthly = calculateBrigadeMonthlyBreakdown({
    hoursEntries: brigadeHours,
    outputEntries: brigadeOutput,
    expenses: brigadeExpenses,
  })

  const summaryRows = [
    {
      [t.brigades.name]: brigade.name,
      [t.brigades.labor]: labor,
      [t.brigades.expenses]: expensesTotal,
      [t.brigades.total]: labor + expensesTotal,
    },
  ]

  const monthlyRows = monthly.map((m) => ({
    [t.people.detail.month]: m.month,
    [t.brigades.labor]: m.labor,
    [t.brigades.expenses]: m.expenses,
    [t.brigades.total]: m.total,
  }))

  const memberRows = members.map((person) => ({
    [t.people.name]: person.name,
    [t.people.type]: person.type === 'osvc' ? t.personType.osvc : t.personType.zamestnanec,
  }))

  const workHoursRows = brigadeWorkHours
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((e) => ({
      [t.common.date]: e.date,
      [t.people.name]: memberName(e.personId),
      [t.entry.site]: siteName(e.siteId),
      [t.analytics.workCategory]: e.workCategory === 'armovani' ? t.analytics.categoryArmovani : t.analytics.categoryMonolit,
      [t.entry.hours]: e.hours,
    }))

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheetFromRows(summaryRows), t.brigades.total.slice(0, 31))
  XLSX.utils.book_append_sheet(workbook, sheetFromRows(monthlyRows), t.brigades.monthlyBreakdown.slice(0, 31))
  XLSX.utils.book_append_sheet(workbook, sheetFromRows(memberRows), t.brigades.members.slice(0, 31))
  if (workHoursRows.length > 0) {
    XLSX.utils.book_append_sheet(workbook, sheetFromRows(workHoursRows), t.export.workHoursSheet.slice(0, 31))
  }

  XLSX.writeFile(workbook, `${brigade.name}-${new Date().toISOString().slice(0, 10)}.xlsx`)
}

/** Export sторінky Зведення (Summary) — počítá stejnou funkcí calculateSummaryRows jako stránka i PDF tisk. */
export async function exportSummaryToExcel(range: PeriodRange | null, t: Dictionary): Promise<void> {
  const tenantId = getActiveTenantId()
  if (tenantId == null) return

  const byTenant = <T extends { id?: number }>(table: EntityTable<T, 'id'>): Promise<T[]> =>
    table.where('tenantId').equals(tenantId).toArray()

  const [brigades, people, hoursEntries, outputEntries, salaryEntries, expenses, payments] = await Promise.all([
    byTenant(db.brigades),
    byTenant(db.people),
    byTenant(db.hoursEntries),
    byTenant(db.outputEntries),
    byTenant(db.salaryEntries),
    byTenant(db.expenses),
    byTenant(db.payments),
  ])

  const debts = new Map(
    people.map((person) => [
      person.id!,
      calculatePersonDebt({
        hoursEntries: hoursEntries.filter((e) => e.personId === person.id),
        outputEntries: outputEntries.filter((e) => e.personId === person.id),
        salaryEntries: salaryEntries.filter((e) => e.personId === person.id),
        expenses: expenses.filter((e) => e.paidByPersonId === person.id),
        payments: payments.filter((p) => p.personId === person.id),
      }),
    ]),
  )

  const rows = calculateSummaryRows({ people, brigades, hoursEntries, outputEntries, salaryEntries, expenses, payments, debts, range })

  const summaryRows = rows.map((row) => ({
    [t.summary.person]: `${row.name}${row.brigadeName ? ` · ${row.brigadeName}` : ''}`,
    [t.people.detail.accrued]: row.totals.accrued,
    [t.people.detail.expenses]: row.totals.expenses,
    [t.people.detail.paid]: row.totals.paid,
    [range == null ? t.summary.outstanding : t.summary.net]: range == null ? row.outstanding : row.totals.net,
  }))

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheetFromRows(summaryRows), t.summary.title.slice(0, 31))
  XLSX.writeFile(workbook, `${t.summary.title}-${new Date().toISOString().slice(0, 10)}.xlsx`)
}
