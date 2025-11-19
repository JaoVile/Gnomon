import { useTheme } from './ThemeContext';
import './ThemeSwitcher.css';

export function ThemeSwitcher() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="theme-switcher">
      <i className="fas fa-moon"></i>
      <label className="theme-switch-wrapper">
        <input
          id="theme-switcher"
          className="theme-switch-checkbox"
          type="checkbox"
          checked={theme === 'light'}
          onChange={toggleTheme}
        />
        <div className="theme-switch">
          <div className="slider"></div>
        </div>
      </label>
      <i className="fas fa-sun"></i>
    </div>
  );
}
