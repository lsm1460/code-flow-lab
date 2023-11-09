import { REQUEST_UNDO, REQUEST_REDO } from '@/consts/channel.js';
import { RootState } from '@/reducers';
import { setDocumentValueAction } from '@/reducers/contentWizard/mainDocument';
import { getHistory, getNextHistory, getPrevHistory } from '@/utils/history';
import classNames from 'classnames/bind';
import _ from 'lodash';
import { useEffect, useState } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import useIpcManager from '../../useIpcManager';
import styles from './flowHeader.module.scss';
const cx = classNames.bind(styles);

function FlowHeader() {
  const dispatch = useDispatch();
  const { sendDocumentForSave: handleSaveButton } = useIpcManager(false);

  const [historyNow, setHistoryNow] = useState(0);
  const [history, setHistory] = useState([]);

  const { flowDoc, isSaved } = useSelector(
    (state: RootState) => ({ flowDoc: state.contentDocument, isSaved: state.isSaved }),
    shallowEqual
  );

  useEffect(() => {
    const { ipcRenderer } = window.electron;

    ipcRenderer.on(REQUEST_UNDO, (e, msg) => {
      prev();
    });

    ipcRenderer.on(REQUEST_REDO, (e, document) => {
      next();
    });
  }, []);

  useEffect(() => {
    const { now, history } = getHistory();

    setHistoryNow(now);
    setHistory(history);
  }, [flowDoc]);

  const prev = () => {
    const historyOp = getPrevHistory();

    !_.isEmpty(historyOp) && dispatch(setDocumentValueAction(historyOp));
  };

  const next = () => {
    const historyOp = getNextHistory();

    !_.isEmpty(historyOp) && dispatch(setDocumentValueAction(historyOp));
  };

  return (
    <header className={cx('header', { mac: window.electron.isMac })}>
      <span className={cx('logo')}>CODE_FLOW_LAB。</span>
      <ul className={cx('history-buttons')}>
        <li className={historyNow < 0 ? cx('disable') : ''}>
          <button onClick={prev}>
            <i className="material-symbols-outlined">undo</i>
            Undo
          </button>
        </li>
        <li className={history.length - 1 > historyNow ? '' : cx('disable')}>
          <button onClick={next}>
            <i className="material-symbols-outlined">redo</i>
            Redo
          </button>
        </li>
      </ul>
      <button className={cx('save-btn', { 'need-save': !isSaved })} onClick={handleSaveButton}>
        {isSaved ? 'saved ✅' : 'need save ❗️'}
      </button>
    </header>
  );
}

export default FlowHeader;
