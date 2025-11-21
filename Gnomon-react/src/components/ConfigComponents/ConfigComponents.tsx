import React from 'react';
import './ConfigComponents.css';

interface ConfigSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function ConfigSection({ title, description, children }: ConfigSectionProps) {
  return (
    <section className="config-section">
      <div className="config-section-header">
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      <div className="config-section-content">
        {children}
      </div>
    </section>
  );
}

interface ToggleSwitchProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  icon?: string;
}

export function ToggleSwitch({ 
  label, 
  description, 
  checked, 
  onChange, 
  disabled = false,
  icon 
}: ToggleSwitchProps) {
  return (
    <div className={`config-option ${disabled ? 'disabled' : ''}`}>
      <div className="config-option-info">
        <label className="config-option-label">
          {icon && <span className="config-option-icon">{icon}</span>}
          {label}
        </label>
        {description && <p className="config-option-description">{description}</p>}
      </div>
      <label className="toggle-switch">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
        />
        <span className="toggle-slider"></span>
      </label>
    </div>
  );
}

interface SelectOptionProps {
  label: string;
  description?: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function SelectOption({ 
  label, 
  description, 
  value, 
  options, 
  onChange,
  disabled = false 
}: SelectOptionProps) {
  return (
    <div className={`config-option ${disabled ? 'disabled' : ''}`}>
      <div className="config-option-info">
        <label className="config-option-label">{label}</label>
        {description && <p className="config-option-description">{description}</p>}
      </div>
      <select 
        className="config-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

interface RangeSliderProps {
  label: string;
  description?: string;
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
  step?: number;
}

export function RangeSlider({ 
  label, 
  description, 
  min, 
  max, 
  value, 
  onChange,
  step = 1 
}: RangeSliderProps) {
  return (
    <div className="config-option">
      <div className="config-option-info">
        <label className="config-option-label">{label}</label>
        {description && <p className="config-option-description">{description}</p>}
      </div>
      <input
        type="range"
        className="config-range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

interface RadioGroupProps {
  label: string;
  description?: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}

export function RadioGroup({ 
  label, 
  description, 
  value, 
  options, 
  onChange 
}: RadioGroupProps) {
  return (
    <div className="config-option config-radio-group">
      <div className="config-option-info">
        <label className="config-option-label">{label}</label>
        {description && <p className="config-option-description">{description}</p>}
      </div>
      <div className="radio-options">
        {options.map(opt => (
          <label key={opt.value} className="radio-option">
            <input
              type="radio"
              name={label}
              value={opt.value}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
            />
            <span className="radio-label">{opt.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}