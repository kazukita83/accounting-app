// ============================================================
// app.jsx — メインReactアプリ
// Auth と API モジュールと連携してリアルデータを使用
// ============================================================
const { useState, useEffect, useCallback, useRef, useMemo } = React;

// ===== SVG Icons =====
const icon = (paths) => (props) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>{paths}</svg>;
const Icons = {
  Home: icon(<><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>),
  List: icon(<><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></>),
  Plus: icon(<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>),
  Settings: icon(<><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></>),
  Camera: icon(<><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></>),
  Edit: icon(<><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>),
  Trash: icon(<><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></>),
  Back: icon(<polyline points="15 18 9 12 15 6"/>),
  Wallet: icon(<><rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/></>),
  ArrowDown: icon(<><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></>),
  ArrowUp: icon(<><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></>),
  Users: icon(<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>),
  Check: icon(<polyline points="20 6 9 17 4 12"/>),
  X: icon(<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>),
  FileText: icon(<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></>),
  DollarSign: icon(<><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></>),
  ArrowRight: icon(<><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>),
  Folder: icon(<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>),
  Image: icon(<><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></>),
  RefreshCw: icon(<><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></>),
  Calendar: icon(<><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>),
  Tag: icon(<><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></>),
  Mail: icon(<><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></>),
  Google: icon(<><path d="M20.283 10.356h-8.327v3.451h4.792c-.446 2.193-2.313 3.453-4.792 3.453a5.27 5.27 0 0 1-5.279-5.28 5.27 5.27 0 0 1 5.279-5.279c1.259 0 2.397.447 3.29 1.178l2.6-2.599c-1.584-1.381-3.615-2.233-5.89-2.233a8.908 8.908 0 0 0-8.934 8.934 8.907 8.907 0 0 0 8.934 8.934c4.467 0 8.529-3.249 8.529-8.934 0-.528-.081-1.097-.202-1.625z"/></>),
  Loader: icon(<><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></>),
};

const fmt = (n) => '¥' + Number(n||0).toLocaleString('ja-JP');
const fmtDate = (d) => { try { const dt=new Date(d); return `${dt.getFullYear()}/${String(dt.getMonth()+1).padStart(2,'0')}/${String(dt.getDate()).padStart(2,'0')}`; } catch(e) { return d; } };

// ===== App Component =====
function App() {
  // ---- 認証・ロード状態 ----
  const [authState, setAuthState] = useState('loading'); // 'loading' | 'unauthenticated' | 'checking' | 'unregistered' | 'needsSetup' | 'ready'
  const [authError, setAuthError] = useState(null);
  const [loadError, setLoadError] = useState(null);

  // ---- データ ----
  const [masterFileId, setMasterFileId] = useState(null);
  const [fiscalFileId, setFiscalFileId] = useState(null);
  const [appUser, setAppUser] = useState(null);         // アプリ内ユーザー情報（role等）
  const [masterData, setMasterData] = useState(null);   // { users, groups, categories, settings }
  const [fyData, setFyData] = useState(null);           // { transactions, cashIn, cashTransfers, budgets }
  const [currentFY, setCurrentFY] = useState(null);
  const [fiscalYears, setFiscalYears] = useState([]);

  // ---- ナビ・UI ----
  const [page, setPage] = useState('home');
  const [subPage, setSubPage] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [toast, setToast] = useState(null);
  const [modal, setModal] = useState(null);
  const [historyTab, setHistoryTab] = useState('expenses');
  const [setupStep, setSetupStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const isNavigating = useRef(false);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };
  const showError = (msg) => { setToast(`⚠ ${msg}`); setTimeout(() => setToast(null), 5000); };

  // ---- 認証初期化 ----
  useEffect(() => {
    Auth.onAuthChange(async ({ user, token }) => {
      if (!user) {
        setAuthState('unauthenticated');
        return;
      }
      // Googleでの認証は成功 → アプリDBを確認
      setAuthState('checking');
      try {
        const { isSetup, masterFileId: mid } = await API.checkSetup();
        if (!isSetup) {
          setAuthState('needsSetup');
          return;
        }
        setMasterFileId(mid);

        const appUserRow = await API.findAppUser(mid, user.email);
        if (!appUserRow) {
          setAuthState('unregistered');
          return;
        }
        const appUserObj = {
          name: appUserRow['氏名'],
          email: appUserRow['メールアドレス'],
          groups: appUserRow['所属グループ'],
          role: appUserRow['役割'],
        };
        setAppUser(appUserObj);

        // マスターデータを読み込む
        const master = await API.loadMasterData(mid);
        setMasterData(master);

        // 最新年度データを読み込む
        const years = await API.listFiscalYears();
        setFiscalYears(years);
        if (years.length > 0) {
          const latestYear = years[0];
          setCurrentFY(latestYear.year);
          const fy = await API.loadFiscalData(latestYear.id);
          setFiscalFileId(latestYear.id);
          setFyData(fy);
        }

        setAuthState('ready');
        navigate('home');
      } catch (e) {
        console.error(e);
        setLoadError(e.message);
        setAuthState('error');
      }
    });
    Auth.init();
  }, []);

  // ---- データ再読み込み ----
  const reloadFiscalData = useCallback(async () => {
    if (!fiscalFileId) return;
    try {
      const fy = await API.loadFiscalData(fiscalFileId);
      setFyData(fy);
    } catch (e) {
      showError('データの更新に失敗しました: ' + e.message);
    }
  }, [fiscalFileId]);

  // ---- ナビゲーション ----
  const navigate = useCallback((newPage, newSubPage = null, newSelectedItem = undefined) => {
    isNavigating.current = true;
    const state = { page: newPage, subPage: newSubPage };
    history.pushState(state, '', `#${newPage}${newSubPage ? '/'+newSubPage : ''}`);
    setPage(newPage);
    setSubPage(newSubPage);
    if (newSelectedItem !== undefined) setSelectedItem(newSelectedItem);
    isNavigating.current = false;
  }, []);

  const goBack = useCallback(() => { history.back(); }, []);
  const goHome = useCallback(() => { navigate('home'); }, [navigate]);

  useEffect(() => {
    const handlePopState = (e) => {
      if (isNavigating.current) return;
      if (modal) { setModal(null); return; }
      const state = e.state;
      if (state) {
        setPage(state.page);
        setSubPage(state.subPage || null);
        if (!state.subPage) setSelectedItem(null);
      } else {
        setSubPage(null);
        setSelectedItem(null);
        setPage('home');
      }
    };
    window.addEventListener('popstate', handlePopState);
    if (!history.state) history.replaceState({ page, subPage }, '', `#${page}`);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [modal]);

  // ---- 派生値 ----
  const isAccountant = appUser?.role === '経理';
  const userGroups = appUser ? appUser.groups.split(',').map(g=>g.trim()).filter(Boolean) : [];
  const activeGroups = masterData?.groups.filter(g=>g.active) || [];
  // activeGroupsが空のときは有効フラグを問わず全グループを使う（データ不整合への安全策）
  const effectiveGroups = activeGroups.length > 0 ? activeGroups : (masterData?.groups || []);
  const activeCategories = masterData?.categories.filter(c=>c.active) || [];

  const activeTxns = (fyData?.transactions || []).filter(t=>t.status==='有効');
  const activeTransfers = (fyData?.cashTransfers || []).filter(t=>t.status==='有効');
  const activeCashIn = (fyData?.cashIn || []).filter(t=>t.status==='有効');

  const totalCashIn = activeCashIn.reduce((s,r) => s+r.amount, 0);
  const totalDistributed = activeTransfers.filter(t=>t.type==='配布').reduce((s,r)=>s+r.amount, 0);
  const totalReturned = activeTransfers.filter(t=>t.type==='返金').reduce((s,r)=>s+r.amount, 0);
  const assocCash = totalCashIn - totalDistributed + totalReturned;

  const groupBalance = (gname) => {
    const received = activeTransfers.filter(t=>t.type==='配布'&&t.group===gname).reduce((s,r)=>s+r.amount,0);
    const spent = activeTxns.filter(t=>t.group===gname).reduce((s,r)=>s+r.amount,0);
    const returned = activeTransfers.filter(t=>t.type==='返金'&&t.group===gname).reduce((s,r)=>s+r.amount,0);
    return { received, spent, returned, balance: received-spent-returned };
  };

  const getBudget = (gname) => (fyData?.budgets.find(b=>b.group===gname)?.amount || 0);

  // ---- アクション ----
  const handleSignIn = async () => {
    setAuthError(null);
    try {
      await Auth.signIn();
    } catch (e) {
      setAuthError(e.message);
    }
  };

  const addTransaction = async (txn) => {
    setIsSaving(true);
    try {
      let photoUrl = '';
      if (txn.photoFile) {
        photoUrl = await API.uploadReceipt(txn.photoFile, currentFY, txn.group);
      }
      const newTxn = await API.addTransaction(fiscalFileId, { ...txn, photoUrl }, appUser);
      setFyData(prev => ({ ...prev, transactions: [...prev.transactions, newTxn] }));
      showToast('記録を登録しました');
      goBack();
    } catch (e) {
      showError('登録に失敗しました: ' + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const addCashIn = async (record) => {
    setIsSaving(true);
    try {
      const newRecord = await API.addCashIn(fiscalFileId, record, appUser);
      setFyData(prev => ({ ...prev, cashIn: [...prev.cashIn, newRecord] }));
      showToast('入金記録を登録しました');
      goBack();
    } catch (e) {
      showError('登録に失敗しました: ' + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const addTransfer = async (record) => {
    setIsSaving(true);
    try {
      const newRecord = await API.addTransfer(fiscalFileId, record, appUser);
      setFyData(prev => ({ ...prev, cashTransfers: [...prev.cashTransfers, newRecord] }));
      showToast('現金移動を記録しました');
      goBack();
    } catch (e) {
      showError('登録に失敗しました: ' + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const updateTransaction = async (id, updates) => {
    setIsSaving(true);
    try {
      await API.updateTransaction(fiscalFileId, id, updates);
      setFyData(prev => ({
        ...prev,
        transactions: prev.transactions.map(t => t.id===id ? {...t, ...updates} : t),
      }));
      // Update selectedItem so detail page reflects changes immediately
      setSelectedItem(prev => prev?.id===id ? {...prev, ...updates} : prev);
      showToast('記録を更新しました');
    } catch (e) {
      showError('更新に失敗しました: ' + e.message);
      throw e;
    } finally {
      setIsSaving(false);
    }
  };

  const deleteRecord = async (type, id) => {
    setIsSaving(true);
    try {
      if (type==='transaction') {
        await API.deleteTransaction(fiscalFileId, id);
        setFyData(prev => ({ ...prev, transactions: prev.transactions.map(t=>t.id===id?{...t,status:'削除済'}:t) }));
      } else if (type==='cashIn') {
        await API.deleteCashIn(fiscalFileId, id);
        setFyData(prev => ({ ...prev, cashIn: prev.cashIn.map(t=>t.id===id?{...t,status:'削除済'}:t) }));
      } else if (type==='transfer') {
        await API.deleteTransfer(fiscalFileId, id);
        setFyData(prev => ({ ...prev, cashTransfers: prev.cashTransfers.map(t=>t.id===id?{...t,status:'削除済'}:t) }));
      }
      setModal(null);
      navigate('history');
      showToast('記録を削除しました');
    } catch (e) {
      showError('削除に失敗しました: ' + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const restoreRecord = async (type, id) => {
    setIsSaving(true);
    try {
      if (type==='transaction') {
        await API.restoreTransaction(fiscalFileId, id);
        setFyData(prev => ({ ...prev, transactions: prev.transactions.map(t=>t.id===id?{...t,status:'有効'}:t) }));
      } else if (type==='cashIn') {
        await API.restoreCashIn(fiscalFileId, id);
        setFyData(prev => ({ ...prev, cashIn: prev.cashIn.map(t=>t.id===id?{...t,status:'有効'}:t) }));
      } else if (type==='transfer') {
        await API.restoreTransfer(fiscalFileId, id);
        setFyData(prev => ({ ...prev, cashTransfers: prev.cashTransfers.map(t=>t.id===id?{...t,status:'有効'}:t) }));
      }
      showToast('記録を復元しました');
    } catch (e) {
      showError('復元に失敗しました: ' + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const updateGroups = async (groups) => {
    try {
      await API.updateGroups(masterFileId, groups);
      setMasterData(prev => ({ ...prev, groups }));
      showToast('グループを保存しました');
    } catch (e) {
      showError('保存に失敗しました: ' + e.message);
    }
  };

  const updateCategories = async (cats) => {
    try {
      await API.updateCategories(masterFileId, cats);
      setMasterData(prev => ({ ...prev, categories: cats }));
      showToast('勘定科目を保存しました');
    } catch (e) {
      showError('保存に失敗しました: ' + e.message);
    }
  };

  const handleNewFiscalYear = async (year) => {
    setIsSaving(true);
    try {
      const { id } = await API.createFiscalYear(year, activeGroups);
      const newYears = [...fiscalYears, { id, year, name: `${CONFIG.FISCAL_FILE_PREFIX}${year}` }]
        .sort((a,b)=>b.year-a.year);
      setFiscalYears(newYears);
      setFiscalFileId(id);
      setCurrentFY(year);
      const fy = await API.loadFiscalData(id);
      setFyData(fy);
      showToast(`${year}年度を作成しました`);
      goBack();
    } catch (e) {
      showError('年度作成に失敗しました: ' + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const switchFiscalYear = async (year) => {
    const found = fiscalYears.find(y=>y.year===year);
    if (!found) return;
    try {
      setFyData(null);
      setCurrentFY(year);
      setFiscalFileId(found.id);
      const fy = await API.loadFiscalData(found.id);
      setFyData(fy);
    } catch (e) {
      showError('年度切替に失敗しました: ' + e.message);
    }
  };

  // ---- 特殊画面（認証前） ----
  if (authState === 'loading') return <LoadingScreen message="読み込み中..." />;
  if (authState === 'checking') return <LoadingScreen message="認証確認中..." />;
  if (authState === 'unauthenticated') return <LoginPage onSignIn={handleSignIn} error={authError} />;
  if (authState === 'error') return <ErrorScreen message={loadError} onRetry={() => window.location.reload()} />;
  if (authState === 'unregistered') return <UnregisteredScreen email={Auth.currentUser()?.email} onSignOut={() => Auth.signOut()} />;
  if (authState === 'needsSetup') return <SetupWizard
    step={setupStep} setStep={setSetupStep}
    onComplete={async (groups) => {
      // マスターファイルを作成（グループ付き）
      const mid = await API.createMasterFile(groups);
      setMasterFileId(mid);

      // マスターデータを読み込む
      const master = await API.loadMasterData(mid);
      setMasterData(master);

      // 現在の年度でファイルを作成
      const currentYear = new Date().getFullYear();
      const groupObjects = (groups || []).filter(g => g.trim()).map(g => ({ name: g.trim(), active: true }));
      const { id: fyId } = await API.createFiscalYear(currentYear, groupObjects);
      setFiscalFileId(fyId);
      setCurrentFY(currentYear);

      // 年度データを読み込む
      const fy = await API.loadFiscalData(fyId);
      setFyData(fy);
      setFiscalYears([{ id: fyId, year: currentYear, name: `${CONFIG.FISCAL_FILE_PREFIX}${currentYear}` }]);

      // セットアップ実行者をアプリユーザーとして設定（経理ロール）
      const setupUser = Auth.currentUser();
      setAppUser({ name: setupUser.name, email: setupUser.email, groups: '', role: '経理' });

      setAuthState('ready');
      navigate('home');
      showToast('初期設定が完了しました');
    }}
    onCancel={() => Auth.signOut()}
  />;

  // データ読み込み中
  if (authState === 'ready' && !masterData) return <LoadingScreen message="データを読み込み中..." />;
  // 年度ファイルが存在しない場合は新年度作成画面へ
  if (authState === 'ready' && masterData && fiscalYears.length === 0) return (
    <NoFiscalYearScreen
      onCreateYear={async () => {
        const year = new Date().getFullYear();
        try {
          const groups = masterData.groups.filter(g => g.active);
          const { id } = await API.createFiscalYear(year, groups);
          setFiscalFileId(id);
          setCurrentFY(year);
          const fy = await API.loadFiscalData(id);
          setFyData(fy);
          setFiscalYears([{ id, year, name: `${CONFIG.FISCAL_FILE_PREFIX}${year}` }]);
          navigate('home');
          showToast(`${year}年度を作成しました`);
        } catch (e) {
          showError('年度作成に失敗しました: ' + e.message);
        }
      }}
      onSignOut={() => Auth.signOut()}
    />
  );

  // ---- メインレンダー ----
  const renderPage = () => {
    if (subPage === 'newExpense') return <NewExpensePage
      categories={activeCategories}
      groups={isAccountant ? effectiveGroups.map(g => g.name) : userGroups}
      isAccountant={isAccountant}
      onSubmit={addTransaction} onCashIn={()=>navigate(page,'newCashIn')} onTransfer={()=>navigate(page,'newTransfer')}
      onBack={goBack} onHome={goHome} isSaving={isSaving}
    />;
    if (subPage === 'newCashIn') return <NewCashInPage onSubmit={addCashIn} onBack={goBack} onHome={goHome} isSaving={isSaving} />;
    if (subPage === 'newTransfer') return <NewTransferPage groups={isAccountant ? effectiveGroups : effectiveGroups.filter(g => userGroups.includes(g.name))} onSubmit={addTransfer} onBack={goBack} onHome={goHome} isSaving={isSaving} />;
    if (subPage === 'expenseDetail') {
      if (!selectedItem) { goBack(); return null; }
      return <ExpenseDetailPage item={selectedItem} isAccountant={isAccountant} userGroups={userGroups}
        categories={activeCategories} groups={effectiveGroups}
        onDelete={(id)=>setModal({type:'confirmDelete',deleteType:'transaction',id})}
        onRestore={(id)=>restoreRecord('transaction',id)}
        onUpdate={updateTransaction}
        onBack={goBack} onHome={goHome} />;
    }
    if (subPage === 'cashInDetail') {
      if (!selectedItem) { goBack(); return null; }
      return <CashInDetailPage item={selectedItem} isAccountant={isAccountant}
        onDelete={(id)=>setModal({type:'confirmDelete',deleteType:'cashIn',id})}
        onRestore={(id)=>restoreRecord('cashIn',id)} onBack={goBack} onHome={goHome} />;
    }
    if (subPage === 'transferDetail') {
      if (!selectedItem) { goBack(); return null; }
      return <TransferDetailPage item={selectedItem} isAccountant={isAccountant}
        onDelete={(id)=>setModal({type:'confirmDelete',deleteType:'transfer',id})}
        onRestore={(id)=>restoreRecord('transfer',id)} onBack={goBack} onHome={goHome} />;
    }
    if (subPage === 'categories') return <CategoriesPage categories={masterData.categories} onUpdate={updateCategories} onBack={goBack} onHome={goHome} />;
    if (subPage === 'groups') return <GroupsPage groups={masterData.groups} onUpdate={updateGroups} onBack={goBack} onHome={goHome} />;
    if (subPage === 'newFiscalYear') return <NewFiscalYearPage
      currentYear={currentFY} existingYears={fiscalYears.map(y=>y.year)}
      onComplete={handleNewFiscalYear} onBack={goBack} onHome={goHome} isSaving={isSaving} />;
    if (subPage === 'appSettings') return <AppSettingsPage
      settings={masterData.settings} fiscalYears={fiscalYears} currentFY={currentFY}
      onSwitchYear={switchFiscalYear} onBack={goBack} onHome={goHome} />;

    switch(page) {
      case 'home': return <HomePage
        assocCash={assocCash} totalCashIn={totalCashIn} totalDistributed={totalDistributed} totalReturned={totalReturned}
        groups={effectiveGroups} groupBalance={groupBalance} getBudget={getBudget}
        isAccountant={isAccountant} userGroups={userGroups} fy={currentFY}
        onNewExpense={()=>navigate(page,'newExpense')} onNewCashIn={()=>navigate(page,'newCashIn')} onNewTransfer={()=>navigate(page,'newTransfer')}
        onRefresh={reloadFiscalData}
      />;
      case 'history': return <HistoryPage
        transactions={fyData.transactions} cashIn={fyData.cashIn} transfers={fyData.cashTransfers}
        isAccountant={isAccountant} userGroups={userGroups}
        tab={historyTab} setTab={setHistoryTab}
        onSelectExpense={(item)=>{navigate(page,'expenseDetail',item);}}
        onSelectCashIn={(item)=>{navigate(page,'cashInDetail',item);}}
        onSelectTransfer={(item)=>{navigate(page,'transferDetail',item);}}
        onHome={goHome}
      />;
      case 'settings': return <SettingsPage
        masterData={masterData} isAccountant={isAccountant}
        userInfo={Auth.currentUser()} appUser={appUser}
        onCategories={()=>navigate(page,'categories')}
        onGroups={()=>navigate(page,'groups')}
        onNewFiscalYear={()=>navigate(page,'newFiscalYear')}
        onAppSettings={()=>navigate(page,'appSettings')}
        onLogout={()=>{Auth.signOut();}}
        onStartSetup={()=>{setSetupStep(0);navigate('setup');}}
        onHome={goHome}
      />;
      default: return null;
    }
  };

  return (
    <div className="app">
      {renderPage()}
      {appUser && !subPage && page !== 'login' && page !== 'setup' && (
        <nav className="bottom-nav">
          <button className={`nav-item ${page==='home'?'active':''}`} onClick={()=>navigate('home')}>
            <Icons.Home /><span>ホーム</span>
          </button>
          <button className={`nav-item ${page==='history'?'active':''}`} onClick={()=>navigate('history')}>
            <Icons.List /><span>履歴</span>
          </button>
          <button className="nav-item" onClick={()=>navigate(page,'newExpense')} style={{color:'var(--blue-600)'}}>
            <div style={{background:'var(--blue-600)',borderRadius:'50%',width:36,height:36,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',marginTop:-8}}><Icons.Plus /></div>
            <span>記録</span>
          </button>
          <button className={`nav-item ${page==='settings'?'active':''}`} onClick={()=>navigate('settings')}>
            <Icons.Settings /><span>設定</span>
          </button>
        </nav>
      )}
      {modal?.type === 'confirmDelete' && (
        <div className="modal-overlay" onClick={()=>setModal(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-handle" />
            <h3 style={{fontSize:16,fontWeight:600,marginBottom:8}}>この記録を削除しますか？</h3>
            <p className="text-sm text-gray">削除した記録は残高計算に含まれなくなります。経理担当者は後から復元できます。</p>
            <div className="confirm-actions">
              <button className="btn btn-secondary" onClick={()=>setModal(null)}>キャンセル</button>
              <button className="btn btn-danger" disabled={isSaving} onClick={()=>deleteRecord(modal.deleteType, modal.id)}>
                {isSaving ? '削除中...' : '削除する'}
              </button>
            </div>
          </div>
        </div>
      )}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

// ===== 状態画面 =====
function NoFiscalYearScreen({ onCreateYear, onSignOut }) {
  const [creating, setCreating] = useState(false);
  const year = new Date().getFullYear();
  return (
    <div style={{height:'100%',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:24}}>
      <div style={{fontSize:48,marginBottom:16}}>📅</div>
      <div style={{fontSize:16,fontWeight:600,marginBottom:8}}>年度ファイルがありません</div>
      <div className="text-sm text-gray text-center mb-4" style={{marginBottom:24}}>
        まず {year} 年度のデータファイルを作成してください。
      </div>
      <button
        className="btn btn-primary btn-block btn-lg"
        disabled={creating}
        style={{maxWidth:280}}
        onClick={async () => { setCreating(true); await onCreateYear(); setCreating(false); }}
      >
        {creating ? <><div className="spinner" style={{width:18,height:18,borderWidth:2}} /> 作成中...</> : `${year}年度を作成する`}
      </button>
      <button className="btn btn-secondary mt-4" style={{marginTop:12}} onClick={onSignOut}>ログアウト</button>
    </div>
  );
}

function LoadingScreen({ message }) {
  return (
    <div style={{height:'100%',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:'linear-gradient(135deg,var(--blue-700),var(--blue-900))'}}>
      <div style={{fontSize:48,marginBottom:16}}>💰</div>
      <div style={{color:'#fff',fontSize:16,marginBottom:24}}>経費管理</div>
      <div className="spinner" style={{borderColor:'rgba(255,255,255,.3)',borderTopColor:'#fff'}} />
      <div style={{color:'rgba(255,255,255,.7)',fontSize:13,marginTop:12}}>{message}</div>
    </div>
  );
}

function ErrorScreen({ message, onRetry }) {
  return (
    <div style={{height:'100%',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:24}}>
      <div style={{fontSize:48,marginBottom:16}}>⚠️</div>
      <div style={{fontSize:16,fontWeight:600,marginBottom:8}}>エラーが発生しました</div>
      <div className="text-sm text-gray text-center mb-4">{message}</div>
      <button className="btn btn-primary" onClick={onRetry}>再試行</button>
    </div>
  );
}

function UnregisteredScreen({ email, onSignOut }) {
  return (
    <div style={{height:'100%',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:24}}>
      <div style={{fontSize:48,marginBottom:16}}>🔒</div>
      <div style={{fontSize:16,fontWeight:600,marginBottom:8}}>アクセス権限がありません</div>
      <div className="text-sm text-gray text-center mb-2">
        <strong>{email}</strong> はこのアプリに登録されていません。
      </div>
      <div className="text-sm text-gray text-center mb-4">経理担当者にメンバー登録を依頼してください。</div>
      <button className="btn btn-secondary" onClick={onSignOut}>別のアカウントでログイン</button>
    </div>
  );
}

// ===== Login Page =====
function LoginPage({ onSignIn, error }) {
  const [loading, setLoading] = useState(false);
  return (
    <div className="login-page">
      <div className="login-logo">💰</div>
      <div className="login-title">経費管理</div>
      <div className="login-sub">団体の経費を簡単に管理</div>
      <div className="login-box">
        <h2 style={{marginBottom:16}}>ログイン</h2>
        <p className="text-sm text-gray" style={{marginBottom:20}}>Googleアカウントでログインしてください。管理者に事前の登録申請が必要です。</p>
        {error && <div style={{background:'var(--red-50)',border:'1px solid var(--red-500)',borderRadius:'var(--radius-sm)',padding:'10px 12px',marginBottom:16,fontSize:13,color:'var(--red-600)'}}>{error}</div>}
        <button
          className="btn btn-primary btn-block btn-lg"
          disabled={loading}
          onClick={async () => { setLoading(true); await onSignIn(); setLoading(false); }}
          style={{gap:10}}
        >
          {loading
            ? <><div className="spinner" style={{width:18,height:18,borderWidth:2}} /> 認証中...</>
            : <><Icons.Google style={{width:20,height:20}} /> Googleでログイン</>
          }
        </button>
      </div>
    </div>
  );
}

// ===== Home Page =====
function HomePage({ assocCash, totalCashIn, totalDistributed, totalReturned, groups, groupBalance, getBudget, isAccountant, userGroups, fy, onNewExpense, onNewCashIn, onNewTransfer, onRefresh }) {
  const [refreshing, setRefreshing] = useState(false);
  const visibleGroups = isAccountant ? groups : groups.filter(g => userGroups.includes(g.name));
  const totalGroupCash = groups.reduce((s,g) => s + groupBalance(g.name).balance, 0);
  const totalAllCash = assocCash + totalGroupCash;
  const totalSpent = groups.reduce((s,g) => s + groupBalance(g.name).spent, 0);

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  };

  return (
    <>
      <div className="header">
        <h1>{fy}年度 経費管理</h1>
        <button className="header-btn" onClick={handleRefresh} title="更新">
          <Icons.RefreshCw style={{width:18,height:18,animation:refreshing?'spin .6s linear infinite':''}} />
        </button>
      </div>
      <div className="content">
        <div className="section">
          {isAccountant && (
            <div className="balance-card association">
              <div className="balance-label">団体 手元現金</div>
              <div className="balance-amount">{fmt(assocCash)}</div>
              <div className="balance-row"><span>入金合計</span><span>{fmt(totalCashIn)}</span></div>
              <div className="balance-row"><span>配布合計</span><span>-{fmt(totalDistributed)}</span></div>
              <div className="balance-row"><span>返金合計</span><span>+{fmt(totalReturned)}</span></div>
              <div style={{marginTop:10,paddingTop:8,borderTop:'1px solid rgba(255,255,255,.2)',fontSize:12}}>
                <div className="balance-row"><span>全体の現金合計</span><span style={{fontWeight:700}}>{fmt(totalAllCash)}</span></div>
                <div className="balance-row"><span>（= 入金 - 全支出）</span><span>{fmt(totalCashIn - totalSpent)}</span></div>
                {totalAllCash === totalCashIn - totalSpent
                  ? <div style={{marginTop:4,opacity:.8,fontSize:11}}>✓ 残高検証OK</div>
                  : <div style={{marginTop:4,color:'#fca5a5',fontSize:11}}>⚠ 残高不一致</div>
                }
              </div>
            </div>
          )}
          <div className="section-title" style={{marginTop:isAccountant?8:0}}>グループ別残高</div>
          {visibleGroups.map(g => {
            const bal = groupBalance(g.name);
            const budget = getBudget(g.name);
            const usagePct = budget > 0 ? Math.min(100, Math.round(bal.spent / budget * 100)) : null;
            return (
              <div key={g.name} className="balance-card group">
                <div className="flex justify-between items-center">
                  <div className="balance-label" style={{color:'var(--gray-500)',opacity:1}}>{g.name}</div>
                  {budget > 0 && <span className="badge badge-blue">予算 {fmt(budget)}</span>}
                </div>
                <div className="balance-amount group-amt">{fmt(bal.balance)}</div>
                {usagePct !== null && (
                  <div style={{margin:'8px 0 4px',height:4,background:'var(--gray-200)',borderRadius:2,overflow:'hidden'}}>
                    <div style={{width:`${usagePct}%`,height:'100%',background:usagePct>90?'var(--red-500)':usagePct>70?'var(--orange-500)':'var(--blue-500)',transition:'width .5s'}} />
                  </div>
                )}
                <div className="balance-row" style={{color:'var(--gray-500)'}}><span>受取</span><span>{fmt(bal.received)}</span></div>
                <div className="balance-row" style={{color:'var(--gray-500)'}}><span>支出</span><span className="text-red">-{fmt(bal.spent)}</span></div>
                {bal.returned > 0 && <div className="balance-row" style={{color:'var(--gray-500)'}}><span>返金</span><span>-{fmt(bal.returned)}</span></div>}
              </div>
            );
          })}
        </div>
        <div className="section" style={{paddingTop:0}}>
          <div className="section-title">アクション</div>
          <div className="entry-grid">
            <div className="entry-card" onClick={onNewExpense}><Icons.Camera /><span>レシート撮影</span></div>
            <div className="entry-card" onClick={onNewExpense}><Icons.Edit /><span>手入力で記録</span></div>
          </div>
          {isAccountant && (
            <div className="entry-grid" style={{paddingTop:0}}>
              <div className="entry-card" onClick={onNewCashIn} style={{borderColor:'var(--green-500)'}}>
                <Icons.ArrowDown style={{color:'var(--green-600)'}} /><span>入金記録</span>
              </div>
              <div className="entry-card" onClick={onNewTransfer} style={{borderColor:'var(--orange-500)'}}>
                <Icons.ArrowRight style={{color:'var(--orange-600)'}} /><span>現金移動</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ===== New Expense Page =====
function NewExpensePage({ categories, groups, isAccountant, onSubmit, onCashIn, onTransfer, onBack, onHome, isSaving }) {
  const [mode, setMode] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [ocrDone, setOcrDone] = useState(false);
  const [form, setForm] = useState({ date:'', seller:'', amount:'', category:'', group:groups[0]||'', memo:'' });
  const fileRef = useRef();

  const handlePhoto = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPhoto(URL.createObjectURL(file));
      setMode('camera');
      // OCRシミュレーション（本番ではTesseract.jsを使用）
      setTimeout(() => {
        setForm(f => ({...f, date: new Date().toISOString().slice(0,10), seller:'', amount:''}));
        setOcrDone(true);
      }, 2000);
    }
  };

  const catGroups = useMemo(() => {
    const map = {};
    categories.forEach(c => { if (!map[c.group]) map[c.group]=[]; map[c.group].push(c); });
    return map;
  }, [categories]);

  if (!mode) {
    return (
      <>
        <div className="header">
          <button className="header-btn" onClick={onHome}><Icons.Home style={{width:18,height:18}} /></button>
          <h1>支出を記録</h1>
          <button className="header-btn" onClick={onBack}>戻る</button>
        </div>
        <div className="content">
          <div className="entry-grid" style={{paddingTop:32}}>
            <div className="entry-card" onClick={()=>fileRef.current?.click()}><Icons.Camera /><span>レシート撮影</span></div>
            <div className="entry-card" onClick={()=>setMode('manual')}><Icons.Edit /><span>手入力で記録</span></div>
          </div>
          <p className="text-sm text-gray text-center">レシートを撮影するとOCRで自動読み取りします</p>
          {isAccountant && (
            <>
              <div className="section-title px-4" style={{marginTop:16}}>経理専用</div>
              <div className="entry-grid" style={{paddingTop:0}}>
                <div className="entry-card" onClick={onCashIn} style={{borderColor:'var(--green-500)'}}>
                  <Icons.ArrowDown style={{color:'var(--green-600)'}} /><span>入金記録</span>
                </div>
                <div className="entry-card" onClick={onTransfer} style={{borderColor:'var(--orange-500)'}}>
                  <Icons.ArrowRight style={{color:'var(--orange-600)'}} /><span>現金移動</span>
                </div>
              </div>
            </>
          )}
          <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{display:'none'}} onChange={handlePhoto} />
        </div>
      </>
    );
  }

  const canSubmit = form.date && form.amount && form.category && form.group;
  return (
    <>
      <div className="header">
        <button className="header-btn" onClick={onHome}><Icons.Home style={{width:18,height:18}} /></button>
        <h1>{mode==='camera' ? 'レシート読み取り' : '手入力'}</h1>
        <button className="header-btn" onClick={()=>{setMode(null);setPhoto(null);setPhotoFile(null);setOcrDone(false);setForm({date:'',seller:'',amount:'',category:'',group:groups[0]||'',memo:''});}}>戻る</button>
      </div>
      <div className="content">
        <div className="section">
          {photo && <img src={photo} className="photo-preview" alt="receipt" />}
          {mode==='camera' && !ocrDone && <div className="ocr-loading"><div className="spinner" /><span>OCRで読み取り中...</span></div>}
          {mode==='camera' && ocrDone && <div className="validation-ok"><Icons.Check style={{width:16,height:16,flexShrink:0}} /> OCR読み取り完了 — 内容を確認してください</div>}
          <div className="form-group"><label className="form-label">購入日 *</label><input type="date" className="form-input" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} /></div>
          <div className="form-group"><label className="form-label">店舗名</label><input type="text" className="form-input" placeholder="例: ファミリーマート" value={form.seller} onChange={e=>setForm({...form,seller:e.target.value})} /></div>
          <div className="form-group"><label className="form-label">合計金額 (円) *</label><input type="number" className="form-input" placeholder="0" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} /></div>
          <div className="form-group">
            <label className="form-label">勘定科目 *</label>
            <select className="form-input form-select" value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>
              <option value="">選択してください</option>
              {Object.entries(catGroups).map(([group, cats]) => (
                <optgroup key={group} label={group}>{cats.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}</optgroup>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">活動グループ *</label>
            {groups.length === 0
              ? <div className="card" style={{background:'var(--orange-50)',border:'1px solid var(--orange-200)',padding:'10px 12px'}}>
                  <div className="text-sm" style={{color:'var(--orange-700)'}}>⚠ 活動グループが設定されていません。</div>
                  <div className="text-xs text-gray mt-1">設定 → 活動グループ から追加してください。</div>
                </div>
              : <select className="form-input form-select" value={form.group} onChange={e=>setForm({...form,group:e.target.value})}>
                  {groups.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
            }
          </div>
          <div className="form-group"><label className="form-label">メモ</label><input type="text" className="form-input" placeholder="任意のメモ" value={form.memo} onChange={e=>setForm({...form,memo:e.target.value})} /></div>
          {mode === 'manual' && (
            <div className="form-group">
              <label className="form-label">レシート写真（任意）</label>
              <button className="btn btn-secondary btn-sm" onClick={()=>fileRef.current?.click()}><Icons.Camera style={{width:16,height:16}} /> 写真を添付</button>
              <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{display:'none'}} onChange={handlePhoto} />
            </div>
          )}
          <button className="btn btn-primary btn-block btn-lg mt-4" disabled={!canSubmit || isSaving} style={{opacity:canSubmit&&!isSaving?1:.5}}
            onClick={()=>onSubmit({
              date:form.date, seller:form.seller, amount:Number(form.amount),
              category:form.category, categoryGroup: categories.find(c=>c.name===form.category)?.group||'',
              group:form.group, memo:form.memo, photoFile: photoFile, method:mode==='camera'?'レシート撮影':'手入力'
            })}>
            {isSaving ? '登録中...' : '登録'}
          </button>
        </div>
      </div>
    </>
  );
}

// ===== New Cash-In Page =====
function NewCashInPage({ onSubmit, onBack, onHome, isSaving }) {
  const [form, setForm] = useState({ date:'', amount:'', source:'', memo:'' });
  const canSubmit = form.date && form.amount && form.source;
  return (
    <>
      <div className="header">
        <button className="header-btn" onClick={onHome}><Icons.Home style={{width:18,height:18}} /></button>
        <h1>入金記録</h1>
        <button className="header-btn" onClick={onBack}>戻る</button>
      </div>
      <div className="content"><div className="section">
        <div className="form-group"><label className="form-label">入金日 *</label><input type="date" className="form-input" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} /></div>
        <div className="form-group"><label className="form-label">金額 (円) *</label><input type="number" className="form-input" placeholder="0" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} /></div>
        <div className="form-group"><label className="form-label">入金元 *</label><input type="text" className="form-input" placeholder="例: 会費徴収" value={form.source} onChange={e=>setForm({...form,source:e.target.value})} /></div>
        <div className="form-group"><label className="form-label">メモ</label><input type="text" className="form-input" placeholder="任意のメモ" value={form.memo} onChange={e=>setForm({...form,memo:e.target.value})} /></div>
        <button className="btn btn-primary btn-block btn-lg mt-4" disabled={!canSubmit||isSaving} style={{opacity:canSubmit&&!isSaving?1:.5}}
          onClick={()=>onSubmit({date:form.date,amount:Number(form.amount),source:form.source,memo:form.memo})}>
          {isSaving?'登録中...':'登録'}
        </button>
      </div></div>
    </>
  );
}

// ===== New Transfer Page =====
function NewTransferPage({ groups, onSubmit, onBack, onHome, isSaving }) {
  const [form, setForm] = useState({ date:'', type:'配布', group:groups[0]?.name||'', amount:'', memo:'' });
  const canSubmit = form.date && form.amount && form.group;
  return (
    <>
      <div className="header">
        <button className="header-btn" onClick={onHome}><Icons.Home style={{width:18,height:18}} /></button>
        <h1>現金移動記録</h1>
        <button className="header-btn" onClick={onBack}>戻る</button>
      </div>
      <div className="content"><div className="section">
        <div className="form-group">
          <label className="form-label">種別 *</label>
          <div className="flex gap-2">
            <button className={`btn flex-1 ${form.type==='配布'?'btn-primary':'btn-secondary'}`} onClick={()=>setForm({...form,type:'配布'})}>配布（団体→グループ）</button>
            <button className={`btn flex-1 ${form.type==='返金'?'btn-primary':'btn-secondary'}`} onClick={()=>setForm({...form,type:'返金'})}>返金（グループ→団体）</button>
          </div>
        </div>
        <div className="form-group"><label className="form-label">日付 *</label><input type="date" className="form-input" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} /></div>
        <div className="form-group">
          <label className="form-label">活動グループ *</label>
          <select className="form-input form-select" value={form.group} onChange={e=>setForm({...form,group:e.target.value})}>
            {groups.map(g => <option key={g.name} value={g.name}>{g.name}</option>)}
          </select>
        </div>
        <div className="form-group"><label className="form-label">金額 (円) *</label><input type="number" className="form-input" placeholder="0" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} /></div>
        <div className="form-group"><label className="form-label">メモ</label><input type="text" className="form-input" placeholder="任意のメモ" value={form.memo} onChange={e=>setForm({...form,memo:e.target.value})} /></div>
        <button className="btn btn-primary btn-block btn-lg mt-4" disabled={!canSubmit||isSaving} style={{opacity:canSubmit&&!isSaving?1:.5}}
          onClick={()=>onSubmit({date:form.date,type:form.type,group:form.group,amount:Number(form.amount),memo:form.memo})}>
          {isSaving?'登録中...':'登録'}
        </button>
      </div></div>
    </>
  );
}

// ===== History Page =====
function HistoryPage({ transactions, cashIn, transfers, isAccountant, userGroups, tab, setTab, onSelectExpense, onSelectCashIn, onSelectTransfer, onHome }) {
  const [showDeleted, setShowDeleted] = useState(false);
  const visibleTxns = transactions.filter(t => (showDeleted||t.status==='有効') && (isAccountant||userGroups.includes(t.group))).sort((a,b)=>b.date.localeCompare(a.date));
  const visibleCashIn = cashIn.filter(t => showDeleted||t.status==='有効').sort((a,b)=>b.date.localeCompare(a.date));
  const visibleTransfers = transfers.filter(t => showDeleted||t.status==='有効').sort((a,b)=>b.date.localeCompare(a.date));
  return (
    <>
      <div className="header">
        <button className="header-btn" onClick={onHome}><Icons.Home style={{width:18,height:18}} /></button>
        <h1>履歴</h1>
        <div style={{width:30}} />
      </div>
      <div className="tabs">
        <div className={`tab ${tab==='expenses'?'active':''}`} onClick={()=>setTab('expenses')}>支出</div>
        {isAccountant && <div className={`tab ${tab==='cashIn'?'active':''}`} onClick={()=>setTab('cashIn')}>入金</div>}
        {isAccountant && <div className={`tab ${tab==='transfers'?'active':''}`} onClick={()=>setTab('transfers')}>現金移動</div>}
      </div>
      <div className="content">
        {isAccountant && (
          <div className="px-4 py-2 flex justify-between items-center" style={{borderBottom:'1px solid var(--gray-100)'}}>
            <span className="text-xs text-gray">削除済を表示</span>
            <label style={{position:'relative',width:40,height:22,cursor:'pointer'}}>
              <input type="checkbox" checked={showDeleted} onChange={e=>setShowDeleted(e.target.checked)} style={{display:'none'}} />
              <div style={{width:40,height:22,borderRadius:11,background:showDeleted?'var(--blue-600)':'var(--gray-300)',transition:'background .2s',position:'relative'}}>
                <div style={{width:18,height:18,borderRadius:9,background:'#fff',position:'absolute',top:2,left:showDeleted?20:2,transition:'left .2s',boxShadow:'0 1px 3px rgba(0,0,0,.2)'}} />
              </div>
            </label>
          </div>
        )}
        {tab==='expenses' && (visibleTxns.length===0 ? <div className="empty-state"><Icons.FileText /><p>支出記録がありません</p></div> : visibleTxns.map(t => (
          <div key={t.id} className="list-item" onClick={()=>onSelectExpense(t)} style={{opacity:t.status==='削除済'?.5:1}}>
            <div className="list-icon" style={{background:t.status==='削除済'?'var(--gray-100)':'var(--blue-50)'}}>
              {t.method==='レシート撮影' ? <Icons.Camera style={{width:20,height:20,color:'var(--blue-600)'}} /> : <Icons.Edit style={{width:20,height:20,color:'var(--blue-600)'}} />}
            </div>
            <div className="list-body">
              <div className="list-title">{t.seller || t.category}</div>
              <div className="list-sub">{t.group} · {t.category}{t.status==='削除済'&&<span className="badge badge-red" style={{marginLeft:6}}>削除済</span>}</div>
            </div>
            <div className="list-right"><div className="list-amount expense">-{fmt(t.amount)}</div><div className="list-date">{fmtDate(t.date)}</div></div>
          </div>
        )))}
        {tab==='cashIn' && (visibleCashIn.length===0 ? <div className="empty-state"><Icons.DollarSign /><p>入金記録がありません</p></div> : visibleCashIn.map(t => (
          <div key={t.id} className="list-item" onClick={()=>onSelectCashIn(t)} style={{opacity:t.status==='削除済'?.5:1}}>
            <div className="list-icon" style={{background:'var(--green-50)'}}><Icons.ArrowDown style={{width:20,height:20,color:'var(--green-600)'}} /></div>
            <div className="list-body"><div className="list-title">{t.source}</div><div className="list-sub">{t.memo}{t.status==='削除済'&&<span className="badge badge-red" style={{marginLeft:6}}>削除済</span>}</div></div>
            <div className="list-right"><div className="list-amount income">+{fmt(t.amount)}</div><div className="list-date">{fmtDate(t.date)}</div></div>
          </div>
        )))}
        {tab==='transfers' && (visibleTransfers.length===0 ? <div className="empty-state"><Icons.ArrowRight /><p>現金移動記録がありません</p></div> : visibleTransfers.map(t => (
          <div key={t.id} className="list-item" onClick={()=>onSelectTransfer(t)} style={{opacity:t.status==='削除済'?.5:1}}>
            <div className="list-icon" style={{background:t.type==='配布'?'var(--orange-50)':'var(--blue-50)'}}>
              {t.type==='配布' ? <Icons.ArrowRight style={{width:20,height:20,color:'var(--orange-600)'}} /> : <Icons.ArrowUp style={{width:20,height:20,color:'var(--blue-600)'}} />}
            </div>
            <div className="list-body"><div className="list-title">{t.type} — {t.group}</div><div className="list-sub">{t.memo}{t.status==='削除済'&&<span className="badge badge-red" style={{marginLeft:6}}>削除済</span>}</div></div>
            <div className="list-right"><div className={`list-amount ${t.type==='配布'?'expense':'income'}`}>{t.type==='配布'?'-':'+'}{fmt(t.amount)}</div><div className="list-date">{fmtDate(t.date)}</div></div>
          </div>
        )))}
      </div>
    </>
  );
}

// ===== Detail Pages =====
function ExpenseDetailPage({ item, isAccountant, userGroups, categories, groups, onDelete, onRestore, onUpdate, onBack, onHome }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // useMemo は早期returnより前に呼ぶ（Reactフックのルール: 条件付きで呼んではいけない）
  const catGroups = useMemo(() => {
    const map = {};
    (categories || []).forEach(c => { if(!map[c.group]) map[c.group]=[]; map[c.group].push(c); });
    return map;
  }, [categories]);

  if (!item) return null;

  const isDeleted = item.status === '削除済';
  const canEdit = (isAccountant || userGroups.includes(item.group)) && !isDeleted;
  const canDelete = canEdit;

  const startEdit = () => {
    setForm({
      date: item.date,
      seller: item.seller || '',
      amount: String(item.amount),
      category: item.category,
      group: item.group,
      memo: item.memo || '',
    });
    setEditing(true);
  };

  const cancelEdit = () => { setEditing(false); setForm(null); };

  const saveEdit = async () => {
    if (!form.date || !form.amount || !form.category || !form.group) return;
    setIsSaving(true);
    try {
      const updates = {
        date: form.date,
        seller: form.seller,
        amount: Number(form.amount),
        category: form.category,
        categoryGroup: categories?.find(c=>c.name===form.category)?.group || item.categoryGroup,
        group: form.group,
        memo: form.memo,
      };
      await onUpdate(item.id, updates);
      setEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  // ---- 編集モード ----
  if (editing && form) {
    const canSubmit = form.date && form.amount && form.category && form.group;
    return (
      <>
        <div className="header">
          <button className="header-btn" onClick={onHome}><Icons.Home style={{width:18,height:18}} /></button>
          <h1>支出を編集</h1>
          <div style={{display:'flex',gap:2}}>
            <button className="header-btn" onClick={saveEdit} disabled={!canSubmit||isSaving} style={{opacity:canSubmit&&!isSaving?1:.4}}>
              <Icons.Check style={{width:20,height:20}} />
            </button>
            <button className="header-btn" onClick={cancelEdit}><Icons.X /></button>
          </div>
        </div>
        <div className="content"><div className="section">
          <div className="form-group"><label className="form-label">購入日 *</label><input type="date" className="form-input" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} /></div>
          <div className="form-group"><label className="form-label">店舗名</label><input type="text" className="form-input" placeholder="例: ファミリーマート" value={form.seller} onChange={e=>setForm({...form,seller:e.target.value})} /></div>
          <div className="form-group"><label className="form-label">合計金額 (円) *</label><input type="number" className="form-input" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} /></div>
          <div className="form-group">
            <label className="form-label">勘定科目 *</label>
            <select className="form-input form-select" value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>
              <option value="">選択してください</option>
              {Object.entries(catGroups).map(([grp,cats]) => (
                <optgroup key={grp} label={grp}>{cats.map(c=><option key={c.name} value={c.name}>{c.name}</option>)}</optgroup>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">活動グループ *</label>
            <select className="form-input form-select" value={form.group} onChange={e=>setForm({...form,group:e.target.value})}>
              {(groups||[]).map(g=><option key={g.name||g} value={g.name||g}>{g.name||g}</option>)}
            </select>
          </div>
          <div className="form-group"><label className="form-label">メモ</label><input type="text" className="form-input" placeholder="任意のメモ" value={form.memo} onChange={e=>setForm({...form,memo:e.target.value})} /></div>
          <div className="flex gap-2 mt-4">
            <button className="btn btn-secondary flex-1" onClick={cancelEdit}>キャンセル</button>
            <button className="btn btn-primary flex-1" disabled={!canSubmit||isSaving} style={{opacity:canSubmit&&!isSaving?1:.5}} onClick={saveEdit}>
              {isSaving?'保存中...':'保存'}
            </button>
          </div>
        </div></div>
      </>
    );
  }

  // ---- 表示モード ----
  return (
    <>
      <div className="header">
        <button className="header-btn" onClick={onHome}><Icons.Home style={{width:18,height:18}} /></button>
        <h1>支出詳細</h1>
        <div style={{display:'flex',gap:2}}>
          {canEdit && <button className="header-btn" onClick={startEdit}><Icons.Edit style={{width:18,height:18}} /></button>}
          <button className="header-btn" onClick={onBack}>戻る</button>
        </div>
      </div>
      <div className="content">

        {/* ヒーロー：金額・日付・グループ */}
        <div style={{
          background: isDeleted
            ? 'linear-gradient(135deg,var(--gray-400),var(--gray-600))'
            : 'linear-gradient(135deg,#dc2626,#b91c1c)',
          color:'#fff', padding:'20px 20px 18px', position:'relative'
        }}>
          {isDeleted && (
            <div style={{marginBottom:8}}>
              <span style={{background:'rgba(0,0,0,.3)',borderRadius:99,padding:'2px 10px',fontSize:12,fontWeight:500}}>削除済</span>
            </div>
          )}
          <div style={{fontSize:38,fontWeight:700,letterSpacing:'-1px',opacity:isDeleted?.6:1,lineHeight:1}}>
            -{fmt(item.amount)}
          </div>
          <div style={{fontSize:13,opacity:.8,marginTop:6}}>{fmtDate(item.date)}</div>
          <div style={{display:'flex',gap:8,marginTop:12,flexWrap:'wrap'}}>
            <span style={{background:'rgba(255,255,255,.2)',borderRadius:99,padding:'3px 12px',fontSize:12,fontWeight:500}}>
              {item.group}
            </span>
            <span style={{background:'rgba(255,255,255,.15)',borderRadius:99,padding:'3px 12px',fontSize:12}}>
              {item.category}
            </span>
          </div>
        </div>

        <div className="section">

          {/* メイン情報カード */}
          <div className="card" style={{marginBottom:12}}>
            <div className="detail-row" style={{paddingTop:0}}>
              <div className="detail-label">店舗名</div>
              <div className="detail-value" style={{fontWeight:item.seller?500:400,color:item.seller?'var(--gray-800)':'var(--gray-400)'}}>{item.seller||'未記入'}</div>
            </div>
            <div className="detail-row">
              <div className="detail-label">科目グループ</div>
              <div className="detail-value">{item.categoryGroup||'—'}</div>
            </div>
            <div className="detail-row">
              <div className="detail-label">報告者</div>
              <div className="detail-value">{item.reporter}</div>
            </div>
            <div className="detail-row" style={{borderBottom:'none',paddingBottom:0}}>
              <div className="detail-label">入力方法</div>
              <div className="detail-value">
                <span className={`badge ${item.method==='レシート撮影'?'badge-green':'badge-gray'}`}>{item.method||'手入力'}</span>
              </div>
            </div>
          </div>

          {/* メモ */}
          {item.memo ? (
            <div className="card" style={{marginBottom:12}}>
              <div className="section-title" style={{marginBottom:6}}>メモ</div>
              <div style={{fontSize:14,color:'var(--gray-700)',lineHeight:1.6}}>{item.memo}</div>
            </div>
          ) : null}

          {/* レシート画像 */}
          {item.photoUrl && (
            <div className="card" style={{marginBottom:12}}>
              <div className="section-title" style={{marginBottom:10}}>レシート画像</div>
              <a href={item.photoUrl} target="_blank" rel="noopener noreferrer" style={{display:'block'}}>
                <img
                  src={item.photoUrl} alt="レシート"
                  style={{width:'100%',maxHeight:240,objectFit:'cover',borderRadius:8,display:'block'}}
                />
                <div style={{fontSize:12,color:'var(--blue-600)',marginTop:6,textAlign:'center'}}>タップして全画面表示</div>
              </a>
            </div>
          )}

          {/* メタ情報 */}
          <div style={{padding:'4px 0 16px',color:'var(--gray-400)',fontSize:11}}>
            <div>記録ID: {item.id}</div>
            {item.timestamp && <div style={{marginTop:3}}>登録日時: {item.timestamp}</div>}
          </div>

          {/* アクションボタン */}
          {canDelete && (
            <button className="btn btn-danger btn-block" onClick={()=>onDelete(item.id)}>
              <Icons.Trash style={{width:16,height:16}} /> この支出を削除
            </button>
          )}
          {isAccountant && isDeleted && (
            <button className="btn btn-primary btn-block mt-2" onClick={()=>onRestore(item.id)}>
              <Icons.RefreshCw style={{width:16,height:16}} /> 復元
            </button>
          )}
        </div>
      </div>
    </>
  );
}

function CashInDetailPage({ item, isAccountant, onDelete, onRestore, onBack, onHome }) {
  if (!item) return null;
  const isDeleted = item.status === '削除済';
  return (
    <>
      <div className="header">
        <button className="header-btn" onClick={onHome}><Icons.Home style={{width:18,height:18}} /></button>
        <h1>入金詳細</h1>
        <button className="header-btn" onClick={onBack}>戻る</button>
      </div>
      <div className="content">
        <div style={{background:'linear-gradient(135deg,#16a34a,#15803d)',color:'#fff',padding:'20px 20px 18px'}}>
          {isDeleted && <div style={{marginBottom:8}}><span style={{background:'rgba(0,0,0,.3)',borderRadius:99,padding:'2px 10px',fontSize:12,fontWeight:500}}>削除済</span></div>}
          <div style={{fontSize:38,fontWeight:700,letterSpacing:'-1px',opacity:isDeleted?.6:1,lineHeight:1}}>+{fmt(item.amount)}</div>
          <div style={{fontSize:13,opacity:.8,marginTop:6}}>{fmtDate(item.date)}</div>
          <div style={{marginTop:12}}>
            <span style={{background:'rgba(255,255,255,.2)',borderRadius:99,padding:'3px 12px',fontSize:12,fontWeight:500}}>{item.source}</span>
          </div>
        </div>
        <div className="section">
          <div className="card" style={{marginBottom:12}}>
            <div className="detail-row" style={{paddingTop:0}}>
              <div className="detail-label">入金日</div><div className="detail-value">{fmtDate(item.date)}</div>
            </div>
            <div className="detail-row">
              <div className="detail-label">入金元</div><div className="detail-value">{item.source}</div>
            </div>
            <div className="detail-row" style={{borderBottom:'none',paddingBottom:0}}>
              <div className="detail-label">登録者</div><div className="detail-value">{item.recorder}</div>
            </div>
          </div>
          {item.memo ? (
            <div className="card" style={{marginBottom:12}}>
              <div className="section-title" style={{marginBottom:6}}>メモ</div>
              <div style={{fontSize:14,color:'var(--gray-700)',lineHeight:1.6}}>{item.memo}</div>
            </div>
          ) : null}
          <div style={{padding:'4px 0 16px',color:'var(--gray-400)',fontSize:11}}>
            <div>記録ID: {item.id}</div>
          </div>
          {isAccountant&&!isDeleted&&<button className="btn btn-danger btn-block" onClick={()=>onDelete(item.id)}><Icons.Trash style={{width:16,height:16}} /> 削除</button>}
          {isAccountant&&isDeleted&&<button className="btn btn-primary btn-block mt-2" onClick={()=>onRestore(item.id)}><Icons.RefreshCw style={{width:16,height:16}} /> 復元</button>}
        </div>
      </div>
    </>
  );
}

function TransferDetailPage({ item, isAccountant, onDelete, onRestore, onBack, onHome }) {
  if (!item) return null;
  const isDeleted = item.status === '削除済';
  const isDistribution = item.type === '配布';
  const accentColor = isDistribution ? '#ea580c' : '#2563eb';
  const gradientBg = isDistribution
    ? 'linear-gradient(135deg,#ea580c,#c2410c)'
    : 'linear-gradient(135deg,#2563eb,#1d4ed8)';
  return (
    <>
      <div className="header">
        <button className="header-btn" onClick={onHome}><Icons.Home style={{width:18,height:18}} /></button>
        <h1>現金移動詳細</h1>
        <button className="header-btn" onClick={onBack}>戻る</button>
      </div>
      <div className="content">
        <div style={{background:gradientBg,color:'#fff',padding:'20px 20px 18px'}}>
          {isDeleted && <div style={{marginBottom:8}}><span style={{background:'rgba(0,0,0,.3)',borderRadius:99,padding:'2px 10px',fontSize:12,fontWeight:500}}>削除済</span></div>}
          <div style={{fontSize:38,fontWeight:700,letterSpacing:'-1px',opacity:isDeleted?.6:1,lineHeight:1}}>
            {isDistribution?'−':'+'}{fmt(item.amount)}
          </div>
          <div style={{fontSize:13,opacity:.8,marginTop:6}}>{fmtDate(item.date)}</div>
          <div style={{display:'flex',gap:8,marginTop:12,flexWrap:'wrap'}}>
            <span style={{background:'rgba(255,255,255,.25)',borderRadius:99,padding:'3px 12px',fontSize:12,fontWeight:600}}>
              {item.type}
            </span>
            <span style={{background:'rgba(255,255,255,.15)',borderRadius:99,padding:'3px 12px',fontSize:12}}>
              {item.group}
            </span>
          </div>
        </div>
        <div className="section">
          <div className="card" style={{marginBottom:12}}>
            <div className="detail-row" style={{paddingTop:0}}>
              <div className="detail-label">種別</div>
              <div className="detail-value">
                <span className={`badge ${isDistribution?'badge-orange':'badge-blue'}`}>{item.type}</span>
                <span style={{fontSize:12,color:'var(--gray-500)',marginLeft:8}}>
                  {isDistribution?'（団体 → グループ）':'（グループ → 団体）'}
                </span>
              </div>
            </div>
            <div className="detail-row">
              <div className="detail-label">活動グループ</div><div className="detail-value">{item.group}</div>
            </div>
            <div className="detail-row" style={{borderBottom:'none',paddingBottom:0}}>
              <div className="detail-label">登録者</div><div className="detail-value">{item.recorder}</div>
            </div>
          </div>
          {item.memo ? (
            <div className="card" style={{marginBottom:12}}>
              <div className="section-title" style={{marginBottom:6}}>メモ</div>
              <div style={{fontSize:14,color:'var(--gray-700)',lineHeight:1.6}}>{item.memo}</div>
            </div>
          ) : null}
          <div style={{padding:'4px 0 16px',color:'var(--gray-400)',fontSize:11}}>
            <div>記録ID: {item.id}</div>
          </div>
          {isAccountant&&!isDeleted&&<button className="btn btn-danger btn-block" onClick={()=>onDelete(item.id)}><Icons.Trash style={{width:16,height:16}} /> 削除</button>}
          {isAccountant&&isDeleted&&<button className="btn btn-primary btn-block mt-2" onClick={()=>onRestore(item.id)}><Icons.RefreshCw style={{width:16,height:16}} /> 復元</button>}
        </div>
      </div>
    </>
  );
}

// ===== Categories Page =====
function CategoriesPage({ categories, onUpdate, onBack, onHome }) {
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newGroup, setNewGroup] = useState('');
  const existingGroups = [...new Set(categories.map(c => c.group))];
  const toggleActive = (name) => onUpdate(categories.map(c => c.name===name ? {...c,active:!c.active} : c));
  const addCategory = () => {
    if (!newName.trim()||!newGroup.trim()) return;
    onUpdate([...categories, { name:newName.trim(), group:newGroup.trim(), active:true }]);
    setNewName(''); setNewGroup(''); setShowAdd(false);
  };
  const grouped = {};
  categories.forEach(c => { if(!grouped[c.group]) grouped[c.group]=[]; grouped[c.group].push(c); });
  return (
    <>
      <div className="header">
        <button className="header-btn" onClick={onHome}><Icons.Home style={{width:18,height:18}} /></button>
        <h1>勘定科目</h1>
        <div style={{display:'flex',gap:2}}>
          <button className="header-btn" onClick={()=>setShowAdd(!showAdd)}><Icons.Plus style={{width:20,height:20}} /></button>
          <button className="header-btn" onClick={onBack}>戻る</button>
        </div>
      </div>
      <div className="content">
        {showAdd && (
          <div className="section" style={{background:'var(--blue-50)',borderBottom:'1px solid var(--blue-200)'}}>
            <div className="form-group"><label className="form-label">科目名</label><input type="text" className="form-input" placeholder="例: 交通費" value={newName} onChange={e=>setNewName(e.target.value)} /></div>
            <div className="form-group"><label className="form-label">グループ</label><input type="text" className="form-input" list="cat-groups" placeholder="例: 活動費" value={newGroup} onChange={e=>setNewGroup(e.target.value)} /><datalist id="cat-groups">{existingGroups.map(g=><option key={g} value={g}/>)}</datalist></div>
            <div className="flex gap-2"><button className="btn btn-secondary flex-1" onClick={()=>setShowAdd(false)}>キャンセル</button><button className="btn btn-primary flex-1" onClick={addCategory} disabled={!newName.trim()||!newGroup.trim()} style={{opacity:newName.trim()&&newGroup.trim()?1:.5}}>追加</button></div>
          </div>
        )}
        {Object.entries(grouped).map(([group, cats]) => (
          <div key={group}>
            <div className="section-title px-4" style={{paddingTop:16}}>{group}</div>
            {cats.map(c => (
              <div key={c.name} className="list-item" onClick={()=>toggleActive(c.name)}>
                <div className="list-icon" style={{background:c.active?'var(--blue-50)':'var(--gray-100)'}}><Icons.Tag style={{width:18,height:18,color:c.active?'var(--blue-600)':'var(--gray-400)'}} /></div>
                <div className="list-body"><div className="list-title" style={{textDecoration:c.active?'none':'line-through',opacity:c.active?1:.5}}>{c.name}</div></div>
                <label style={{position:'relative',width:40,height:22,cursor:'pointer',flexShrink:0}} onClick={e=>e.stopPropagation()}>
                  <input type="checkbox" checked={c.active} onChange={()=>toggleActive(c.name)} style={{display:'none'}} />
                  <div style={{width:40,height:22,borderRadius:11,background:c.active?'var(--green-500)':'var(--gray-300)',transition:'background .2s',position:'relative'}}><div style={{width:18,height:18,borderRadius:9,background:'#fff',position:'absolute',top:2,left:c.active?20:2,transition:'left .2s',boxShadow:'0 1px 3px rgba(0,0,0,.2)'}} /></div>
                </label>
              </div>
            ))}
          </div>
        ))}
        <div className="section"><p className="text-xs text-gray text-center">タップして有効/無効を切り替え。変更はGoogleスプレッドシートに自動保存されます。</p></div>
      </div>
    </>
  );
}

// ===== Groups Page =====
function GroupsPage({ groups, onUpdate, onBack, onHome }) {
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const toggleActive = (name) => onUpdate(groups.map(g => g.name===name ? {...g,active:!g.active} : g));
  const addGroup = () => { if (!newName.trim()) return; onUpdate([...groups, { name:newName.trim(), active:true }]); setNewName(''); setShowAdd(false); };
  return (
    <>
      <div className="header">
        <button className="header-btn" onClick={onHome}><Icons.Home style={{width:18,height:18}} /></button>
        <h1>活動グループ</h1>
        <div style={{display:'flex',gap:2}}>
          <button className="header-btn" onClick={()=>setShowAdd(!showAdd)}><Icons.Plus style={{width:20,height:20}} /></button>
          <button className="header-btn" onClick={onBack}>戻る</button>
        </div>
      </div>
      <div className="content">
        {showAdd && (
          <div className="section" style={{background:'var(--blue-50)',borderBottom:'1px solid var(--blue-200)'}}>
            <div className="form-group"><label className="form-label">グループ名</label><input type="text" className="form-input" placeholder="例: 企画グループ" value={newName} onChange={e=>setNewName(e.target.value)} /></div>
            <div className="flex gap-2"><button className="btn btn-secondary flex-1" onClick={()=>setShowAdd(false)}>キャンセル</button><button className="btn btn-primary flex-1" onClick={addGroup} disabled={!newName.trim()} style={{opacity:newName.trim()?1:.5}}>追加</button></div>
          </div>
        )}
        {groups.map(g => (
          <div key={g.name} className="list-item" onClick={()=>toggleActive(g.name)}>
            <div className="list-icon" style={{background:g.active?'var(--blue-50)':'var(--gray-100)'}}><Icons.Users style={{width:18,height:18,color:g.active?'var(--blue-600)':'var(--gray-400)'}} /></div>
            <div className="list-body"><div className="list-title" style={{textDecoration:g.active?'none':'line-through',opacity:g.active?1:.5}}>{g.name}</div></div>
            <label style={{position:'relative',width:40,height:22,cursor:'pointer',flexShrink:0}} onClick={e=>e.stopPropagation()}>
              <input type="checkbox" checked={g.active} onChange={()=>toggleActive(g.name)} style={{display:'none'}} />
              <div style={{width:40,height:22,borderRadius:11,background:g.active?'var(--green-500)':'var(--gray-300)',transition:'background .2s',position:'relative'}}><div style={{width:18,height:18,borderRadius:9,background:'#fff',position:'absolute',top:2,left:g.active?20:2,transition:'left .2s',boxShadow:'0 1px 3px rgba(0,0,0,.2)'}} /></div>
            </label>
          </div>
        ))}
        <div className="section"><p className="text-xs text-gray text-center">変更はGoogleスプレッドシートに自動保存されます。</p></div>
      </div>
    </>
  );
}

// ===== Settings Page =====
function SettingsPage({ masterData, isAccountant, userInfo, appUser, onCategories, onGroups, onNewFiscalYear, onAppSettings, onLogout, onStartSetup, onHome }) {
  return (
    <>
      <div className="header">
        <button className="header-btn" onClick={onHome}><Icons.Home style={{width:18,height:18}} /></button>
        <h1>設定</h1>
        <div style={{width:30}} />
      </div>
      <div className="content">
        <div className="section">
          <div className="section-title">アカウント</div>
          <div className="card">
            <div className="flex items-center gap-3">
              {userInfo?.picture && <img src={userInfo.picture} style={{width:40,height:40,borderRadius:'50%'}} alt="" />}
              <div>
                <div className="text-sm" style={{fontWeight:500}}>{appUser?.name || userInfo?.name}</div>
                <div className="text-xs text-gray">{userInfo?.email}</div>
                <span className={`badge ${appUser?.role==='経理'?'badge-blue':'badge-gray'} mt-2`}>{appUser?.role}</span>
              </div>
            </div>
          </div>
        </div>
        {isAccountant && (
          <div className="section" style={{paddingTop:0}}>
            <div className="section-title">経理メニュー</div>
            {[
              {icon:<Icons.Tag style={{width:18,height:18,color:'var(--blue-600)'}} />, bg:'var(--blue-50)', title:'勘定科目の管理', sub:'科目の追加・編集・無効化', onClick:onCategories},
              {icon:<Icons.Calendar style={{width:18,height:18,color:'var(--green-600)'}} />, bg:'var(--green-50)', title:'新年度を開始', sub:'新しい年度のファイルを作成', onClick:onNewFiscalYear},
              {icon:<Icons.Users style={{width:18,height:18,color:'var(--orange-600)'}} />, bg:'var(--orange-50)', title:'活動グループ管理', sub:'グループの追加・有効/無効切替', onClick:onGroups},
              {icon:<Icons.Settings style={{width:18,height:18,color:'var(--gray-600)'}} />, bg:'var(--gray-100)', title:'アプリ設定', sub:'年度開始月・年度切替', onClick:onAppSettings},
              {icon:<Icons.Folder style={{width:18,height:18,color:'var(--blue-600)'}} />, bg:'var(--blue-50)', title:'初期設定ウィザード', sub:'ホームフォルダの設定・再実行', onClick:onStartSetup},
            ].map(item => (
              <div key={item.title} className="list-item" onClick={item.onClick} style={{border:'1px solid var(--gray-200)',borderRadius:'var(--radius-sm)',marginBottom:8}}>
                <div className="list-icon" style={{background:item.bg}}>{item.icon}</div>
                <div className="list-body"><div className="list-title">{item.title}</div><div className="list-sub">{item.sub}</div></div>
                <Icons.ArrowRight style={{width:16,height:16,color:'var(--gray-400)'}} />
              </div>
            ))}
          </div>
        )}
        <div className="section" style={{paddingTop:0}}>
          <div className="section-title">その他</div>
          <div className="card">
            <div className="text-xs text-gray">年度開始月: {masterData?.settings?.年度開始月}月</div>
            <div className="text-xs text-gray">バージョン: 1.0.0</div>
          </div>
          <button className="btn btn-danger btn-block mt-4" onClick={onLogout}>ログアウト</button>
        </div>
      </div>
    </>
  );
}

// ===== New Fiscal Year Page =====
function NewFiscalYearPage({ currentYear, existingYears, onComplete, onBack, onHome, isSaving }) {
  const [year, setYear] = useState(currentYear + 1);
  const alreadyExists = existingYears.includes(year);
  return (
    <>
      <div className="header">
        <button className="header-btn" onClick={onHome}><Icons.Home style={{width:18,height:18}} /></button>
        <h1>新年度を開始</h1>
        <button className="header-btn" onClick={onBack}>戻る</button>
      </div>
      <div className="content"><div className="section">
        <div className="card" style={{background:'var(--blue-50)',border:'1px solid var(--blue-200)',marginBottom:16}}>
          <div className="text-sm text-blue">現在の年度: {currentYear}年度</div>
        </div>
        <div className="form-group"><label className="form-label">新しい年度</label><input type="number" className="form-input" value={year} onChange={e=>setYear(Number(e.target.value))} /></div>
        {alreadyExists && <div className="validation-warn" style={{marginBottom:16}}><span>⚠ {year}年度は既に存在します</span></div>}
        <div className="card" style={{marginBottom:16}}>
          <div className="text-sm mb-2" style={{fontWeight:500}}>作成されるもの:</div>
          <div className="flex items-center gap-2" style={{padding:'6px 0'}}><Icons.FileText style={{width:16,height:16,color:'var(--green-600)'}} /><span className="text-sm">経費管理_{year}.gsheet（Google Drive）</span></div>
          <div className="flex items-center gap-2" style={{padding:'6px 0'}}><Icons.Folder style={{width:16,height:16,color:'var(--orange-600)'}} /><span className="text-sm">レシート画像/{year}/ フォルダ</span></div>
        </div>
        <button className="btn btn-primary btn-block btn-lg" disabled={alreadyExists||isSaving} style={{opacity:alreadyExists||isSaving?.5:1}} onClick={()=>onComplete(year)}>
          {isSaving?'作成中...':`${year}年度を作成`}
        </button>
      </div></div>
    </>
  );
}

// ===== App Settings Page =====
function AppSettingsPage({ settings, fiscalYears, currentFY, onSwitchYear, onBack, onHome }) {
  return (
    <>
      <div className="header">
        <button className="header-btn" onClick={onHome}><Icons.Home style={{width:18,height:18}} /></button>
        <h1>アプリ設定</h1>
        <button className="header-btn" onClick={onBack}>戻る</button>
      </div>
      <div className="content"><div className="section">
        <div className="section-title">年度切替</div>
        <div className="card" style={{padding:0}}>
          {fiscalYears.map(fy => (
            <div key={fy.year} className="list-item" onClick={()=>{onSwitchYear(fy.year);onBack();}}>
              <div className="list-icon" style={{background:fy.year===currentFY?'var(--blue-50)':'var(--gray-100)'}}>
                <Icons.Calendar style={{width:18,height:18,color:fy.year===currentFY?'var(--blue-600)':'var(--gray-400)'}} />
              </div>
              <div className="list-body"><div className="list-title">{fy.year}年度</div><div className="list-sub">{fy.name}</div></div>
              {fy.year===currentFY && <span className="badge badge-blue">表示中</span>}
            </div>
          ))}
        </div>
        <div className="section-title" style={{marginTop:16}}>現在の設定</div>
        <div className="card">
          <div className="text-xs text-gray">年度開始月: {settings?.年度開始月}月</div>
          <div className="text-xs text-gray mt-2">ホームフォルダID: <span style={{fontFamily:'monospace',fontSize:10}}>{settings?.ホームフォルダID}</span></div>
        </div>
      </div></div>
    </>
  );
}

// ===== Setup Wizard =====
function SetupWizard({ step, setStep, onComplete, onCancel }) {
  const steps = [
    { title: 'ホームフォルダを確認', desc: `Google DriveのフォルダID（config.jsのHOME_FOLDER_IDに設定済み）を使ってアプリを初期化します。` },
    { title: '活動グループを登録', desc: '団体の活動グループを追加してください。後から設定で変更できます。' },
    { title: '勘定科目を設定', desc: '支出の分類に使う勘定科目を設定してください。' },
    { title: 'マスターデータを作成', desc: 'Google Driveにマスターデータファイルと最初の年度ファイルを作成します。' },
  ];
  const [groups, setGroups] = useState(['企画グループ','広報グループ','イベントグループ','総務グループ']);
  const [newGroup, setNewGroup] = useState('');
  const [creating, setCreating] = useState(false);

  return (
    <>
      <div className="header">
        <button className="header-btn" onClick={onCancel}><Icons.X /></button>
        <h1>初期設定</h1>
        <span className="text-sm" style={{opacity:.7}}>{step+1}/{steps.length}</span>
      </div>
      <div className="wizard-progress">
        {steps.map((_,i) => <div key={i} className={`wizard-bar ${i<step?'done':i===step?'current':''}`} />)}
      </div>
      <div className="content"><div className="wizard-step">
        <h3><span className="wizard-step-num">{step+1}</span>{steps[step].title}</h3>
        <p className="text-sm text-gray mb-4">{steps[step].desc}</p>
        {step===0 && (
          <div className="card" style={{background:'var(--blue-50)',border:'1px solid var(--blue-200)'}}>
            <div className="text-sm text-blue">フォルダID: <code style={{fontSize:12}}>{CONFIG.HOME_FOLDER_ID}</code></div>
            <div className="text-xs text-gray mt-2">このフォルダにマスターデータファイルと年度ファイルが作成されます。</div>
          </div>
        )}
        {step===1 && (<>
          {groups.map((g,i) => (
            <div key={i} className="flex items-center gap-2 mb-2">
              <input type="text" className="form-input flex-1" value={g} onChange={e=>{const ng=[...groups];ng[i]=e.target.value;setGroups(ng);}} />
              <button className="btn btn-icon btn-danger" style={{flexShrink:0}} onClick={()=>setGroups(groups.filter((_,j)=>j!==i))}><Icons.X style={{width:16,height:16}} /></button>
            </div>
          ))}
          <div className="flex gap-2 mt-4">
            <input type="text" className="form-input flex-1" placeholder="グループ名" value={newGroup} onChange={e=>setNewGroup(e.target.value)} />
            <button className="btn btn-secondary" onClick={()=>{if(newGroup){setGroups([...groups,newGroup]);setNewGroup('');}}}>
              <Icons.Plus style={{width:16,height:16}} />
            </button>
          </div>
        </>)}
        {step===2 && (
          <div className="card">
            <div className="text-sm text-gray mb-2">デフォルトの勘定科目が設定されます:</div>
            {['交通費','消耗品費','食費・飲料','会場費','印刷費','通信費','雑費'].map(c => (
              <div key={c} className="flex items-center gap-2" style={{padding:'4px 0'}}><Icons.Check style={{width:14,height:14,color:'var(--green-600)'}} /><span className="text-sm">{c}</span></div>
            ))}
            <p className="text-xs text-gray mt-4">後から設定で変更できます。</p>
          </div>
        )}
        {step===3 && (
          <div className="card">
            <div className="text-sm mb-2">以下のファイルがGoogle Driveに作成されます:</div>
            <div className="flex items-center gap-2" style={{padding:'6px 0'}}><Icons.FileText style={{width:16,height:16,color:'var(--blue-600)'}} /><span className="text-sm">マスターデータ.gsheet</span></div>
            <div className="flex items-center gap-2" style={{padding:'6px 0'}}><Icons.FileText style={{width:16,height:16,color:'var(--green-600)'}} /><span className="text-sm">経費管理_{new Date().getFullYear()}.gsheet</span></div>
            <div className="flex items-center gap-2" style={{padding:'6px 0'}}><Icons.Folder style={{width:16,height:16,color:'var(--orange-600)'}} /><span className="text-sm">レシート画像/ フォルダ</span></div>
          </div>
        )}
        <div className="flex gap-2 mt-4">
          {step>0 && <button className="btn btn-secondary flex-1" onClick={()=>setStep(step-1)}>戻る</button>}
          {step<steps.length-1
            ? <button className="btn btn-primary flex-1" onClick={()=>setStep(step+1)}>次へ</button>
            : <button className="btn btn-primary flex-1" disabled={creating} onClick={async()=>{setCreating(true);await onComplete(groups);setCreating(false);}}>
                {creating ? '作成中...' : 'セットアップ完了'}
              </button>
          }
        </div>
      </div></div>
    </>
  );
}

// ===== Mount =====
ReactDOM.createRoot(document.getElementById('root')).render(<App />);
