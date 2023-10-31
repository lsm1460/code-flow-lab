import { RootState } from '@/reducers';
import { resetFlowLogAction } from '@/reducers/contentWizard/mainDocument';
import dayjs from 'dayjs';
import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import classNames from 'classnames/bind';
import styles from './flowLog.module.scss';
const cx = classNames.bind(styles);

function FlowLog() {
  const dispatch = useDispatch();

  const logEl = useRef<HTMLDivElement>(null);
  const flowLogList = useSelector((state: RootState) => state.flowLogList);

  useEffect(() => {
    logEl.current.scrollTo(0, logEl.current.scrollHeight);
  }, [flowLogList, logEl]);

  const handleDelete = () => {
    dispatch(resetFlowLogAction());
  };

  return (
    <div className={cx('flow-log-wrap')}>
      <div className={cx('flow-log')} ref={logEl}>
        <div>
          {flowLogList.map((_log, _i) => (
            <p key={_i} className={cx(_log.type)}>
              <span>{dayjs(_log.date).format('HH:mm ss')}</span>
              {_log.text}
            </p>
          ))}
        </div>
      </div>

      <button className={cx('delete-button', 'material-symbols-outlined')} onClick={handleDelete}>
        delete
      </button>
    </div>
  );
}

export default FlowLog;
