/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Layout } from './components/Layout';
import { 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Zap, 
  ShoppingBag, 
  ArrowRight,
  RefreshCcw,
  Sparkles,
  Search,
  Plus,
  X,
  Package,
  ShoppingCart,
  LogIn,
  Copy,
  Check,
  Edit3,
  LogOut,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { mockDailySalesAvg, mockInventory } from './data/mockData';
import { analyzeSupplyChain } from './services/geminiService';
import { AssistantAnalysisResponse, InventoryItem } from './types';
import { calculateItemMetrics } from './utils/itemStatus';
import { 
  auth, 
  db, 
  handleFirestoreError, 
  OperationType 
} from './services/firebase';
import { 
  onAuthStateChanged, 
  signInWithPopup,
  signInWithRedirect, 
  signOut, 
  User 
} from 'firebase/auth';
import { 
  collection, 
  onSnapshot, 
  setDoc, 
  doc, 
  updateDoc, 
  query, 
  where,
  getDocs,
  limit,
  orderBy,
  serverTimestamp,
  deleteDoc,
  addDoc
} from 'firebase/firestore';

const Overview = lazy(() => import('./views/Overview').then(module => ({ default: module.Overview })));
const Inventory = lazy(() => import('./views/Inventory').then(module => ({ default: module.Inventory })));
const Forecasting = lazy(() => import('./views/Forecasting').then(module => ({ default: module.Forecasting })));
const Team = lazy(() => import('./views/Team').then(module => ({ default: module.Team })));
const RestockAI = lazy(() => import('./views/RestockAI').then(module => ({ default: module.RestockAI })));
const SalesHistory = lazy(() => import('./views/SalesHistory').then(module => ({ default: module.SalesHistory })));
import { Landing } from './views/Landing';

const AIAssistant = lazy(() => import('./components/AIAssistant').then(module => ({ default: module.AIAssistant })));

// Move googleProvider to firebase service if needed, but it seems it's used here
import { googleProvider } from './services/firebase';

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [shopData, setShopData] = useState<any>(null);
  const [anyShopsExist, setAnyShopsExist] = useState<boolean | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [newShopName, setNewShopName] = useState('');
  const [authMode, setAuthMode] = useState<'create' | 'join'>('create');
  const [analysis, setAnalysis] = useState<AssistantAnalysisResponse | null>(null);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [salesHistory, setSalesHistory] = useState<any[]>([]);
  const [restockHistory, setRestockHistory] = useState<any[]>([]);
  const [showEventAlert, setShowEventAlert] = useState(true);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [inventoryFilter, setInventoryFilter] = useState('all');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [inventorySort, setInventorySort] = useState<'name' | 'stock' | 'expiry'>('name');
  const [inventorySearch, setInventorySearch] = useState('');
  const [showOpnameModal, setShowOpnameModal] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showSalesModal, setShowSalesModal] = useState(false);
  const [showRestockReviewModal, setShowRestockReviewModal] = useState(false);
  const [restockBatches, setRestockBatches] = useState<{[key: string]: string}>({});
  const [selectedItemAnalytics, setSelectedItemAnalytics] = useState<InventoryItem | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedSaleItems, setSelectedSaleItems] = useState<{[key: string]: number}>({});
  const [isEditingItem, setIsEditingItem] = useState(false);
  const [newItem, setNewItem] = useState({ item: '', category: 'Beans' as any, stock: 10, minStock: 2, criticalStock: 1, unit: 'kg', exp_date: '2026-10-10' });
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });
  const [chartTimeframe, setChartTimeframe] = useState<'week' | 'month'>('week');
  const [editingMinStock, setEditingMinStock] = useState<number | null>(null);
  const [editingCriticalStock, setEditingCriticalStock] = useState<number | null>(null);
  const [fluxTimeframe, setFluxTimeframe] = useState<'H' | 'M' | 'B'>('M');
  const [rejectedRestockItems, setRejectedRestockItems] = useState<string[]>([]);

  const showToast = (message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast({ message: '', visible: false }), 3000);
  };

  // Firebase Auth & Profile Listener
  useEffect(() => {
    let unsubscribeProfile: (() => void) | undefined;
    let unsubscribeShop: (() => void) | undefined;

    // Handle redirect result if user tried to login via redirect
    import('firebase/auth').then(({ getRedirectResult }) => {
      getRedirectResult(auth).then((result) => {
        if (result) {
          console.log("Logged in via redirect:", result.user);
        }
      }).catch((error) => {
        console.error("Redirect login error:", error);
        if (error.code === 'auth/unauthorized-domain') {
          alert(`Domain tidak diizinkan oleh Firebase.\n\nHarap buka Firebase Console -> Authentication -> Settings -> Authorized Domains, lalu tambahkan: ${window.location.hostname}`);
        } else {
          alert(`Gagal login (Redirect): ${error.message}`);
        }
      });
    });

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setAuthLoading(true);
      if (currentUser) {
        setUser(currentUser);
        const userDocPath = `users/${currentUser.uid}`;
        
        // Initial snapshot for shops count
        const shopsCol = collection(db, 'shops');
        getDocs(query(shopsCol, limit(1))).then(snap => {
          setAnyShopsExist(!snap.empty);
        }).catch(err => {
          console.warn("Shops existence check restricted:", err.message);
          setAnyShopsExist(false); // Default to false
        });

        // Use onSnapshot for reactive profile updates
        unsubscribeProfile = onSnapshot(doc(db, userDocPath), async (userSnap) => {
          if (userSnap.exists()) {
            const profile = userSnap.data();
            setUserProfile(profile);

            // Ensure displayName is always set if missing
            if (!profile.displayName) {
              await setDoc(doc(db, userDocPath), {
                displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Unknown User'
              }, { merge: true });
            }

            // Fetch shop data if member of a shop
            if (profile.currentShopId) {
              if (unsubscribeShop) unsubscribeShop();
              const shopDocPath = `shops/${profile.currentShopId}`;
              unsubscribeShop = onSnapshot(doc(db, shopDocPath), async (shopSnap) => {
                if (shopSnap.exists()) {
                  setShopData({ id: shopSnap.id, ...shopSnap.data() });
                } else {
                  console.warn("Shop document missing, clearing reference.");
                  setShopData(null);
                  // If shop is missing, clear it from user profile so they can join/create again
                  const userDoc = doc(db, `users/${currentUser.uid}`);
                  await setDoc(userDoc, {
                    currentShopId: null,
                    role: null
                  }, { merge: true });
                  setUserProfile(prev => prev ? { ...prev, currentShopId: null, role: null } : null);
                }
              }, (error) => {
                console.error("Shop snapshot error:", error);
                handleFirestoreError(error, OperationType.GET, shopDocPath);
                setShopData(null);
                setUserProfile(prev => prev ? { ...prev, currentShopId: null } : null);
              });
            } else {
              setShopData(null);
            }
          } else {
            console.log("Profile missing, initializing...");
            setUserProfile(null);
            setShopData(null);
            // New User Initialization or Recovery
            const ownedShopsQuery = query(collection(db, 'shops'), where('ownerId', '==', currentUser.uid), limit(1));
            const ownedShopsSnap = await getDocs(ownedShopsQuery);
            
            let initialProfile: any = {
              uid: currentUser.uid,
              email: currentUser.email,
              displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Unknown User',
              createdAt: serverTimestamp(),
              currentShopId: null,
              role: null
            };

            if (!ownedShopsSnap.empty) {
              const shop = ownedShopsSnap.docs[0];
              initialProfile.currentShopId = shop.id;
              initialProfile.role = 'owner';
              setAnyShopsExist(true);
            } else {
              setAnyShopsExist(false);
            }

            await setDoc(doc(db, userDocPath), initialProfile);
          }
        }, (error) => {
          console.error("Profile sync error:", error);
          handleFirestoreError(error, OperationType.GET, userDocPath);
        });
      } else {
        setUser(null);
        setUserProfile(null);
        setShopData(null);
        if (unsubscribeProfile) unsubscribeProfile();
        if (unsubscribeShop) unsubscribeShop();
      }
      setAuthLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
      if (unsubscribeShop) unsubscribeShop();
    };
  }, []);

  // Firestore Inventory Sync (from Shop)
  useEffect(() => {
    if (!user || !userProfile?.currentShopId) {
      setInventory([]);
      setInventoryLoading(false);
      return;
    }

    const inventoryPath = `shops/${userProfile.currentShopId}/inventory`;
    const q = query(collection(db, inventoryPath), orderBy('item', 'asc'), limit(100));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(d => {
        const data = d.data();
        let cat = data.category;
        // Auto-migrate sirup to Syrup category
        if (typeof data.item === 'string' && data.item.toLowerCase().includes('sirup') && cat !== 'Syrup') {
           cat = 'Syrup';
           // Fire and forget update
           updateDoc(doc(db, inventoryPath, d.id), { category: 'Syrup' }).catch(console.error);
        }
        return {
          id: d.id,
          ...data,
          category: cat
        };
      }) as InventoryItem[];
      setInventory(items);
      setInventoryLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, inventoryPath);
    });

    return () => unsubscribe();
  }, [user, userProfile?.currentShopId]);

  // Firestore Team Sync
  useEffect(() => {
    if (!user || !userProfile?.currentShopId) {
      setTeamMembers([]);
      setSalesHistory([]);
      return;
    }

    const q = query(
      collection(db, 'users'), 
      where('currentShopId', '==', userProfile.currentShopId),
      limit(100)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const members = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTeamMembers(members);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
    });

    const salesQ = query(
      collection(db, `shops/${userProfile.currentShopId}/sales`),
      orderBy('timestamp', 'desc'),
      limit(30)
    );
    
    const unsubscribeSales = onSnapshot(salesQ, (snapshot) => {
      setSalesHistory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("Sales sync error:", error);
    });

    const restocksQ = query(
      collection(db, `shops/${userProfile.currentShopId}/restocks`),
      orderBy('timestamp', 'desc'),
      limit(30)
    );
    
    const unsubscribeRestocks = onSnapshot(restocksQ, (snapshot) => {
      setRestockHistory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("Restocks sync error:", error);
    });

    return () => {
       unsubscribe();
       unsubscribeSales();
       unsubscribeRestocks();
    };
  }, [user, userProfile?.currentShopId]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        showToast("Login dibatalkan (Popup tertutup).");
      } else if (error.code === 'auth/unauthorized-domain') {
        alert(`Domain tidak diizinkan oleh Firebase.\n\nHarap akses via localhost atau tambahkan domain ini (${window.location.hostname}) di Firebase Console -> Authentication -> Settings -> Authorized Domains.`);
      } else if (error.code === 'auth/popup-blocked' || error.message?.toLowerCase().includes('popup')) {
        showToast("Popup terblokir, mengalihkan halaman...");
        await signInWithRedirect(auth, googleProvider);
      } else {
        console.error("Login failed:", error);
        alert(`Gagal login: ${error.message}`);
        // Fallback for tricky mobile browsers that just fail silently
        showToast("Mencoba login via redirect...");
        await signInWithRedirect(auth, googleProvider);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      showToast("Logged out successfully.");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleCreateShop = async () => {
    if (!newShopName || !user) return;
    setLoading(true);
    try {
      const joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const shopRef = await addDoc(collection(db, 'shops'), {
        name: newShopName,
        ownerId: user.uid,
        joinCode: joinCode,
        createdAt: serverTimestamp()
      });

      // Update user profile remotely (onSnapshot will handle local state update)
      const updates = {
        currentShopId: shopRef.id,
        role: 'owner'
      };
      await updateDoc(doc(db, `users/${user.uid}`), updates);

      showToast(`Shop "${newShopName}" created!`);
    } catch (error) {
      console.error("Create shop failed:", error);
      showToast("Gagal membuat toko.");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinShop = async () => {
    if (!joinCodeInput || !user) return;
    setLoading(true);
    try {
      // First, find the shop with this join code
      const shopsQuery = query(collection(db, 'shops'), where('joinCode', '==', joinCodeInput.toUpperCase()), limit(1));
      const querySnap = await getDocs(shopsQuery);
      
      if (querySnap.empty) {
        showToast("Kode Toko tidak valid.");
        setLoading(false);
        return;
      }

      const shopDoc = querySnap.docs[0];
      const shopData = shopDoc.data();

      // AS REQUESTED: Default to 'staff' role for anyone joining via code
      const updates = {
        currentShopId: shopDoc.id,
        role: 'staff', 
        displayName: user.displayName || user.email?.split('@')[0] || 'Unknown User',
        updatedAt: serverTimestamp()
      };
      
      await setDoc(doc(db, `users/${user.uid}`), updates, { merge: true });

      showToast(`Berhasil join ke ${shopData.name}!`);
      setShowJoinModal(false);
      setJoinCodeInput('');
    } catch (error) {
      console.error("Join shop failed:", error);
      showToast("Gagal join toko. Pastikan email Anda sudah terverifikasi.");
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshJoinCode = async () => {
    if (!shopData?.id || userProfile?.role !== 'owner') return;
    setLoading(true);
    try {
      const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      await updateDoc(doc(db, `shops/${shopData.id}`), {
        joinCode: newCode,
        updatedAt: serverTimestamp()
      });
      showToast("Kode join berhasil diperbarui!");
    } catch (error) {
      console.error("Refresh join code failed:", error);
      showToast("Gagal memperbarui kode join.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast("Copied to clipboard!");
  };

  const handleManualOrder = () => {
    if (!user || !userProfile?.currentShopId || !analysis?.shoppingList?.length) {
      showToast("Tidak ada daftar belanja atau analisis AI.");
      return;
    }
    const approvedItems = analysis.shoppingList.filter(item => !rejectedRestockItems.includes(item.item));
    if (approvedItems.length === 0) {
      showToast("Semua barang telah ditolak.");
      return;
    }
    
    const initialBatches: {[key: string]: string} = {};
    const defaultExpDate = new Date();
    defaultExpDate.setMonth(defaultExpDate.getMonth() + 3); // Default 3 months from now
    const defaultExpDateStr = defaultExpDate.toISOString().split('T')[0];

    approvedItems.forEach(item => {
      initialBatches[item.item] = defaultExpDateStr;
    });

    setRestockBatches(initialBatches);
    setShowRestockReviewModal(true);
  };

  const executeRestock = async () => {
    if (!user || !userProfile?.currentShopId || !analysis?.shoppingList?.length) {
      return;
    }
    const approvedItems = analysis.shoppingList.filter(item => !rejectedRestockItems.includes(item.item));
    setLoading(true);
    try {
      const shopId = userProfile.currentShopId;
      for (const shopItem of approvedItems) {
        const itemExpDate = restockBatches[shopItem.item];
        const existingItem = inventory.find(i => i.item.toLowerCase() === shopItem.item.toLowerCase());
        
        if (existingItem) {
          const newStock = Number(existingItem.stock) + Number(shopItem.quantity);
          const currentBatches = existingItem.batches || [];
          
          let updatedBatches = [...currentBatches, { qty: shopItem.quantity, exp_date: itemExpDate }];
          
          // Sort batches by earliest exp date first
          updatedBatches.sort((a, b) => new Date(a.exp_date).getTime() - new Date(b.exp_date).getTime());
          
          // Re-calculate the earliest expiry date that has stock
          let newEarliestExpDate = existingItem.exp_date || '';
          if (updatedBatches.length > 0 && updatedBatches[0].qty > 0) {
            newEarliestExpDate = updatedBatches[0].exp_date || newEarliestExpDate;
          }

          await updateDoc(doc(db, `shops/${shopId}/inventory/${existingItem.id}`), {
            stock: newStock,
            exp_date: newEarliestExpDate,
            batches: updatedBatches,
            updatedAt: serverTimestamp()
          });
        } else {
          // If the AI suggested something not in inventory, add it
          await addDoc(collection(db, `shops/${shopId}/inventory`), {
            item: shopItem.item,
            stock: shopItem.quantity,
            unit: shopItem.unit,
            exp_date: itemExpDate,
            category: 'Others', // Fallback
            batches: [{ qty: shopItem.quantity, exp_date: itemExpDate }],
            updatedAt: serverTimestamp()
          });
        }
      }

      // Record to restocks history
      await addDoc(collection(db, `shops/${shopId}/restocks`), {
        items: approvedItems.map(item => ({
          itemId: inventory.find(i => i.item.toLowerCase() === item.item.toLowerCase())?.id || null, // Might be null if just created, but we store the string below anyway
          item: item.item,
          qty: item.quantity,
          unit: item.unit
        })),
        timestamp: serverTimestamp()
      });

      showToast("Order Restock dan Batch Expiry telah dieksekusi!");
      setShowRestockReviewModal(false);
      setRejectedRestockItems([]);
      runAnalysis();
    } catch (error) {
      console.error("Restock failed:", error);
      showToast("Gagal melakukan restock.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStock = async (id: string, newStock: number) => {
    if (!user || !userProfile?.currentShopId) return;
    const path = `shops/${userProfile.currentShopId}/inventory/${id}`;
    try {
      await updateDoc(doc(db, path), { 
        stock: newStock,
        updatedAt: serverTimestamp()
      });
      showToast("Inventory updated!");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const handleAddItem = async () => {
    if (!newItem.item || !user || !userProfile?.currentShopId) return;
    const path = `shops/${userProfile.currentShopId}/inventory`;
    try {
      // Clean up the data before saving
      const cleanedItem = {
        ...newItem,
        item: newItem.item.trim(),
        unit: newItem.unit.trim().toLowerCase(),
        stock: Number(newItem.stock) || 0,
        minStock: Number(newItem.minStock) || 0,
        criticalStock: Number(newItem.criticalStock) || 0,
      };

      await addDoc(collection(db, path), {
        ...cleanedItem,
        batches: [{ qty: cleanedItem.stock, exp_date: cleanedItem.exp_date }],
        updatedAt: serverTimestamp()
      });
      setShowAddItemModal(false);
      showToast(`${cleanedItem.item} berhasil ditambahkan!`);
      setNewItem({ item: '', category: 'Beans' as any, stock: 10, minStock: 2, criticalStock: 1, unit: 'kg', exp_date: '2026-10-10' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const handleUpdateItemProperty = async (id: string, updates: Partial<InventoryItem>) => {
    if (!user || !userProfile?.currentShopId) return;
    const path = `shops/${userProfile.currentShopId}/inventory/${id}`;
    try {
      await updateDoc(doc(db, path), {
        ...updates,
        updatedAt: serverTimestamp()
      });
      showToast("Item details updated!");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!user || !userProfile?.currentShopId) return;
    const path = `shops/${userProfile.currentShopId}/inventory/${id}`;
    try {
      await deleteDoc(doc(db, path));
      showToast("Item berhasil dihapus.");
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const handleRecordSale = async () => {
    if (Object.keys(selectedSaleItems).length === 0 || !userProfile?.currentShopId) return;
    
    setLoading(true);
    const shopId = userProfile.currentShopId;
    const salesPath = `shops/${shopId}/sales`;
    
    try {
      // 1. Record the sale
      const items = Object.entries(selectedSaleItems).map(([itemId, qty]) => ({ itemId, qty }));
      await addDoc(collection(db, salesPath), {
        items,
        totalAmount: 0, // In a real app we'd calculate this
        timestamp: serverTimestamp()
      });

      // 2. Update inventory for each item
      for (const [itemId, qty] of Object.entries(selectedSaleItems)) {
        const item = inventory.find(i => i.id === itemId);
        if (item) {
          const currentStock = Number(item.stock);
          let deductQty = Number(qty);
          const newStock = Math.max(0, currentStock - deductQty);
          
          let updatedBatches = item.batches ? JSON.parse(JSON.stringify(item.batches)) : [{qty: newStock + deductQty, exp_date: item.exp_date || ''}];
          
          // Sort by earliest expiry just in case
          updatedBatches.sort((a: any, b: any) => new Date(a.exp_date).getTime() - new Date(b.exp_date).getTime());
          
          // FIFO deduction
          for (let i = 0; i < updatedBatches.length; i++) {
            if (deductQty <= 0) break;
            
            if (updatedBatches[i].qty > 0) {
              if (updatedBatches[i].qty >= deductQty) {
                updatedBatches[i].qty -= deductQty;
                deductQty = 0;
              } else {
                deductQty -= updatedBatches[i].qty;
                updatedBatches[i].qty = 0;
              }
            }
          }
          
          // Filter out empty batches
          updatedBatches = updatedBatches.filter((b: any) => b.qty > 0);
          
          // Update earliest expiry
          let newEarliestExpDate = item.exp_date || '';
          if (updatedBatches.length > 0) {
            newEarliestExpDate = updatedBatches[0].exp_date || newEarliestExpDate;
          }

          await updateDoc(doc(db, `shops/${shopId}/inventory/${itemId}`), {
            stock: newStock,
            exp_date: newEarliestExpDate,
            batches: updatedBatches,
            updatedAt: serverTimestamp()
          });
        }
      }

      showToast("Penjualan dicatat!");
      setSelectedSaleItems({});
      setShowSalesModal(false);
    } catch (error) {
      console.error("Sales recording failed:", error);
      showToast("Gagal mencatat penjualan.");
    } finally {
      setLoading(false);
    }
  };

  // Calculate real daily sales average from history
  const calculatedDailySalesAvg = useMemo(() => {
    if (!salesHistory || salesHistory.length === 0) return {};
    
    const totals: { [key: string]: number } = {};
    const firstSaleDate = salesHistory[salesHistory.length - 1].timestamp?.toDate() || new Date();
    const now = new Date();
    const daysDiff = Math.max(1, Math.ceil((now.getTime() - firstSaleDate.getTime()) / (1000 * 60 * 60 * 24)));

    salesHistory.forEach(sale => {
      if (Array.isArray(sale.items)) {
        sale.items.forEach((item: any) => {
          // Find item name from inventory for better AI context
          const invItem = inventory.find(i => i.id === item.itemId);
          const key = invItem ? invItem.item : item.itemId;
          totals[key] = (totals[key] || 0) + (Number(item.qty) || 0);
        });
      }
    });

    // Average per day
    const averages: { [key: string]: number } = {};
    Object.keys(totals).forEach(key => {
      averages[key] = totals[key] / daysDiff;
    });
    
    return averages;
  }, [salesHistory, inventory]);

  const runAnalysis = async (forceRefresh = false) => {
    if (!user) return;
    if (inventory.length === 0) {
      setAnalysis(null);
      return;
    }
    setLoading(true);
    try {
      const result = await analyzeSupplyChain(inventory, calculatedDailySalesAvg, '', forceRefresh);
      setAnalysis(result);
    } catch (error) {
      console.error("Analysis failed:", error);
    } finally {
      setLoading(false);
    }
  };

  // Run analysis when inventory changes meaningfully with debounce
  useEffect(() => {
    if (inventory.length === 0) return;

    const timer = setTimeout(() => {
      runAnalysis();
    }, 2000); // Wait for 2 seconds of inactivity

    return () => clearTimeout(timer);
  }, [JSON.stringify(inventory.map(i => ({ i: i.item, s: i.stock, e: i.exp_date, b: i.batches })))]);

  const filteredInventory = inventory
    .filter(item => {
      const matchesFilter = inventoryFilter === 'all' || item.category.toLowerCase() === inventoryFilter.toLowerCase();
      const matchesSearch = item.item.toLowerCase().includes(inventorySearch.toLowerCase());
      const matchesLowStock = !lowStockOnly || (Number(item.stock) <= (item.minStock || 0) / 2) || (item.criticalStock !== undefined && Number(item.stock) <= item.criticalStock);
      return matchesFilter && matchesSearch && matchesLowStock;
    })
    .sort((a, b) => {
      if (inventorySort === 'name') return a.item.localeCompare(b.item);
      if (inventorySort === 'stock') return a.stock - b.stock;
      if (inventorySort === 'expiry') return new Date(a.exp_date).getTime() - new Date(b.exp_date).getTime();
      return 0;
    });

  const categories = ['all', ...new Set(inventory.map(item => item.category.toLowerCase()))];

  const [loadingTimeout, setLoadingTimeout] = useState(false);

  useEffect(() => {
    let timer: any;
    if (authLoading || (user && userProfile?.currentShopId && !shopData)) {
      timer = setTimeout(() => {
        setLoadingTimeout(true);
      }, 3500);
    } else {
      setLoadingTimeout(false);
    }
    return () => clearTimeout(timer);
  }, [authLoading, user, userProfile?.currentShopId, shopData]);

  const handleResetShop = async () => {
    if (user) {
      try {
        await setDoc(doc(db, `users/${user.uid}`), { currentShopId: null, role: null }, { merge: true });
      } catch (err) {
        console.error("Reset shop failed:", err);
      }
      setUserProfile(prev => prev ? { ...prev, currentShopId: null, role: null } : null);
      setShopData(null);
    }
  };

  const handleSeedSampleData = async () => {
    if (!userProfile?.currentShopId) return;
    setLoading(true);
    const shopId = userProfile.currentShopId;
    try {
      const invRef = collection(db, `shops/${shopId}/inventory`);
      const existingSnap = await getDocs(query(invRef, limit(1)));
      if (!existingSnap.empty) {
        showToast("Inventaris kedai sudah memiliki data.");
        setLoading(false);
        return;
      }

      const createdItems: { id: string; item: string }[] = [];
      for (const m of mockInventory) {
        const docRef = await addDoc(invRef, {
          item: m.item,
          stock: m.stock,
          minStock: m.minStock,
          criticalStock: Math.max(1, Math.floor(m.minStock / 2)),
          unit: m.unit,
          exp_date: m.exp_date,
          category: m.category,
          batches: [{ qty: m.stock, exp_date: m.exp_date }],
          updatedAt: serverTimestamp()
        });
        createdItems.push({ id: docRef.id, item: m.item });
      }

      // Add sample sales history
      const salesRef = collection(db, `shops/${shopId}/sales`);
      for (let day = 6; day >= 0; day--) {
        const saleDate = new Date();
        saleDate.setDate(saleDate.getDate() - day);
        saleDate.setHours(14, 0, 0, 0);

        const sampleItems = createdItems.slice(0, 4).map(ci => ({
          itemId: ci.id,
          qty: Math.floor(Math.random() * 3) + 1
        }));

        await addDoc(salesRef, {
          items: sampleItems,
          totalAmount: 45000,
          timestamp: saleDate
        });
      }

      showToast("Berhasil memuat 11 data sampel kedai!");
    } catch (err) {
      console.error("Seed sample data failed:", err);
      showToast("Gagal memuat sampel data.");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || (user && userProfile?.currentShopId && !shopData)) {
    return (
      <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center gap-6 p-6">
        <RefreshCcw className="w-10 h-10 text-amber-500 animate-spin" />
        <div className="text-center space-y-2">
          <p className="text-[10px] font-black text-stone-500 uppercase tracking-[0.3em] animate-pulse">Sinkronisasi Data Kedai</p>
          <p className="text-[8px] font-black text-stone-700 uppercase tracking-widest">Menghubungkan ke sistem inventaris WxCofLog...</p>
        </div>
        {loadingTimeout && (
          <div className="text-center space-y-3 max-w-xs mt-2 bg-stone-900/60 p-5 rounded-2xl border border-stone-800">
            <p className="text-xs text-amber-500 font-bold">Koneksi memakan waktu lebih lama.</p>
            <div className="flex flex-col gap-2">
              <button
                onClick={handleResetShop}
                className="px-4 py-2.5 bg-amber-500 text-stone-950 hover:bg-amber-400 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors"
              >
                Reset / Buat / Pilih Kedai
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-stone-400 hover:text-stone-200 text-[9px] font-black uppercase tracking-wider"
              >
                Keluar (Sign Out)
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (!user) {
    return <Landing onLogin={handleLogin} loading={authLoading || loading} />;
  }

  if (!userProfile?.currentShopId) {
    return (
      <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center p-6 select-none">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          <div className="text-center mb-12">
            <div className="w-16 h-16 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-2xl shadow-amber-500/20 overflow-hidden">
               <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-4xl font-black text-stone-100 italic tracking-tighter uppercase leading-[0.9]">WxCof<span className="text-amber-500">Log.</span></h1>
            <p className="text-stone-600 text-[10px] font-black uppercase tracking-widest md:tracking-[0.4em] mt-3">Intelligent Supply Chain</p>
          </div>

          <div className="bg-stone-900 border border-stone-800 p-8 rounded-[2.5rem] shadow-2xl space-y-6">
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <p className="text-[10px] uppercase font-black tracking-widest text-green-500 mb-4 block">Login Akun: {user.email}</p>
                <div className="flex bg-stone-900 p-1 rounded-xl">
                  <button 
                    onClick={() => setAuthMode('create')}
                    className={cn(
                      "flex-1 py-3 px-4 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                      authMode === 'create' ? "bg-amber-500 text-stone-950 shadow-md" : "text-stone-500 hover:text-stone-300"
                    )}
                  >
                    Buka Kedai Baru
                  </button>
                  <button 
                    onClick={() => setAuthMode('join')}
                    className={cn(
                      "flex-1 py-3 px-4 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                      authMode === 'join' ? "bg-stone-800 text-stone-100 shadow-md" : "text-stone-500 hover:text-stone-300"
                    )}
                  >
                    Gabung Kedai
                  </button>
                </div>

              </div>

              <div className="space-y-4">
                {authMode === 'join' ? (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="p-5 bg-stone-950 border border-stone-800 rounded-2xl space-y-4">
                    <div>
                      <label className="text-[10px] font-black uppercase text-stone-400 block mb-1">Kode Kedai (dari Admin)</label>
                      <p className="text-[9px] text-stone-600 font-bold mb-4">Masukkan 6 digit kode yang diberikan oleh pemilik kedai untuk bergabung sebagai staf/admin.</p>
                    </div>
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        placeholder="KODE6D (contoh)"
                        className="flex-1 min-w-0 bg-stone-900 border border-stone-800 rounded-xl px-4 py-3 text-sm font-bold text-stone-100 uppercase placeholder:text-stone-600/50 tracking-widest text-center"
                        value={joinCodeInput}
                        onChange={(e) => setJoinCodeInput(e.target.value)}
                        maxLength={6}
                      />
                      <button 
                        onClick={handleJoinShop}
                        disabled={loading || !joinCodeInput || joinCodeInput.length < 6}
                        className="bg-amber-500 text-stone-950 px-6 rounded-xl disabled:opacity-50 hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/20 shrink-0"
                      >
                        <ArrowRight className="w-5 h-5 mx-auto" />
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="p-5 bg-stone-950 border border-stone-800 rounded-2xl space-y-4 transition-all border-amber-500/50 bg-amber-500/5 shadow-[0_0_30px_rgba(245,158,11,0.1)]">
                    <div>
                      <label className="text-[10px] font-black uppercase text-amber-500 block mb-1">Nama Bisnis Kopi Anda</label>
                      <p className="text-[9px] text-stone-500 font-bold mb-4">Buat database terpisah (workspace) untuk bisnis Anda. Nantinya Anda bisa mengundang karyawan ke kedai ini.</p>
                    </div>
                    <div className="space-y-3">
                      <input 
                        type="text"
                        placeholder="Contoh: Kopi Kenangan Senja"
                        className="w-full bg-stone-900 border border-stone-800 rounded-xl px-4 py-3 text-sm font-bold text-stone-100 placeholder:text-stone-600/50 focus:border-amber-500 focus:outline-none transition-colors"
                        value={newShopName}
                        onChange={(e) => setNewShopName(e.target.value)}
                      />
                      <button 
                        onClick={handleCreateShop}
                        disabled={loading || !newShopName}
                        className="w-full py-4 bg-amber-500 text-stone-950 font-black rounded-xl uppercase text-[10px] tracking-[0.2em] disabled:opacity-50 hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/20"
                      >
                        {loading ? 'Membuat Database...' : 'Daftarkan Kedai Baru'}
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>

            <button onClick={handleLogout} className="w-full text-[9px] font-black text-stone-500 uppercase tracking-widest hover:text-stone-300 transition-colors">
              Sign out
            </button>
          </div>

          </div>

          <div className="mt-8 text-center space-y-4">
             <p className="text-[9px] text-stone-700 font-black uppercase tracking-widest italic">Authorized Session Initialization Required</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <Layout 
      onLogout={handleLogout}
      role={userProfile?.role || 'Guest Node'}
      shopName={shopData?.name || 'Syncing Node...'}
      userName={userProfile?.displayName || 'User Profile'}
    >
      {/* Toast Notification */}
      <AnimatePresence>
        {toast.visible && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] bg-white text-stone-950 px-6 py-3 rounded-full font-black uppercase text-[10px] tracking-widest shadow-2xl border border-stone-200"
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showRestockReviewModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-stone-950/90 backdrop-blur-xl flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-stone-900 border border-stone-800 p-8 rounded-[3rem] w-full max-w-2xl">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-3xl font-black text-stone-100 tracking-tighter uppercase italic">Restock <span className="text-amber-500">Batches.</span></h3>
                  <p className="text-[10px] text-stone-500 font-black uppercase tracking-widest mt-2">Atur tanggal kedaluwarsa untuk batch baru ini (FIFO/FEFO)</p>
                </div>
                <button onClick={() => setShowRestockReviewModal(false)} className="p-2 text-stone-500 hover:text-stone-100">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar mb-8">
                {analysis?.shoppingList.filter((item: any) => !rejectedRestockItems.includes(item.item)).map((item: any) => (
                  <div key={item.item} className="p-5 bg-stone-950 border border-stone-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-black uppercase text-stone-200">{item.item}</h4>
                      <p className="text-[10px] text-stone-500 font-black uppercase tracking-widest mt-1">Qty: {item.quantity} {item.unit}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-stone-600 uppercase tracking-widest mb-2">Expiry Date (Batch Ini)</p>
                      <input 
                        type="date"
                        value={restockBatches[item.item] || ''}
                        onChange={(e) => setRestockBatches(prev => ({...prev, [item.item]: e.target.value}))}
                        className="bg-stone-900 border border-stone-800 text-stone-100 text-xs p-3 rounded-xl uppercase tracking-tighter font-mono focus:border-amber-500 outline-none w-40"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <button 
                onClick={executeRestock}
                disabled={loading}
                className="w-full py-4 bg-amber-500 text-stone-950 rounded-2xl font-black uppercase text-xs tracking-widest disabled:opacity-50 hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/20"
              >
                {loading ? 'Processing...' : 'Konfirmasi Masuk Stok'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedItemAnalytics && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[110] bg-stone-950/90 backdrop-blur-xl flex items-center justify-center p-4 md:p-6 overflow-y-auto">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-stone-900 border border-stone-800 p-6 md:p-10 rounded-[2.5rem] w-full max-w-2xl my-auto">
              <div className="flex justify-between items-start mb-8">
                <div className="flex-1">
                  <h3 className="text-3xl font-black text-stone-100 tracking-tighter uppercase italic">{selectedItemAnalytics.item}</h3>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <p className="text-[10px] text-amber-500 font-black uppercase tracking-widest">
                      {selectedItemAnalytics.category} • {selectedItemAnalytics.stock} {selectedItemAnalytics.unit}
                      {['Beans', 'Milk', 'Syrup'].includes(selectedItemAnalytics.category) && selectedItemAnalytics.exp_date && (
                        <> • EXP: {new Date(selectedItemAnalytics.exp_date).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'})}</>
                      )}
                    </p>
                    <div className="w-px h-2.5 bg-stone-800"></div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-stone-500 font-black uppercase tracking-widest">Batas Aman: {selectedItemAnalytics.minStock || 0} {selectedItemAnalytics.unit}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {userProfile?.role !== 'staff' && (
                    <div className="relative">
                      <button 
                        onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
                        className={cn(
                          "p-2 rounded-full transition-all duration-300",
                          showDeleteConfirm ? "text-white bg-red-500 scale-110" : "text-stone-500 hover:text-red-500 bg-stone-800/30"
                        )}
                        title="Hapus Item"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                      
                      <AnimatePresence>
                        {showDeleteConfirm && (
                          <motion.div 
                            initial={{ opacity: 0, x: 20, scale: 0.8 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 20, scale: 0.8 }}
                            className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-stone-900 border border-stone-800 p-3 rounded-2xl shadow-2xl flex items-center gap-3 whitespace-nowrap z-[100]"
                          >
                            <span className="text-[9px] font-black uppercase text-stone-300">Hapus barang ini?</span>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => setShowDeleteConfirm(false)}
                                className="px-3 py-1.5 bg-stone-800 text-stone-400 rounded-lg text-[9px] font-black uppercase hover:bg-stone-700"
                              >
                                Batal
                              </button>
                              <button 
                                onClick={() => {
                                  handleDeleteItem(selectedItemAnalytics.id);
                                  setSelectedItemAnalytics(null);
                                  setShowDeleteConfirm(false);
                                }}
                                className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-[9px] font-black uppercase hover:bg-red-500"
                              >
                                Ya, Hapus
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                  <button onClick={() => { setSelectedItemAnalytics(null); setEditingMinStock(null); setShowDeleteConfirm(false); }} className="p-2 text-stone-500 hover:text-stone-100 bg-stone-800/50 rounded-full transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {/* Batas Aman */}
                <div className="bg-stone-950/50 p-6 rounded-3xl border border-stone-800/30 flex flex-col justify-between gap-6">
                  <div>
                    <h4 className="text-[10px] font-black text-stone-500 uppercase tracking-widest mb-2">Batas Aman (Max Target)</h4>
                    <p className="text-xs text-stone-400 font-bold leading-relaxed">
                      Status optimal jika stok sesuai angka ini. Menjadi warning jika kurang dari setengahnya.
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {editingMinStock !== null ? (
                      <div className="flex items-center gap-3 bg-stone-900 border border-amber-500/30 p-2 rounded-2xl w-full">
                        <input 
                          type="number" 
                          className="w-full min-w-0 bg-stone-950 border border-stone-800 rounded-xl px-4 py-2 text-sm font-black text-amber-500 focus:border-amber-500 outline-none"
                          value={Number.isNaN(editingMinStock) ? '' : (editingMinStock ?? '')}
                          onChange={(e) => setEditingMinStock(Number(e.target.value))}
                          autoFocus
                          placeholder="0"
                        />
                        <span className="text-[10px] font-black text-stone-600 uppercase">{selectedItemAnalytics.unit}</span>
                        <button 
                          onClick={() => {
                            handleUpdateItemProperty(selectedItemAnalytics.id, { minStock: editingMinStock });
                            setSelectedItemAnalytics(prev => prev ? {...prev, minStock: editingMinStock} : null);
                            setEditingMinStock(null);
                            showToast(`Batas aman ${selectedItemAnalytics.item} diperbarui!`);
                          }}
                          className="p-2.5 bg-amber-500 text-stone-950 rounded-xl hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20 shrink-0"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-6 justify-between w-full">
                        <div className="flex flex-col items-start">
                          <span className="text-2xl font-black text-stone-100 tracking-tight">{selectedItemAnalytics.minStock || 0}</span>
                          <span className="text-[8px] font-black text-stone-600 uppercase tracking-widest">{selectedItemAnalytics.unit}</span>
                        </div>
                        <button 
                          disabled={userProfile?.role === 'staff'}
                          onClick={() => setEditingMinStock(selectedItemAnalytics.minStock || 0)}
                          className="px-6 py-3 text-[10px] uppercase tracking-[0.2em] font-black text-amber-500 bg-amber-500/10 border border-amber-500/20 rounded-2xl hover:bg-amber-500 hover:text-stone-950 transition-all active:scale-95 disabled:opacity-30 flex items-center gap-2 whitespace-nowrap shrink-0"
                        >
                          <Edit3 className="w-3.5 h-3.5" /> Edit
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Batas Kritis */}
                <div className="bg-stone-950/50 p-6 rounded-3xl border border-stone-800/30 flex flex-col justify-between gap-6">
                  <div>
                    <h4 className="text-[10px] font-black text-red-500/70 uppercase tracking-widest mb-2">Batas Kritis</h4>
                    <p className="text-xs text-stone-400 font-bold leading-relaxed">
                      Status stok menjadi kritis dan butuh tindakan segera.
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {editingCriticalStock !== null ? (
                      <div className="flex items-center gap-3 bg-stone-900 border border-red-500/30 p-2 rounded-2xl w-full">
                        <input 
                          type="number" 
                          className="w-full min-w-0 bg-stone-950 border border-stone-800 rounded-xl px-4 py-2 text-sm font-black text-red-500 focus:border-red-500 outline-none"
                          value={Number.isNaN(editingCriticalStock) ? '' : (editingCriticalStock ?? '')}
                          onChange={(e) => setEditingCriticalStock(Number(e.target.value))}
                          autoFocus
                          placeholder="0"
                        />
                        <span className="text-[10px] font-black text-stone-600 uppercase">{selectedItemAnalytics.unit}</span>
                        <button 
                          onClick={() => {
                            handleUpdateItemProperty(selectedItemAnalytics.id, { criticalStock: editingCriticalStock });
                            setSelectedItemAnalytics(prev => prev ? {...prev, criticalStock: editingCriticalStock} : null);
                            setEditingCriticalStock(null);
                            showToast(`Batas kritis ${selectedItemAnalytics.item} diperbarui!`);
                          }}
                          className="p-2.5 bg-red-500 text-stone-950 rounded-xl hover:bg-red-400 transition-all shadow-lg shadow-red-500/20 shrink-0"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-6 justify-between w-full">
                        <div className="flex flex-col items-start">
                          <span className="text-2xl font-black text-stone-100 tracking-tight">{selectedItemAnalytics.criticalStock || 0}</span>
                          <span className="text-[8px] font-black text-stone-600 uppercase tracking-widest">{selectedItemAnalytics.unit}</span>
                        </div>
                        <button 
                          disabled={userProfile?.role === 'staff'}
                          onClick={() => setEditingCriticalStock(selectedItemAnalytics.criticalStock || 0)}
                          className="px-6 py-3 text-[10px] uppercase tracking-[0.2em] font-black text-red-500 bg-red-500/10 border border-red-500/20 rounded-2xl hover:bg-red-500 hover:text-stone-950 transition-all active:scale-95 disabled:opacity-30 flex items-center gap-2 whitespace-nowrap shrink-0"
                        >
                          <Edit3 className="w-3.5 h-3.5" /> Edit
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {(() => {
                  const itemAnalysis = analysis?.analysis?.find(a => a.item.toLowerCase() === selectedItemAnalytics.item.toLowerCase());
                  const metrics = calculateItemMetrics(selectedItemAnalytics, salesHistory, itemAnalysis);

                  return (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-stone-950 p-4 rounded-2xl border border-stone-800/50">
                          <span className="text-[8px] text-stone-600 font-black uppercase tracking-widest block mb-1">Status AI (Real-time)</span>
                          <span className={cn("text-xs font-black uppercase tracking-tight", 
                            metrics.isCritical ? "text-red-500" :
                            metrics.isWarning ? "text-amber-500" : "text-green-500"
                          )}>
                            {metrics.status}
                          </span>
                        </div>
                        <div className="bg-stone-950 p-4 rounded-2xl border border-stone-800/50">
                          <span className="text-[8px] text-stone-600 font-black uppercase tracking-widest block mb-1">Sisa Hari</span>
                          <span className="text-xl font-mono font-black text-stone-100">{metrics.depletionDaysStr}</span>
                        </div>
                        <div className="bg-stone-950 p-4 rounded-2xl border border-stone-800/50 col-span-2">
                          <span className="text-[8px] text-stone-600 font-black uppercase tracking-widest block mb-1">Prakiraan Pemakaian (Hari)</span>
                          <span className="text-xl font-mono font-black text-stone-100">{metrics.avgDailyUsage} {selectedItemAnalytics.unit}</span>
                        </div>
                      </div>

                      <div className="bg-amber-500/10 border border-amber-500/20 p-5 rounded-2xl">
                        <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                          <Zap className="w-3.5 h-3.5" /> Rekomendasi Pintar AI
                        </h4>
                        <p className="text-xs font-bold text-stone-300 leading-relaxed uppercase tracking-tight">
                          {metrics.recommendation}
                        </p>
                      </div>

                      <div className="bg-stone-950 border border-stone-800/50 p-5 rounded-2xl">
                         <h4 className="text-[10px] font-black text-stone-500 uppercase tracking-widest mb-4">Historical Data (14 Hari Terakhir)</h4>
                         <div className="h-24 flex items-end gap-2">
                            {metrics.historyData.map((h, i) => (
                              <div key={i} className="flex-1 bg-stone-800 hover:bg-amber-500 transition-colors rounded-sm relative group" style={{ height: `${Math.max(5, (h / metrics.maxHistoryQty) * 100)}%` }}>
                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-stone-100 text-stone-900 text-[8px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                                  {h}
                                </div>
                              </div>
                            ))}
                         </div>
                         <div className="flex justify-between items-center mt-3 text-[8px] font-black text-stone-600 uppercase">
                           <span>14 Hari Lalu</span>
                           <span>Hari Ini</span>
                         </div>
                      </div>
                    </div>
                  );
                })()
              }
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddItemModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[90] bg-stone-950/80 backdrop-blur-md flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-stone-900 border border-stone-800 p-8 md:p-10 rounded-[2.5rem] w-full max-w-lg">
              <h3 className="text-3xl font-black text-stone-100 tracking-tighter uppercase mb-2">Tambah <span className="text-amber-500">Stok</span> Baru</h3>
              <p className="text-[10px] text-stone-600 font-black uppercase tracking-widest mb-8">Daftarkan item baru ke dalam database inventaris</p>
              
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black uppercase text-stone-500 mb-2 block">Nama Barang</label>
                  <input 
                    type="text" 
                    placeholder="Contoh: Biji Kopi Espresso"
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-3 text-sm font-bold text-stone-100 focus:border-amber-500 outline-none"
                    value={newItem.item}
                    onChange={e => setNewItem({...newItem, item: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="text-[10px] font-black uppercase text-stone-500 mb-2 block">Kategori</label>
                      <select 
                        className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-3 text-sm font-bold text-stone-100 focus:border-amber-500 outline-none"
                        value={newItem.category}
                        onChange={e => setNewItem({...newItem, category: e.target.value})}
                      >
                        <option value="Beans">Beans (Biji)</option>
                        <option value="Milk">Milk (Susu)</option>
                        <option value="Syrup">Syrup (Sirup)</option>
                        <option value="Sugar">Sugar (Gula)</option>
                        <option value="Packaging">Packaging</option>
                        <option value="Others">Lainnya</option>
                      </select>
                   </div>
                   <div>
                      <label className="text-[10px] font-black uppercase text-stone-500 mb-2 block">Tanggal Kadaluwarsa</label>
                      {['Beans', 'Milk', 'Syrup'].includes(newItem.category) ? (
                        <input 
                          type="date"
                          className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-3 text-sm font-bold text-stone-100 focus:border-amber-500 outline-none"
                          value={newItem.exp_date}
                          onChange={e => setNewItem({...newItem, exp_date: e.target.value})}
                        />
                      ) : (
                        <div className="w-full bg-stone-950/50 border border-stone-900 rounded-xl px-4 py-3 text-sm font-bold text-stone-700 select-none">
                          Tidak Berlaku
                        </div>
                      )}
                   </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase text-stone-500 mb-2 block">Stok Awal</label>
                    <input 
                      type="number"
                      placeholder="0"
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-3 text-sm font-bold text-stone-100 focus:border-amber-500 outline-none"
                      value={Number.isNaN(newItem.stock) ? '' : newItem.stock}
                      onChange={e => setNewItem({...newItem, stock: parseFloat(e.target.value)})}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-stone-500 mb-2 block">Satuan</label>
                    <input 
                      type="text"
                      placeholder="kg, liter, pcs"
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-3 text-sm font-bold text-stone-100 focus:border-amber-500 outline-none"
                      value={newItem.unit}
                      onChange={e => setNewItem({...newItem, unit: e.target.value})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase text-stone-500 mb-2 block">Batas Aman</label>
                    <div className="relative">
                      <input 
                        type="number"
                        placeholder="Safety"
                        className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-3 text-sm font-bold text-stone-100 focus:border-amber-500 outline-none pr-10"
                        value={Number.isNaN(newItem.minStock) ? '' : newItem.minStock}
                        onChange={e => setNewItem({...newItem, minStock: parseFloat(e.target.value)})}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-stone-500 mb-2 block">Batas Kritis</label>
                    <div className="relative">
                      <input 
                        type="number"
                        placeholder="Critical"
                        className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-3 text-sm font-bold text-stone-100 focus:border-red-500 outline-none pr-10"
                        value={Number.isNaN(newItem.criticalStock) ? '' : newItem.criticalStock}
                        onChange={e => setNewItem({...newItem, criticalStock: parseFloat(e.target.value)})}
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-4 mt-10">
                <button onClick={() => setShowAddItemModal(false)} className="flex-1 py-4 bg-stone-800 text-stone-400 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-stone-700 transition-colors">Batal</button>
                <button onClick={handleAddItem} className="flex-1 py-4 bg-amber-500 text-stone-950 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/20">Simpan Item</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Opname Modal */}
      <AnimatePresence>
        {showOpnameModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[90] bg-stone-950/80 backdrop-blur-md flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-stone-900 border border-stone-800 p-8 rounded-[2rem] w-full max-w-lg">
              <h3 className="text-2xl font-black text-stone-100 tracking-tighter uppercase mb-6">Opname Stok Manual</h3>
              <div className="space-y-4 max-h-[400px] overflow-auto pr-2 custom-scrollbar">
                {inventory.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-stone-950 rounded-2xl border border-stone-800">
                    <span className="text-xs font-bold text-stone-400 uppercase tracking-tight">{item.item}</span>
                    <div className="flex items-center gap-4">
                      <button onClick={() => handleUpdateStock(item.id, Math.max(0, item.stock - 0.5))} className="w-8 h-8 rounded-lg bg-stone-800 text-stone-100 flex items-center justify-center hover:bg-amber-500 transition-colors text-xs">-</button>
                      <span className="font-mono text-sm w-12 text-center">{item.stock}</span>
                      <button onClick={() => handleUpdateStock(item.id, item.stock + 0.5)} className="w-8 h-8 rounded-lg bg-stone-800 text-stone-100 flex items-center justify-center hover:bg-amber-500 transition-colors text-xs">+</button>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => setShowOpnameModal(false)} className="w-full mt-8 py-4 bg-amber-500 text-stone-950 rounded-2xl font-black uppercase text-xs tracking-widest">Selesai</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto">
        {/* Top Header Section */}
        {location.pathname === '/overview' && (
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-12 gap-6 md:gap-8">
            <div className="text-left">
              <h2 className="text-4xl md:text-5xl font-black text-stone-100 tracking-tighter uppercase leading-[0.9]">Operational <span className="text-amber-500 italic">Core.</span></h2>
              <p className="text-stone-600 text-[10px] font-black uppercase tracking-widest md:tracking-[0.4em] mt-3">Neural network monitoring system v2.4</p>
            </div>
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 w-full md:w-auto mt-4 md:mt-0">
               <button 
                 onClick={() => setShowSalesModal(true)}
                 className="flex-1 md:flex-none px-4 md:px-8 py-4 bg-amber-500 text-stone-950 rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-all flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20"
               >
                 <ShoppingCart className="w-4 h-4" />
                 Catat Penjualan
               </button>
               <button onClick={() => runAnalysis(true)} disabled={loading} className="flex-1 md:flex-none px-4 md:px-8 py-4 bg-stone-900 border border-stone-800 text-stone-100 rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest hover:border-amber-500/50 transition-all flex items-center justify-center gap-2">
                 {loading ? <RefreshCcw className="w-4 h-4 animate-spin text-amber-500" /> : <Sparkles className="w-4 h-4 text-amber-500" />}
                 Force Sync
               </button>
            </div>
          </div>
        )}

        {/* Dynamic View Route Render */}
        <div className="pb-20">
          <Suspense fallback={<div className="p-10 flex flex-col items-center justify-center text-stone-500 h-64"><RefreshCcw className="w-8 h-8 animate-spin text-amber-500 mb-4" /><span className="text-[10px] font-black uppercase tracking-widest">Memuat Modul...</span></div>}>
            <Routes>
              <Route path="/" element={<Navigate to="/overview" replace />} />
              <Route path="/overview" element={
                <Overview 
                  inventory={inventory}
                  inventoryLoading={inventoryLoading}
                  analysis={analysis}
                  userProfile={userProfile}
                  setShowAddItemModal={setShowAddItemModal}
                  fluxTimeframe={fluxTimeframe}
                  setFluxTimeframe={setFluxTimeframe}
                  salesHistory={salesHistory}
                  handleManualOrder={handleManualOrder}
                  onSeedSampleData={handleSeedSampleData}
                />
              } />
              <Route path="/inventory" element={
                <Inventory 
                  inventory={inventory}
                  filteredInventory={filteredInventory}
                  analysis={analysis}
                  userProfile={userProfile}
                  inventorySearch={inventorySearch}
                  setInventorySearch={setInventorySearch}
                  setShowAddItemModal={setShowAddItemModal}
                  categories={categories}
                  inventoryFilter={inventoryFilter}
                  setInventoryFilter={setInventoryFilter}
                  inventorySort={inventorySort}
                  setInventorySort={setInventorySort}
                  lowStockOnly={lowStockOnly}
                  setLowStockOnly={setLowStockOnly}
                  setSelectedItemAnalytics={setSelectedItemAnalytics}
                  salesHistory={salesHistory}
                />
              } />
              <Route path="/forecasting" element={
                <Forecasting 
                  analysis={analysis}
                  chartTimeframe={chartTimeframe}
                  setChartTimeframe={setChartTimeframe}
                  salesHistory={salesHistory}
                  inventory={inventory}
                />
              } />
              <Route path="/team" element={
                <Team 
                  userProfile={userProfile}
                  shopData={shopData}
                  copyToClipboard={copyToClipboard}
                  handleRefreshJoinCode={handleRefreshJoinCode}
                  loading={loading}
                  teamMembers={teamMembers}
                  user={user}
                  showToast={showToast}
                />
              } />
              <Route path="/restock" element={
                <RestockAI 
                  analysis={analysis}
                  handleManualOrder={handleManualOrder}
                  rejectedRestockItems={rejectedRestockItems}
                  setRejectedRestockItems={setRejectedRestockItems}
                  inventory={inventory}
                  restockHistory={restockHistory}
                />
              } />
              <Route path="/sales-history" element={
                <SalesHistory 
                  salesHistory={salesHistory}
                  inventory={inventory}
                />
              } />
            </Routes>
          </Suspense>
        </div>
      </div>

      <Suspense fallback={null}>
        <AIAssistant inventory={inventory} dailySalesAvg={calculatedDailySalesAvg} />
      </Suspense>

      {/* Record Sales Modal */}
      <AnimatePresence>
        {showSalesModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-stone-950/90 backdrop-blur-xl flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-stone-900 border border-stone-800 p-8 rounded-[3rem] w-full max-w-2xl">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-3xl font-black text-stone-100 tracking-tighter uppercase italic">Terminal <span className="text-amber-500">Penjualan.</span></h3>
                  <p className="text-[10px] text-stone-500 font-black uppercase tracking-widest mt-2">Kurangi stok melalui log transaksi</p>
                </div>
                <button onClick={() => setShowSalesModal(false)} className="p-2 text-stone-500 hover:text-stone-100">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10 max-h-[60vh] h-[500px]">
                {/* Left: Item Picker */}
                <div className="h-full space-y-4 overflow-y-auto pr-2 custom-scrollbar relative">
                  <h4 className="text-[10px] font-black uppercase text-stone-600 tracking-widest sticky top-0 z-10 bg-stone-900 py-2">Item Tersedia</h4>
                  {inventory.map(item => (
                    <button 
                      key={item.id} 
                      onClick={() => setSelectedSaleItems(prev => ({...prev, [item.id]: (prev[item.id] || 0) + 1}))}
                      className="w-full flex items-center justify-between p-4 bg-stone-950 border border-stone-800 rounded-2xl hover:border-amber-500/50 transition-all group"
                    >
                      <div className="text-left">
                        <span className="text-[8px] font-black text-stone-700 uppercase block">{item.category}</span>
                        <span className="text-xs font-black text-stone-300 uppercase">{item.item}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-mono font-black text-stone-600">{item.stock} {item.unit}</span>
                        <Plus className="w-4 h-4 text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </button>
                  ))}
                </div>

                {/* Right: Cart */}
                <div className="bg-stone-950 border border-stone-800 rounded-3xl p-6 flex flex-col h-full overflow-hidden">
                  <h4 className="text-[10px] font-black uppercase text-stone-600 tracking-widest mb-6 shrink-0">Batch Saat Ini</h4>
                  <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-2">
                    {Object.entries(selectedSaleItems).map(([id, qty]) => {
                      const item = inventory.find(i => i.id === id);
                      return (
                        <div key={id} className="flex items-center justify-between gap-3">
                          <span className="text-xs font-bold text-stone-300 truncate flex-1 min-w-0" title={item?.item}>{item?.item}</span>
                          <div className="flex items-center gap-3 shrink-0">
                            <button 
                              onClick={() => setSelectedSaleItems(prev => {
                                const next = {...prev};
                                if (next[id] <= 1) delete next[id];
                                else next[id]--;
                                return next;
                              })}
                              className="w-6 h-6 rounded-lg bg-stone-900 border border-stone-800 text-stone-500 flex items-center justify-center hover:text-white"
                            >
                              -
                            </button>
                            <span className="font-mono text-sm font-black text-amber-500 w-6 text-center">{qty}</span>
                            <button 
                              onClick={() => setSelectedSaleItems(prev => ({...prev, [id]: prev[id] + 1}))}
                              className="w-6 h-6 rounded-lg bg-stone-900 border border-stone-800 text-stone-500 flex items-center justify-center hover:text-white"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    {Object.keys(selectedSaleItems).length === 0 && (
                      <div className="h-full flex flex-col items-center justify-center text-stone-700 opacity-50 text-center py-10">
                        <ShoppingCart className="w-12 h-12 mb-4" />
                        <p className="text-[10px] font-black uppercase tracking-widest">Keranjang masih kosong</p>
                      </div>
                    )}
                  </div>
                  <div className="mt-6 pt-6 border-t border-stone-800/50 shrink-0">
                    <button 
                      onClick={handleRecordSale}
                      disabled={loading || Object.keys(selectedSaleItems).length === 0}
                      className="w-full py-4 bg-amber-500 text-stone-950 rounded-2xl font-black uppercase text-xs tracking-widest disabled:opacity-50 hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/20"
                    >
                      {loading ? 'Memproses...' : 'Konfirmasi Transaksi'}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
