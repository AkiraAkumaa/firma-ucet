import { useRef, useState, type ChangeEvent } from 'react'
import { useT } from '../../i18n/I18nContext'
import { Card } from '../../shared/ui/Card'
import { Button } from '../../shared/ui/Button'
import { ConfirmDialog } from '../../shared/ui/ConfirmDialog'
import { exportBackup, importBackup } from '../../backup/backup'
import { useLastBackupAt } from '../../backup/lastBackupTracker'
import { useActiveTenantId } from '../../tenant/activeTenant'
import { daysBetween } from '../../domain/debt/dateUtils'
import { exportToExcel } from '../../export/exportExcel'
import { pruneOrphanedRecords } from '../../db/cascadeDelete'
import { ROUTES } from '../../app/routes'

type Status = 'idle' | 'success' | 'error'

const BACKUP_WARNING_DAYS = 30

export function BackupManager() {
  const t = useT()
  const tenantId = useActiveTenantId()
  const lastBackupAt = useLastBackupAt(tenantId)
  const daysSinceBackup = lastBackupAt != null ? daysBetween(new Date(lastBackupAt), new Date()) : null
  const backupIsStale = daysSinceBackup == null || daysSinceBackup > BACKUP_WARNING_DAYS
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [confirmingCleanup, setConfirmingCleanup] = useState(false)
  const [cleanupResult, setCleanupResult] = useState<number | null>(null)

  const confirmCleanup = async () => {
    const result = await pruneOrphanedRecords()
    const total = Object.values(result).reduce((sum, n) => sum + n, 0)
    setCleanupResult(total)
    setConfirmingCleanup(false)
  }

  const handleFileSelected = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setPendingFile(file)
    e.target.value = ''
  }

  const confirmImport = async () => {
    if (!pendingFile) return
    try {
      await importBackup(pendingFile)
      setStatus('success')
    } catch {
      setStatus('error')
    } finally {
      setPendingFile(null)
      setTimeout(() => setStatus('idle'), 3000)
    }
  }

  return (
    <Card>
      <div className="space-y-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => exportToExcel(t)}>{t.backup.exportExcel}</Button>
            <Button variant="secondary" onClick={() => window.open(ROUTES.printDebtSummary, '_blank')}>
              {t.backup.exportPdf}
            </Button>
          </div>
          <p className="mt-1.5 text-xs text-gray-500">{t.backup.exportPdfHint}</p>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">{t.backup.dangerZone}</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => exportBackup()}>
              {t.backup.exportJson}
            </Button>
            <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
              {t.backup.importJson}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={handleFileSelected}
            />
          </div>
          <p className={`mt-1.5 text-sm ${backupIsStale ? 'font-medium text-red-600 dark:text-red-400' : 'text-gray-500'}`}>
            {daysSinceBackup == null
              ? t.backup.neverBackedUp
              : daysSinceBackup === 0
                ? t.backup.lastBackupToday
                : t.backup.lastBackup(daysSinceBackup)}
          </p>
        </div>

        {status === 'success' && <p className="text-sm text-green-600 dark:text-green-400">{t.backup.importSuccess}</p>}
        {status === 'error' && <p className="text-sm text-red-600 dark:text-red-400">{t.backup.importError}</p>}

        <div>
          <Button variant="secondary" onClick={() => setConfirmingCleanup(true)}>
            {t.backup.cleanupOrphans}
          </Button>
          <p className="mt-1.5 text-xs text-gray-500">{t.backup.cleanupOrphansHint}</p>
          {cleanupResult != null && (
            <p className="mt-1.5 text-sm text-green-600 dark:text-green-400">
              {cleanupResult > 0 ? t.backup.cleanupOrphansResult(cleanupResult) : t.backup.cleanupOrphansNone}
            </p>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={pendingFile != null}
        title={t.backup.importConfirmTitle}
        body={t.backup.importConfirmBody}
        confirmLabel={t.backup.importJson}
        danger
        onConfirm={confirmImport}
        onCancel={() => setPendingFile(null)}
      />

      <ConfirmDialog
        open={confirmingCleanup}
        title={t.backup.cleanupOrphansConfirmTitle}
        body={t.backup.cleanupOrphansConfirmBody}
        confirmLabel={t.backup.cleanupOrphans}
        danger
        onConfirm={confirmCleanup}
        onCancel={() => setConfirmingCleanup(false)}
      />
    </Card>
  )
}
