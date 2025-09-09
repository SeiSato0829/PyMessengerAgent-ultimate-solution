// 軽量な通知システム (react-hot-toast代替)
export const showToast = (message, type = 'success') => {
  const toast = document.createElement('div')
  toast.className = `fixed top-4 right-4 px-4 py-2 rounded shadow-lg z-50 ${
    type === 'success' ? 'bg-green-500' : 
    type === 'error' ? 'bg-red-500' : 'bg-blue-500'
  } text-white`
  toast.textContent = message
  
  document.body.appendChild(toast)
  
  setTimeout(() => {
    toast.style.opacity = '0'
    setTimeout(() => document.body.removeChild(toast), 300)
  }, 3000)
}

// 軽量なチャートコンポーネント (recharts代替)
export const SimpleChart = ({ data, className = '' }) => {
  if (!data || data.length === 0) return null
  
  const maxValue = Math.max(...data.map(d => d.value))
  
  return (
    <div className={`flex items-end space-x-1 ${className}`} style={{ height: '100px' }}>
      {data.map((item, index) => {
        const height = (item.value / maxValue) * 80
        return (
          <div key={index} className="flex flex-col items-center">
            <div 
              className="bg-blue-500 w-8 rounded-t"
              style={{ height: `${height}px` }}
              title={`${item.name}: ${item.value}`}
            />
            <span className="text-xs mt-1 truncate w-8 text-center">
              {item.name}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// 軽量な統計表示
export const SimpleStats = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <div key={index} className="bg-gray-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-gray-900">
            {stat.value}
          </div>
          <div className="text-sm text-gray-600">
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  )
}

// 軽量なローディング表示
export const SimpleLoader = ({ size = 'md' }) => {
  const sizeClass = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8', 
    lg: 'w-12 h-12'
  }[size]
  
  return (
    <div className={`${sizeClass} border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin`} />
  )
}