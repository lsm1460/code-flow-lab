import FlowChartViewer from '../../viewer';
import classNames from 'classnames/bind';
import styles from './viewerWrapper.module.scss';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/reducers';
const cx = classNames.bind(styles);

function ViewerWrapper() {
  const [isMinimize, setIsMinimize] = useState(true);
  const [isActive, setIsActive] = useState(true);

  const selectedGroupId = useSelector((state: RootState) => state.selectedGroupId);

  return (
    <div className={cx('viewer-wrapper', { minimize: isMinimize, active: isActive })}>
      <ul className={cx('viewer-controll-wrap')}>
        <li>
          <button
            onClick={() => setIsMinimize((_prev) => !_prev)}
            className="material-symbols-outlined"
            title={!isMinimize ? '최소화' : '확대'}
          >
            {!isMinimize ? 'minimize' : 'open_with'}
          </button>
        </li>
        <li>
          <button
            onClick={() => setIsActive((_prev) => !_prev)}
            className="material-symbols-outlined"
            title={!isActive ? '투명' : '불투명'}
          >
            {!isActive ? 'light_off' : 'lightbulb'}
          </button>
        </li>
        {!selectedGroupId && (
          <li>
            <button className="material-symbols-outlined" title="재생">
              play_arrow
            </button>
          </li>
        )}
      </ul>
      <div>
        <div>
          <FlowChartViewer />
        </div>
      </div>
    </div>
  );
}

export default ViewerWrapper;
