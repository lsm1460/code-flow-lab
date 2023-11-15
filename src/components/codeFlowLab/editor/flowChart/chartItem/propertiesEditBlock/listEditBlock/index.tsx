import { ChartItemType, ConnectPoint } from '@/consts/types/codeFlowLab';
import { RootState } from '@/reducers';
import { MouseEventHandler } from 'react';
import { shallowEqual, useSelector } from 'react-redux';
import ConnectDot from '../../connectDot';
import TextEditBlock from '../textEditBlock';

import classNames from 'classnames/bind';
import styles from './listEditBlock.module.scss';
const cx = classNames.bind(styles);

interface Props {
  id: string;
  size: number;
  connectionVariables: ConnectPoint[];
  handlePointConnectStart: MouseEventHandler<HTMLElement>;
}
function ListEditBlock({ id, size, connectionVariables, handlePointConnectStart }: Props) {
  const chartItems = useSelector((state: RootState) => state.contentDocument.items, shallowEqual);

  return (
    <div>
      <div className={cx('condition-box')}>
        <div className={cx('property-wrap')}>
          <div className={cx('condition-list')}>
            <p className={cx('condition-sub-title')}>
              Array
              {connectionVariables[0] ? `: ${chartItems?.[connectionVariables[0].connectParentId].name}` : ''}
              <ConnectDot
                parentId={id}
                connectDir={'right'}
                connectType={ChartItemType.variable}
                targetType={ChartItemType.variable}
                index={0}
                typeIndex={0}
                connectParentId={connectionVariables[0]?.connectParentId}
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
      </div>
      <TextEditBlock
        id={id}
        text={size}
        propertyKey="size"
        pointInfo={{
          pointIndex: 0,
          connectPoint: connectionVariables[0],
          handlePointConnectStart,
        }}
        label="size"
        inputType="number"
      />
    </div>
  );
}

export default ListEditBlock;
