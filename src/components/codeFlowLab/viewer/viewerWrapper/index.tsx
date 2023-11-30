import FlowChartViewer from '../../viewer';
import classNames from 'classnames/bind';
import styles from './viewerWrapper.module.scss';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/reducers';
import {
  setIsFullscreenAction,
  setSceneOrderAction,
  setSelectedGroupIdAction,
} from '@/reducers/contentWizard/mainDocument';
import { REQUEST_FULLSCREEN_ON, REQUEST_FULLSCREEN_OFF, REQUEST_PLAY } from '@/consts/channel.js';
const cx = classNames.bind(styles);

function ViewerWrapper() {
  const { ipcRenderer } = window.electron;
  const dispatch = useDispatch();

  const [isMinimize, setIsMinimize] = useState(true);
  const [isActive, setIsActive] = useState(true);

  const { selectedGroupId, isFullscreen } = useSelector((state: RootState) => ({
    selectedGroupId: state.selectedGroupId,
    isFullscreen: state.isFullscreen,
  }));

  useEffect(() => {
    const handleFullscreenOff = (_event, _payload) => {
      dispatch(setIsFullscreenAction(false));
    };

    ipcRenderer.on(REQUEST_FULLSCREEN_OFF, handleFullscreenOff);
    ipcRenderer.on(REQUEST_PLAY, handlePlay);

    return () => {
      ipcRenderer.removeAllListeners(REQUEST_PLAY);
      ipcRenderer.removeAllListeners(REQUEST_FULLSCREEN_OFF);
    };
  }, []);

  const handlePlay = () => {
    dispatch(setSelectedGroupIdAction(''));
    dispatch(setSceneOrderAction(1));
    dispatch(setIsFullscreenAction(true));

    ipcRenderer.send(REQUEST_FULLSCREEN_ON);
  };

  return (
    <div className={cx('viewer-wrapper', { minimize: isMinimize, active: isActive, fullscreen: isFullscreen })}>
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
            <button className="material-symbols-outlined" title="재생" onClick={handlePlay}>
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
