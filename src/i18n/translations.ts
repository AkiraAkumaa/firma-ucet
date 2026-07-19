import { pluralCs, pluralUk } from './pluralize'

export interface Dictionary {
  common: {
    appName: string
    save: string
    cancel: string
    delete: string
    edit: string
    add: string
    back: string
    search: string
    loading: string
    noData: string
    yes: string
    no: string
    close: string
    total: string
    date: string
    amount: string
    note: string
    optional: string
    confirmDeleteTitle: string
    confirmDeleteBody: string
    selectAll: string
    selectedCount: (n: number) => string
    deleteSelected: string
    bulkDeleteConfirmTitle: string
    bulkDeleteConfirmBody: (n: number) => string
    apply: string
    howCalculated: string
    exactDate: string
    monthOnly: string
    present: string
    vsPreviousPeriod: (type: 'month' | 'quarter' | 'year') => string
    hoursShort: string
  }
  theme: {
    light: string
    dark: string
  }
  nav: {
    overview: string
    people: string
    brigades: string
    sites: string
    entry: string
    company: string
    summary: string
    analytics: string
    settings: string
  }
  personType: {
    osvc: string
    zamestnanec: string
  }
  siteStatus: {
    active: string
    completed: string
  }
  overview: {
    title: string
    totalDebt: string
    longestDelay: string
    activeSites: string
    laborCostThisMonth: string
    accruedThisYear: (year: number) => string
    paidThisYear: (year: number) => string
    debtOverTime: string
    expensesByBrigade: string
    laborCostBySite: string
    notEnoughData: string
    noDelay: string
    delayDays: (n: number) => string
    totalProfit: string
    laborCostThisMonthHint: string
    totalProfitHint: string
    overdueBanner: (count: number, days: number) => string
    overdueBannerLink: string
  }
  summary: {
    title: string
    periodAll: string
    periodYear: string
    periodQuarter: string
    periodMonth: string
    month: string
    year: string
    quarter: string
    person: string
    outstanding: string
    net: string
    companyValue: string
    companyValueHint: string
    noData: string
  }
  people: {
    title: string
    name: string
    brigade: string
    type: string
    hourlyRate: string
    debt: string
    addPerson: string
    noPeople: string
    bulkChangeBrigade: string
    insuranceMonthly: string
    insuranceMonthlyHint: string
    detail: {
      totalDebt: string
      oldestUnpaidMonth: string
      delay: string
      monthlyBreakdown: string
      history: string
      month: string
      accrued: string
      expenses: string
      paid: string
      remaining: string
      noDebt: string
      historyHours: string
      historyOutput: string
      historyExpense: string
      historyPayment: string
      historySalary: string
    }
  }
  brigades: {
    title: string
    addBrigade: string
    name: string
    people: string
    expenses: string
    labor: string
    noBrigades: string
    members: string
    totalExpenses: string
    monthlyBreakdown: string
    total: string
    renameHint: string
    deleteWarning: (memberCount: number) => string
    membershipHistory: string
    addMembership: string
    membershipHint: string
  }
  sites: {
    title: string
    addSite: string
    name: string
    address: string
    status: string
    laborCost: string
    byBrigade: string
    byWorkType: string
    noSites: string
    profitability: string
    revenue: string
    materialCost: string
    otherExpenses: string
    netProfit: string
    planVsActual: string
    monthlyBreakdown: string
    bulkChangeStatus: string
  }
  workTypes: {
    title: string
    addWorkType: string
    name: string
    unit: string
    priceOsvc: string
    priceZamestnanec: string
    priceCustomer: string
  }
  expenseCategories: {
    title: string
    addCategory: string
    name: string
  }
  company: {
    title: string
    pricingTitle: string
    materialsTitle: string
    companyExpensesTitle: string
    profitabilityTitle: string
    planTitle: string
    plannedQuantity: string
    actualQuantity: string
    remainingQuantity: string
    plannedRevenueTotal: string
    noPlan: string
    addProgress: string
    progressHistory: string
    monthlyProgress: string
    noProgress: string
    reportTitle: string
    reportPeriodMonth: string
    reportPeriodQuarter: string
    reportPeriodYear: string
    reportYear: string
    reportAllSites: string
    reportGenerate: string
    customerPriceDefault: (price: number) => string
    customerPriceOverrideLabel: string
    useDefaultPrice: string
    allSitesOption: string
  }
  entry: {
    title: string
    hoursTab: string
    outputTab: string
    expenseTab: string
    paymentTab: string
    salaryTab: string
    date: string
    site: string
    noSite: string
    unknownReference: string
    person: string
    people: string
    selectAll: string
    hours: string
    workType: string
    quantity: string
    unitPrice: string
    priceOverridden: string
    resetPrice: string
    category: string
    paidBy: string
    paidByCompany: string
    attachment: string
    save: string
    saved: string
    saveAndAddAnother: string
    total: string
    setupNeeded: string
  }
  settings: {
    title: string
    brigadesTab: string
    peopleTab: string
    sitesTab: string
    workTypesTab: string
    expenseCategoriesTab: string
    backupTab: string
  }
  backup: {
    title: string
    exportJson: string
    importJson: string
    exportExcel: string
    exportPdf: string
    exportPdfHint: string
    importSuccess: string
    importError: string
    importConfirmTitle: string
    importConfirmBody: string
    dangerZone: string
    cleanupOrphans: string
    cleanupOrphansHint: string
    cleanupOrphansConfirmTitle: string
    cleanupOrphansConfirmBody: string
    cleanupOrphansNone: string
    cleanupOrphansResult: (count: number) => string
    lastBackup: (days: number) => string
    lastBackupToday: string
    neverBackedUp: string
  }
  print: {
    generatedOn: string
    companyTotal: string
    allSites: string
    quarterLabel: (quarter: number, year: number) => string
  }
  tenant: {
    namePlaceholder: string
    addNew: string
  }
  validation: {
    required: string
    mustBePositive: string
  }
  export: {
    fileNamePrefix: string
    debtSheet: string
    sitesSheet: string
    hoursSheet: string
    outputSheet: string
    expensesSheet: string
    paymentsSheet: string
    salarySheet: string
    materialCostSheet: string
    workHoursSheet: string
  }
  analytics: {
    title: string
    tabProductivity: string
    tabHours: string
    tabDrawings: string
    hoursHint: string
    workCategory: string
    categoryArmovani: string
    categoryMonolit: string
    addHours: string
    hoursNote: string
    noEntries: string
    productivityTitle: string
    kgPerHour: string
    m3PerHour: string
    positionsPerHour: string
    formworkM2PerHour: string
    personHours: string
    brigadeCoefficient: string
    brigadeCoefficientHint: string
    drawingsTitle: string
    newDrawing: string
    drawingName: string
    createdDate: string
    rebarSection: string
    diameterMass: (d: number) => string
    positionCount: string
    bentFraction: string
    sponyCount: string
    concreteVolume: string
    complexNodesNote: string
    monolithSection: string
    thicknessMm: string
    volumeM3: string
    addThickness: string
    formworkArea: string
    pourCount: string
    coefficientsTitle: string
    density: string
    positionsPerM3: string
    smallDiameterFraction: string
    formworkToVolumeRatio: string
    poursPerM3: string
    recordActual: string
    actualHours: string
    delayNotes: string
    actualRecorded: string
    forecastTitle: string
    forecastHint: string
    forecastNotEnough: (have: number, need: number) => string
    forecastResult: (hours: number) => string
    noDrawings: string
    backToDrawings: string
    startDate: string
    setStartDate: string
    timelineTitle: string
    totalCalendarDays: string
    workedDaysCount: string
    pauseDaysCount: string
    pausePeriods: string
    noPauses: string
    stillOngoing: string
    hoursOnSite: string
    hoursByCategory: string
    drawingsOnSite: string
  }
}

const uk: Dictionary = {
  common: {
    appName: 'Облік праці та боргів',
    save: 'Зберегти',
    cancel: 'Скасувати',
    delete: 'Видалити',
    edit: 'Редагувати',
    add: 'Додати',
    back: 'Назад',
    search: 'Пошук',
    loading: 'Завантаження…',
    noData: 'Немає даних',
    yes: 'Так',
    no: 'Ні',
    close: 'Закрити',
    total: 'Разом',
    date: 'Дата',
    amount: 'Сума',
    note: 'Примітка',
    optional: 'необов’язково',
    confirmDeleteTitle: 'Видалити запис?',
    confirmDeleteBody: 'Цю дію не можна скасувати.',
    selectAll: 'Обрати всі',
    selectedCount: (n) => `Обрано: ${n}`,
    deleteSelected: 'Видалити обрані',
    bulkDeleteConfirmTitle: 'Видалити обрані записи?',
    bulkDeleteConfirmBody: (n) => `Буде видалено ${n} записів разом з усією пов’язаною інформацією. Цю дію не можна скасувати.`,
    apply: 'Застосувати',
    howCalculated: 'Як це рахується?',
    exactDate: 'Точна дата',
    monthOnly: 'Тільки місяць',
    present: 'дотепер',
    vsPreviousPeriod: (type) =>
      `vs ${type === 'month' ? 'минулий місяць' : type === 'quarter' ? 'минулий квартал' : 'минулий рік'}`,
    hoursShort: 'год',
  },
  theme: {
    light: 'Світла',
    dark: 'Темна',
  },
  nav: {
    overview: 'Огляд',
    people: 'Люди',
    brigades: 'Бригади',
    sites: 'Об’єкти',
    entry: 'Внесення',
    company: 'Компанія',
    summary: 'Зведення',
    analytics: 'Аналітика',
    settings: 'Налаштування',
  },
  personType: {
    osvc: 'ФОП',
    zamestnanec: 'Найманий',
  },
  siteStatus: {
    active: 'Активний',
    completed: 'Завершений',
  },
  overview: {
    title: 'Огляд',
    totalDebt: 'Загальний борг фірми перед людьми',
    longestDelay: 'Найдовша затримка',
    activeSites: 'Активних об’єктів',
    laborCostThisMonth: 'Витрати на працю цього місяця',
    accruedThisYear: (year) => `Нараховано за ${year}`,
    paidThisYear: (year) => `Виплачено за ${year}`,
    debtOverTime: 'Динаміка загального боргу',
    expensesByBrigade: 'Витрати по бригадах',
    laborCostBySite: 'Витрати на працю по об’єктах',
    notEnoughData: 'Замало даних для графіка',
    noDelay: 'Немає затримок',
    delayDays: (n) => `${n} ${pluralUk(n, 'день', 'дні', 'днів')}`,
    totalProfit: 'Чистий прибуток компанії',
    laborCostThisMonthHint:
      'Сума нарахованого за Годинами (Години × ставка) і Виробітком (Кількість × ціна за одиницю) по всіх людях та об’єктах — тільки записи з датою в поточному місяці.',
    totalProfitHint:
      'Сума прибутку по всіх об’єктах: Дохід (оплати замовника + виконано по Плану × ціна для замовника) мінус Вартість праці, Матеріали та Інші витрати.',
    overdueBanner: (count, days) =>
      `Увага: ${count} ${pluralUk(count, 'людина', 'людини', 'людей')} прострочили оплату понад ${days} ${pluralUk(days, 'день', 'дні', 'днів')}`,
    overdueBannerLink: 'Переглянути список',
  },
  summary: {
    title: 'Зведення',
    periodAll: 'Загальна',
    periodYear: 'Річна',
    periodQuarter: 'Квартальна',
    periodMonth: 'Місячна',
    month: 'Місяць',
    year: 'Рік',
    quarter: 'Квартал',
    person: 'Людина',
    outstanding: 'Непогашено',
    net: 'Різниця',
    companyValue: 'Цінність для компанії',
    companyValueHint:
      'Оцінка: (виробіток людини за період × ціна для замовника мінус те, що компанія заплатила людині за цей виробіток) мінус частка витрат бригади за період (порівну на людину в бригаді) мінус соц./мед. страхування за відпрацьовані місяці (тільки для найманих). Це орієнтовна оцінка, а не офіційний дохід об’єкта — той рахується окремо через План по об’єктах.',
    noData: 'За цей період немає записів',
  },
  people: {
    title: 'Люди',
    name: 'Ім’я',
    brigade: 'Бригада',
    type: 'Тип',
    hourlyRate: 'Ставка, Kč/год',
    debt: 'Борг',
    addPerson: 'Додати людину',
    noPeople: 'Ще немає жодної людини',
    bulkChangeBrigade: 'Перенести в бригаду',
    insuranceMonthly: 'Соц./мед. страхування, Kč/міс',
    insuranceMonthlyHint: 'Тільки для найманих — компанія платить це щомісяця за людину. ФОП платить сам за себе.',
    detail: {
      totalDebt: 'Загальний борг',
      oldestUnpaidMonth: 'Найстаріший непогашений місяць',
      delay: 'Затримка',
      monthlyBreakdown: 'Розбивка по місяцях',
      history: 'Історія записів',
      month: 'Місяць',
      accrued: 'Нараховано',
      expenses: 'Витрати',
      paid: 'Виплачено',
      remaining: 'Лишилось',
      noDebt: 'Боргу немає',
      historyHours: 'Години',
      historyOutput: 'Виробіток',
      historyExpense: 'Витрата',
      historyPayment: 'Виплата',
      historySalary: 'Зарплата',
    },
  },
  brigades: {
    title: 'Бригади',
    addBrigade: 'Додати бригаду',
    name: 'Назва',
    people: 'Людей',
    expenses: 'Витрати',
    labor: 'Праця',
    noBrigades: 'Ще немає жодної бригади',
    members: 'Люди в бригаді',
    totalExpenses: 'Витрати бригади (праця + витрати)',
    monthlyBreakdown: 'Статистика по місяцях',
    total: 'Разом',
    renameHint: 'Перейменувати можна також у Налаштування → Бригади.',
    deleteWarning: (n) =>
      n > 0
        ? `Разом з бригадою буде видалено ${n} ${pluralUk(n, 'людину', 'людини', 'людей')} з неї та всю їхню історію (години, виробіток, зарплати, витрати, виплати). Цю дію не можна скасувати.`
        : 'Цю дію не можна скасувати.',
    membershipHistory: 'Історія бригад',
    addMembership: 'Додати перехід',
    membershipHint:
      'Коли людина переходить в іншу бригаду, додай запис з датою — це дозволяє точно рахувати продуктивність бригад у Аналітиці за той період, коли людина реально там працювала.',
  },
  sites: {
    title: 'Об’єкти',
    addSite: 'Додати об’єкт',
    name: 'Назва',
    address: 'Адреса',
    status: 'Статус',
    laborCost: 'Вартість праці',
    byBrigade: 'По бригадах',
    byWorkType: 'По видах робіт',
    noSites: 'Ще немає жодного об’єкта',
    profitability: 'Прибутковість',
    revenue: 'Дохід',
    materialCost: 'Матеріали',
    otherExpenses: 'Інші витрати',
    netProfit: 'Чистий прибуток',
    planVsActual: 'План і факт',
    monthlyBreakdown: 'Статистика по місяцях',
    bulkChangeStatus: 'Змінити статус',
  },
  workTypes: {
    title: 'Види робіт',
    addWorkType: 'Додати вид роботи',
    name: 'Назва',
    unit: 'Одиниця',
    priceOsvc: 'Ціна для ФОП',
    priceZamestnanec: 'Ціна для найманого',
    priceCustomer: 'Ціна для замовника',
  },
  expenseCategories: {
    title: 'Категорії витрат',
    addCategory: 'Додати категорію',
    name: 'Назва',
  },
  company: {
    title: 'Компанія',
    pricingTitle: 'Ціни для замовника',
    materialsTitle: 'Матеріали',
    companyExpensesTitle: 'Витрати компанії',
    profitabilityTitle: 'Прибутковість по об’єктах',
    planTitle: 'План по об’єктах',
    plannedQuantity: 'Заплановано',
    actualQuantity: 'Виконано',
    remainingQuantity: 'Залишилось',
    plannedRevenueTotal: 'Запланований дохід',
    noPlan: 'План ще не внесено',
    addProgress: 'Додати виконання',
    progressHistory: 'Історія виконання',
    monthlyProgress: 'По місяцях',
    noProgress: 'Ще немає записів про виконання',
    reportTitle: 'Звіт для керівника',
    reportPeriodMonth: 'Місяць',
    reportPeriodQuarter: 'Квартал',
    reportPeriodYear: 'Рік',
    reportYear: 'Рік',
    reportAllSites: 'Усі об’єкти',
    reportGenerate: 'Сформувати звіт',
    customerPriceDefault: (price) => `Стандартна ціна: ${price} Kč`,
    customerPriceOverrideLabel: 'Ціна для цього об’єкта (якщо відрізняється)',
    useDefaultPrice: 'Скинути до стандартної',
    allSitesOption: 'Усі об’єкти',
  },
  entry: {
    title: 'Внесення даних',
    hoursTab: 'Години',
    outputTab: 'Виробіток',
    expenseTab: 'Витрата',
    paymentTab: 'Виплата',
    salaryTab: 'Зарплата сумою',
    date: 'Дата',
    site: 'Об’єкт',
    noSite: 'Без об’єкта',
    unknownReference: '— вибери зі списку —',
    person: 'Людина',
    people: 'Люди',
    selectAll: 'Обрати всіх',
    hours: 'Кількість годин',
    workType: 'Вид роботи',
    quantity: 'Кількість',
    unitPrice: 'Ціна за одиницю',
    priceOverridden: 'Ціна змінена вручну',
    resetPrice: 'Скинути до стандартної',
    category: 'Категорія',
    paidBy: 'Хто заплатив',
    paidByCompany: 'Компанія',
    attachment: 'Фактура',
    save: 'Зберегти',
    saved: 'Збережено',
    saveAndAddAnother: 'Зберегти і додати ще',
    total: 'Разом',
    setupNeeded: 'Спершу додай довідники в Налаштуваннях',
  },
  settings: {
    title: 'Налаштування',
    brigadesTab: 'Бригади',
    peopleTab: 'Люди',
    sitesTab: 'Об’єкти',
    workTypesTab: 'Види робіт',
    expenseCategoriesTab: 'Категорії витрат',
    backupTab: 'Резервна копія',
  },
  backup: {
    title: 'Резервна копія',
    exportJson: 'Експортувати базу (JSON)',
    importJson: 'Імпортувати базу (JSON)',
    exportExcel: 'Експортувати в Excel',
    exportPdf: 'Експортувати в PDF',
    exportPdfHint: 'Відкриється діалог друку — обери «Зберегти як PDF»',
    importSuccess: 'Дані успішно імпортовано',
    importError: 'Не вдалося імпортувати файл',
    importConfirmTitle: 'Імпортувати резервну копію?',
    importConfirmBody: 'Усі дані поточної компанії буде замінено вмістом файлу. Інші компанії це не торкнеться.',
    dangerZone: 'Небезпечна зона',
    cleanupOrphans: 'Очистити застарілі записи',
    cleanupOrphansHint:
      'Якщо після видалення людини/об’єкта борг чи прибуток все одно показує старі числа — це залишки записів, видалених до виправлення каскадного видалення. Ця дія прибере їх остаточно.',
    cleanupOrphansConfirmTitle: 'Очистити застарілі записи?',
    cleanupOrphansConfirmBody:
      'Буде видалено всі записи (години, виробіток, зарплата, витрати, виплати тощо), які посилаються на вже видалених людей/об’єкти/бригади. Цю дію не можна скасувати.',
    cleanupOrphansNone: 'Застарілих записів не знайдено',
    cleanupOrphansResult: (count) => `Видалено записів: ${count}`,
    lastBackup: (days) => `Останній бекап: ${days} ${pluralUk(days, 'день', 'дні', 'днів')} тому`,
    lastBackupToday: 'Останній бекап: сьогодні',
    neverBackedUp: 'Резервну копію ще не робили — варто зробити зараз',
  },
  print: {
    generatedOn: 'Згенеровано',
    companyTotal: 'Компанія загалом',
    allSites: 'Усі об’єкти',
    quarterLabel: (quarter, year) => `${quarter} квартал ${year}`,
  },
  tenant: {
    namePlaceholder: 'Назва компанії',
    addNew: 'Нова компанія',
  },
  validation: {
    required: 'Обов’язкове поле',
    mustBePositive: 'Має бути більше нуля',
  },
  export: {
    fileNamePrefix: 'oblik-firmy',
    debtSheet: 'Борг',
    sitesSheet: 'Обєкти',
    hoursSheet: 'Години',
    outputSheet: 'Виробіток',
    expensesSheet: 'Витрати',
    paymentsSheet: 'Виплати',
    salarySheet: 'Зарплата',
    materialCostSheet: 'Матеріали',
    workHoursSheet: 'Години аналітика',
  },
  analytics: {
    title: 'Аналітика',
    tabProductivity: 'Продуктивність',
    tabHours: 'Години (аналітика)',
    tabDrawings: 'Креслення',
    hoursHint:
      'Ці години НЕ впливають на зарплату чи борг — це окремий облік для збору даних про швидкість робіт, навіть якщо людина отримує оплату за виробіток, а не погодинно.',
    workCategory: 'Вид робіт',
    categoryArmovani: 'В’язання арматури',
    categoryMonolit: 'Опалубка + бетонування',
    addHours: 'Додати запис',
    hoursNote: 'Примітка (необов’язково)',
    noEntries: 'Ще немає записів',
    productivityTitle: 'Продуктивність по бригадах',
    kgPerHour: 'кг / люд-год',
    m3PerHour: 'м³ / люд-год',
    positionsPerHour: 'позицій / люд-год',
    formworkM2PerHour: 'м² опалубки / люд-год',
    personHours: 'Люд-годин',
    brigadeCoefficient: 'Коефіцієнт бригади',
    brigadeCoefficientHint:
      'Продуктивність бригади поділена на середню по цьому виду робіт. 1 = точно середня, більше 1 — швидша за середню, менше 1 — повільніша.',
    drawingsTitle: 'Креслення / об’єкти для прогнозу',
    newDrawing: 'Новий об’єкт',
    drawingName: 'Назва',
    createdDate: 'Дата створення',
    rebarSection: 'Арматура',
    diameterMass: (d) => `ø${d} мм, кг`,
    positionCount: 'Кількість позицій вкладок',
    bentFraction: 'Частка гнутих елементів (0–1)',
    sponyCount: 'Кількість спон',
    concreteVolume: 'Обсяг бетону конструкції, м³',
    complexNodesNote: 'Прорізи / шахти / складні вузли (необов’язково)',
    monolithSection: 'Моноліт',
    thicknessMm: 'Товщина, мм',
    volumeM3: 'Обсяг, м³',
    addThickness: 'Додати товщину',
    formworkArea: 'Площа опалубки, м²',
    pourCount: 'Кількість заливок/етапів',
    coefficientsTitle: 'Похідні коефіцієнти',
    density: 'Щільність армування, кг/м³',
    positionsPerM3: 'Позицій/м³',
    smallDiameterFraction: 'Частка ø6–ø8 від маси',
    formworkToVolumeRatio: 'Опалубка/м³',
    poursPerM3: 'Заливок/м³',
    recordActual: 'Записати факт',
    actualHours: 'Фактичні люд-години',
    delayNotes: 'Що затягнуло виконання (обов’язково)',
    actualRecorded: 'Факт зафіксовано',
    forecastTitle: 'Прогноз трудовитрат',
    forecastHint:
      'Зважене середнє фактичних люд-годин N найсхожіших минулих об’єктів того самого виду робіт (за похідними коефіцієнтами). Число рахує код, не AI.',
    forecastNotEnough: (have, need) => `Даних недостатньо для прогнозу: зібрано ${have} з ${need} потрібних об’єктів.`,
    forecastResult: (hours) => `Орієнтовно: ${hours} люд-годин`,
    noDrawings: 'Ще немає жодного об’єкта',
    backToDrawings: 'До списку креслень',
    startDate: 'Дата початку роботи',
    setStartDate: 'Встановити дату початку',
    timelineTitle: 'Терміни виконання',
    totalCalendarDays: 'Всього днів (з паузами)',
    workedDaysCount: 'Робочих днів',
    pauseDaysCount: 'Днів простою',
    pausePeriods: 'Періоди простою',
    noPauses: 'Без простоїв',
    stillOngoing: 'Ще триває',
    hoursOnSite: 'Люд-годин на об’єкті (аналітика)',
    hoursByCategory: 'По видах робіт',
    drawingsOnSite: 'Креслення на цьому об’єкті',
  },
}

const cs: Dictionary = {
  common: {
    appName: 'Evidence práce a dluhů',
    save: 'Uložit',
    cancel: 'Zrušit',
    delete: 'Smazat',
    edit: 'Upravit',
    add: 'Přidat',
    back: 'Zpět',
    search: 'Hledat',
    loading: 'Načítání…',
    noData: 'Žádná data',
    yes: 'Ano',
    no: 'Ne',
    close: 'Zavřít',
    total: 'Celkem',
    date: 'Datum',
    amount: 'Částka',
    note: 'Poznámka',
    optional: 'nepovinné',
    confirmDeleteTitle: 'Smazat záznam?',
    confirmDeleteBody: 'Tuto akci nelze vrátit zpět.',
    selectAll: 'Vybrat vše',
    selectedCount: (n) => `Vybráno: ${n}`,
    deleteSelected: 'Smazat vybrané',
    bulkDeleteConfirmTitle: 'Smazat vybrané záznamy?',
    bulkDeleteConfirmBody: (n) => `Bude smazáno ${n} záznamů včetně veškerých souvisejících dat. Tuto akci nelze vrátit zpět.`,
    apply: 'Použít',
    howCalculated: 'Jak se to počítá?',
    exactDate: 'Přesné datum',
    monthOnly: 'Jen měsíc',
    present: 'dosud',
    vsPreviousPeriod: (type) =>
      `vs ${type === 'month' ? 'minulý měsíc' : type === 'quarter' ? 'minulé čtvrtletí' : 'minulý rok'}`,
    hoursShort: 'h',
  },
  theme: {
    light: 'Světlý',
    dark: 'Tmavý',
  },
  nav: {
    overview: 'Přehled',
    people: 'Lidé',
    brigades: 'Party',
    sites: 'Stavby',
    entry: 'Zadání',
    company: 'Firma',
    summary: 'Souhrn',
    analytics: 'Analytika',
    settings: 'Nastavení',
  },
  personType: {
    osvc: 'OSVČ',
    zamestnanec: 'Zaměstnanec',
  },
  siteStatus: {
    active: 'Aktivní',
    completed: 'Dokončená',
  },
  overview: {
    title: 'Přehled',
    totalDebt: 'Celkový dluh firmy vůči lidem',
    longestDelay: 'Nejdelší zpoždění',
    activeSites: 'Aktivních staveb',
    laborCostThisMonth: 'Náklady na práci tento měsíc',
    accruedThisYear: (year) => `Nárokováno za ${year}`,
    paidThisYear: (year) => `Vyplaceno za ${year}`,
    debtOverTime: 'Vývoj celkového dluhu',
    expensesByBrigade: 'Náklady podle party',
    laborCostBySite: 'Náklady na práci podle stavby',
    notEnoughData: 'Málo dat pro graf',
    noDelay: 'Žádné zpoždění',
    delayDays: (n) => `${n} ${pluralCs(n, 'den', 'dny', 'dní')}`,
    totalProfit: 'Čistý zisk firmy',
    laborCostThisMonthHint:
      'Součet nárokovaného z Hodin (Hodiny × sazba) a Výrobku (Množství × cena za jednotku) za všechny lidi a stavby — jen záznamy s datem v tomto měsíci.',
    totalProfitHint:
      'Součet zisku všech staveb: Příjem (platby zákazníka + provedeno podle Plánu × cena pro zákazníka) minus Náklady na práci, Materiál a Ostatní výdaje.',
    overdueBanner: (count, days) =>
      `Pozor: ${count} ${pluralCs(count, 'osoba má', 'osoby mají', 'osob má')} zpoždění platby přes ${days} ${pluralCs(days, 'den', 'dny', 'dní')}`,
    overdueBannerLink: 'Zobrazit seznam',
  },
  summary: {
    title: 'Souhrn',
    periodAll: 'Celkem',
    periodYear: 'Roční',
    periodQuarter: 'Kvartální',
    periodMonth: 'Měsíční',
    month: 'Měsíc',
    year: 'Rok',
    quarter: 'Kvartál',
    person: 'Osoba',
    outstanding: 'Nesplaceno',
    net: 'Rozdíl',
    companyValue: 'Hodnota pro firmu',
    companyValueHint:
      'Odhad: (výrobek osoby za období × cena pro zákazníka minus to, co firma osobě za tento výrobek zaplatila) minus podíl na výdajích party za období (rovným dílem na osobu v partě) minus sociální/zdravotní pojištění za odpracované měsíce (jen u zaměstnanců). Je to orientační odhad, ne oficiální příjem stavby — ten se počítá zvlášť přes Plán podle staveb.',
    noData: 'Za toto období nejsou žádné záznamy',
  },
  people: {
    title: 'Lidé',
    name: 'Jméno',
    brigade: 'Parta',
    type: 'Typ',
    hourlyRate: 'Sazba, Kč/h',
    debt: 'Dluh',
    addPerson: 'Přidat osobu',
    noPeople: 'Zatím žádná osoba',
    bulkChangeBrigade: 'Přesunout do party',
    insuranceMonthly: 'Sociální/zdravotní pojištění, Kč/měs',
    insuranceMonthlyHint: 'Jen u zaměstnanců — firma to platí měsíčně za osobu. OSVČ si platí sám/sama.',
    detail: {
      totalDebt: 'Celkový dluh',
      oldestUnpaidMonth: 'Nejstarší nesplacený měsíc',
      delay: 'Zpoždění',
      monthlyBreakdown: 'Rozpis po měsících',
      history: 'Historie záznamů',
      month: 'Měsíc',
      accrued: 'Nárokováno',
      expenses: 'Výdaje',
      paid: 'Vyplaceno',
      remaining: 'Zbývá',
      noDebt: 'Žádný dluh',
      historyHours: 'Hodiny',
      historyOutput: 'Výrobek',
      historyExpense: 'Výdaj',
      historyPayment: 'Výplata',
      historySalary: 'Mzda',
    },
  },
  brigades: {
    title: 'Party',
    addBrigade: 'Přidat partu',
    name: 'Název',
    people: 'Lidí',
    expenses: 'Výdaje',
    labor: 'Práce',
    noBrigades: 'Zatím žádná parta',
    members: 'Lidé v partě',
    totalExpenses: 'Náklady party (práce + výdaje)',
    monthlyBreakdown: 'Statistika po měsících',
    total: 'Celkem',
    renameHint: 'Přejmenovat lze také v Nastavení → Party.',
    deleteWarning: (n) =>
      n > 0
        ? `Spolu s partou bude smazáno ${n} ${pluralCs(n, 'osoba', 'osoby', 'osob')} z ní a veškerá jejich historie (hodiny, výrobek, mzdy, výdaje, výplaty). Tuto akci nelze vrátit zpět.`
        : 'Tuto akci nelze vrátit zpět.',
    membershipHistory: 'Historie party',
    addMembership: 'Přidat přechod',
    membershipHint:
      'Když osoba přejde do jiné party, přidej záznam s datem — to umožní přesně počítat produktivitu party v Analytice za období, kdy tam osoba skutečně pracovala.',
  },
  sites: {
    title: 'Stavby',
    addSite: 'Přidat stavbu',
    name: 'Název',
    address: 'Adresa',
    status: 'Stav',
    laborCost: 'Náklady na práci',
    byBrigade: 'Podle party',
    byWorkType: 'Podle druhu práce',
    noSites: 'Zatím žádná stavba',
    profitability: 'Ziskovost',
    revenue: 'Příjem',
    materialCost: 'Materiál',
    otherExpenses: 'Ostatní výdaje',
    netProfit: 'Čistý zisk',
    planVsActual: 'Plán a skutečnost',
    monthlyBreakdown: 'Statistika po měsících',
    bulkChangeStatus: 'Změnit stav',
  },
  workTypes: {
    title: 'Druhy práce',
    addWorkType: 'Přidat druh práce',
    name: 'Název',
    unit: 'Jednotka',
    priceOsvc: 'Cena pro OSVČ',
    priceZamestnanec: 'Cena pro zaměstnance',
    priceCustomer: 'Cena pro zákazníka',
  },
  expenseCategories: {
    title: 'Kategorie výdajů',
    addCategory: 'Přidat kategorii',
    name: 'Název',
  },
  company: {
    title: 'Firma',
    pricingTitle: 'Ceny pro zákazníka',
    materialsTitle: 'Materiál',
    companyExpensesTitle: 'Výdaje firmy',
    profitabilityTitle: 'Ziskovost podle staveb',
    planTitle: 'Plán podle staveb',
    plannedQuantity: 'Plánováno',
    actualQuantity: 'Provedeno',
    remainingQuantity: 'Zbývá',
    plannedRevenueTotal: 'Plánovaný příjem',
    noPlan: 'Plán zatím není zadaný',
    addProgress: 'Přidat provedení',
    progressHistory: 'Historie provedení',
    monthlyProgress: 'Po měsících',
    noProgress: 'Zatím žádné záznamy o provedení',
    reportTitle: 'Zpráva pro vedení',
    reportPeriodMonth: 'Měsíc',
    reportPeriodQuarter: 'Čtvrtletí',
    reportPeriodYear: 'Rok',
    reportYear: 'Rok',
    reportAllSites: 'Všechny stavby',
    reportGenerate: 'Vytvořit zprávu',
    customerPriceDefault: (price) => `Výchozí cena: ${price} Kč`,
    customerPriceOverrideLabel: 'Cena pro tuto stavbu (pokud se liší)',
    useDefaultPrice: 'Obnovit výchozí cenu',
    allSitesOption: 'Všechny stavby',
  },
  entry: {
    title: 'Zadání dat',
    hoursTab: 'Hodiny',
    outputTab: 'Výrobek',
    expenseTab: 'Výdaj',
    paymentTab: 'Výplata',
    salaryTab: 'Mzda částkou',
    date: 'Datum',
    site: 'Stavba',
    noSite: 'Bez stavby',
    unknownReference: '— vyber ze seznamu —',
    person: 'Osoba',
    people: 'Lidé',
    selectAll: 'Vybrat vše',
    hours: 'Počet hodin',
    workType: 'Druh práce',
    quantity: 'Množství',
    unitPrice: 'Cena za jednotku',
    priceOverridden: 'Cena upravena ručně',
    resetPrice: 'Obnovit výchozí cenu',
    category: 'Kategorie',
    paidBy: 'Kdo zaplatil',
    paidByCompany: 'Firma',
    attachment: 'Faktura',
    save: 'Uložit',
    saved: 'Uloženo',
    saveAndAddAnother: 'Uložit a přidat další',
    total: 'Celkem',
    setupNeeded: 'Nejdřív přidej číselníky v Nastavení',
  },
  settings: {
    title: 'Nastavení',
    brigadesTab: 'Party',
    peopleTab: 'Lidé',
    sitesTab: 'Stavby',
    workTypesTab: 'Druhy práce',
    expenseCategoriesTab: 'Kategorie výdajů',
    backupTab: 'Záloha',
  },
  backup: {
    title: 'Záloha',
    exportJson: 'Exportovat databázi (JSON)',
    importJson: 'Importovat databázi (JSON)',
    exportExcel: 'Exportovat do Excelu',
    exportPdf: 'Exportovat do PDF',
    exportPdfHint: 'Otevře se dialog tisku — vyber „Uložit jako PDF“',
    importSuccess: 'Data byla úspěšně importována',
    importError: 'Soubor se nepodařilo importovat',
    importConfirmTitle: 'Importovat zálohu?',
    importConfirmBody: 'Všechna data aktuální firmy budou nahrazena obsahem souboru. Ostatních firem se to nedotkne.',
    dangerZone: 'Nebezpečná zóna',
    cleanupOrphans: 'Vyčistit zastaralé záznamy',
    cleanupOrphansHint:
      'Pokud po smazání osoby/stavby dluh nebo zisk pořád ukazuje stará čísla, jde o zbytky záznamů smazaných před opravou kaskádového mazání. Tato akce je definitivně odstraní.',
    cleanupOrphansConfirmTitle: 'Vyčistit zastaralé záznamy?',
    cleanupOrphansConfirmBody:
      'Budou smazány všechny záznamy (hodiny, výrobek, mzda, výdaje, výplaty atd.), které odkazují na už smazané osoby/stavby/brigády. Tuto akci nelze vzít zpět.',
    cleanupOrphansNone: 'Žádné zastaralé záznamy nebyly nalezeny',
    cleanupOrphansResult: (count) => `Smazáno záznamů: ${count}`,
    lastBackup: (days) => `Poslední záloha: před ${days} ${pluralCs(days, 'dnem', 'dny', 'dny')}`,
    lastBackupToday: 'Poslední záloha: dnes',
    neverBackedUp: 'Záloha ještě nebyla vytvořena — stojí za to udělat ji teď',
  },
  print: {
    generatedOn: 'Vygenerováno',
    companyTotal: 'Firma celkem',
    allSites: 'Všechny stavby',
    quarterLabel: (quarter, year) => `${quarter}. čtvrtletí ${year}`,
  },
  tenant: {
    namePlaceholder: 'Název firmy',
    addNew: 'Nová firma',
  },
  validation: {
    required: 'Povinné pole',
    mustBePositive: 'Musí být větší než nula',
  },
  export: {
    fileNamePrefix: 'evidence-firmy',
    debtSheet: 'Dluhy',
    sitesSheet: 'Stavby',
    hoursSheet: 'Hodiny',
    outputSheet: 'Vyrobek',
    expensesSheet: 'Vydaje',
    paymentsSheet: 'Vyplaty',
    salarySheet: 'Mzda',
    materialCostSheet: 'Material',
    workHoursSheet: 'Hodiny analytika',
  },
  analytics: {
    title: 'Analytika',
    tabProductivity: 'Produktivita',
    tabHours: 'Hodiny (analytika)',
    tabDrawings: 'Kreslení',
    hoursHint:
      'Tyto hodiny NEOVLIVŇUJÍ mzdu ani dluh — je to samostatná evidence pro sběr dat o rychlosti prací, i když je osoba placená od výrobku, ne hodinově.',
    workCategory: 'Druh práce',
    categoryArmovani: 'Vázání armatury',
    categoryMonolit: 'Bednění + betonování',
    addHours: 'Přidat záznam',
    hoursNote: 'Poznámka (nepovinné)',
    noEntries: 'Zatím žádné záznamy',
    productivityTitle: 'Produktivita podle party',
    kgPerHour: 'kg / osobohodinu',
    m3PerHour: 'm³ / osobohodinu',
    positionsPerHour: 'pozic / osobohodinu',
    formworkM2PerHour: 'm² bednění / osobohodinu',
    personHours: 'Osobohodin',
    brigadeCoefficient: 'Koeficient party',
    brigadeCoefficientHint:
      'Produktivita party dělená průměrem pro tento druh práce. 1 = přesně průměrná, více než 1 rychlejší, méně pomalejší.',
    drawingsTitle: 'Kreslení / objekty pro prognózu',
    newDrawing: 'Nový objekt',
    drawingName: 'Název',
    createdDate: 'Datum vytvoření',
    rebarSection: 'Armatura',
    diameterMass: (d) => `ø${d} mm, kg`,
    positionCount: 'Počet pozic výkazu',
    bentFraction: 'Podíl ohýbaných prvků (0–1)',
    sponyCount: 'Počet distančníků',
    concreteVolume: 'Objem betonu konstrukce, m³',
    complexNodesNote: 'Prostupy / šachty / složité uzly (nepovinné)',
    monolithSection: 'Monolit',
    thicknessMm: 'Tloušťka, mm',
    volumeM3: 'Objem, m³',
    addThickness: 'Přidat tloušťku',
    formworkArea: 'Plocha bednění, m²',
    pourCount: 'Počet betonáží/etap',
    coefficientsTitle: 'Odvozené koeficienty',
    density: 'Hustota vyztužení, kg/m³',
    positionsPerM3: 'Pozic/m³',
    smallDiameterFraction: 'Podíl ø6–ø8 z hmotnosti',
    formworkToVolumeRatio: 'Bednění/m³',
    poursPerM3: 'Betonáží/m³',
    recordActual: 'Zaznamenat skutečnost',
    actualHours: 'Skutečné osobohodiny',
    delayNotes: 'Co protáhlo dobu (povinné)',
    actualRecorded: 'Skutečnost zaznamenána',
    forecastTitle: 'Prognóza trudovitrat',
    forecastHint:
      'Vážený průměr skutečných osobohodin N nejpodobnějších minulých objektů stejného druhu práce (podle odvozených koeficientů). Číslo počítá kód, ne AI.',
    forecastNotEnough: (have, need) => `Nedostatek dat pro prognózu: sebráno ${have} z ${need} potřebných objektů.`,
    forecastResult: (hours) => `Orientačně: ${hours} osobohodin`,
    noDrawings: 'Zatím žádný objekt',
    backToDrawings: 'Zpět na seznam kreslení',
    startDate: 'Datum začátku práce',
    setStartDate: 'Nastavit datum začátku',
    timelineTitle: 'Termíny provedení',
    totalCalendarDays: 'Celkem dní (včetně pauz)',
    workedDaysCount: 'Pracovních dní',
    pauseDaysCount: 'Dní prostoje',
    pausePeriods: 'Období prostoje',
    noPauses: 'Bez prostojů',
    stillOngoing: 'Stále probíhá',
    hoursOnSite: 'Osobohodin na stavbě (analytika)',
    hoursByCategory: 'Podle druhu práce',
    drawingsOnSite: 'Kreslení na této stavbě',
  },
}

export type Language = 'uk' | 'cs'

export const dictionaries: Record<Language, Dictionary> = { uk, cs }

export const intlLocale: Record<Language, string> = { uk: 'uk-UA', cs: 'cs-CZ' }
