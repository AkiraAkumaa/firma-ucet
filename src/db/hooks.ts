import { useLiveQuery } from 'dexie-react-hooks'
import { db } from './db'
import { useActiveTenantId } from '../tenant/activeTenant'

export function useBrigades() {
  const tenantId = useActiveTenantId()
  return useLiveQuery(() => (tenantId == null ? [] : db.brigades.where('tenantId').equals(tenantId).sortBy('name')), [tenantId], [])
}

export function usePeople() {
  const tenantId = useActiveTenantId()
  return useLiveQuery(() => (tenantId == null ? [] : db.people.where('tenantId').equals(tenantId).sortBy('name')), [tenantId], [])
}

export function useSites() {
  const tenantId = useActiveTenantId()
  return useLiveQuery(() => (tenantId == null ? [] : db.sites.where('tenantId').equals(tenantId).sortBy('name')), [tenantId], [])
}

export function useWorkTypes() {
  const tenantId = useActiveTenantId()
  return useLiveQuery(() => (tenantId == null ? [] : db.workTypes.where('tenantId').equals(tenantId).sortBy('name')), [tenantId], [])
}

export function useExpenseCategories() {
  const tenantId = useActiveTenantId()
  return useLiveQuery(
    () => (tenantId == null ? [] : db.expenseCategories.where('tenantId').equals(tenantId).sortBy('name')),
    [tenantId],
    [],
  )
}

export function useHoursEntries() {
  const tenantId = useActiveTenantId()
  return useLiveQuery(() => (tenantId == null ? [] : db.hoursEntries.where('tenantId').equals(tenantId).toArray()), [tenantId], [])
}

export function useOutputEntries() {
  const tenantId = useActiveTenantId()
  return useLiveQuery(() => (tenantId == null ? [] : db.outputEntries.where('tenantId').equals(tenantId).toArray()), [tenantId], [])
}

export function useExpenses() {
  const tenantId = useActiveTenantId()
  return useLiveQuery(() => (tenantId == null ? [] : db.expenses.where('tenantId').equals(tenantId).toArray()), [tenantId], [])
}

export function usePayments() {
  const tenantId = useActiveTenantId()
  return useLiveQuery(() => (tenantId == null ? [] : db.payments.where('tenantId').equals(tenantId).toArray()), [tenantId], [])
}

export function useSiteCustomerPayments() {
  const tenantId = useActiveTenantId()
  return useLiveQuery(
    () => (tenantId == null ? [] : db.siteCustomerPayments.where('tenantId').equals(tenantId).toArray()),
    [tenantId],
    [],
  )
}

export function useSiteMaterialCosts() {
  const tenantId = useActiveTenantId()
  return useLiveQuery(
    () => (tenantId == null ? [] : db.siteMaterialCosts.where('tenantId').equals(tenantId).toArray()),
    [tenantId],
    [],
  )
}

export function useSiteWorkPlans() {
  const tenantId = useActiveTenantId()
  return useLiveQuery(() => (tenantId == null ? [] : db.siteWorkPlans.where('tenantId').equals(tenantId).toArray()), [tenantId], [])
}

export function useSiteWorkProgress() {
  const tenantId = useActiveTenantId()
  return useLiveQuery(
    () => (tenantId == null ? [] : db.siteWorkProgress.where('tenantId').equals(tenantId).toArray()),
    [tenantId],
    [],
  )
}

export function useSalaryEntries() {
  const tenantId = useActiveTenantId()
  return useLiveQuery(() => (tenantId == null ? [] : db.salaryEntries.where('tenantId').equals(tenantId).toArray()), [tenantId], [])
}

export function useInsuranceOverrides() {
  const tenantId = useActiveTenantId()
  return useLiveQuery(
    () => (tenantId == null ? [] : db.insuranceOverrides.where('tenantId').equals(tenantId).toArray()),
    [tenantId],
    [],
  )
}

export function useWorkHourEntries() {
  const tenantId = useActiveTenantId()
  return useLiveQuery(
    () => (tenantId == null ? [] : db.workHourEntries.where('tenantId').equals(tenantId).toArray()),
    [tenantId],
    [],
  )
}

export function useBrigadeMemberships() {
  const tenantId = useActiveTenantId()
  return useLiveQuery(
    () => (tenantId == null ? [] : db.brigadeMemberships.where('tenantId').equals(tenantId).toArray()),
    [tenantId],
    [],
  )
}

export function useDrawingRecords() {
  const tenantId = useActiveTenantId()
  return useLiveQuery(
    () => (tenantId == null ? [] : db.drawingRecords.where('tenantId').equals(tenantId).toArray()),
    [tenantId],
    [],
  )
}

export function useTenants() {
  return useLiveQuery(() => db.tenants.orderBy('name').toArray(), [], [])
}
