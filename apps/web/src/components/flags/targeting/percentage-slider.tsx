import { Slider } from '~/components/ui/slider';
import { Input } from '~/components/ui/input';

interface PercentageSliderProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export function PercentageSlider({
  value,
  onChange,
  disabled,
}: PercentageSliderProps) {
  const handleSliderChange = (values: number[]) => {
    onChange(values[0]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value, 10);
    if (!isNaN(newValue)) {
      onChange(Math.min(100, Math.max(0, newValue)));
    }
  };

  return (
    <div className="flex items-center gap-4">
      <Slider
        value={[value]}
        onValueChange={handleSliderChange}
        max={100}
        step={1}
        className="flex-1"
        disabled={disabled}
      />
      <div className="flex items-center gap-1 shrink-0">
        <Input
          type="number"
          min={0}
          max={100}
          value={value}
          onChange={handleInputChange}
          className="w-16 text-center"
          disabled={disabled}
        />
        <span className="text-muted-foreground">%</span>
      </div>
    </div>
  );
}
