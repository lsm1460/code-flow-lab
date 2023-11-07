import { ChartItemType, ConnectPoint } from '@/consts/types/codeFlowLab';
import { RootState } from '@/reducers';
import { MouseEventHandler } from 'react';
import { shallowEqual, useSelector } from 'react-redux';
import ConnectDot from '../../connectDot';
import TextEditBlock from '../textEditBlock';

import classNames from 'classnames/bind';
import styles from './variableUtilsEditBlock.module.scss';
const cx = classNames.bind(styles);

interface Props {
  id: string;
  text: string;
  connectionVariables: ConnectPoint[];
  handlePointConnectStart: MouseEventHandler<HTMLElement>;
}
function VariableUtilsEditBlock({ id, text, connectionVariables, handlePointConnectStart }: Props) {
  const chartItems = useSelector((state: RootState) => state.contentDocument.items, shallowEqual);

  return (
    <div>
      <div className={cx('condition-box')}>
        <div className={cx('property-wrap')}>
          <div className={cx('condition-list')}>
            <p className={cx('condition-sub-title')}>
              Variable
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
        text={text}
        propertyKey="text"
        pointInfo={{
          pointIndex: 1,
          connectPoint: connectionVariables[1],
          handlePointConnectStart,
        }}
      />
    </div>
  );
}

export default VariableUtilsEditBlock;
