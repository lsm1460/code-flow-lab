import { ChartItemType, ConnectPoint } from '@/consts/types/codeFlowLab';
import { RootState } from '@/reducers';
import { MouseEventHandler, useEffect } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import ConnectDot from '../../connectDot';
import TextEditBlock from '../textEditBlock';

import classNames from 'classnames/bind';
import styles from './listEditBlock.module.scss';
import { Operation, setDocumentValueAction } from '@/reducers/contentWizard/mainDocument';
import ToggleEditBlock from '../toggleEditBlock';
const cx = classNames.bind(styles);

interface Props {
  id: string;
  size: number;
  useIndex: boolean;
  connectionVariables: ConnectPoint[];
  handlePointConnectStart: MouseEventHandler<HTMLElement>;
}
function ListEditBlock({ id, size, useIndex, connectionVariables, handlePointConnectStart }: Props) {
  const dispatch = useDispatch();

  const chartItems = useSelector((state: RootState) => state.contentDocument.items, shallowEqual);

  const toggleCallback = (_toggle: boolean) => {
    const operations: Operation[] = [{ key: `items.${id}.useIndex`, value: _toggle }];

    dispatch(setDocumentValueAction(operations));
  };

  useEffect(() => {
    if (!useIndex && !connectionVariables[0]) {
      const operations: Operation[] = [{ key: `items.${id}.useIndex`, value: true, isSkip: true }];

      dispatch(setDocumentValueAction(operations));
    }
  }, [connectionVariables, useIndex]);

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
        <div className={cx('toggle-wrap', { active: !!connectionVariables[0] })}>
          <ToggleEditBlock label="use index in list item" toggleCallback={toggleCallback} onoff={useIndex} />
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
