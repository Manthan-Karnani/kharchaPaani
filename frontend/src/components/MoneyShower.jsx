import { useEffect, useState } from 'react';
import { IndianRupee } from 'lucide-react';

const pieces = Array.from({ length: 24 }, (_, index) => ({
  left: `${4 + index * 4}%`,
  delay: `${(index * 47) % 260}ms`,
  duration: `${1450 + (index % 4) * 85}ms`,
  drift: `${(index % 2 ? 1 : -1) * (14 + index % 3 * 8)}px`,
  rotation: `${(index % 2 ? 1 : -1) * (18 + index * 5)}deg`,
}));

export default function MoneyShower() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 2100);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return <div className="money-shower" aria-hidden="true">
    {pieces.map((piece, index) => <span
      key={index}
      className="money-shower-piece money-shower-coin"
      style={{ left: piece.left, '--delay': piece.delay, '--duration': piece.duration, '--drift': piece.drift, '--rotation': piece.rotation }}
    >
      <IndianRupee size={12} strokeWidth={2}/>
    </span>)}
  </div>;
}
