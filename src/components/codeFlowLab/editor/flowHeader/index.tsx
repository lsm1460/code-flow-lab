import { RootState } from '@/reducers';
import { setDocumentValueAction } from '@/reducers/contentWizard/mainDocument';
import { getHistory, getNextHistory, getPrevHistory } from '@/utils/history';
import _ from 'lodash';
import { useEffect, useState } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';

import classNames from 'classnames/bind';
import styles from './flowHeader.module.scss';
const cx = classNames.bind(styles);

function FlowHeader() {
  const dispatch = useDispatch();

  const [historyNow, setHistoryNow] = useState(0);
  const [history, setHistory] = useState([]);

  const flowDoc = useSelector((state: RootState) => state.contentDocument, shallowEqual);

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
    <header className={cx('header')}>
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
    </header>
  );
}

export default FlowHeader;
