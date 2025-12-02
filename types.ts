export type UserRole = 'Mike' | 'operator' | 'staff' | null;

export interface LocationRule {
  range: string;
  type: string;
  note: string;
  allowedDest: number | null;
  currentDest: number | null;
  destinations: string; // Comma separated string
  maxPallet: number | null;
  curPallet: number | null;
}

export interface LogEntry {
  time: string;
  text: string;
}

export interface ColumnConfig {
  id: keyof LocationRule | 'utilization' | 'status' | 'actions';
  label: string;
  order: number;
  visible: boolean;
}

export interface UnloadPlanRow {
  raw: any[];
  dest: string;
  pallets: number;
  rowIndex: number;
  containerNo: string;
  location?: string;
}

export interface UnloadPlan {
  headers: string[];
  rows: UnloadPlanRow[];
  headerRowIndex: number;
  aoa: any[][];
}

export type DestContainerMap = Record<string, string[]>;

export const ACCOUNTS = {
  Mike: { password: "lk2025", role: "Mike" as UserRole },
  operator: { password: "123456", role: "operator" as UserRole },
  staff: { password: "123456", role: "operator" as UserRole }
};

export const LOCATION_TYPES = [
  { value: "amz2", label: "Amazon (Max 2)", class: "bg-blue-50 text-blue-700 border-blue-200" },
  { value: "amzflex", label: "Amazon Flex", class: "bg-blue-50 text-blue-700 border-blue-200" },
  { value: "sehin", label: "Shein Zone", class: "bg-pink-50 text-pink-700 border-pink-200" },
  { value: "private", label: "Private/Residential", class: "bg-orange-50 text-orange-700 border-orange-200" },
  { value: "mixed", label: "Mixed (Platform/Private)", class: "bg-purple-50 text-purple-700 border-purple-200" },
  { value: "express", label: "FedEx/UPS Express", class: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  { value: "buffer", label: "Buffer/Overflow", class: "bg-gray-50 text-gray-700 border-gray-200" },
  { value: "highvalue", label: "High Value (R)", class: "bg-red-50 text-red-700 border-red-200" },
  { value: "other", label: "Other/Temp", class: "bg-slate-50 text-slate-700 border-slate-200" },
];

export const DESTINATION_OPTIONS = [
  "商业地址","希音仓","住宅地址","谷仓","万邑通","walmart","tiktok",
  "暂扣","大货中转","仓储上架",
  "Amazon-XLX7 Total","Amazon-MIT2 Total","Amazon-GYR2 Total","Amazon-GEU3 Total","Amazon-IUSW Total","Amazon-GEU2 Total",
  "Amazon-GYR3 Total","Amazon-IND9 Total","Amazon-IUTE Total","Amazon-CLT2 Total","Amazon-FWA4 Total","Amazon-SCK8 Total",
  "Amazon-ABE8 Total","Amazon-SBD1 Total","Amazon-MQJ1 Total","Amazon-LGB8 Total","Amazon-PSC2 Total","Amazon-BNA6 Total",
  "Amazon-FTW1 Total","Amazon-AVP1 Total","Amazon-IUSP Total","Amazon-LAN2 Total","Amazon-MEM1 Total","Amazon-RMN3 Total",
  "Amazon-VGT2 Total","Amazon-RFD2 Total","Amazon-ABQ2 Total","Amazon-IUSJ Total","Amazon-IAH3 Total","Amazon-LAX9 Total",
  "Amazon-IUSR Total","Amazon-SCK4 Total","Amazon-ONT8 Total","Amazon-TCY1 Total","Amazon-SLC2 Total","Amazon-RDU4 Total",
  "Amazon-SMF3 Total","Amazon-MDW2 Total","Amazon-LAS1 Total","Amazon-IUSQ Total","Amazon-ORF2 Total","Amazon-FOE1 Total",
  "Amazon-TEB9 Total","Amazon-GEU5 Total","Amazon-DEN8 Total","Amazon-POC1 Total","Amazon-RDU2 Total","Amazon-IUTI Total",
  "Amazon-POC3 Total","Amazon-LGB6 Total","Amazon-SWF2 Total","Amazon-OKC2 Total","Amazon-HLI2 Total","运去哪",
  "Amazon-IUSF Total","Amazon-SMF6 Total","Amazon-TCY2 Total","Amazon-SBD2 Total","Amazon-POC2 Total","Amazon-AMA1 Total",
  "Amazon-IUST Total","Amazon-FAT2 Total","Amazon-IND5 Total","Amazon-PHX7 Total","Amazon-QXY8 Total","Amazon-MKC4 Total",
  "wayfair","西邮","Amazon-SJC7 Total","Amazon-PBI3 Total","Amazon-PPO4 Total","Amazon-ICT2 Total","Amazon-MEM6 Total",
  "Amazon-STL3 Total","Amazon-MCC1 Total","Amazon-ILG1 Total","Amazon-RYY2 Total","Amazon-LAS6 Total","Amazon-BOS7 Total",
  "Amazon-LGB4 Total","4px","Amazon-DFW6 Total","Amazon-RIC7 Total","Amazon-STL4 Total","Amazon-SAT1 Total","Amazon-FTW5 Total",
  "Amazon-MCE1 Total","Amazon-OAK3 Total","Amazon-LIT2 Total","Amazon-LFT1 Total","Amazon-XON1 Total","Amazon-SAT4 Total",
  "Amazon-SLC3 Total","Amazon-MDW6 Total","Amazon-BFI3 Total","Amazon-RFD4 Total","Amazon-MQJ2 Total"
];