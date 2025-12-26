interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  activeColor?: string; // Custom color classes for active state
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  variant?: 'default' | 'pills';
  fullWidth?: boolean;
}

export function Tabs({
  tabs,
  activeTab,
  onTabChange,
  variant = 'default',
  fullWidth = false,
}: TabsProps) {
  return (
    <div>
      <div className={`flex flex-wrap gap-2 overflow-x-auto ${fullWidth ? 'w-full' : ''}`}>
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          const hasCustomColor = tab.activeColor && isActive;

          return (
            <button
              key={tab.id}
              type='button'
              onClick={() => onTabChange(tab.id)}
              className={`flex cursor-pointer items-center justify-center gap-2 border border-gray-200 px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                fullWidth ? 'flex-1' : ''
              } ${
                hasCustomColor
                  ? `${tab.activeColor} rounded-lg text-white`
                  : variant === 'pills'
                    ? isActive
                      ? 'bg-gradient-dark rounded-lg text-white'
                      : 'rounded-lg bg-white text-gray-700 hover:bg-gray-200'
                    : isActive
                      ? 'bg-gradient-light-blue rounded-lg text-white'
                      : 'rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tab.icon && <span className='flex items-center'>{tab.icon}</span>}
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
