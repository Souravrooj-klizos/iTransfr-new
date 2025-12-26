interface SummaryItemProps {
  label: string;
  value: string | React.ReactNode;
  subtext?: string | string[];
  valueStyle?: React.CSSProperties;
  icon?: React.ReactNode;
}

export function SummaryItem({ label, value, subtext, valueStyle, icon }: SummaryItemProps) {
  const subtextArray = Array.isArray(subtext) ? subtext : subtext ? [subtext] : [];

  return (
    <div className='mb-4'>
      <div className='mb-2 text-xs text-gray-500'>{label}</div>
      <div className='flex items-center gap-2'>
        {icon}
        <div className='font-medium text-gray-900' style={valueStyle}>
          {value}
        </div>
      </div>
      {subtextArray.map((text, index) => (
        <div
          key={index}
          className={`text-${index === 0 ? 'sm' : 'xs'} text-gray-${index === 0 ? '600' : '500'}`}
        >
          {text}
        </div>
      ))}
    </div>
  );
}
