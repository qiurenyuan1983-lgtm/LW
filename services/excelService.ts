import * as XLSX from 'xlsx';
import { UnloadPlan, UnloadPlanRow, LocationRule } from '../types';

export function classifyDestinationForRule(dest: string): string {
  const raw = (dest || "").trim();
  const d = raw.toLowerCase();
  if (!d) return "other";

  if (d.includes("amazon")) return "amz";
  if (/^[a-z]{3}\d$/i.test(raw)) return "amz";

  if (d.includes("希音") || d.includes("shein")) return "sehin";
  if (d.includes("住宅") || d.includes("私人") || d.includes("residential")) return "private";
  if (
    d.includes("walmart") || d.includes("wayfair") || d.includes("tiktok") ||
    d.includes("4px") || d.includes("西邮") || d.includes("平台") ||
    d.includes("暂扣") || d.includes("中转") || d.includes("fbx")
  ) {
    return "platform";
  }

  return "other";
}

export function parseUnloadSheet(aoa: any[][]): UnloadPlan | null {
  if (!aoa || !aoa.length) {
    alert("表格内容为空");
    return null;
  }

  // 1. Find Container No (Search in first 15 rows)
  let containerNo = "";
  const containerRegex = /(柜号|container|cntr)/i;
  
  outerLoop: for (let i = 0; i < Math.min(15, aoa.length); i++) {
    const row = aoa[i] || [];
    for (let j = 0; j < row.length; j++) {
      const text = String(row[j] == null ? "" : row[j]).trim();
      if (containerRegex.test(text)) {
        // Try current cell split or next cell
        if (text.includes(":") || text.includes("：")) {
            const split = text.split(/[:：]/);
            if(split[1] && split[1].trim()) {
                containerNo = split[1].trim();
                break outerLoop;
            }
        }
        // If not found in split, try next cell
        if (j < row.length - 1) {
            const nextVal = String(row[j + 1] == null ? "" : row[j + 1]).trim();
            if(nextVal) {
                containerNo = nextVal;
                break outerLoop;
            }
        }
      }
    }
  }

  // 2. Find Header
  let headerRowIndex = -1;
  let headers: string[] = [];
  const maxScan = Math.min(30, aoa.length);
  for (let i = 0; i < maxScan; i++) {
    const row = (aoa[i] || []).map(v => String(v == null ? "" : v).trim());
    if (!row.length) continue;

    if (
      row.some(c => c.includes("派送地址")) ||
      row.some(c => c.includes("目的地"))   ||
      row.some(c => c.toUpperCase() === "SO")
    ) {
      headerRowIndex = i;
      headers = row;
      break;
    }
  }

  if (headerRowIndex === -1) {
    alert("未找到表头（需要包含 '派送地址' 或 '目的地' 字段）");
    return null;
  }

  // 3. Find Dest Col
  let destIdx = -1;
  headers.forEach((h, idx) => {
    const v = (h || "").toString().trim();
    const lower = v.toLowerCase();
    if (destIdx >= 0) return;
    if (
      v.includes("派送地址") ||
      v.includes("目的地")   ||
      lower.includes("destination") ||
      lower === "dest"
    ) {
      destIdx = idx;
    }
  });

  if (destIdx === -1) {
    alert("未找到 '派送地址 / 目的地 / destination' 列，请检查表头。");
    return null;
  }

  // 4. Find Pallet Col
  let palletIdx = -1;
  headers.forEach((h, idx) => {
    const v = (h || "").toString().trim();
    const lower = v.toLowerCase();
    if (palletIdx >= 0) return;
    if (
      v.includes("PB数量") || v.includes("PB数") ||
      v.includes("板数")   || v.includes("托盘") ||
      lower.includes("pallet")
    ) {
      palletIdx = idx;
    }
  });

  // 5. Parse Rows
  const rows: UnloadPlanRow[] = [];
  for (let i = headerRowIndex + 1; i < aoa.length; i++) {
    const row = aoa[i];
    if (!row) continue;
    const cells = Array.from(row);
    const allEmpty = cells.every(v => v == null || String(v).trim() === "");
    if (allEmpty) continue;

    const dest = cells[destIdx] != null ? String(cells[destIdx]).trim() : "";
    let pallets = 1;
    if (palletIdx >= 0 && cells[palletIdx] != null && String(cells[palletIdx]).trim() !== "") {
      const pv = Number(cells[palletIdx]);
      if (!Number.isNaN(pv) && pv > 0) pallets = pv;
    }

    // Skip rows without destination, unless we want to catch them? 
    // Usually empty dest rows are junk or footer, but sometimes valid. Let's keep if not empty row.
    if(dest) {
        rows.push({
          raw: cells.map(v => (v == null ? "" : v)),
          dest,
          pallets,
          rowIndex: i,
          containerNo
        });
    }
  }

  return { headers, rows, headerRowIndex, aoa };
}

export function assignLocationsForUnload(rows: UnloadPlanRow[], currentRules: LocationRule[]): UnloadPlanRow[] {
  // Deep copy to simulate allocation state
  const capList = currentRules.map(r => {
    const max = (r.maxPallet && !Number.isNaN(Number(r.maxPallet))) ? Number(r.maxPallet) : null;
    const cur = (r.curPallet && !Number.isNaN(Number(r.curPallet))) ? Number(r.curPallet) : 0;
    const allowed = r.allowedDest || (['mixed','private','other'].includes(r.type) ? 3 : 2);
    
    return {
      range: r.range,
      type: r.type,
      destinations: r.destinations ? r.destinations.split(/[，,]/).map(t => t.trim()).filter(Boolean) : [],
      max,
      used: cur,
      allowedDestCount: allowed
    };
  });

  function findBestLocation(row: UnloadPlanRow) {
    const dest = row.dest || "";
    const pallets = row.pallets && row.pallets > 0 ? row.pallets : 1;
    const cat = classifyDestinationForRule(dest);
    
    let bestIndex = -1;
    let bestScore = -Infinity;

    capList.forEach((c, idx) => {
      // 1. Zone/Type Matching
      let isMatch = false;
      if (cat === "amz") {
         if (['amz2', 'amzflex', 'buffer'].includes(c.type)) isMatch = true;
      } else if (cat === "sehin") {
         if (c.type === "sehin") isMatch = true;
      } else if (cat === "platform") {
         if (['mixed', 'buffer', 'other'].includes(c.type)) isMatch = true;
      } else if (cat === "private") {
         if (['private', 'mixed'].includes(c.type)) isMatch = true;
      } else {
         if (['mixed', 'buffer', 'other'].includes(c.type)) isMatch = true;
      }
      
      if (!isMatch) return; // Hard Filter

      // 2. Capacity Check
      // If max is set, strict check. If not set, allow but score lower if usage high
      if (c.max != null) {
          if (c.used + pallets > c.max) return;
      }

      // 3. Destination Constraint
      const hasDest = c.destinations.includes(dest);
      const destCount = c.destinations.length;
      
      if (!hasDest) {
         // New destination for this location
         if (destCount >= c.allowedDestCount) return; // Full on dests
      }

      // Scoring
      let score = 0;

      // Priority 1: Already has this destination
      if (hasDest) score += 1000;
      
      // Priority 2: Empty location (clean slate)
      else if (destCount === 0) score += 500;
      
      // Priority 3: Utilization (Prefer filling up existing vs fragmentation?)
      // Strategy: Try to consolidate.
      if (c.max) {
          const util = c.used / c.max;
          // Prefer somewhat used over completely empty to save empty bins? 
          // Or prefer empty to keep clean? 
          // Let's prefer balancing load: lower util is better for space, but consolidation is better for picking.
          // V14 Logic: "Continuous locations" -> implies filling them up.
          // Let's deduct score for high utilization to avoid jam, but add small bonus for non-zero to group
          if(util > 0.8) score -= 200; 
      }

      if (score > bestScore) {
        bestScore = score;
        bestIndex = idx;
      }
    });

    if (bestIndex >= 0) {
      capList[bestIndex].used += pallets;
      if (!capList[bestIndex].destinations.includes(dest)) {
          capList[bestIndex].destinations.push(dest);
      }
      return capList[bestIndex].range;
    }
    return "";
  }

  return rows.map(row => {
    const loc = findBestLocation(row);
    return { ...row, location: loc };
  });
}

export function parseOutboundSheet(aoa: any[][]) {
    if (!aoa || aoa.length === 0) {
      alert("出库单表格内容为空");
      return null;
    }
    const headers = aoa[0].map((h: any) => String(h || "").trim());
    let destIdx = -1;
    let palletIdx = -1;

    headers.forEach((h, idx) => {
      const lower = h.toLowerCase();
      if (destIdx < 0 && (h.includes("目的地") || lower.includes("destination") || lower === "dest")) {
        destIdx = idx;
      }
      if (palletIdx < 0 && (h.includes("托盘") || h.includes("板数") || lower.includes("pallet"))) {
        palletIdx = idx;
      }
    });

    if (destIdx < 0) {
      alert("出库单未找到“目的地 / destination”列，请检查表头。");
      return null;
    }
    if (palletIdx < 0) {
      alert("出库单未找到“托盘 / pallet”列，请检查表头。");
      return null;
    }

    const rows = [];
    for (let i = 1; i < aoa.length; i++) {
      const row = aoa[i];
      if (!row || row.every((v: any) => (v === null || v === undefined || String(v).trim() === ""))) continue;
      const dest = row[destIdx] != null ? String(row[destIdx]) : "";
      let pallets = row[palletIdx] != null ? Number(row[palletIdx]) : 0;
      if (Number.isNaN(pallets) || pallets <= 0) continue;
      rows.push({ dest, pallets });
    }
    return rows;
  }