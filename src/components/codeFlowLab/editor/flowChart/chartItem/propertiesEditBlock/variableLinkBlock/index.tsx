import classNames from 'classnames/bind';
import styles from './variableLinkBlock.module.scss';
import ConnectDot from '../../connectDot';
import { ChartItemType, ConnectPoint } from '@/consts/types/codeFlowLab';
import { shallowEqual, useSelector } from 'react-redux';
import { RootState } from '@/reducers';
import { MouseEventHandler } from 'react';
const cx = classNames.bind(styles);

interface Props {
  label: string;
  id: string;
  connectPoint: ConnectPoint;
  handlePointConnectStart: MouseEventHandler<HTMLElement>;
}
function VariableLinkBlock({ label, id, connectPoint, handlePointConnectStart }: Props) {
  const chartItems = useSelector((state: RootState) => state.contentDocument.items, shallowEqual);

  return (
    <div className={cx('property-wrap')}>
      <div className={cx('condition-list')}>
        <p className={cx('condition-sub-title')}>
          {label}
          {connectPoint ? `: ${chartItems?.[connectPoint.connectParentId].name}` : ''}
          <ConnectDot
            parentId={id}
            connectDir={'right'}
            connectType={ChartItemType.variable}
            targetType={ChartItemType.variable}
            index={0}
            typeIndex={0}
            connectParentId={connectPoint?.connectParentId}
            handlePointConnectStart={handlePointConnectStart}
            isSlave
            style={{
              position: 'absolute',
              right: 0,
              top: '50%',
            }}
          />
        </p>
      </div>
    </div>
  );
}

export default VariableLinkBlock;
