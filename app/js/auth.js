// ============================================================
// auth.js — Google Sign-In (GIS) 認証モジュール
// Google Identity Services ライブラリを使用
// ============================================================

const Auth = (() => {
  let _tokenClient = null;
  let _accessToken = null;
  let _tokenExpiry = null;
  let _userInfo = null;
  let _onAuthChange = null;  // コールバック: 認証状態変化時に呼ばれる

  // 認証状態変化のコールバックを登録
  function onAuthChange(callback) {
    _onAuthChange = callback;
  }

  // 保存されたセッションを復元
  function restoreSession() {
    try {
      const saved = sessionStorage.getItem('auth_session');
      if (saved) {
        const { token, expiry, user } = JSON.parse(saved);
        if (expiry && Date.now() < expiry) {
          _accessToken = token;
          _tokenExpiry = expiry;
          _userInfo = user;
          return true;
        }
      }
    } catch (e) {}
    return false;
  }

  // セッションを保存
  function saveSession() {
    sessionStorage.setItem('auth_session', JSON.stringify({
      token: _accessToken,
      expiry: _tokenExpiry,
      user: _userInfo,
    }));
  }

  // セッションを破棄
  function clearSession() {
    _accessToken = null;
    _tokenExpiry = null;
    _userInfo = null;
    sessionStorage.removeItem('auth_session');
  }

  // Google GIS の初期化（ページロード時に呼ぶ）
  function init() {
    // 保存済みセッションがあれば復元して済み
    if (restoreSession()) {
      _onAuthChange?.({ user: _userInfo, token: _accessToken });
      return;
    }
    // セッションなし → ログインページを表示
    _onAuthChange?.({ user: null, token: null });
  }

  // Google Sign-In を開始（ボタンクリック時）
  function signIn() {
    return new Promise((resolve, reject) => {
      if (!window.google?.accounts?.oauth2) {
        reject(new Error('Google Identity Services が読み込まれていません'));
        return;
      }

      _tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CONFIG.CLIENT_ID,
        scope: CONFIG.SCOPES,
        callback: async (response) => {
          if (response.error) {
            reject(new Error(response.error));
            return;
          }

          _accessToken = response.access_token;
          // アクセストークンの有効期限（通常1時間）
          _tokenExpiry = Date.now() + (response.expires_in * 1000) - 60000;

          try {
            // ユーザー情報を取得
            _userInfo = await fetchUserInfo();
            saveSession();
            _onAuthChange?.({ user: _userInfo, token: _accessToken });
            resolve(_userInfo);
          } catch (e) {
            reject(e);
          }
        },
      });

      _tokenClient.requestAccessToken({ prompt: 'consent' });
    });
  }

  // Googleからユーザー情報を取得
  async function fetchUserInfo() {
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${_accessToken}` },
    });
    if (!res.ok) throw new Error('ユーザー情報の取得に失敗しました');
    const data = await res.json();
    return {
      email: data.email,
      name: data.name,
      picture: data.picture,
    };
  }

  // サインアウト
  function signOut() {
    if (_accessToken) {
      google.accounts.oauth2.revoke(_accessToken, () => {});
    }
    clearSession();
    _onAuthChange?.({ user: null, token: null });
  }

  // 現在のアクセストークンを取得（期限切れチェック付き）
  async function getToken() {
    if (!_accessToken) throw new Error('未認証です。ログインしてください。');

    // トークンが期限切れに近い場合は再取得
    if (_tokenExpiry && Date.now() > _tokenExpiry) {
      return new Promise((resolve, reject) => {
        _tokenClient.requestAccessToken({ prompt: '' });
        // callbackは再設定済みなので自動的に更新される
        // 少し待ってから取得
        setTimeout(() => {
          if (_accessToken) resolve(_accessToken);
          else reject(new Error('トークンの更新に失敗しました'));
        }, 1000);
      });
    }

    return _accessToken;
  }

  // 現在のユーザー情報
  function currentUser() {
    return _userInfo;
  }

  // 認証済みかどうか
  function isAuthenticated() {
    return !!_accessToken && !!_userInfo;
  }

  return { init, signIn, signOut, getToken, currentUser, isAuthenticated, onAuthChange };
})();
