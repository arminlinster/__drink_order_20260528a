import React, { useState, useEffect, useMemo, useCallback } from "react";
import { 
  Coffee, 
  Plus, 
  Minus, 
  Trash2, 
  Edit, 
  RefreshCw, 
  AlertCircle, 
  Copy, 
  Check, 
  User, 
  Search,
  Sparkles
} from "lucide-react";

// API 後端 網址 (與 index.html 保持完全一致)
const API_URL = "https://script.google.com/macros/s/AKfycbzzDaiA9KuQBjPrGAOUlVqrOx_Kl7zNy443IpDwWPgqzf4ITjktSCy2ZZ8GtS-0SrfD/exec";

const FALLBACK_MENU = [
  { name: "手作波霸奶茶", price: 55, category: "人氣熱銷", description: "香濃奶茶配上手作太妃黃金珍珠，Q彈有嚼勁，辦公室熱銷首選。" },
  { name: "茉香珍珠綠茶", price: 40, category: "嚴選鮮茶", description: "清新茉莉雲花綠茶，伴隨飽滿白玉珍珠，芳香甘甜、爽口無負擔。" },
  { name: "炭焙四季春", price: 35, category: "嚴選鮮茶", description: "臺灣南投高山四季春青茶，喉韻清香高雅，入喉回甘悠長。" },
  { name: "經典莊園紅茶", price: 35, category: "嚴選鮮茶", description: "嚴選錫蘭莊園紅茶葉，茶湯紅潤飽滿，醇厚回甘帶淡淡果香。" },
  { name: "小農重乳烏龍拿鐵", price: 60, category: "小農鮮乳", description: "深焙鐵觀音烏龍配上小農牧場醇鮮乳，乳香濃郁與茶焙香在口中完美交融。" },
  { name: "伯爵紅茶拿鐵", price: 60, category: "小農鮮乳", description: "佛手柑佛香優雅伯爵紅茶搭配香濃鮮乳，佛手柑清香獨特療癒。" },
  { name: "鮮百香雙響炮", price: 65, category: "鮮果特調", description: "埔里鮮百香果原汁入茶，大方鋪滿椰果與珍珠，雙重Q彈爽脆嚼感。" },
  { name: "手搾葡萄柚綠茶", price: 65, category: "鮮果特調", description: "手剝滿滿紅肉柚子果粒，清甜綠茶茶底微潤，酸甜微苦茶香爽快。" },
  { name: "古法翡翠冬瓜檸檬", price: 55, category: "在地經典", description: "古法慢火手炒黑糖冬瓜蜜，調配屏東現榨檸檬汁，酸香生津，消暑神品。" },
  { name: "椰果鮮芒果青茶", price: 60, category: "鮮果特調", description: "夏季香甜芒果原汁與鮮爽青茶，搭配多汁Q嫩脆椰果，熱帶水果風情。" }
];

const TOPPINGS = [
  { name: "黃金珍珠", price: 5 },
  { name: "清脆椰果", price: 5 },
  { name: "嫩仙草凍", price: 5 },
  { name: "原味布丁", price: 10 }
];

const SUGAR_OPTIONS = [
  { label: "正常糖", desc: "100%" },
  { label: "少糖", desc: "70%" },
  { label: "半糖", desc: "50%" },
  { label: "微糖", desc: "30%" },
  { label: "無糖", desc: "0%" }
];

const ICE_OPTIONS = [
  { label: "正常冰", desc: "標準" },
  { label: "少冰", desc: "70%" },
  { label: "微冰", desc: "30%" },
  { label: "去冰", desc: "冷" },
  { label: "溫熱", desc: "熱" }
];

interface MenuItem {
  name: string;
  price: number;
  category: string;
  description: string;
}

interface Order {
  orderId: string;
  timestamp: string;
  name: string;
  drink: string;
  sugar: string;
  ice: string;
  quantity: number;
  totalPrice: number;
}

export default function App() {
  const [activeTabCategory, setActiveTabCategory] = useState("全部");
  const [menuSearch, setMenuSearch] = useState("");
  
  // 資料狀態
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [apiLoading, setApiLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // 編輯控制
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  
  // 記憶消費者姓名
  const [lastOrderName, setLastOrderName] = useState(() => {
    return localStorage.getItem("drink_username") || "";
  });

  const [isFilteringMy, setIsFilteringMy] = useState(false);

  // 表單內部狀態
  const [formName, setFormName] = useState(lastOrderName);
  const [formDrink, setFormDrink] = useState("");
  const [formPrice, setFormPrice] = useState(0);
  const [formCategory, setFormCategory] = useState("");
  const [formSugar, setFormSugar] = useState("半糖");
  const [formIce, setFormIce] = useState("少冰");
  const [formQuantity, setFormQuantity] = useState(1);
  const [formToppings, setFormToppings] = useState<string[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ msg: string; type: string } | null>(null);

  const showToast = useCallback((msg: string, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  }, []);

  // 計算單項累計總合
  const toppingsPrice = useMemo(() => {
    return formToppings.reduce((acc, tName) => {
      const found = TOPPINGS.find(t => t.name === tName);
      return acc + (found ? found.price : 0);
    }, 0);
  }, [formToppings]);

  const singlePrice = formPrice + toppingsPrice;
  const totalPrice = singlePrice * formQuantity;

  // GET 同步
  const fetchRemoteData = async (isSilent = false) => {
    if (!isSilent) setApiLoading(true);
    try {
      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error("HTTP connection error");
      }
      const resData = await response.json();
      
      if (resData.menu && resData.menu.length > 0) {
        setMenu(resData.menu);
      } else {
        setMenu(FALLBACK_MENU);
      }
      
      if (resData.orders) {
        setOrders(resData.orders);
      } else {
        setOrders([]);
      }
      setApiError(null);
    } catch (err) {
      console.error("Fetch API 失敗:", err);
      setMenu(FALLBACK_MENU);
      setApiError("無法連接到 Google 雲端工作表，已為您載入「本地離線菜單」。重新整理或連接後端後即可完整投單！");
      showToast("⚠️ 已轉換為本地試用菜單", "warning");
    } finally {
      setApiLoading(false);
    }
  };

  useEffect(() => {
    fetchRemoteData();
  }, []);

  const handleToppingToggle = (toppingName: string) => {
    setFormToppings(prev => 
      prev.includes(toppingName)
        ? prev.filter(t => t !== toppingName)
        : [...prev, toppingName]
    );
  };

  const handleQuantityChange = (change: number) => {
    const nextVal = formQuantity + change;
    if (nextVal >= 1 && nextVal <= 99) {
      setFormQuantity(nextVal);
    }
  };

  const applyLastUsedName = () => {
    if (lastOrderName) {
      setFormName(lastOrderName);
    }
  };

  // 提交 POST
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert("請填寫訂購人姓名！");
      return;
    }
    if (!formDrink) {
      alert("請先從菜單中選擇一款飲料！");
      return;
    }

    setIsSubmitting(true);
    
    let finalDrinkName = formDrink;
    if (formToppings.length > 0) {
      finalDrinkName += ` [加 ${formToppings.join(", ")}]`;
    }

    const orderData = {
      name: formName.trim(),
      drink: finalDrinkName,
      sugar: formSugar,
      ice: formIce,
      quantity: formQuantity,
      totalPrice
    };

    try {
      localStorage.setItem("drink_username", orderData.name);
      setLastOrderName(orderData.name);

      let payload;
      if (editingOrder) {
        payload = {
          action: "update",
          data: {
            orderId: editingOrder.orderId,
            ...orderData
          }
        };
      } else {
        payload = {
          action: "create",
          data: orderData
        };
      }

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      if (result.status === "success") {
        showToast(editingOrder ? "✨ 您的訂單修改成功！" : "🎉 您的飲料訂單已上傳雲端！", "success");
        
        // 重置表單
        setFormDrink("");
        setFormPrice(0);
        setFormCategory("");
        setFormQuantity(1);
        setFormToppings([]);
        setEditingOrder(null);
        
        await fetchRemoteData(true);
      } else {
        throw new Error(result.message);
      }
    } catch (err: any) {
      console.error("Post 失敗:", err);
      showToast(`❌ 連線失敗: ${err.message || '模擬本地處理'}`, "error");
      
      // 本地試玩兜底 (確保在任何極端或無網模式下都可以點擊體驗)
      simulateLocalAction(orderData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const simulateLocalAction = (orderData: any) => {
    const mockId = editingOrder ? editingOrder.orderId : "local-id-" + Math.random().toString(36).substring(2, 9);
    if (editingOrder) {
      setOrders(prev => prev.map(o => o.orderId === mockId ? { ...o, ...orderData, orderId: mockId } : o));
      showToast("✨ (本地試玩) 修改成功！", "success");
    } else {
      const newOrder: Order = {
        orderId: mockId,
        timestamp: new Date().toISOString(),
        name: orderData.name,
        drink: orderData.drink,
        sugar: orderData.sugar,
        ice: orderData.ice,
        quantity: orderData.quantity,
        totalPrice: orderData.totalPrice
      };
      setOrders(prev => [newOrder, ...prev]);
      showToast("🎉 (本地試玩) 點單成功！", "success");
    }
    
    setFormDrink("");
    setFormPrice(0);
    setFormCategory("");
    setFormQuantity(1);
    setFormToppings([]);
    setEditingOrder(null);
  };

  const handleEditClick = (order: Order) => {
    const element = document.getElementById("order-form-container");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }

    setEditingOrder(order);

    let baseDrink = order.drink;
    let matchedToppings: string[] = [];
    
    const toppingMatch = order.drink.match(/(.+) \[(?:加 )?(.+)\]/);
    if (toppingMatch) {
      baseDrink = toppingMatch[1].trim();
      matchedToppings = toppingMatch[2].split(",").map(t => t.trim());
    }

    const matchedMenu = menu.find(m => m.name === baseDrink) || { price: 35, category: "" };

    setFormName(order.name);
    setFormDrink(baseDrink);
    setFormPrice(matchedMenu.price);
    setFormCategory(matchedMenu.category);
    setFormSugar(order.sugar);
    setFormIce(order.ice);
    setFormQuantity(order.quantity);
    setFormToppings(matchedToppings);

    showToast("✏️ 訂單明細已為您載入修改表單！", "info");
  };

  const handleCancelEdit = () => {
    setEditingOrder(null);
    setFormDrink("");
    setFormPrice(0);
    setFormCategory("");
    setFormQuantity(1);
    setFormToppings([]);
    showToast("已取消修改編輯", "info");
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm("確定要刪除這筆訂單嗎？")) return;

    try {
      const payload = {
        action: "delete",
        data: { orderId }
      };

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      if (result.status === "success") {
        showToast("🗑️ 訂單已成功移除！", "success");
        await fetchRemoteData(true);
      } else {
        throw new Error(result.message);
      }
    } catch (err) {
      console.error("Delete 失敗:", err);
      setOrders(prev => prev.filter(o => o.orderId !== orderId));
      showToast("🗑️ (本地試玩) 訂單已移除", "success");
    }
  };

  const selectDrinkFromMenu = (menuItem: MenuItem) => {
    setFormDrink(menuItem.name);
    setFormPrice(menuItem.price);
    setFormCategory(menuItem.category);
    setFormToppings([]);

    const element = document.getElementById("order-form-container");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      element.classList.add("ring-4", "ring-emerald-400");
      setTimeout(() => {
        element.classList.remove("ring-4", "ring-emerald-400");
      }, 400);
    }
    showToast(`已點選：${menuItem.name}`, "success");
  };

  // 計算不重複分類
  const categories = useMemo(() => {
    const set = new Set<string>();
    menu.forEach(item => {
      if (item.category) set.add(item.category);
    });
    return ["全部", ...Array.from(set)];
  }, [menu]);

  // 過濾菜單
  const displayedMenu = useMemo(() => {
    return menu.filter(item => {
      const matchesCat = activeTabCategory === "全部" || item.category === activeTabCategory;
      const matchesSearch = !menuSearch || 
        item.name.toLowerCase().includes(menuSearch.toLowerCase()) || 
        (item.description && item.description.toLowerCase().includes(menuSearch.toLowerCase()));
      return matchesCat && matchesSearch;
    });
  }, [menu, activeTabCategory, menuSearch]);

  // 過濾訂單明細
  const [ordersSearch, setOrdersSearch] = useState("");
  const filteredOrders = useMemo(() => {
    let list = orders;
    
    if (isFilteringMy && lastOrderName) {
      list = list.filter(o => o.name.toLowerCase() === lastOrderName.toLowerCase());
    }

    if (ordersSearch.trim()) {
      const query = ordersSearch.toLowerCase().trim();
      list = list.filter(o => 
        o.name.toLowerCase().includes(query) || 
        o.drink.toLowerCase().includes(query) || 
        o.sugar.toLowerCase().includes(query) || 
        o.ice.toLowerCase().includes(query)
      );
    }

    return list;
  }, [orders, ordersSearch, isFilteringMy, lastOrderName]);

  // 統計資訊
  const stats = useMemo(() => {
    const totalCups = orders.reduce((sum, o) => sum + o.quantity, 0);
    const totalPrice = orders.reduce((sum, o) => sum + o.totalPrice, 0);
    const uniquePeople = new Set(orders.map(o => o.name)).size;
    return { totalCups, totalPrice, uniquePeople };
  }, [orders]);

  // Clipboard 簡訊
  const aggregatedText = useMemo(() => {
    const summary: Record<string, number> = {};
    orders.forEach(o => {
      const key = `${o.drink} [${o.sugar}/${o.ice}]`;
      summary[key] = (summary[key] || 0) + o.quantity;
    });

    let textOutput = `🥤【今日團購飲料統計清單】🥛\n`;
    textOutput += `統計時間: ${new Date().toLocaleDateString('zh-TW', { month: '2-digit', day: '2-digit' })}\n`;
    textOutput += `總計: ${orders.length} 筆項目，合計 ${stats.totalCups} 杯，共 $${stats.totalPrice} 元\n`;
    textOutput += `-----------------------\n`;
    Object.entries(summary).forEach(([drinkKey, qty], i) => {
      textOutput += `${i + 1}. ${drinkKey} ─── x ${qty} 杯\n`;
    });
    textOutput += `-----------------------\n`;
    textOutput += `成員: ${Array.from(new Set(orders.map(o => o.name))).join(', ')}\n`;
    textOutput += `辦公室飲料管理系統`;
    return textOutput;
  }, [orders, stats]);

  const [copied, setCopied] = useState(false);
  const handleCopyStats = () => {
    if (orders.length === 0) return;
    navigator.clipboard.writeText(aggregatedText)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {
        alert("複製失敗，請嘗試手動選取複製");
      });
  };

  return (
    <div className="min-h-screen lg:h-screen w-full bg-slate-50 flex flex-col font-sans text-slate-800 overflow-y-auto lg:overflow-hidden select-none">
      
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg border flex items-center gap-2.5 transition-all duration-300 transform translate-x-0 ${
          notification.type === "success" 
            ? "bg-white border-emerald-100 text-emerald-800 shadow-emerald-100/50"
            : notification.type === "error"
            ? "bg-white border-rose-100 text-rose-800 shadow-rose-100/50"
            : notification.type === "warning"
            ? "bg-white border-amber-100 text-amber-800 shadow-amber-100/50"
            : "bg-white border-blue-100 text-blue-800 shadow-blue-100/50"
        }`}>
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <p className="text-xs font-bold font-sans">{notification.msg}</p>
        </div>
      )}

      {/* Header Bar */}
      <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center shrink-0 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
            <svg className="w-5.5 h-5.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900 leading-tight">辦公室飲料訂購系統</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Office Drink Ordering System • 2026-05-28
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 self-stretch sm:self-auto justify-between sm:justify-start">
          <button
            onClick={() => fetchRemoteData()}
            disabled={apiLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-50 active:scale-95 disabled:opacity-50 transition-all font-sans"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${apiLoading ? 'animate-spin' : ''}`} />
            <span>{apiLoading ? '同步中' : '重整連線'}</span>
          </button>
          
          <div className="w-px h-8 bg-slate-200 hidden sm:block"></div>

          <div className="flex gap-6">
            <div className="text-right">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">今日杯數</p>
              <p className="text-md font-extrabold text-emerald-600 font-mono">
                {stats.totalCups} <span className="text-xs font-normal text-slate-500 font-sans">杯</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">今日總額</p>
              <p className="text-md font-extrabold text-slate-900 font-mono">
                ${stats.totalPrice} <span className="text-xs font-normal text-slate-500 font-sans">元</span>
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 overflow-y-auto lg:overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-5 p-5">
        
        {/* Left column: Form Container */}
        <section className="lg:col-span-4 flex flex-col h-full lg:overflow-y-auto pr-0 lg:pr-1 min-h-[450px]">
          <div 
            id="order-form-container" 
            className={`bg-white rounded-xl border p-4.5 flex flex-col justify-between transition-all duration-300 shadow-sm ${
              editingOrder ? 'border-amber-400 bg-amber-50/5' : 'border-slate-200'
            }`}
          >
            <div>
              <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center justify-between">
                <span className="flex items-center">
                  <span className={`w-2 h-5 rounded-full mr-2 ${editingOrder ? 'bg-amber-500' : 'bg-emerald-600'}`} />
                  {editingOrder ? '修改我的訂單' : '填寫新訂購單'}
                </span>
                {editingOrder && (
                  <button 
                    onClick={handleCancelEdit}
                    className="text-[10px] text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded font-bold transition"
                  >
                    取消修改
                  </button>
                )}
              </h2>

              <form onSubmit={handleFormSubmit} className="space-y-4">
                
                {/* Name */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                      訂購人姓名
                    </label>
                    {lastOrderName && formName !== lastOrderName && (
                      <button
                        type="button"
                        onClick={applyLastUsedName}
                        className="text-[9.5px] text-emerald-600 font-bold hover:underline transition"
                      >
                        代入「{lastOrderName}」
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="請輸入姓名"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 rounded-lg text-sm focus:outline-none transition font-sans placeholder-slate-300 font-medium"
                  />
                </div>

                {/* Selected Drink Display */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">
                    選擇的飲品
                  </label>
                  {formDrink ? (
                    <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-2.5 flex justify-between items-center">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-emerald-900 truncate">{formDrink}</p>
                        <p className="text-[10px] text-emerald-600 font-bold tracking-wider">{formCategory || "特色茶飲"}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] text-slate-400 block font-bold tracking-wider font-mono">基礎價</span>
                        <p className="text-sm font-extrabold text-emerald-800 font-mono">${formPrice}</p>
                      </div>
                    </div>
                  ) : (
                    <div 
                      onClick={() => document.getElementById('menu-anchor')?.scrollIntoView({ behavior: 'smooth' })}
                      className="border border-dashed border-slate-200 hover:border-emerald-300 rounded-lg py-4 text-center cursor-pointer bg-slate-50 hover:bg-slate-100/50 transition duration-150"
                    >
                      <p className="text-xs text-slate-400 font-medium">請在右側/下方菜單選擇飲品</p>
                      <span className="text-[9.5px] text-emerald-600 font-bold inline-block mt-0.5">點擊前往菜單 ➔</span>
                    </div>
                  )}
                </div>

                {/* Toppings (only visible if drink selected) */}
                {formDrink && (
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">
                      加料選配 (可多選)
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {TOPPINGS.map((t) => {
                        const isSelected = formToppings.includes(t.name);
                        return (
                          <button
                            key={t.name}
                            type="button"
                            onClick={() => handleToppingToggle(t.name)}
                            className={`flex justify-between items-center px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                              isSelected 
                                ? 'bg-emerald-50 border-emerald-400 text-emerald-800 shadow-sm' 
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            <span>{t.name}</span>
                            <span className="font-mono text-[9px] text-slate-400 font-bold bg-slate-50 px-1 py-0.2 rounded border border-slate-100">
                              +${t.price}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Sugar Options */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">
                    甜度
                  </label>
                  <div className="grid grid-cols-5 gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200/40">
                    {SUGAR_OPTIONS.map((opt) => {
                      const isSelected = formSugar === opt.label;
                      return (
                        <button
                          key={opt.label}
                          type="button"
                          onClick={() => setFormSugar(opt.label)}
                          className={`py-1 rounded-md text-center transition flex flex-col justify-center items-center ${
                            isSelected
                              ? 'bg-emerald-600 text-white font-bold shadow-sm'
                              : 'hover:bg-white text-slate-600 font-semibold'
                          }`}
                        >
                          <span className="text-[11px]">{opt.label}</span>
                          <span className={`text-[8.5px] font-mono leading-none ${isSelected ? 'text-emerald-100' : 'text-slate-400'}`}>{opt.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Ice Options */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">
                    冰塊
                  </label>
                  <div className="grid grid-cols-5 gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200/40">
                    {ICE_OPTIONS.map((opt) => {
                      const isSelected = formIce === opt.label;
                      return (
                        <button
                          key={opt.label}
                          type="button"
                          onClick={() => setFormIce(opt.label)}
                          className={`py-1 rounded-md text-center transition flex flex-col justify-center items-center ${
                            isSelected
                              ? 'bg-emerald-600 text-white font-bold shadow-sm'
                              : 'hover:bg-white text-slate-600 font-semibold'
                          }`}
                        >
                          <span className="text-[11px]">{opt.label}</span>
                          <span className={`text-[8.5px] font-mono leading-none ${isSelected ? 'text-emerald-100' : 'text-slate-400'}`}>{opt.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Quantity input */}
                <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                    購買數量
                  </label>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      disabled={formQuantity <= 1}
                      onClick={() => handleQuantityChange(-1)}
                      className="w-7.5 h-7.5 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 disabled:opacity-50"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-bold text-sm w-6 text-center font-mono">{formQuantity}</span>
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(1)}
                      className="w-7.5 h-7.5 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </form>
            </div>

            {/* Subtotal & Submit section */}
            <div className="pt-4.5 mt-4 border-t border-slate-150 flex flex-col gap-3">
              <div className="flex justify-between items-center text-xs text-slate-500 font-semibold font-sans">
                <span>單筆小計:</span>
                <span className="text-md font-bold text-emerald-600 font-mono">
                  ${totalPrice}
                </span>
              </div>
              <button
                onClick={handleFormSubmit}
                disabled={!formDrink || isSubmitting}
                className={`w-full py-2.5 rounded-lg text-xs font-bold text-white transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2 ${
                  !formDrink 
                    ? 'bg-slate-300 pointer-events-none text-slate-400 cursor-not-allowed shadow-none'
                    : isSubmitting 
                    ? 'bg-emerald-600/70 cursor-wait' 
                    : editingOrder 
                    ? 'bg-amber-500 hover:bg-amber-600' 
                    : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/10'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>處理中...</span>
                  </>
                ) : editingOrder ? (
                  <span>認可並修改訂單</span>
                ) : (
                  <span>送出訂單</span>
                )}
              </button>
            </div>
          </div>

          {/* Backup mode message label inside left pane */}
          {apiError && (
            <div className="mt-3.5 bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-lg text-[10.5px] leading-normal flex items-start gap-2 select-none">
              <span className="text-sm">⚠️</span>
              <div className="space-y-0.5">
                <p className="font-extrabold text-amber-900">離線試玩備份模式</p>
                <p>因 Sheet 雲端連線限制，已為您架設本地快取服務，可正常點餐測試！</p>
              </div>
            </div>
          )}
        </section>

        {/* Right column: Orders & Menu */}
        <section className="lg:col-span-8 flex flex-col h-full lg:overflow-y-auto space-y-4 pr-0 lg:pr-1">
          
          {/* Today's Orders list block */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden min-h-[300px]">
            <div className="px-5 py-3.5 border-b border-slate-150 flex justify-between items-center bg-white shrink-0">
              <h2 className="text-xs font-bold text-slate-900 tracking-wider flex items-center">
                <span className="w-2 h-4.5 bg-emerald-600 rounded-full mr-2" />
                今日點單列表
              </h2>
              
              <div className="flex items-center gap-2">
                {/* 看我的 toggle */}
                {lastOrderName && (
                  <div className="flex rounded-md bg-slate-100 p-0.5 text-[10.5px] font-bold border border-slate-200/60 shadow-inner">
                    <button
                      onClick={() => setIsFilteringMy(false)}
                      className={`px-2 py-0.5 rounded transition ${!isFilteringMy ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      全部訂單
                    </button>
                    <button
                      onClick={() => setIsFilteringMy(true)}
                      className={`px-2 py-0.5 rounded transition ${isFilteringMy ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      看我的
                    </button>
                  </div>
                )}
                
                {/* Tab search trigger */}
                <div className="relative w-36 sm:w-44">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-2 text-slate-400">
                    <Search className="w-3 h-3" />
                  </span>
                  <input
                    type="text"
                    placeholder="篩選訂單..."
                    value={ordersSearch}
                    onChange={(e) => setOrdersSearch(e.target.value)}
                    className="w-full pl-6 pr-2 py-1 border border-slate-200 focus:outline-none focus:border-emerald-500 rounded-md text-[11px] bg-slate-50 font-medium font-sans"
                  />
                </div>
              </div>
            </div>

            {/* Orders list contents */}
            <div className="flex-grow overflow-auto p-4 max-h-[350px]">
              {filteredOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-slate-300 py-12 border-2 border-dashed border-slate-100 rounded-xl">
                  <svg className="w-12 h-12 mb-2 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-xs font-bold text-slate-500">目前無符合條件之訂單</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">試著填寫左側表單加入訂單</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-separate border-spacing-y-1.5">
                    <thead className="sticky top-0 bg-white z-10">
                      <tr className="text-[10px] text-slate-400 uppercase font-black tracking-widest border-b border-slate-200 leading-none">
                        <th className="px-3.5 py-1.5 font-sans">訂購人</th>
                        <th className="px-3.5 py-1.5 font-sans">飲品</th>
                        <th className="px-3.5 py-1.5 font-sans">規格</th>
                        <th className="px-3.5 py-1.5 font-sans text-center">數量</th>
                        <th className="px-3.5 py-1.5 font-sans">金額</th>
                        <th className="px-3.5 py-1.5 text-right font-sans">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.map((order) => {
                        const isOwn = lastOrderName && order.name.toLowerCase() === lastOrderName.toLowerCase();
                        return (
                          <tr 
                            key={order.orderId} 
                            className={`bg-slate-50 rounded-xl group hover:bg-emerald-50/40 transition-colors ${
                              isOwn ? 'border-l-4 border-emerald-500 bg-emerald-50/10' : ''
                            }`}
                          >
                            <td className="px-3.5 py-2.5 rounded-l-lg font-bold text-xs text-slate-900">
                              {order.name}
                            </td>
                            <td className="px-3.5 py-2.5 text-xs">
                              <span className="font-bold text-slate-800">
                                {order.drink}
                              </span>
                            </td>
                            <td className="px-3.5 py-2.5 text-[11px] text-slate-500 font-semibold">
                              {order.sugar} / {order.ice}
                            </td>
                            <td className="px-3.5 py-2.5 text-xs font-bold font-mono text-center text-slate-600">
                              {order.quantity}
                            </td>
                            <td className="px-3.5 py-2.5 text-xs font-black text-slate-900 font-mono">
                              ${order.totalPrice}
                            </td>
                            <td className="px-3.5 py-2.5 rounded-r-lg text-right space-x-2.5 opacity-60 group-hover:opacity-100 transition duration-150">
                              <button 
                                onClick={() => handleEditClick(order)}
                                className="text-emerald-600 text-[11px] font-black hover:underline cursor-pointer"
                              >
                                編輯
                              </button>
                              <button 
                                onClick={() => handleDeleteOrder(order.orderId)}
                                className="text-rose-500 text-[11px] font-black hover:underline cursor-pointer"
                              >
                                刪除
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Clipboard and toolings area */}
            {orders.length > 0 && (
              <div className="px-5 py-3 border-t border-slate-150 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 shrink-0">
                <div className="text-[10.5px] text-slate-500 font-sans leading-snug">
                  <span className="font-extrabold text-slate-700 block">⚡️ 今日彙彙統計小幫手</span>
                  <span>自動計算全部飲料杯數與總金額，支援一鍵複製發送！</span>
                </div>
                <button
                  onClick={handleCopyStats}
                  className={`flex items-center gap-1.5 text-xs px-3.5 py-1.5 rounded-lg font-bold tracking-wider transition active:scale-95 ${
                    copied ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-900 text-white hover:bg-slate-850 shadow'
                  }`}
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "已成功複製!" : "複製團購單"}</span>
                </button>
              </div>
            )}
          </div>

          {/* Tea menu directory catalog container */}
          <div id="menu-anchor" className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xs font-black text-slate-900 tracking-wider uppercase flex items-center">
                  <span className="w-2 h-4.5 bg-emerald-600 rounded-full mr-2" />
                  精緻茶飲菜單
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  推薦點擊下方茶飲，系統可立即為您載入編輯。
                </p>
              </div>

              {/* Menu query search bar */}
              <div className="relative w-full sm:w-44">
                <span className="absolute inset-y-0 left-0 flex items-center pl-2 text-slate-400">
                  <Search className="w-3 h-3" />
                </span>
                <input
                  type="text"
                  placeholder="搜尋菜單飲品..."
                  value={menuSearch}
                  onChange={(e) => setMenuSearch(e.target.value)}
                  className="w-full pl-6 pr-2 py-1 border border-slate-200 focus:outline-none focus:border-emerald-500 rounded-md text-[11px] bg-slate-50 font-medium font-sans"
                />
              </div>
            </div>

            {/* Menu categories tabs row */}
            {categories.length > 1 && (
              <div className="flex gap-1 overflow-x-auto pb-1 max-w-full no-scrollbar select-none">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveTabCategory(cat)}
                    className={`px-2.5 py-1 rounded-md text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                      activeTabCategory === cat 
                        ? 'bg-emerald-600 text-white font-bold shadow-sm' 
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200 border border-slate-200/30'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {/* Drink items showcase matrix layout */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[360px] overflow-y-auto pr-0.5">
              {displayedMenu.map((item) => {
                const isSelected = formDrink === item.name;
                return (
                  <div
                    key={item.name}
                    onClick={() => selectDrinkFromMenu(item)}
                    className={`p-3 rounded-lg border text-left cursor-pointer transition relative group ${
                      isSelected 
                        ? 'bg-emerald-50/40 border-emerald-400 shadow-sm' 
                        : 'bg-white border-slate-200 hover:border-slate-350 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-0.5 gap-2">
                      <h4 className="text-sm font-bold text-slate-800 group-hover:text-emerald-700 transition truncate">
                        {item.name}
                      </h4>
                      <span className="text-xs font-extrabold text-emerald-600 font-mono">
                        ${item.price}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {item.category && (
                        <span className="inline-block text-[9px] font-black text-emerald-700 bg-emerald-50 border border-emerald-100/50 px-1 rounded">
                          {item.category}
                        </span>
                      )}
                    </div>
                    
                    {item.description && (
                      <p className="text-[10.5px] text-slate-400 leading-normal line-clamp-1 mt-1 font-sans">
                        {item.description}
                      </p>
                    )}

                    <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition pointer-events-none">
                      <span className="text-[8px] bg-emerald-600 text-white px-1.5 py-0.5 rounded font-black tracking-wider">
                        加入 ➔
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>

        </section>

      </main>

      {/* High Density Custom Footing */}
      <footer className="bg-white border-t border-slate-200 px-6 py-2.5 flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest shrink-0">
        <span>飲料訂購系統 v2.4.0</span>
        <span className="hidden sm:inline">© 2026 Corporate Catering Unit</span>
      </footer>

    </div>
  );
}
