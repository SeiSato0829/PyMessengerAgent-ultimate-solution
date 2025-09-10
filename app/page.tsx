'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
// import toast, { Toaster } from 'react-hot-toast';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0
  });

  // 新規タスクフォーム
  const [newTask, setNewTask] = useState({
    account_id: '',
    recipient_name: '',
    message: '',
    scheduled_at: ''
  });

  useEffect(() => {
    checkUser();
    if (user) {
      loadDashboardData();
      subscribeToRealtime();
    }
  }, [user]);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
    } else {
      setUser(session.user);
    }
  };

  const loadDashboardData = async () => {
    setLoading(true);
    
    // タスク取得
    const { data: tasksData } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    
    // アカウント取得
    const { data: accountsData } = await supabase
      .from('facebook_accounts')
      .select('*');
    
    // ワーカー状態取得
    const { data: workersData } = await supabase
      .from('worker_connections')
      .select('*')
      .gte('last_heartbeat', new Date(Date.now() - 5 * 60 * 1000).toISOString());
    
    // 統計取得
    const { data: statsData } = await supabase
      .from('task_statistics')
      .select('*')
      .single();
    
    setTasks(tasksData || []);
    setAccounts(accountsData || []);
    setWorkers(workersData || []);
    if (statsData) {
      setStats({
        pending: statsData.pending_count,
        processing: statsData.processing_count,
        completed: statsData.completed_count,
        failed: statsData.failed_count
      });
    }
    
    setLoading(false);
  };

  const subscribeToRealtime = () => {
    // タスク更新をリアルタイム監視
    const tasksSubscription = supabase
      .channel('tasks_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'tasks' },
        (payload) => {
          loadDashboardData();
          
          // if (payload.eventType === 'UPDATE' && payload.new.status === 'completed') {
          //   toast.success(`タスク完了: ${payload.new.id.slice(0, 8)}`);
          // } else if (payload.eventType === 'UPDATE' && payload.new.status === 'failed') {
          //   toast.error(`タスク失敗: ${payload.new.error_message}`);
          // }
        }
      )
      .subscribe();

    // ワーカー状態をリアルタイム監視
    const workersSubscription = supabase
      .channel('workers_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'worker_connections' },
        (payload) => {
          loadDashboardData();
          
          // if (payload.eventType === 'UPDATE' && payload.new.status === 'online') {
          //   toast.success(`ワーカー接続: ${payload.new.worker_name}`);
          // }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(tasksSubscription);
      supabase.removeChannel(workersSubscription);
    };
  };

  const createTask = async () => {
    if (!newTask.account_id || !newTask.recipient_name || !newTask.message) {
      alert('必須項目を入力してください');
      return;
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        user_id: user.id,
        account_id: newTask.account_id,
        task_type: 'send_message',
        recipient_name: newTask.recipient_name,
        message: newTask.message,
        scheduled_at: newTask.scheduled_at || null
      })
      .select()
      .single();

    if (error) {
      alert('タスク作成失敗: ' + error.message);
    } else {
      alert('タスクを作成しました');
      setNewTask({ account_id: '', recipient_name: '', message: '', scheduled_at: '' });
      loadDashboardData();
    }
  };

  const cancelTask = async (taskId) => {
    const { error } = await supabase
      .from('tasks')
      .update({ status: 'cancelled' })
      .eq('id', taskId);

    if (!error) {
      alert('タスクをキャンセルしました');
      loadDashboardData();
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* <Toaster /> */}
      
      {/* ヘッダー */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">
            PyMessenger Dashboard
          </h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">{user?.email}</span>
            <button
              onClick={logout}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              ログアウト
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700">待機中</h3>
            <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700">実行中</h3>
            <p className="text-3xl font-bold text-blue-600">{stats.processing}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700">完了</h3>
            <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700">失敗</h3>
            <p className="text-3xl font-bold text-red-600">{stats.failed}</p>
          </div>
        </div>

        {/* ワーカー状態 */}
        <div className="bg-white rounded-lg shadow mb-8 p-6">
          <h2 className="text-xl font-bold mb-4">ワーカー状態</h2>
          {workers.length === 0 ? (
            <div className="text-gray-500">
              接続中のワーカーがありません。ローカルワーカーを起動してください。
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {workers.map(worker => (
                <div key={worker.id} className="border rounded p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{worker.worker_name}</span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      worker.status === 'online' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {worker.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {worker.worker_type} - {worker.ip_address}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 新規タスク作成 */}
        <div className="bg-white rounded-lg shadow mb-8 p-6">
          <h2 className="text-xl font-bold mb-4">新規タスク作成</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                アカウント
              </label>
              <select
                value={newTask.account_id}
                onChange={(e) => setNewTask({ ...newTask, account_id: e.target.value })}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">選択してください</option>
                {accounts.map(account => (
                  <option key={account.id} value={account.id}>
                    {account.account_name} ({account.email})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                送信先
              </label>
              <input
                type="text"
                value={newTask.recipient_name}
                onChange={(e) => setNewTask({ ...newTask, recipient_name: e.target.value })}
                className="w-full border rounded px-3 py-2"
                placeholder="友達の名前"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                メッセージ
              </label>
              <textarea
                value={newTask.message}
                onChange={(e) => setNewTask({ ...newTask, message: e.target.value })}
                className="w-full border rounded px-3 py-2"
                rows={3}
                placeholder="送信するメッセージ"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                予約実行（オプション）
              </label>
              <input
                type="datetime-local"
                value={newTask.scheduled_at}
                onChange={(e) => setNewTask({ ...newTask, scheduled_at: e.target.value })}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={createTask}
                className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                タスク作成
              </button>
            </div>
          </div>
        </div>

        {/* タスク一覧 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">タスク一覧</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    送信先
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    メッセージ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ステータス
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    作成日時
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tasks.map(task => (
                  <tr key={task.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {task.id.slice(0, 8)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {task.recipient_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {task.message}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        task.status === 'completed' ? 'bg-green-100 text-green-800' :
                        task.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                        task.status === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {task.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(task.created_at).toLocaleString('ja-JP')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {task.status === 'pending' && (
                        <button
                          onClick={() => cancelTask(task.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          キャンセル
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}