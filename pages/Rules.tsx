
import React, { useState, useEffect, useMemo } from 'react';
import { LocationRule, UserRole, ColumnConfig, LOCATION_TYPES, DESTINATION_OPTIONS, UnloadPlan, DestContainerMap } from '../types';
import * as XLSX from 'xlsx';
import { parseUnloadSheet, assignLocationsForUnload, parseOutboundSheet } from '../services/excelService';
import { Search, Plus, RotateCcw, Download, Upload, Settings, X, Trash2, AlertTriangle, FileText, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface Props {
  rules: LocationRule[];
  setRules: (rules: LocationRule[]) => void;
  userRole: UserRole;
  addLog: (text: string) => void;
}

const DEST_CONTAINER_KEY = "la_dest_container_map_v1";

const Rules: React.FC<Props> = ({ rules, setRules, userRole, addLog }) => {
  const { t } = useLanguage();

  const DEFAULT_COLUMNS: ColumnConfig[] = [
    { id: 'range', label: t('colRange'), order: 1, visible: true },
    { id: 'destinations', label: t('colDest'), order: 2, visible: true },
    { id: 'type', label: t('colType'), order: 3, visible: true },
    { id: 'maxPallet', label: t('colMax'), order: 4, visible: true },
    { id: 'curPallet', label: t('colCur'), order: 5, visible: true },
    { id: 'utilization', label: t('colUtil'), order: 6, visible: true },
    { id: 'allowedDest', label: t('colAllow'), order: 7, visible: true },
    { id: 'currentDest', label: t('colCurDest'), order: 8, visible: true },
    { id: 'status', label: t('colStatus'), order: 9, visible: true },
    { id: 'note', label: t('colNote'), order: 10, visible: true },
  ];

  const [keyword, setKeyword] = useState('');
  const [columns, setColumns] = useState<ColumnConfig[]>(DEFAULT_COLUMNS);
  const [showColSettings, setShowColSettings] = useState(false);
  
  // Update Columns labels when language changes
  useEffect(() => {
      setColumns(cols => cols.map(c => {
          const defaults = DEFAULT_COLUMNS.find(d => d.id === c.id);
          return defaults ? { ...c, label: defaults.label } : c;
      }));
  }, [t]);

  // Sort State
  const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: 'asc' | 'desc' }>({
    key: 'range', // Default sort by range
    direction: 'asc'
  });

  // Dest Selector Modal State
  const [editingDestIndex, setEditingDestIndex] = useState<number | null>(null);
  const [destSearch, setDestSearch] = useState('');

  // Exception Modal
  const [showException, setShowException] = useState(false);
  const [exceptionNote, setExceptionNote] = useState('');

  // Container Map (Dest -> [Container1, Container2])
  const [destContainerMap, setDestContainerMap] = useState<DestContainerMap>({});

  // New Rule State
  const [newRule, setNewRule] = useState<Partial<LocationRule>>({ type: 'other' });

  // Plan State
  const [lastPlan, setLastPlan] = useState<UnloadPlan | null>(null);

  const isAdmin = userRole === 'Mike';
  const isOperator = userRole === 'operator' || userRole === 'staff';

  const canEdit = (field: keyof LocationRule) => {
    if (isAdmin) return true;
    if (isOperator) return ['curPallet', 'destinations', 'note'].includes(field);
    return false;
  };

  // Load container map on init
  useEffect(() => {
    const saved = localStorage.getItem(DEST_CONTAINER_KEY);
    if(saved) {
        try {
            setDestContainerMap(JSON.parse(saved));
        } catch(e) {}
    }
  }, []);

  // Save container map
  useEffect(() => {
    localStorage.setItem(DEST_CONTAINER_KEY, JSON.stringify(destContainerMap));
  }, [destContainerMap]);

  // --- Handlers ---

  const handleUpdateRule = (index: number, field: keyof LocationRule, value: any) => {
    const newRules = [...rules];
    const oldVal = newRules[index][field];
    newRules[index] = { ...newRules[index], [field]: value };
    
    // Auto update dest count
    if (field === 'destinations') {
        const tags = (value as string).split(/[，,]/).filter(Boolean);
        newRules[index].currentDest = tags.length;
    }

    setRules(newRules);
    addLog(`Updated ${newRules[index].range} ${field}: ${oldVal} -> ${value}`);
  };

  const handleAddRule = () => {
    if (!newRule.range) return alert("Range required");
    const rule: LocationRule = {
      range: newRule.range,
      type: newRule.type || 'other',
      destinations: newRule.destinations || '',
      maxPallet: newRule.maxPallet || null,
      curPallet: newRule.curPallet || null,
      allowedDest: newRule.allowedDest || 2,
      currentDest: newRule.destinations ? newRule.destinations.split(',').length : null,
      note: newRule.note || ''
    };
    setRules([...rules, rule]);
    setNewRule({ type: 'other' });
    addLog(`Added rule: ${rule.range}`);
  };

  const handleDeleteRule = (index: number) => {
    if(!confirm(t('confirmDelete'))) return;
    const r = rules[index];
    const newRules = rules.filter((_, i) => i !== index);
    setRules(newRules);
    addLog(`Deleted rule: ${r.range}`);
  };

  const handleResetRules = () => {
      if(confirm(t('confirmReset'))) {
          localStorage.removeItem("la_location_rules_v13");
          window.location.reload();
      }
  };

  const handleSaveException = () => {
      if(!exceptionNote) return;
      addLog(`EXCEPTION LOGGED: ${exceptionNote}`);
      alert("Exception recorded in logs.");
      setExceptionNote('');
      setShowException(false);
  };

  const handleSort = (key: string) => {
      let direction: 'asc' | 'desc' = 'asc';
      if (sortConfig.key === key && sortConfig.direction === 'asc') {
          direction = 'desc';
      }
      setSortConfig({ key, direction });
  };

  // --- Import/Export ---

  const exportXLSX = () => {
     const ws = XLSX.utils.json_to_sheet(rules);
     const wb = XLSX.utils.book_new();
     XLSX.utils.book_append_sheet(wb, ws, "Rules");
     XLSX.writeFile(wb, "LocationRules.xlsx");
     addLog("Exported Rules XLSX");
  };

  const handleUnloadImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
        const data = new Uint8Array(ev.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, {type: 'array'});
        const aoa = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {header: 1}) as any[][];
        const parsed = parseUnloadSheet(aoa);
        if(parsed) {
            const assigned = assignLocationsForUnload(parsed.rows, rules);
            
            // Update container map
            const newMap = {...destContainerMap};
            let parsedContainerNo = ""; // try to capture one from rows
            
            assigned.forEach(row => {
                if(row.containerNo) parsedContainerNo = row.containerNo;
                if(row.dest && row.containerNo) {
                    if(!newMap[row.dest]) newMap[row.dest] = [];
                    if(!newMap[row.dest].includes(row.containerNo)) {
                        newMap[row.dest].push(row.containerNo);
                    }
                }
            });
            setDestContainerMap(newMap);

            // Apply to local state
            const newRules = [...rules];
            assigned.forEach(row => {
                if(row.location) {
                    const rIdx = newRules.findIndex(r => r.range === row.location);
                    if(rIdx >= 0) {
                        newRules[rIdx].curPallet = (newRules[rIdx].curPallet || 0) + row.pallets;
                        // Add dest tag if missing
                        const tags = (newRules[rIdx].destinations || "").split(/[，,]/).map(t=>t.trim()).filter(Boolean);
                        if(row.dest && !tags.includes(row.dest)) {
                            tags.push(row.dest);
                            newRules[rIdx].destinations = tags.join('，');
                            newRules[rIdx].currentDest = tags.length;
                        }
                    }
                }
            });
            setRules(newRules);
            
            // Prepare export plan
            const plan = parsed;
            // Inject locations into plan.aoa
            let headerRow = plan.aoa[plan.headerRowIndex];
            let locIdx = headerRow.findIndex((h:any) => String(h).includes("建议库位"));
            if(locIdx === -1) {
                locIdx = headerRow.length;
                headerRow.push("建议库位");
            }
            assigned.forEach(row => {
                if(!plan.aoa[row.rowIndex]) plan.aoa[row.rowIndex] = [];
                plan.aoa[row.rowIndex][locIdx] = row.location || "";
            });
            setLastPlan(plan);
            addLog(`Imported Unload Plan: ${parsed.rows.length} rows. Container: ${parsedContainerNo}`);
            alert(`${t('importSuccess')} ${assigned.filter(r => !!r.location).length} locations assigned.`);
        }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const handleExportPlan = () => {
    if(!lastPlan) return;
    const ws = XLSX.utils.aoa_to_sheet(lastPlan.aoa);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Plan");
    XLSX.writeFile(wb, "UnloadPlan_WithLocations.xlsx");
  };

  const handleOutboundImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
        const data = new Uint8Array(ev.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, {type: 'array'});
        const aoa = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {header: 1}) as any[][];
        const rows = parseOutboundSheet(aoa);
        
        if(rows) {
            const newRules = [...rules];
            let deducted = 0;
            rows.forEach(row => {
                let remaining = row.pallets;
                // Simple heuristic: find location with this dest tag and most pallets
                while(remaining > 0) {
                     const candidates = newRules
                        .map((r, i) => ({r, i}))
                        .filter(x => (x.r.destinations||"").includes(row.dest))
                        .sort((a,b) => (b.r.curPallet||0) - (a.r.curPallet||0));
                     
                     if(candidates.length === 0) break; // No matching location found
                     
                     const target = candidates[0];
                     const take = Math.min(target.r.curPallet || 0, remaining);
                     if(take <= 0) break;
                     
                     newRules[target.i].curPallet = (newRules[target.i].curPallet || 0) - take;
                     remaining -= take;
                     deducted += take;
                }
            });
            setRules(newRules);
            addLog(`Imported Outbound: Deducted ${deducted} pallets`);
            alert(`${t('deductedPallets')} (${deducted})`);
        }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const handleInventoryImport = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if(!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
          const data = new Uint8Array(ev.target?.result as ArrayBuffer);
          const wb = XLSX.read(data, {type: 'array'});
          const sheet = wb.Sheets[wb.SheetNames[0]];
          const json = XLSX.utils.sheet_to_json(sheet) as any[];
          
          const newRules = [...rules];
          let updated = 0;
          json.forEach(row => {
             // Assuming columns: Location, Pallets
             const loc = row['Location'] || row['库位'];
             const pal = row['Pallets'] || row['托盘'] || row['Quantity'] || row['数量'];
             if(loc && pal != null) {
                 const idx = newRules.findIndex(r => r.range === String(loc));
                 if(idx >= 0) {
                     newRules[idx].curPallet = Number(pal);
                     updated++;
                 }
             }
          });
          setRules(newRules);
          addLog(`Inventory Import: Updated ${updated} locations.`);
          alert(`${t('importSuccess')} Updated ${updated} locations.`);
      };
      reader.readAsArrayBuffer(file);
      e.target.value = '';
  }

  // --- Rendering ---

  const sortedColumns = useMemo(() => [...columns].sort((a,b) => a.order - b.order).filter(c => c.visible), [columns]);

  const sortedAndFilteredRules = useMemo(() => {
    let result = [...rules];
    
    // 1. Filter
    if(keyword) {
        const low = keyword.toLowerCase();
        result = result.filter(r => 
            r.range.toLowerCase().includes(low) || 
            r.destinations.toLowerCase().includes(low) || 
            r.note.toLowerCase().includes(low)
        );
    }

    // 2. Sort
    if (sortConfig.key) {
        result.sort((a, b) => {
            const isAsc = sortConfig.direction === 'asc';
            
            // Computed columns
            if (sortConfig.key === 'utilization') {
                const uA = (a.curPallet || 0) / (a.maxPallet || 1);
                const uB = (b.curPallet || 0) / (b.maxPallet || 1);
                return isAsc ? uA - uB : uB - uA;
            }
            if (sortConfig.key === 'status') {
                const overA = (a.allowedDest && a.currentDest && a.currentDest > a.allowedDest) ? 1 : 0;
                const overB = (b.allowedDest && b.currentDest && b.currentDest > b.allowedDest) ? 1 : 0;
                return isAsc ? overA - overB : overB - overA;
            }

            // Special Sort for Type (Sort by Label/Translated Name)
            if (sortConfig.key === 'type') {
                const getLabel = (typeCode: string) => {
                    const def = LOCATION_TYPES.find(d => d.value === typeCode);
                    return def ? t(def.value as any) : typeCode;
                };
                const labelA = getLabel(a.type);
                const labelB = getLabel(b.type);
                return isAsc 
                    ? labelA.localeCompare(labelB, undefined, {sensitivity: 'base'})
                    : labelB.localeCompare(labelA, undefined, {sensitivity: 'base'});
            }

            // Natural Sort for Range (or any text field that might behave like "A1, A10")
            if (sortConfig.key === 'range') {
                 return isAsc 
                    ? a.range.localeCompare(b.range, undefined, {numeric: true, sensitivity: 'base'})
                    : b.range.localeCompare(a.range, undefined, {numeric: true, sensitivity: 'base'});
            }

            // Generic logic for other fields
            const valA = a[sortConfig.key as keyof LocationRule];
            const valB = b[sortConfig.key as keyof LocationRule];

            if (valA === valB) return 0;
            // Always put nulls at the end
            if (valA === null || valA === undefined) return 1;
            if (valB === null || valB === undefined) return -1;

            if (typeof valA === 'number' && typeof valB === 'number') {
                return isAsc ? valA - valB : valB - valA;
            }

            // Text fallback with natural sort
            const strA = String(valA);
            const strB = String(valB);
            return isAsc 
                ? strA.localeCompare(strB, undefined, {numeric: true, sensitivity: 'base'})
                : strB.localeCompare(strA, undefined, {numeric: true, sensitivity: 'base'});
        });
    }

    return result;
  }, [rules, keyword, sortConfig, t]);

  const toggleDestInRule = (ruleIndex: number, dest: string) => {
      const rule = rules[ruleIndex];
      const tags = (rule.destinations || "").split(/[，,]/).map(t=>t.trim()).filter(Boolean);
      let newTags;
      if(tags.includes(dest)) {
          newTags = tags.filter(t => t !== dest);
      } else {
          // Check allowance
          if (rule.allowedDest && tags.length >= rule.allowedDest) {
              alert(`Max ${rule.allowedDest} destinations allowed!`);
              return;
          }
          newTags = [...tags, dest];
      }
      handleUpdateRule(ruleIndex, 'destinations', newTags.join('，'));
  };

  return (
    <div className="space-y-4 relative">
        {/* Toolbar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center z-10 relative">
            <div className="flex gap-2 w-full xl:w-auto">
                <div className="relative flex-1 xl:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        placeholder={t('searchPlaceholder')}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={keyword}
                        onChange={e => setKeyword(e.target.value)}
                    />
                </div>
                <button 
                    onClick={() => setShowColSettings(!showColSettings)}
                    className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-600"
                    title={t('columnSettings')}
                >
                    <Settings size={20} />
                </button>
            </div>

            <div className="flex flex-wrap gap-2 items-center">
                <button 
                    onClick={() => setShowException(true)}
                    className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 border border-red-200 text-sm font-medium transition-colors"
                >
                    <AlertTriangle size={16} /> {t('logException')}
                </button>
                <label className="flex items-center gap-2 px-3 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 border border-purple-200 text-sm font-medium cursor-pointer transition-colors">
                    <FileText size={16} /> {t('inventory')}
                    <input type="file" className="hidden" accept=".xlsx,.xls" onChange={handleInventoryImport} />
                </label>
                <label className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 border border-blue-200 text-sm font-medium cursor-pointer transition-colors">
                    <Upload size={16} /> {t('unload')}
                    <input type="file" className="hidden" accept=".xlsx,.xls" onChange={handleUnloadImport} />
                </label>
                <button 
                    onClick={handleExportPlan} 
                    disabled={!lastPlan}
                    className="flex items-center gap-2 px-3 py-2 bg-slate-50 text-slate-700 rounded-lg hover:bg-slate-100 border border-slate-200 text-sm font-medium disabled:opacity-50 transition-colors"
                >
                    <Download size={16} /> {t('plan')}
                </button>
                <label className="flex items-center gap-2 px-3 py-2 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 border border-orange-200 text-sm font-medium cursor-pointer transition-colors">
                    <Upload size={16} /> {t('outbound')}
                    <input type="file" className="hidden" accept=".xlsx,.xls" onChange={handleOutboundImport} />
                </label>
                <button onClick={exportXLSX} className="flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 border border-emerald-200 text-sm font-medium transition-colors">
                    <Download size={16} /> {t('rules')}
                </button>
            </div>
        </div>

        {/* Exception Modal */}
        {showException && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
                <div className="bg-white rounded-xl shadow-2xl p-6 w-96 max-w-full">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <AlertTriangle className="text-red-500" /> {t('exceptionTitle')}
                    </h3>
                    <textarea 
                        className="w-full h-32 border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                        placeholder={t('exceptionPlaceholder')}
                        value={exceptionNote}
                        onChange={e => setExceptionNote(e.target.value)}
                    ></textarea>
                    <div className="flex justify-end gap-2 mt-4">
                        <button onClick={() => setShowException(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">{t('cancel')}</button>
                        <button onClick={handleSaveException} className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg">{t('record')}</button>
                    </div>
                </div>
            </div>
        )}

        {/* Column Settings Modal */}
        {showColSettings && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm relative z-20">
                <div className="flex justify-between mb-2">
                    <h4 className="font-semibold text-slate-700">{t('columnSettings')}</h4>
                    <button onClick={() => setShowColSettings(false)}><X size={16} /></button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    {columns.sort((a,b)=>a.order-b.order).map((col) => (
                        <label key={col.id} className="flex items-center gap-2 p-2 bg-white rounded border border-slate-200">
                            <input 
                                type="checkbox" 
                                checked={col.visible} 
                                onChange={() => {
                                    const newCols = [...columns];
                                    const c = newCols.find(x => x.id === col.id);
                                    if(c) c.visible = !c.visible;
                                    setColumns(newCols);
                                }}
                            />
                            {col.label}
                        </label>
                    ))}
                </div>
            </div>
        )}

        {/* Admin Add Rule */}
        {isAdmin && (
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-2 items-center text-sm">
                <input 
                    placeholder={t('range')} 
                    className="border p-2 rounded w-24"
                    value={newRule.range || ''} 
                    onChange={e => setNewRule({...newRule, range: e.target.value})}
                />
                <select 
                    className="border p-2 rounded w-32"
                    value={newRule.type}
                    onChange={e => setNewRule({...newRule, type: e.target.value})}
                >
                    {LOCATION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                <input placeholder={t('maxPal')} type="number" className="border p-2 rounded w-20"
                    value={newRule.maxPallet || ''} onChange={e => setNewRule({...newRule, maxPallet: Number(e.target.value)})} />
                <input placeholder={t('allowDest')} type="number" className="border p-2 rounded w-20" 
                     value={newRule.allowedDest || ''} onChange={e => setNewRule({...newRule, allowedDest: Number(e.target.value)})} />
                <input placeholder={t('note')} className="border p-2 rounded flex-1 min-w-[150px]" 
                     value={newRule.note || ''} onChange={e => setNewRule({...newRule, note: e.target.value})} />
                
                <button onClick={handleAddRule} className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700"><Plus size={16} /></button>
                <button onClick={handleResetRules} className="bg-red-50 text-red-600 border border-red-200 p-2 rounded hover:bg-red-100" title="Reset Defaults"><RotateCcw size={16} /></button>
            </div>
        )}

        {/* Dest Selector Modal */}
        {editingDestIndex !== null && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
                <div className="bg-white rounded-xl shadow-2xl w-[500px] max-w-full max-h-[80vh] flex flex-col">
                    <div className="p-4 border-b flex justify-between items-center bg-slate-50 rounded-t-xl">
                        <h3 className="font-bold text-slate-800">{t('selectDestinations')}: {rules[editingDestIndex].range}</h3>
                        <button onClick={() => setEditingDestIndex(null)}><X size={20} /></button>
                    </div>
                    <div className="p-4 border-b">
                         <input 
                            autoFocus
                            placeholder="Search..." 
                            className="w-full px-3 py-2 border rounded-lg"
                            value={destSearch}
                            onChange={e => setDestSearch(e.target.value)}
                         />
                         <div className="text-xs text-slate-500 mt-2">
                             {t('maxAllowed')}: <span className="font-semibold">{rules[editingDestIndex].allowedDest}</span> | 
                             {t('current')}: <span className="font-semibold">{rules[editingDestIndex].currentDest}</span>
                         </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 gap-2">
                        {DESTINATION_OPTIONS.filter(opt => opt.toLowerCase().includes(destSearch.toLowerCase())).map(opt => {
                             const tags = (rules[editingDestIndex].destinations || "").split(/[，,]/).map(t=>t.trim()).filter(Boolean);
                             const isChecked = tags.includes(opt);
                             return (
                                 <label key={opt} className={`flex items-center gap-2 p-2 rounded border cursor-pointer hover:bg-blue-50 ${isChecked ? 'border-blue-500 bg-blue-50' : 'border-slate-200'}`}>
                                     <input 
                                        type="checkbox" 
                                        checked={isChecked}
                                        onChange={() => toggleDestInRule(editingDestIndex, opt)}
                                     />
                                     <span className="text-sm truncate">{opt}</span>
                                 </label>
                             )
                        })}
                    </div>
                    <div className="p-4 border-t flex justify-end">
                        <button onClick={() => setEditingDestIndex(null)} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">{t('done')}</button>
                    </div>
                </div>
            </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm h-[calc(100vh-240px)] overflow-auto relative">
            <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-medium uppercase text-xs sticky top-0 z-10 shadow-sm">
                    <tr>
                        {sortedColumns.map(col => (
                            <th 
                                key={col.id} 
                                className="px-4 py-3 whitespace-nowrap bg-slate-50 cursor-pointer hover:bg-slate-100 select-none group transition-colors"
                                onClick={() => handleSort(col.id)}
                            >
                                <div className="flex items-center gap-1">
                                    {col.label}
                                    {sortConfig.key === col.id ? (
                                        sortConfig.direction === 'asc' ? <ArrowUp size={14} className="text-blue-600" /> : <ArrowDown size={14} className="text-blue-600" />
                                    ) : (
                                        <ArrowUpDown size={14} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    )}
                                </div>
                            </th>
                        ))}
                        {isAdmin && <th className="px-4 py-3 bg-slate-50">{t('colActions')}</th>}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {sortedAndFilteredRules.map((rule, idx) => {
                        // Find index in original rules array for updating
                        const realIndex = rules.findIndex(r => r.range === rule.range);
                        if (realIndex === -1) return null;

                        const utilization = (rule.curPallet || 0) / (rule.maxPallet || 1);
                        const isOverDest = rule.allowedDest && rule.currentDest && rule.currentDest > rule.allowedDest;
                        
                        return (
                            <tr key={idx} className={`hover:bg-slate-50 transition-colors ${isOverDest ? 'bg-red-50 hover:bg-red-100' : ''}`}>
                                {sortedColumns.map(col => {
                                    if(col.id === 'range') return (
                                        <td key="range" className="px-4 py-2 font-medium text-slate-700 whitespace-nowrap">{rule.range}</td>
                                    );
                                    if(col.id === 'destinations') return (
                                        <td 
                                            key="destinations" 
                                            className="px-4 py-2 max-w-xs cursor-pointer"
                                            onDoubleClick={() => canEdit('destinations') && setEditingDestIndex(realIndex)}
                                            title="Double click to edit tags"
                                        >
                                            <div className="flex flex-wrap gap-1">
                                                {rule.destinations.split(/[，,]/).map(t => t.trim()).filter(Boolean).map((tag, i) => {
                                                    const containers = destContainerMap[tag];
                                                    const tooltip = containers && containers.length > 0 ? `Container: ${containers.join(', ')}` : "";
                                                    const isAmz = tag.toLowerCase().includes('amazon');
                                                    return (
                                                        <span 
                                                            key={i} 
                                                            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] border ${
                                                                isAmz ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                                                                'bg-slate-100 text-slate-600 border-slate-200'
                                                            }`}
                                                            title={tooltip}
                                                        >
                                                            {tag}
                                                            {canEdit('destinations') && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        toggleDestInRule(realIndex, tag);
                                                                    }}
                                                                    className={`rounded-full p-0.5 transition-colors ${
                                                                        isAmz ? 'hover:bg-blue-200 text-blue-500 hover:text-blue-800' : 'hover:bg-slate-200 text-slate-400 hover:text-slate-600'
                                                                    }`}
                                                                    title={t('removeTag')}
                                                                >
                                                                    <X size={10} />
                                                                </button>
                                                            )}
                                                        </span>
                                                    )
                                                })}
                                                {canEdit('destinations') && rule.destinations.length === 0 && (
                                                    <span className="text-xs text-slate-400 italic">...</span>
                                                )}
                                            </div>
                                        </td>
                                    );
                                    if(col.id === 'type') {
                                        const typeDef = LOCATION_TYPES.find(lt => lt.value === rule.type) || LOCATION_TYPES[LOCATION_TYPES.length-1];
                                        return (
                                            <td key="type" className="px-4 py-2 whitespace-nowrap">
                                                {isAdmin ? (
                                                    <select 
                                                        value={rule.type} 
                                                        onChange={(e) => handleUpdateRule(realIndex, 'type', e.target.value)}
                                                        className="bg-transparent border-none text-xs focus:ring-0 p-0 cursor-pointer"
                                                    >
                                                        {LOCATION_TYPES.map(locType => <option key={locType.value} value={locType.value}>{t(locType.value as any)}</option>)}
                                                    </select>
                                                ) : (
                                                    <span className={`px-2 py-1 rounded-md text-[10px] border ${typeDef.class}`}>
                                                        {t(typeDef.value as any)}
                                                    </span>
                                                )}
                                            </td>
                                        );
                                    }
                                    if(col.id === 'maxPallet') return (
                                        <td key="max" className="px-4 py-2">
                                            {canEdit('maxPallet') ? (
                                                <input 
                                                    type="number" 
                                                    className="w-16 bg-transparent border border-transparent hover:border-slate-300 rounded px-1 focus:ring-1"
                                                    value={rule.maxPallet ?? ''}
                                                    onChange={e => handleUpdateRule(realIndex, 'maxPallet', Number(e.target.value))}
                                                />
                                            ) : (rule.maxPallet)}
                                        </td>
                                    );
                                    if(col.id === 'curPallet') return (
                                        <td key="cur" className="px-4 py-2">
                                            {canEdit('curPallet') ? (
                                                <input 
                                                    type="number" 
                                                    className="w-16 bg-transparent border border-transparent hover:border-slate-300 rounded px-1 focus:ring-1"
                                                    value={rule.curPallet ?? ''}
                                                    onChange={e => handleUpdateRule(realIndex, 'curPallet', Number(e.target.value))}
                                                />
                                            ) : (rule.curPallet)}
                                        </td>
                                    );
                                    if(col.id === 'utilization') {
                                        let color = 'bg-slate-200';
                                        if(utilization > 0.9) color = 'bg-red-500';
                                        else if(utilization > 0.7) color = 'bg-yellow-500';
                                        else if(utilization > 0) color = 'bg-blue-500';
                                        
                                        return (
                                            <td key="util" className="px-4 py-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                        <div className={`h-full ${color}`} style={{width: `${Math.min(utilization*100, 100)}%`}}></div>
                                                    </div>
                                                    <span className="text-xs text-slate-500">{Math.round(utilization * 100)}%</span>
                                                </div>
                                            </td>
                                        );
                                    }
                                    if(col.id === 'allowedDest') return (
                                        <td key="allow" className="px-4 py-2 text-slate-500">{rule.allowedDest}</td>
                                    );
                                    if(col.id === 'currentDest') return (
                                        <td key="cd" className="px-4 py-2">{rule.currentDest}</td>
                                    );
                                    if(col.id === 'status') return (
                                        <td key="status" className="px-4 py-2">
                                            {isOverDest ? <span className="text-red-600 font-bold text-xs bg-red-50 px-2 py-1 rounded">{t('statusOverflow')}</span> : <span className="text-emerald-600 text-xs bg-emerald-50 px-2 py-1 rounded">{t('statusOk')}</span>}
                                        </td>
                                    );
                                    if(col.id === 'note') return (
                                        <td key="note" className="px-4 py-2 min-w-[200px]">
                                             {canEdit('note') ? (
                                                <input 
                                                    type="text" 
                                                    className="w-full bg-transparent border border-transparent hover:border-slate-300 rounded px-1 focus:ring-1"
                                                    value={rule.note || ''}
                                                    onChange={e => handleUpdateRule(realIndex, 'note', e.target.value)}
                                                />
                                            ) : (rule.note)}
                                        </td>
                                    );
                                    return <td key={col.id}></td>;
                                })}
                                {isAdmin && (
                                    <td className="px-4 py-2">
                                        <button onClick={() => handleDeleteRule(realIndex)} className="text-slate-400 hover:text-red-500 transition-colors">
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                )}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            {sortedAndFilteredRules.length === 0 && <div className="p-8 text-center text-slate-400">No matching locations found.</div>}
        </div>
    </div>
  );
};

export default Rules;
