import classNames from 'classnames/bind';
import styles from './toggleEditBlock.module.scss';
const cx = classNames.bind(styles);

interface Props {
  label: string;
  onoff: boolean;
  toggleCallback: (_result: boolean) => void;
}
function ToggleEditBlock({ label, onoff, toggleCallback }: Props) {
  return (
    <label className={cx('toggle-switch')}>
      <span>{label}</span>
      <input type="checkbox" checked={onoff} hidden onChange={(_event) => toggleCallback(_event.target.checked)} />
      <span className={cx('toggle-button')}></span>
    </label>
  );
}

export default ToggleEditBlock;
