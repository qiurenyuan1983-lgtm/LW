import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'en' | 'zh';

const translations = {
  en: {
    // General
    appTitle: "LinkW Warehouse System",
    appSubtitle: "Dashboard · Reporting · Import/Export · Role Management",
    dashboard: "Dashboard",
    rulesOps: "Rules & Ops",
    wmsSystem: "WMS System",
    signOut: "Sign Out",
    user: "User",
    menu: "MENU",
    
    // Login
    loginTitle: "LinkW Warehouse",
    loginSubtitle: "Sign in to access the system",
    username: "Username",
    password: "Password",
    signIn: "Sign In",
    invalidCredentials: "Invalid credentials",
    defaultAccounts: "Default Accounts:",
    
    // Dashboard
    overviewTitle: "Warehouse Overview",
    overviewDesc: "Real-time stats on capacity, utilization, and location types.",
    totalLocations: "Total Locations",
    zones: "A-R Zones",
    palletCapacity: "Pallet Capacity",
    avgUtilization: "Avg Utilization",
    destConstraint: "Dest Constraint",
    locsExceeding: "Locs exceeding max dests",
    summaryByType: "Summary by Type",
    zoneStats: "Zone Statistics",
    topDestinations: "Top Destinations (by Loc Count)",
    count: "Count",
    util: "Util",
    
    // Util Status
    lowLoad: "Low Load (Empty)",
    modLoad: "Moderate Load",
    highLoad: "High Load",
    critLoad: "Critical / Full",
    normalLoad: "Normal Load",

    // Rules Toolbar
    searchPlaceholder: "Search locations...",
    logException: "Log Exception",
    // FIX: Add new translation key.
    containerMap: "Container Map",
    inventory: "Inventory",
    unload: "Unload",
    plan: "Plan",
    outbound: "Outbound",
    rules: "Rules",
    columnSettings: "Columns",
    
    // Rules Table
    colRange: "Range",
    colDest: "Destinations",
    colType: "Type",
    colMax: "Max Pallets",
    colCur: "Cur Pallets",
    colUtil: "Utilization",
    colAllow: "Allow Dest",
    colCurDest: "Cur Dest",
    colStatus: "Status",
    colNote: "Note",
    colActions: "Actions",
    statusOk: "OK",
    statusOverflow: "OVERFLOW",
    
    // Location Types
    amz2: "Amazon (Max 2)",
    amzflex: "Amazon Flex",
    sehin: "Shein Zone",
    private: "Private/Residential",
    mixed: "Mixed (Platform/Private)",
    express: "FedEx/UPS Express",
    buffer: "Buffer/Overflow",
    highvalue: "High Value (R)",
    other: "Other/Temp",
    
    // WMS
    tabInventory: "Inventory",
    tabInbound: "Inbound",
    tabOutbound: "Outbound",
    tabException: "Exceptions",
    tabMaster: "Master Data",
    wmsModule: "Module",
    wmsIntegration: "WMS Integration",
    loadWms: "Load WMS",
    noWmsUrl: "No WMS URL configured.",
    enterWmsUrl: "Enter your WMS system URL below to embed it here.",
    
    // WMS Descriptions
    descInventory: "Check stock levels across zones A/B/C/V/R. Export inventory snapshots.",
    descInbound: "Process container arrivals. Generate putaway tasks based on location rules.",
    descOutbound: "Manage pick lists, verify shipments, and generate BOLs.",
    descException: "Track broken items, mixed SKUs, and KPI reports.",
    descMaster: "Configure customers, destinations, and user permissions.",

    // Modals & Alerts
    exceptionTitle: "Log Exception",
    exceptionPlaceholder: "Describe the exception (e.g. Broken pallet in A05)...",
    cancel: "Cancel",
    record: "Record",
    selectDestinations: "Select Destinations",
    maxAllowed: "Max Allowed",
    current: "Current",
    done: "Done",
    confirmDelete: "Delete this rule?",
    confirmReset: "Reset to defaults? All changes will be lost.",
    removeTag: "Remove tag",
    importSuccess: "Import successful!",
    // FIX: Add new translation key.
    containerMapImportSuccess: "Container map updated",
    deductedPallets: "Deducted pallets based on outbound sheet.",
    
    // Add Rule
    range: "Range",
    maxPal: "Max Pal",
    allowDest: "Allow",
    note: "Note"
  },
  zh: {
    // General
    appTitle: "盈仓科技 · 库位系统",
    appSubtitle: "看板 · 报表 · 导入导出 · 权限管理",
    dashboard: "库位看板",
    rulesOps: "规则与操作",
    wmsSystem: "WMS 系统",
    signOut: "退出登录",
    user: "用户",
    menu: "菜单",
    
    // Login
    loginTitle: "盈仓科技 · LA 仓库",
    loginSubtitle: "仅内部使用 · 请输入账号密码",
    username: "账号",
    password: "密码",
    signIn: "登录",
    invalidCredentials: "账号或密码错误",
    defaultAccounts: "默认账号：",
    
    // Dashboard
    overviewTitle: "仓库概览",
    overviewDesc: "实时统计库容、利用率及库位类型分布。",
    totalLocations: "库位总数",
    zones: "A-R 全区",
    palletCapacity: "托盘容量",
    avgUtilization: "平均利用率",
    destConstraint: "目的地约束",
    locsExceeding: "超标库位数量",
    summaryByType: "分类汇总",
    zoneStats: "区域统计数据",
    topDestinations: "热门目的地 (按库位)",
    count: "数量",
    util: "利用率",

    // Util Status
    lowLoad: "库容较空",
    modLoad: "库容适中",
    highLoad: "库容较高",
    critLoad: "接近满载 / 爆仓",
    normalLoad: "正常",

    // Rules Toolbar
    searchPlaceholder: "搜索库位、备注...",
    logException: "异常登记",
    // FIX: Add new translation key.
    containerMap: "柜号映射",
    inventory: "盘点单",
    unload: "拆柜单",
    plan: "排位表",
    outbound: "出库单",
    rules: "规则表",
    columnSettings: "列设置",

    // Rules Table
    colRange: "库位范围",
    colDest: "目的地标签",
    colType: "类别",
    colMax: "最大托盘",
    colCur: "当前托盘",
    colUtil: "利用率",
    colAllow: "允许数",
    colCurDest: "当前数",
    colStatus: "状态",
    colNote: "备注",
    colActions: "操作",
    statusOk: "正常",
    statusOverflow: "超标",
    
    // Location Types
    amz2: "Amazon (≤2)",
    amzflex: "亚马逊机动",
    sehin: "希音专区",
    private: "私人/住宅",
    mixed: "混放 (平台/私人)",
    express: "FedEx/UPS 快递",
    buffer: "偏仓/缓冲区",
    highvalue: "贵品区 (R)",
    other: "其他/暂存",
    
    // WMS
    tabInventory: "库存看板",
    tabInbound: "入库/拆柜",
    tabOutbound: "出库/发货",
    tabException: "异常管理",
    tabMaster: "主数据",
    wmsModule: "模块",
    wmsIntegration: "WMS 集成",
    loadWms: "加载 WMS",
    noWmsUrl: "未配置 WMS 地址",
    enterWmsUrl: "在下方输入 WMS 系统地址以嵌入显示。",

    // WMS Descriptions
    descInventory: "查询 A/B/C/V/R 各区库存水平。导出库存快照。",
    descInbound: "处理到柜拆柜。根据库位规则生成上架任务。",
    descOutbound: "管理拣货单，核对发货，生成 BOL。",
    descException: "追踪破损、混装、少件等异常及 KPI 报表。",
    descMaster: "配置客户、目的地映射及用户权限。",

    // Modals & Alerts
    exceptionTitle: "异常登记",
    exceptionPlaceholder: "描述异常情况 (例如: A05 托盘破损, 柜号 1234 少 5 箱)...",
    cancel: "取消",
    record: "记录",
    selectDestinations: "选择目的地",
    maxAllowed: "最大允许",
    current: "当前",
    done: "完成",
    confirmDelete: "确定删除此规则？",
    confirmReset: "确定恢复默认？所有更改将丢失。",
    removeTag: "移除标签",
    importSuccess: "导入成功！",
    // FIX: Add new translation key.
    containerMapImportSuccess: "柜号映射已更新",
    deductedPallets: "根据出库单已扣减托盘。",

    // Add Rule
    range: "库位",
    maxPal: "最大",
    allowDest: "允许",
    note: "备注"
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations['en']) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('zh');

  useEffect(() => {
    const savedLang = localStorage.getItem('app_language');
    if (savedLang === 'en' || savedLang === 'zh') {
      setLanguage(savedLang);
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('app_language', lang);
  };

  const t = (key: keyof typeof translations['en']) => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
