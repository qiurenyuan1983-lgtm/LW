import { LocationRule } from '../types';

const locationCodes = [
  "Office1",
  "A00","A01","A02","A03","A04","A05","A06","A07","A08","A09",
  "A10","A11","A12","A13","A14","A15","A16","A17","A18","A19",
  "A20","A21","A22","A23","A24","A25","A26","A27","A28","A29",
  "A30","A31","A32","A33","A34","A35","A36","A37","A38","A39",
  "A40","A41","A42","A43","A44","A45","A46","A47","A48","A49",
  "A50","A51","A52","A53","A54",
  "B00","B01","B02","B03","B04","B05","B06","B07","B08","B09",
  "B10","B11","B12","B13","B14","B15","B16","B17","B18","B19",
  "B20","B21","B22","B23","B24","B25","B26","B27","B28","B29",
  "B30","B31","B32","B33",
  "C00","C01","C02","C03","C04","C05","C06","C07","C08","C09",
  "C10","C11","C12","C13","C14","C15","C16","C17","C18","C19",
  "C20","C21","C22","C23","C24","C25","C26","C27","C28","C29",
  "C30","C31","C32","C33",
  "D00","D01","D02","D03","D04","D05","D06","D07","D08","D09",
  "D10","D11","D12","D13","D14","D15","D16","D17","D18","D19",
  "D20","D21","D22","D23","D24","D25","D26","D27","D28","D29",
  "D30","D31","D32","D33",
  "E01","E02","E03","E04","E05","E06","E07","E08","E09",
  "E10","E11","E12","E13","E14","E15","E16","E17",
  "F00","F01","F02","F03","F04","F05","F06","F07","F08","F09","F10","F11",
  "G00","G01","G02","G03","G04","G05","G06","G07","G08","G09","G10","G11","G12","G13","G14","G15","G16","G17","G18",
  "H01","T02","H03","H04","H05","H06","H07","H08","H09","H10","H11","H12","H13","H14",
  "H15","H16","H17","H18","H19","H20","H21","H22","H23","H24","H25","H26","H27","H28","H29","H30","H31","H32","H33","H34",
  "H35","H36","H37","H38","H39","H40","H41","H42",
  "V09","V10","V11","V12","V13","V14","V15","V16","V17","V18","V19","V20",
  "V21","V22","V23","V24","V25","V26","V27","V28","V29","V30","V31","V32",
  "V33","V34","V35","V36","V37","V38","V39","V40","V41","V42","V43","V44",
  "V45","V46","V47","V48","V49","V50","V51","V52","V53","V54","V55","V56",
  "V57","V58","V59","V60","V61","V62","V63","V64","V65",
  "R34","R35","R36","R37","R38","R39","R40","R41","R42"
];

export function buildDefaultRule(code: string): LocationRule {
  let type = "other";
  let note = "";
  let allowed: number | null = null;
  let maxPallet: number | null = null; // Default null, let user set it, or could set default capacities

  if (code === "Office1") {
    type = "other";
    note = "暂存区/大货中转";
    allowed = 5;
    return { range: code, type, note, allowedDest: allowed, currentDest: null, destinations: "", maxPallet, curPallet: null };
  }

  const prefix = code[0];
  const num = parseInt(code.slice(1), 10);

  // V14 Zoning Logic
  if (prefix === "A") {
    if (code === "A00") {
      type = "express"; note = "FedEx 快递区"; allowed = 5;
    } else if (code === "A12") {
      type = "express"; note = "UPS 快递区"; allowed = 5;
    } else if (num >= 45 && num <= 54) {
      type = "sehin"; note = "希音专属区"; allowed = 2;
    } else {
      // A01-A44 (excl A12)
      type = "amz2"; note = "亚马逊主区域"; allowed = 2;
    }
  } 
  else if (prefix === "B") {
    type = "amz2"; note = "亚马逊扩展区"; allowed = 2;
  } 
  else if (prefix === "C") {
    type = "amz2"; note = "亚马逊扩展区2"; allowed = 2;
  }
  else if (prefix === "D") {
    type = "buffer"; note = "亚马逊偏仓"; allowed = 2;
  }
  else if (prefix === "E") {
    type = "buffer"; note = "混放/整理区"; allowed = 2;
  }
  else if (prefix === "F") {
    type = "other"; note = "中转/暂扣区"; allowed = 3;
  }
  else if (prefix === "G") {
    if (num >= 1 && num <= 4) {
      type = "buffer"; note = "偏仓 Amazon"; allowed = 2;
    } else {
      type = "private"; note = "私人地址"; allowed = 3;
    }
  }
  else if (prefix === "H") {
    type = "mixed"; note = "私人/平台混放"; allowed = 3;
  }
  else if (prefix === "V") {
    type = "mixed"; note = "私人/商业混放"; allowed = 3;
  }
  else if (prefix === "R") {
    type = "highvalue"; note = "贵品区域"; allowed = 3;
  }

  return {
    range: code,
    type,
    note,
    allowedDest: allowed,
    currentDest: null,
    destinations: "",
    maxPallet,
    curPallet: null
  };
}

export function generateDefaultRules(): LocationRule[] {
    return locationCodes.map(buildDefaultRule);
}