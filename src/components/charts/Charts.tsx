import React from 'react';

export const BarChart: React.FC = () => {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-full h-full flex items-end justify-between space-x-2">
        {[65, 45, 75, 50, 85, 35, 70, 60, 80, 40, 55, 45].map((height, index) => (
          <div key={index} className="flex-1">
            <div 
              className="w-full bg-gradient-to-t from-purple-500 to-blue-500 rounded-t"
              style={{ height: `${height}%` }}
            ></div>
            <div className="text-xs text-gray-400 mt-2 text-center">
              {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][index]}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const LineChart: React.FC = () => {
  const points = [40, 60, 45, 70, 55, 80, 65, 75, 50, 85, 70, 90];
  const maxPoint = Math.max(...points);
  const pointsString = points
    .map((point, index) => `${(index * (100 / (points.length - 1))).toFixed(1)},${100 - (point / maxPoint * 100)}`)
    .join(' ');

  return (
    <div className="w-full h-full relative">
      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <polyline
          points={pointsString}
          fill="none"
          stroke="url(#line-gradient)"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
        <defs>
          <linearGradient id="line-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#3B82F6" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-400">
        {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month) => (
          <span key={month}>{month}</span>
        ))}
      </div>
    </div>
  );
};

export const DoughnutChart: React.FC = () => {
  const data = [
    { value: 35, color: '#8B5CF6' },
    { value: 25, color: '#3B82F6' },
    { value: 20, color: '#EC4899' },
    { value: 20, color: '#10B981' }
  ];

  let cumulativePercent = 0;
  const segments = data.map(segment => {
    const segmentPercent = segment.value;
    const startPercent = cumulativePercent;
    cumulativePercent += segmentPercent;
    
    return {
      color: segment.color,
      startPercent,
      percent: segmentPercent
    };
  });

  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="relative w-48 h-48">
        <svg viewBox="0 0 100 100" className="transform -rotate-90">
          {segments.map((segment, index) => {
            const pathData = describeArc(50, 50, 40, 
              (segment.startPercent / 100) * 360,
              ((segment.startPercent + segment.percent) / 100) * 360
            );
            return (
              <path
                key={index}
                d={pathData}
                fill="none"
                stroke={segment.color}
                strokeWidth="20"
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-white text-xl font-bold">
          100%
        </div>
      </div>
    </div>
  );
};

// Helper function for DoughnutChart
function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians))
  };
}

function describeArc(x: number, y: number, radius: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return [
    "M", start.x, start.y,
    "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
  ].join(" ");
}